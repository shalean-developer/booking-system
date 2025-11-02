/**
 * Script to fix a specific booking's total_amount
 * Usage: node scripts/fix-specific-booking.js BK-1762075705763-rmdbr40x0
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
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const bookingId = process.argv[2] || 'BK-1762075705763-rmdbr40x0';
const isDryRun = process.argv.includes('--dry-run');

async function fixBooking() {
  console.log(`🔍 Checking booking: ${bookingId}\n`);

  try {
    // Fetch the booking with all relevant fields
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, total_amount, price_snapshot, customer_name, booking_date, status, service_type, bedrooms, bathrooms, extras')
      .eq('id', bookingId)
      .single();

    if (error) {
      throw error;
    }

    if (!booking) {
      console.error(`❌ Booking ${bookingId} not found`);
      process.exit(1);
    }

    console.log('📋 Current Booking Data:');
    console.log(`   ID: ${booking.id}`);
    console.log(`   Customer: ${booking.customer_name || 'N/A'}`);
    console.log(`   Date: ${booking.booking_date}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Service: ${booking.service_type || 'N/A'}`);
    console.log(`   Bedrooms: ${booking.bedrooms || 0}`);
    console.log(`   Bathrooms: ${booking.bathrooms || 0}`);
    console.log(`   Current total_amount: ${booking.total_amount || 'NULL'} cents`);
    console.log(`   Current total_amount (rands): R${((booking.total_amount || 0) / 100).toFixed(2)}`);

    // Check price_snapshot
    let snapshotAmount = null;
    if (booking.price_snapshot) {
      try {
        const snapshot = typeof booking.price_snapshot === 'string' 
          ? JSON.parse(booking.price_snapshot) 
          : booking.price_snapshot;
        
        console.log('\n📸 Price Snapshot Data:');
        console.log(JSON.stringify(snapshot, null, 2));
        
        snapshotAmount = snapshot?.total || snapshot?.totalAmount || null;
        if (snapshotAmount) {
          console.log(`\n✅ Found amount in price_snapshot: ${snapshotAmount} cents = R${(snapshotAmount / 100).toFixed(2)}`);
        } else {
          console.log(`\n⚠️  price_snapshot exists but no total/totalAmount found`);
        }
      } catch (e) {
        console.log(`\n❌ Error parsing price_snapshot: ${e.message}`);
      }
    } else {
      console.log(`\n❌ No price_snapshot available`);
    }

    // Determine what amount to use
    let finalAmount = booking.total_amount || 0;
    let source = 'current total_amount';
    
    if ((!finalAmount || finalAmount === 0) && snapshotAmount && snapshotAmount > 0) {
      finalAmount = snapshotAmount;
      source = 'price_snapshot';
    } else if (!finalAmount || finalAmount === 0) {
      console.log('\n⚠️  Cannot determine amount - both total_amount and price_snapshot are missing/zero');
      console.log('   You may need to manually set the amount or recalculate based on service details');
      
      if (booking.service_type) {
        console.log('\n💡 Tip: You can recalculate the amount using the pricing calculator based on:');
        console.log(`   - Service Type: ${booking.service_type}`);
        console.log(`   - Bedrooms: ${booking.bedrooms || 0}`);
        console.log(`   - Bathrooms: ${booking.bathrooms || 0}`);
        console.log(`   - Extras: ${JSON.stringify(booking.extras || [])}`);
      }
      process.exit(1);
    }

    if (finalAmount > 0 && (booking.total_amount !== finalAmount)) {
      console.log(`\n🔧 Fix Required:`);
      console.log(`   Current: ${booking.total_amount || 'NULL'} cents`);
      console.log(`   Should be: ${finalAmount} cents (R${(finalAmount / 100).toFixed(2)})`);
      console.log(`   Source: ${source}`);

      if (!isDryRun) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ total_amount: finalAmount })
          .eq('id', bookingId);

        if (updateError) {
          console.error(`\n❌ Failed to update: ${updateError.message}`);
          process.exit(1);
        }

        console.log(`\n✅ Booking updated successfully!`);
        console.log(`   New total_amount: ${finalAmount} cents = R${(finalAmount / 100).toFixed(2)}`);
      } else {
        console.log(`\n[DRY RUN] Would update total_amount to ${finalAmount} cents`);
      }
    } else if (finalAmount > 0 && booking.total_amount === finalAmount) {
      console.log(`\n✅ Booking already has correct amount: R${(finalAmount / 100).toFixed(2)}`);
    } else {
      console.log(`\n⚠️  Amount is still zero - manual intervention needed`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixBooking();

