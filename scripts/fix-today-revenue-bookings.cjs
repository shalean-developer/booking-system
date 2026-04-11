/**
 * Script to fix bookings with missing total_amount for today's revenue
 * This script queries all completed bookings for today and updates missing total_amount from price_snapshot
 * Usage: node scripts/fix-today-revenue-bookings.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local file manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const isDryRun = process.argv.includes('--dry-run');

async function fixTodayRevenueBookings() {
  console.log(isDryRun ? '🔍 DRY RUN: Checking today\'s completed bookings for missing amounts...' : '🔧 Fixing today\'s completed bookings with missing amounts...\n');

  try {
    // Get today's date
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    
    console.log(`📅 Today's date: ${todayISO}\n`);

    // Find all completed bookings for today with missing or zero total_amount
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, total_amount, price_snapshot, customer_name, booking_date, status, created_at')
      .eq('booking_date', todayISO)
      .or('status.ilike.completed,status.eq.completed') // Case-insensitive
      .or('total_amount.is.null,total_amount.eq.0')
      .not('price_snapshot', 'is', null);

    if (error) {
      throw error;
    }

    if (!bookings || bookings.length === 0) {
      console.log('✅ No bookings found with missing amounts that have price_snapshot');
      
      // Also check if there are any completed bookings at all
      const { data: allCompleted } = await supabase
        .from('bookings')
        .select('id, total_amount, customer_name')
        .eq('booking_date', todayISO)
        .ilike('status', 'completed');
      
      console.log(`\n📊 Total completed bookings for today: ${allCompleted?.length || 0}`);
      if (allCompleted && allCompleted.length > 0) {
        const withAmount = allCompleted.filter(b => b.total_amount && b.total_amount > 0);
        const withoutAmount = allCompleted.filter(b => !b.total_amount || b.total_amount === 0);
        console.log(`   - With valid total_amount: ${withAmount.length}`);
        console.log(`   - Without total_amount: ${withoutAmount.length}`);
        if (withoutAmount.length > 0) {
          console.log(`\n   Bookings without amount:`);
          withoutAmount.forEach(b => {
            console.log(`     - ${b.id}: ${b.customer_name || 'N/A'}`);
          });
        }
      }
      return;
    }

    console.log(`📋 Found ${bookings.length} booking(s) with missing total_amount that have price_snapshot:\n`);

    let fixedCount = 0;
    let skippedCount = 0;
    let totalRevenueRecovered = 0;

    for (const booking of bookings) {
      try {
        let snapshot;
        if (typeof booking.price_snapshot === 'string') {
          snapshot = JSON.parse(booking.price_snapshot);
        } else {
          snapshot = booking.price_snapshot;
        }

        // Try multiple field name variations
        const totalInCents = snapshot?.total 
          || snapshot?.totalAmount 
          || snapshot?.price
          || snapshot?.amount
          || (snapshot?.subtotal && snapshot?.serviceFee ? snapshot.subtotal + snapshot.serviceFee : null);
        
        if (!totalInCents || totalInCents === 0) {
          console.log(`⚠️  Skipping ${booking.id}: price_snapshot exists but no amount found`);
          console.log(`   Customer: ${booking.customer_name || 'N/A'}, Date: ${booking.booking_date}`);
          console.log(`   Snapshot keys: ${Object.keys(snapshot || {}).join(', ') || 'none'}`);
          skippedCount++;
          continue;
        }

        const totalInRands = totalInCents / 100;
        console.log(`📝 Booking ${booking.id}:`);
        console.log(`   Customer: ${booking.customer_name || 'N/A'}`);
        console.log(`   Date: ${booking.booking_date}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Current total_amount: ${booking.total_amount || 'NULL'}`);
        console.log(`   Found in price_snapshot: ${totalInCents} cents = R${totalInRands.toFixed(2)}`);

        if (!isDryRun) {
          // Update the booking with the total_amount from price_snapshot
          const { error: updateError } = await supabase
            .from('bookings')
            .update({ 
              total_amount: totalInCents 
            })
            .eq('id', booking.id);

          if (updateError) {
            console.log(`   ❌ Failed to update: ${updateError.message}`);
            skippedCount++;
          } else {
            console.log(`   ✅ Updated successfully`);
            fixedCount++;
            totalRevenueRecovered += totalInCents;
          }
        } else {
          console.log(`   [DRY RUN] Would update total_amount to ${totalInCents} cents`);
          fixedCount++;
          totalRevenueRecovered += totalInCents;
        }
        console.log('');
      } catch (parseError) {
        console.log(`⚠️  Skipping ${booking.id}: Error parsing price_snapshot - ${parseError.message}`);
        skippedCount++;
      }
    }

    console.log('─'.repeat(60));
    if (isDryRun) {
      console.log(`📊 DRY RUN Results:`);
      console.log(`   Would fix: ${fixedCount} booking(s)`);
      console.log(`   Would recover: ${totalRevenueRecovered} cents = R${(totalRevenueRecovered / 100).toFixed(2)}`);
      console.log(`   Would skip: ${skippedCount} booking(s)`);
      console.log(`\n💡 Run without --dry-run to apply changes`);
    } else {
      console.log(`📊 Fix Results:`);
      console.log(`   ✅ Fixed: ${fixedCount} booking(s)`);
      console.log(`   💰 Revenue recovered: ${totalRevenueRecovered} cents = R${(totalRevenueRecovered / 100).toFixed(2)}`);
      console.log(`   ⚠️  Skipped: ${skippedCount} booking(s)`);
      console.log(`\n💡 Refresh your dashboard to see the updated Revenue Today amount`);
    }
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('❌ Error fixing bookings:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixTodayRevenueBookings();

