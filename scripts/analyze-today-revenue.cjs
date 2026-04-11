/**
 * Script to analyze today's revenue breakdown
 * Shows which bookings contributed to the total revenue
 * Usage: node scripts/analyze-today-revenue.js
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

async function analyzeTodayRevenue() {
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];
  
  console.log('📊 Analyzing Today\'s Revenue Breakdown\n');
  console.log(`📅 Date: ${todayISO}\n`);
  console.log('='.repeat(70));

  try {
    // Get all completed bookings for today
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, total_amount, price_snapshot, customer_name, booking_date, status, service_type, booking_time, created_at')
      .eq('booking_date', todayISO)
      .ilike('status', 'completed')
      .order('booking_time', { ascending: true });

    if (error) throw error;

    if (!bookings || bookings.length === 0) {
      console.log('❌ No completed bookings found for today');
      return;
    }

    console.log(`\n✅ Found ${bookings.length} completed booking(s) for today\n`);

    let totalFromAmount = 0;
    let totalFromSnapshot = 0;
    const bookingsBreakdown = [];

    bookings.forEach((booking, idx) => {
      let amount = booking.total_amount || 0;
      let amountSource = 'total_amount';
      let fallbackDetails = null;

      // If total_amount is missing/zero, try price_snapshot
      if ((!amount || amount === 0) && booking.price_snapshot) {
        try {
          const snapshot = typeof booking.price_snapshot === 'string' 
            ? JSON.parse(booking.price_snapshot) 
            : booking.price_snapshot;
          
          // Try multiple field variations
          const snapshotAmount = snapshot?.total 
            || snapshot?.totalAmount 
            || snapshot?.price
            || snapshot?.amount
            || (snapshot?.subtotal && snapshot?.serviceFee ? snapshot.subtotal + snapshot.serviceFee : null);
          
          if (snapshotAmount && snapshotAmount > 0) {
            amount = snapshotAmount;
            amountSource = 'price_snapshot';
            fallbackDetails = {
              field: Object.keys(snapshot).find(k => snapshot[k] === snapshotAmount) || 'calculated',
              rawValue: snapshotAmount
            };
            totalFromSnapshot += amount;
          }
        } catch (e) {
          // Parse error - skip
        }
      } else if (amount > 0) {
        totalFromAmount += amount;
      }

      const amountRands = amount / 100;
      bookingsBreakdown.push({
        index: idx + 1,
        id: booking.id,
        customer: booking.customer_name || 'N/A',
        service: booking.service_type || 'N/A',
        time: booking.booking_time || 'N/A',
        amount: amount,
        amountRands: amountRands,
        source: amountSource,
        fallback: fallbackDetails,
        hasSnapshot: !!booking.price_snapshot
      });
    });

    // Display breakdown
    console.log('📋 Bookings Breakdown:\n');
    bookingsBreakdown.forEach(b => {
      console.log(`${b.index}. ${b.id}`);
      console.log(`   Customer: ${b.customer}`);
      console.log(`   Service: ${b.service}`);
      console.log(`   Time: ${b.time}`);
      console.log(`   Amount: R${b.amountRands.toFixed(2)} (${b.amount} cents)`);
      console.log(`   Source: ${b.source}`);
      if (b.fallback) {
        console.log(`   └─ Fallback: From price_snapshot field "${b.fallback.field}"`);
      } else if (b.source === 'total_amount') {
        console.log(`   └─ From total_amount field (direct)`);
      } else {
        console.log(`   └─ ⚠️  No amount available (both total_amount and price_snapshot missing/zero)`);
      }
      console.log('');
    });

    // Summary
    const totalRevenue = totalFromAmount + totalFromSnapshot;
    const totalRevenueRands = totalRevenue / 100;

    console.log('='.repeat(70));
    console.log('💰 Revenue Summary:\n');
    console.log(`   Total Bookings: ${bookings.length}`);
    console.log(`   Revenue from total_amount: ${totalFromAmount} cents = R${(totalFromAmount / 100).toFixed(2)}`);
    console.log(`   Revenue from price_snapshot fallback: ${totalFromSnapshot} cents = R${(totalFromSnapshot / 100).toFixed(2)}`);
    console.log(`   ─────────────────────────────────────────────────────────`);
    console.log(`   TOTAL REVENUE: ${totalRevenue} cents = R${totalRevenueRands.toFixed(2)}`);
    console.log('='.repeat(70));

    // Breakdown by source
    console.log('\n📊 Revenue Source Breakdown:\n');
    const fromAmount = bookingsBreakdown.filter(b => b.source === 'total_amount' && b.amount > 0);
    const fromSnapshot = bookingsBreakdown.filter(b => b.source === 'price_snapshot');
    const withoutAmount = bookingsBreakdown.filter(b => b.amount === 0);

    console.log(`   ✅ Using total_amount: ${fromAmount.length} booking(s)`);
    fromAmount.forEach(b => {
      console.log(`      - ${b.customer}: R${b.amountRands.toFixed(2)}`);
    });

    if (fromSnapshot.length > 0) {
      console.log(`\n   🔄 Using price_snapshot fallback: ${fromSnapshot.length} booking(s)`);
      fromSnapshot.forEach(b => {
        console.log(`      - ${b.customer}: R${b.amountRands.toFixed(2)} (from ${b.fallback?.field || 'unknown'})`);
      });
    }

    if (withoutAmount.length > 0) {
      console.log(`\n   ⚠️  No amount available: ${withoutAmount.length} booking(s)`);
      withoutAmount.forEach(b => {
        console.log(`      - ${b.customer} (${b.id})`);
      });
    }

    // Service type breakdown
    const byService = {};
    bookingsBreakdown.forEach(b => {
      const service = b.service;
      if (!byService[service]) {
        byService[service] = { count: 0, revenue: 0 };
      }
      byService[service].count++;
      byService[service].revenue += b.amountRands;
    });

    console.log('\n📦 Breakdown by Service Type:\n');
    Object.entries(byService)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .forEach(([service, data]) => {
        console.log(`   ${service}: ${data.count} booking(s) = R${data.revenue.toFixed(2)}`);
      });

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

analyzeTodayRevenue();

