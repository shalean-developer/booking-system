/**
 * Booking Reminder Service
 * 
 * This service handles sending booking reminders via email and SMS.
 * It should be called by a cron job that runs every hour.
 * 
 * Setup Instructions:
 * 1. Set up a cron job (e.g., using Supabase Edge Functions, Vercel Cron, or external service)
 * 2. Configure email service (Resend, SendGrid, etc.)
 * 3. Configure SMS service (Twilio, AWS SNS, etc.)
 * 4. Call checkAndSendReminders() every hour
 */

import { createClient } from '@supabase/supabase-js';

interface BookingReminder {
  booking_id: string; // TEXT in database
  customer_id: string; // UUID in database
  customer_email: string;
  customer_phone: string | null;
  booking_date: string;
  booking_time: string;
  service_type: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
}

interface ReminderServiceConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  emailService?: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  smsService?: {
    provider: 'twilio' | 'aws-sns' | 'custom';
    apiKey: string;
    fromNumber?: string;
  };
}

export class ReminderService {
  private supabase: ReturnType<typeof createClient>;
  private config: ReminderServiceConfig;

  constructor(config: ReminderServiceConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  }

  /**
   * Main function to check and send reminders
   * Call this from your cron job
   */
  async checkAndSendReminders() {
    const results = {
      email_24h: { sent: 0, failed: 0 },
      email_2h: { sent: 0, failed: 0 },
      sms_24h: { sent: 0, failed: 0 },
      sms_2h: { sent: 0, failed: 0 },
    };

    try {
      // Check for 24-hour reminders
      const bookings24h = await this.getBookingsNeedingReminders(24, 'email_24h');
      for (const booking of bookings24h) {
        const success = await this.sendEmailReminder(booking, 24);
        await this.recordReminderSent(booking.booking_id, booking.customer_id, 'email_24h', success);
        if (success) results.email_24h.sent++;
        else results.email_24h.failed++;
      }

      // Check for 2-hour reminders (email)
      const bookings2hEmail = await this.getBookingsNeedingReminders(2, 'email_2h');
      for (const booking of bookings2hEmail) {
        const success = await this.sendEmailReminder(booking, 2);
        await this.recordReminderSent(booking.booking_id, booking.customer_id, 'email_2h', success);
        if (success) results.email_2h.sent++;
        else results.email_2h.failed++;
      }

      // Check for 24-hour SMS reminders
      const bookings24hSms = await this.getBookingsNeedingReminders(24, 'sms_24h');
      for (const booking of bookings24hSms) {
        if (!booking.customer_phone) continue;
        const success = await this.sendSmsReminder(booking, 24);
        await this.recordReminderSent(booking.booking_id, booking.customer_id, 'sms_24h', success);
        if (success) results.sms_24h.sent++;
        else results.sms_24h.failed++;
      }

      // Check for 2-hour SMS reminders
      const bookings2hSms = await this.getBookingsNeedingReminders(2, 'sms_2h');
      for (const booking of bookings2hSms) {
        if (!booking.customer_phone) continue;
        const success = await this.sendSmsReminder(booking, 2);
        await this.recordReminderSent(booking.booking_id, booking.customer_id, 'sms_2h', success);
        if (success) results.sms_2h.sent++;
        else results.sms_2h.failed++;
      }

      return results;
    } catch (error) {
      console.error('Error checking and sending reminders:', error);
      throw error;
    }
  }

  /**
   * Get bookings that need reminders
   */
  private async getBookingsNeedingReminders(
    hours: number,
    reminderType: 'email_24h' | 'email_2h' | 'sms_24h' | 'sms_2h'
  ): Promise<BookingReminder[]> {
    const { data, error } = await this.supabase.rpc('get_bookings_needing_reminders', {
      reminder_hours: hours,
      reminder_type: reminderType,
    } as any) as { data: any[] | null; error: any };

    if (error) {
      console.error(`Error fetching bookings for ${reminderType}:`, error);
      return [];
    }

    return (data || []).map((row: any) => ({
      booking_id: row.booking_id,
      customer_id: row.customer_id,
      customer_email: row.customer_email,
      customer_phone: row.customer_phone,
      booking_date: row.booking_date,
      booking_time: row.booking_time,
      service_type: row.service_type,
      address_line1: row.address_line1,
      address_suburb: row.address_suburb,
      address_city: row.address_city,
    }));
  }

  /**
   * Send email reminder
   */
  private async sendEmailReminder(booking: BookingReminder, hours: number): Promise<boolean> {
    if (!this.config.emailService) {
      console.warn('Email service not configured');
      return false;
    }

    try {
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
      const formattedDate = bookingDateTime.toLocaleDateString('en-ZA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const formattedTime = bookingDateTime.toLocaleTimeString('en-ZA', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const subject = `Reminder: Your ${booking.service_type} appointment is ${hours === 24 ? 'tomorrow' : 'in 2 hours'}`;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #14b8a6;">Booking Reminder</h2>
            <p>Hello,</p>
            <p>This is a reminder that you have a <strong>${booking.service_type}</strong> appointment:</p>
            <div style="background: #f0fdfa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${formattedTime}</p>
              <p><strong>Address:</strong> ${booking.address_line1}, ${booking.address_suburb}, ${booking.address_city}</p>
            </div>
            <p>We look forward to seeing you!</p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              If you need to reschedule or cancel, please visit your dashboard or contact us.
            </p>
          </div>
        </body>
        </html>
      `;

      // Use Resend or your email service
      // Example with Resend:
      if (typeof fetch !== 'undefined') {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.emailService.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${this.config.emailService.fromName} <${this.config.emailService.fromEmail}>`,
            to: [booking.customer_email],
            subject,
            html,
          }),
        });

        return response.ok;
      }

      return false;
    } catch (error) {
      console.error('Error sending email reminder:', error);
      return false;
    }
  }

  /**
   * Send SMS reminder
   */
  private async sendSmsReminder(booking: BookingReminder, hours: number): Promise<boolean> {
    if (!this.config.smsService || !booking.customer_phone) {
      console.warn('SMS service not configured or no phone number');
      return false;
    }

    try {
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
      const formattedDate = bookingDateTime.toLocaleDateString('en-ZA', {
        month: 'short',
        day: 'numeric',
      });
      const formattedTime = bookingDateTime.toLocaleTimeString('en-ZA', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const message = `Reminder: Your ${booking.service_type} appointment is ${hours === 24 ? 'tomorrow' : 'in 2 hours'} on ${formattedDate} at ${formattedTime}. Address: ${booking.address_line1}, ${booking.address_suburb}`;

      // Example with Twilio
      if (this.config.smsService.provider === 'twilio') {
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${this.config.smsService.apiKey}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${Buffer.from(`${this.config.smsService.apiKey}:${this.config.smsService.fromNumber}`).toString('base64')}`,
            },
            body: new URLSearchParams({
              From: this.config.smsService.fromNumber || '',
              To: booking.customer_phone,
              Body: message,
            }),
          }
        );

        return response.ok;
      }

      return false;
    } catch (error) {
      console.error('Error sending SMS reminder:', error);
      return false;
    }
  }

  /**
   * Record that a reminder was sent
   */
  private async recordReminderSent(
    bookingId: string,
    customerId: string,
    reminderType: string,
    success: boolean
  ) {
    try {
      await (this.supabase.from('sent_reminders') as any).insert({
        booking_id: bookingId,
        customer_id: customerId,
        reminder_type: reminderType,
        delivery_status: success ? 'sent' : 'failed',
      });
    } catch (error) {
      console.error('Error recording reminder:', error);
    }
  }
}

/**
 * Example usage in a cron job (e.g., Supabase Edge Function or Vercel Cron)
 * 
 * export default async function handler() {
 *   const service = new ReminderService({
 *     supabaseUrl: process.env.SUPABASE_URL!,
 *     supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
 *     emailService: {
 *       apiKey: process.env.RESEND_API_KEY!,
 *       fromEmail: 'noreply@yourdomain.com',
 *       fromName: 'Your Cleaning Service',
 *     },
 *     smsService: {
 *       provider: 'twilio',
 *       apiKey: process.env.TWILIO_ACCOUNT_SID!,
 *       fromNumber: process.env.TWILIO_PHONE_NUMBER!,
 *     },
 *   });
 * 
 *   const results = await service.checkAndSendReminders();
 *   console.log('Reminder results:', results);
 *   return results;
 * }
 */
