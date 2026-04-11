/**
 * Script to fix bookings with missing total_amount by using price_snapshot
 * Usage: node scripts/fix-missing-booking-amounts.js [--dry-run]
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

async function fixMissingAmounts() {
  console.log(isDryRun ? '🔍 DRY RUN: Checking bookings with missing amounts...' : '🔧 Fixing bookings with missing amounts...\n');

  try {
    // Find bookings with null or zero total_amount but have price_snapshot
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, total_amount, price_snapshot, customer_name, booking_date, status')
      .or('total_amount.is.null,total_amount.eq.0')
      .not('price_snapshot', 'is', null)
      .limit(100);

    if (error) {
      throw error;
    }

    if (!bookings || bookings.length === 0) {
      console.log('✅ No bookings found with missing amounts that have price_snapshot');
      return;
    }

    console.log(`📋 Found ${bookings.length} booking(s) with missing total_amount:\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const booking of bookings) {
      try {
        let snapshot;
        if (typeof booking.price_snapshot === 'string') {
          snapshot = JSON.parse(booking.price_snapshot);
        } else {
          snapshot = booking.price_snapshot;
        }

        // Try to extract total from price_snapshot
        const totalInCents = snapshot?.total || snapshot?.totalAmount;
        
        if (!totalInCents || totalInCents === 0) {
          console.log(`⚠️  Skipping ${booking.id}: price_snapshot exists but no total amount found`);
          console.log(`   Customer: ${booking.customer_name || 'N/A'}, Date: ${booking.booking_date}`);
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
          }
        } else {
          console.log(`   [DRY RUN] Would update total_amount to ${totalInCents} cents`);
          fixedCount++;
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
      console.log(`   Would skip: ${skippedCount} booking(s)`);
      console.log(`\n💡 Run without --dry-run to apply changes`);
    } else {
      console.log(`📊 Fix Results:`);
      console.log(`   ✅ Fixed: ${fixedCount} booking(s)`);
      console.log(`   ⚠️  Skipped: ${skippedCount} booking(s)`);
    }
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('❌ Error fixing bookings:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixMissingAmounts();

