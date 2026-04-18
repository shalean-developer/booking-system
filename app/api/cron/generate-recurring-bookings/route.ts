import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-secret';
import { createServiceClient } from '@/lib/supabase-server';
import { calculateBookingOccurrencesForMonth, getMonthYearString } from '@/lib/recurring-bookings';
import { calcTotalAsync } from '@/lib/pricing';
import { generateUniqueBookingId } from '@/lib/booking-id';
import { chargePaystackAuthorization } from '@/lib/paystack-recurring';
import type { RecurringSchedule } from '@/types/recurring';
import { buildEarningsInsertFields } from '@/lib/earnings-v2';
import { deriveCompanyOnlyCostsCents } from '@/lib/earnings-company-costs';

export const dynamic = 'force-dynamic';

/**
 * Map recurring schedule frequency to pricing frequency
 */
function mapFrequencyToPricingFrequency(frequency: string): 'one-time' | 'weekly' | 'bi-weekly' | 'monthly' {
  switch (frequency) {
    case 'weekly':
    case 'custom-weekly':
      return 'weekly';
    case 'bi-weekly':
    case 'custom-bi-weekly':
      return 'bi-weekly';
    case 'monthly':
      return 'monthly';
    default:
      return 'one-time';
  }
}

/**
 * Check if today is the last day of the month
 */
function isLastDayOfMonth(): boolean {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // If tomorrow is the 1st, today is the last day of the month
  return tomorrow.getDate() === 1;
}

/**
 * Get next month's year and month
 */
function getNextMonth(): { year: number; month: number } {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return {
    year: nextMonth.getFullYear(),
    month: nextMonth.getMonth() + 1,
  };
}

function generateInvoiceReference(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

export async function GET(req: NextRequest) {
  try {
    const unauthorized = requireCronSecret(req);
    if (unauthorized) return unauthorized;

    const svc = createServiceClient();

    // Allow manual triggering with ?force=true query parameter (for testing)
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    // Check if today is the last day of the month (unless forced)
    if (!force && !isLastDayOfMonth()) {
      return NextResponse.json({
        ok: true,
        message: 'Not the last day of the month. Skipping generation. Use ?force=true to override.',
        processed: 0,
        generated: 0,
        errors: [],
      });
    }

    const { year: nextYear, month: nextMonth } = getNextMonth();
    const nextMonthYear = getMonthYearString(new Date(nextYear, nextMonth - 1, 1));
    const nextMonthFirstDay = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    
    // Calculate last day of next month
    const lastDayOfNextMonth = new Date(nextYear, nextMonth, 0).getDate();
    const nextMonthLastDay = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-${lastDayOfNextMonth.toString().padStart(2, '0')}`;

    console.log(`[Cron] Generating bookings for ${nextMonthYear} (${nextMonthFirstDay} to ${nextMonthLastDay})`);

    // Fetch all active recurring schedules that need generation
    // We'll filter in code for complex OR conditions
    const { data: allSchedules, error: schedulesError } = await svc
      .from('recurring_schedules')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', nextMonthLastDay);

    if (schedulesError) {
      console.error('[Cron] Error fetching recurring schedules:', schedulesError);
      return NextResponse.json(
        { ok: false, error: `Failed to fetch schedules: ${schedulesError.message}` },
        { status: 500 }
      );
    }

    // Filter schedules that need generation:
    // 1. end_date is NULL OR end_date >= first day of next month
    // 2. last_generated_month is NULL OR last_generated_month < next month
    const schedules = (allSchedules || []).filter((schedule: any) => {
      // Check end_date condition
      const endDateValid = !schedule.end_date || schedule.end_date >= nextMonthFirstDay;
      
      // Check last_generated_month condition
      const lastGeneratedValid = !schedule.last_generated_month || schedule.last_generated_month < nextMonthYear;
      
      return endDateValid && lastGeneratedValid;
    });

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No active recurring schedules found that need generation.',
        processed: 0,
        generated: 0,
        errors: [],
      });
    }

    console.log(`[Cron] Found ${schedules.length} schedules to process`);

    let processed = 0;
    let totalGenerated = 0;
    const errors: string[] = [];

    // Prefetch per-day rules for custom schedules (to support different times per weekday)
    const customScheduleIds = (schedules as any[])
      .filter((s) => s?.frequency === 'custom-weekly' || s?.frequency === 'custom-bi-weekly')
      .map((s) => s.id)
      .filter(Boolean);

    const rulesByScheduleId = new Map<string, Array<{ day_of_week: number; preferred_time: string }>>();
    if (customScheduleIds.length > 0) {
      const { data: rulesData, error: rulesFetchError } = await svc
        .from('recurring_schedule_rules')
        .select('schedule_id, day_of_week, preferred_time')
        .in('schedule_id', customScheduleIds);

      if (rulesFetchError) {
        console.error('[Cron] Error fetching recurring schedule rules:', rulesFetchError);
      } else {
        (rulesData || []).forEach((r: any) => {
          if (!r?.schedule_id) return;
          const arr = rulesByScheduleId.get(r.schedule_id) || [];
          arr.push({ day_of_week: r.day_of_week, preferred_time: r.preferred_time });
          rulesByScheduleId.set(r.schedule_id, arr);
        });
      }
    }

    // Process each schedule
    for (const schedule of schedules as RecurringSchedule[]) {
      try {
        processed++;

        // Skip if already generated for this month
        if (schedule.last_generated_month === nextMonthYear) {
          console.log(`[Cron] Schedule ${schedule.id} already generated for ${nextMonthYear}, skipping`);
          continue;
        }

        // Check if schedule has started
        const scheduleStartDate = new Date(schedule.start_date);
        const nextMonthStartDate = new Date(nextYear, nextMonth - 1, 1);
        if (scheduleStartDate > new Date(nextYear, nextMonth, 0)) {
          console.log(`[Cron] Schedule ${schedule.id} hasn't started yet, skipping`);
          continue;
        }

        // Check if schedule has ended
        if (schedule.end_date) {
          const scheduleEndDate = new Date(schedule.end_date);
          if (scheduleEndDate < nextMonthStartDate) {
            console.log(`[Cron] Schedule ${schedule.id} has ended, skipping`);
            continue;
          }
        }

        // Fetch customer details
        const { data: customer, error: customerError } = await svc
          .from('customers')
          .select('id, first_name, last_name, email, phone, paystack_authorization_code, paystack_authorization_email, paystack_authorization_reusable, paystack_authorization_signature')
          .eq('id', schedule.customer_id)
          .maybeSingle();

        if (customerError || !customer) {
          errors.push(`Schedule ${schedule.id}: Customer not found`);
          console.error(`[Cron] Schedule ${schedule.id}: Customer error:`, customerError);
          continue;
        }

        // Calculate booking occurrences (date + time) for next month
        const rules = rulesByScheduleId.get(schedule.id);
        const occurrences = calculateBookingOccurrencesForMonth(schedule, nextYear, nextMonth, rules);

        // Filter occurrences that fall within schedule's start_date and end_date
        const validOccurrences = occurrences.filter((occ) => {
          if (occ.date < scheduleStartDate) return false;
          if (schedule.end_date && occ.date > new Date(schedule.end_date)) return false;
          return true;
        });

        if (validOccurrences.length === 0) {
          console.log(`[Cron] Schedule ${schedule.id}: No valid dates for ${nextMonthYear}`);
          // Still update last_generated_month to avoid retrying
          await svc
            .from('recurring_schedules')
            .update({ last_generated_month: nextMonthYear })
            .eq('id', schedule.id);
          continue;
        }

        // Use stored pricing if available, otherwise calculate
        let totalAmountCents: number;
        let priceSnapshot: any;
        let earningsPayload: ReturnType<typeof buildEarningsInsertFields> | null = null;

        const requiresTeamForEarnings =
          schedule.service_type === 'Deep' || schedule.service_type === 'Move In/Out';
        const defaultTeamSize = requiresTeamForEarnings ? 2 : 1;

        let hireDateForEarnings: string | null = null;
        if (schedule.cleaner_id && schedule.cleaner_id !== 'manual') {
          const { data: hireRow } = await svc
            .from('cleaners')
            .select('hire_date')
            .eq('id', schedule.cleaner_id)
            .maybeSingle();
          hireDateForEarnings = hireRow?.hire_date ?? null;
        }

        if (schedule.total_amount && schedule.total_amount > 0) {
          // Use stored pricing from schedule
          totalAmountCents = schedule.total_amount;

          const serviceFeeCents = 5000; // Default R50 — aligns with historical snapshot assumption
          earningsPayload = buildEarningsInsertFields({
            totalAmountCents,
            serviceFeeCents,
            tipCents: 0,
            hireDate: hireDateForEarnings,
            serviceType: schedule.service_type,
            requiresTeam: requiresTeamForEarnings,
            teamSize: defaultTeamSize,
            equipmentCostCents: 0,
            extraCleanerFeeCents: 0,
          });

          // Calculate price snapshot from stored values
          const totalAmountRands = totalAmountCents / 100;
          const serviceFee = 50; // Default service fee
          const subtotal = totalAmountRands - serviceFee;

          priceSnapshot = {
            service_type: schedule.service_type,
            bedrooms: schedule.bedrooms,
            bathrooms: schedule.bathrooms,
            extras: schedule.extras || [],
            extrasQuantities: schedule.extras_quantities || schedule.extrasQuantities || {},
            notes: schedule.notes || null,
            subtotal: Math.round(subtotal),
            serviceFee: serviceFee,
            frequencyDiscount: 0, // Manual pricing doesn't show discount breakdown
            total: totalAmountRands,
            snapshot_date: new Date().toISOString(),
            manual_pricing: true, // Flag to indicate this is from stored pricing
          };

          console.log(`[Cron] Schedule ${schedule.id}: Using stored pricing - R${totalAmountRands.toFixed(2)}`);
        } else {
          // Calculate pricing dynamically
          const pricingFrequency = mapFrequencyToPricingFrequency(schedule.frequency);
          const pricing = await calcTotalAsync(
            {
              service: schedule.service_type as any,
              bedrooms: schedule.bedrooms,
              bathrooms: schedule.bathrooms,
              extras: schedule.extras || [],
              extrasQuantities: schedule.extras_quantities || schedule.extrasQuantities || {},
            },
            pricingFrequency
          );

          totalAmountCents = pricing.total * 100; // Convert to cents

          const companyCosts = deriveCompanyOnlyCostsCents({
            serviceType: schedule.service_type,
            equipmentChargeZar: pricing.breakdown.equipmentCharge,
            laborSubtotalOneCleanerZar: pricing.breakdown.laborSubtotalOneCleaner,
            numberOfCleaners: pricing.breakdown.numberOfCleaners,
          });

          earningsPayload = buildEarningsInsertFields({
            totalAmountCents,
            serviceFeeCents: Math.round(pricing.serviceFee * 100),
            tipCents: 0,
            hireDate: hireDateForEarnings,
            serviceType: schedule.service_type,
            requiresTeam: requiresTeamForEarnings,
            teamSize: defaultTeamSize,
            equipmentCostCents: companyCosts.equipmentCostCents,
            extraCleanerFeeCents: companyCosts.extraCleanerFeeCents,
          });

          // Build price snapshot
          priceSnapshot = {
            service_type: schedule.service_type,
            bedrooms: schedule.bedrooms,
            bathrooms: schedule.bathrooms,
            extras: schedule.extras || [],
            extrasQuantities: schedule.extras_quantities || schedule.extrasQuantities || {},
            notes: schedule.notes || null,
            subtotal: pricing.subtotal,
            serviceFee: pricing.serviceFee,
            frequencyDiscount: pricing.frequencyDiscount,
            total: pricing.total,
            snapshot_date: new Date().toISOString(),
          };

          console.log(`[Cron] Schedule ${schedule.id}: Calculated pricing - R${pricing.total.toFixed(2)}`);
        }

        // Check for existing bookings to avoid duplicates
        const dateStrings = validOccurrences.map((o) => o.date.toISOString().split('T')[0]);
        const { data: existingBookings } = await svc
          .from('bookings')
          .select('booking_date')
          .eq('recurring_schedule_id', schedule.id)
          .in('booking_date', dateStrings);

        const existingDates = new Set(
          (existingBookings || []).map((b: any) => b.booking_date)
        );

        // Create bookings for each valid date
        const bookingsToCreate = validOccurrences
          .filter((occ) => {
            const dateStr = occ.date.toISOString().split('T')[0];
            return !existingDates.has(dateStr);
          })
          .map((occ) => {
            const bookingId = generateUniqueBookingId();
            const dateStr = occ.date.toISOString().split('T')[0];
            const timeStr = occ.time; // Already in HH:MM format

            // Determine if team booking
            const requiresTeam = schedule.service_type === 'Deep' || schedule.service_type === 'Move In/Out';
            const cleanerIdForInsert = requiresTeam || !schedule.cleaner_id || schedule.cleaner_id === 'manual'
              ? null
              : schedule.cleaner_id;

            const bookingData: any = {
              id: bookingId,
              customer_id: schedule.customer_id,
              cleaner_id: cleanerIdForInsert,
              booking_date: dateStr,
              booking_time: timeStr,
              service_type: schedule.service_type,
              customer_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer',
              customer_email: customer.email || '',
              customer_phone: customer.phone || '',
              address_line1: schedule.address_line1,
              address_suburb: schedule.address_suburb,
              address_city: schedule.address_city,
              total_amount: totalAmountCents,
              requires_team: requiresTeam,
              price_snapshot: priceSnapshot,
              status: 'pending',
              recurring_schedule_id: schedule.id,
            };

            if (earningsPayload) {
              Object.assign(bookingData, earningsPayload);
            }

            return bookingData;
          });

        if (bookingsToCreate.length === 0) {
          console.log(`[Cron] Schedule ${schedule.id}: All dates already have bookings`);
          // Still update last_generated_month
          await svc
            .from('recurring_schedules')
            .update({ last_generated_month: nextMonthYear })
            .eq('id', schedule.id);
          continue;
        }

        // Insert bookings in batch
        const { error: insertError } = await svc
          .from('bookings')
          .insert(bookingsToCreate);

        if (insertError) {
          errors.push(`Schedule ${schedule.id}: Failed to create bookings - ${insertError.message}`);
          console.error(`[Cron] Schedule ${schedule.id}: Insert error:`, insertError);
          continue;
        }

        // Create invoice for next month + attempt auto-charge (idempotent by schedule+month)
        try {
          const invoiceTotalAmount = totalAmountCents * bookingsToCreate.length;

          const { data: existingInvoice, error: existingInvoiceError } = await svc
            .from('recurring_invoices')
            .select('id, status, payment_reference')
            .eq('recurring_schedule_id', schedule.id)
            .eq('month_year', nextMonthYear)
            .maybeSingle();

          if (existingInvoiceError) {
            console.error(`[Cron] Schedule ${schedule.id}: Error checking existing invoice:`, existingInvoiceError);
          }

          if (!existingInvoice?.id) {
            const invoiceReference = generateInvoiceReference(`INV-${nextMonthYear}`);

            const { data: createdInvoice, error: createInvoiceError } = await svc
              .from('recurring_invoices')
              .insert({
                customer_id: schedule.customer_id,
                recurring_schedule_id: schedule.id,
                period_start: nextMonthFirstDay,
                period_end: nextMonthLastDay,
                month_year: nextMonthYear,
                total_amount: invoiceTotalAmount,
                payment_reference: invoiceReference,
                status: 'pending',
              })
              .select('id, payment_reference, status')
              .single();

            if (createInvoiceError || !createdInvoice) {
              console.error(`[Cron] Schedule ${schedule.id}: Failed to create invoice:`, createInvoiceError);
            } else {
              const authCode = (customer as any)?.paystack_authorization_code || null;
              const authEmail = (customer as any)?.paystack_authorization_email || customer.email || null;
              const authReusable = (customer as any)?.paystack_authorization_reusable;

              if (!authCode || !authEmail || authReusable === false) {
                await svc
                  .from('recurring_invoices')
                  .update({ status: 'requires_action', updated_at: new Date().toISOString() })
                  .eq('id', createdInvoice.id);
                console.log(
                  `[Cron] Schedule ${schedule.id}: No reusable Paystack authorization. Invoice requires action: ${createdInvoice.payment_reference}`
                );
              } else {
                try {
                  const chargeResult = await chargePaystackAuthorization({
                    authorizationCode: authCode,
                    email: authEmail,
                    amountCents: invoiceTotalAmount,
                    reference: createdInvoice.payment_reference,
                    currency: 'ZAR',
                    metadata: {
                      recurring_schedule_id: schedule.id,
                      month_year: nextMonthYear,
                      bookings_count: bookingsToCreate.length,
                    },
                  });

                  const chargeStatus = chargeResult?.data?.status || '';
                  const nextStatus =
                    chargeStatus === 'success'
                      ? 'paid'
                      : chargeStatus === 'failed'
                        ? 'failed'
                        : 'requires_action';

                  await svc
                    .from('recurring_invoices')
                    .update({ status: nextStatus, updated_at: new Date().toISOString() })
                    .eq('id', createdInvoice.id);

                  // If Paystack returns updated authorization, store it.
                  const auth = chargeResult?.data?.authorization;
                  if (auth?.authorization_code) {
                    await svc
                      .from('customers')
                      .update({
                        paystack_authorization_code: auth.authorization_code,
                        paystack_authorization_email: authEmail,
                        paystack_authorization_reusable: auth.reusable ?? null,
                        paystack_authorization_signature: auth.signature ?? null,
                        updated_at: new Date().toISOString(),
                      })
                      .eq('id', schedule.customer_id);
                  }

                  console.log(
                    `[Cron] Schedule ${schedule.id}: Auto-charge ${nextStatus} for ${nextMonthYear} (invoice ${createdInvoice.payment_reference})`
                  );
                } catch (chargeErr) {
                  console.error(`[Cron] Schedule ${schedule.id}: Auto-charge error:`, chargeErr);
                  await svc
                    .from('recurring_invoices')
                    .update({ status: 'requires_action', updated_at: new Date().toISOString() })
                    .eq('id', createdInvoice.id);
                }
              }
            }
          } else {
            console.log(
              `[Cron] Schedule ${schedule.id}: Invoice already exists for ${nextMonthYear} (${existingInvoice.payment_reference}), status=${existingInvoice.status}`
            );
          }
        } catch (invoiceErr) {
          console.error(`[Cron] Schedule ${schedule.id}: Invoice/charge processing failed:`, invoiceErr);
        }

        // Update last_generated_month (after bookings/invoice attempt)
        const { error: updateError } = await svc
          .from('recurring_schedules')
          .update({ last_generated_month: nextMonthYear })
          .eq('id', schedule.id);

        if (updateError) {
          errors.push(`Schedule ${schedule.id}: Failed to update last_generated_month - ${updateError.message}`);
          console.error(`[Cron] Schedule ${schedule.id}: Update error:`, updateError);
        } else {
          totalGenerated += bookingsToCreate.length;
          console.log(`[Cron] Schedule ${schedule.id}: Created ${bookingsToCreate.length} bookings for ${nextMonthYear}`);
        }
      } catch (error: any) {
        const errorMsg = `Schedule ${schedule.id}: ${error.message || 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`[Cron] Error processing schedule ${schedule.id}:`, error);
        // Continue with next schedule
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Processed ${processed} schedules, generated ${totalGenerated} bookings for ${nextMonthYear}`,
      processed,
      generated: totalGenerated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (e: any) {
    console.error('[Cron] Fatal error in generate-recurring-bookings:', e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

