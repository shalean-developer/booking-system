/**
 * Script to check today's completed bookings and revenue
 * Usage: node scripts/check-today-revenue.js
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

async function checkTodayRevenue() {
  console.log('🔍 Checking today\'s completed bookings and revenue...\n');

  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    
    console.log(`📅 Today's date: ${todayISO}\n`);

    // Check all bookings for today
    const { data: allTodayBookings, error: allError } = await supabase
      .from('bookings')
      .select('id, booking_date, status, total_amount, customer_name')
      .eq('booking_date', todayISO);

    if (allError) {
      throw allError;
    }

    console.log(`📊 All bookings for today (${todayISO}): ${allTodayBookings?.length || 0}`);
    if (allTodayBookings && allTodayBookings.length > 0) {
      console.log('\nBreakdown by status:');
      const byStatus = {};
      allTodayBookings.forEach(b => {
        byStatus[b.status] = (byStatus[b.status] || 0) + 1;
      });
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
    }

    // Check completed bookings for today
    const { data: completedToday, error: completedError } = await supabase
      .from('bookings')
      .select('id, booking_date, status, total_amount, customer_name, cleaner_completed_at')
      .eq('booking_date', todayISO)
      .eq('status', 'completed');

    if (completedError) {
      throw completedError;
    }

    console.log(`\n✅ Completed bookings for today: ${completedToday?.length || 0}`);
    
    if (!completedToday || completedToday.length === 0) {
      console.log('\n⚠️  No completed bookings found for today!');
      console.log('   This could mean:');
      console.log('   1. The bookings have status other than "completed"');
      console.log('   2. The booking_date doesn\'t match today\'s date');
      console.log('   3. There are no bookings scheduled for today');
      return;
    }

    console.log('\n📋 Completed booking details:');
    let totalCents = 0;
    completedToday.forEach((booking, idx) => {
      const amount = booking.total_amount || 0;
      const amountRands = amount / 100;
      totalCents += amount;
      
      console.log(`\n   ${idx + 1}. Booking ID: ${booking.id}`);
      console.log(`      Customer: ${booking.customer_name || 'N/A'}`);
      console.log(`      Date: ${booking.booking_date}`);
      console.log(`      Status: ${booking.status}`);
      console.log(`      Total Amount: ${amount} cents = R${amountRands.toFixed(2)}`);
      if (booking.cleaner_completed_at) {
        console.log(`      Completed at: ${new Date(booking.cleaner_completed_at).toLocaleString()}`);
      }
    });

    const totalRands = totalCents / 100;
    console.log('\n' + '─'.repeat(60));
    console.log(`💰 Total Revenue Today: ${totalCents} cents = R${totalRands.toFixed(2)}`);
    console.log('─'.repeat(60));

    // Check if any have null total_amount
    const withNullAmount = completedToday.filter(b => !b.total_amount || b.total_amount === 0);
    if (withNullAmount.length > 0) {
      console.log(`\n⚠️  Warning: ${withNullAmount.length} completed booking(s) have null or zero total_amount:`);
      withNullAmount.forEach(b => {
        console.log(`   - ${b.id}: ${b.customer_name || 'N/A'}`);
      });
    }

    // Check date format variations
    console.log('\n🔍 Checking for date format issues...');
    const { data: dateCheck } = await supabase
      .from('bookings')
      .select('id, booking_date, status, total_amount')
      .eq('status', 'completed')
      .limit(10);
    
    if (dateCheck && dateCheck.length > 0) {
      console.log('   Sample of completed bookings (any date):');
      dateCheck.slice(0, 5).forEach(b => {
        const isToday = b.booking_date === todayISO;
        console.log(`   - ${b.id}: date=${b.booking_date} ${isToday ? '(TODAY!)' : ''}, amount=${b.total_amount || 'null'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking today\'s revenue:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkTodayRevenue();

