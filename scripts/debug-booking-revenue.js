/**
 * Debug script to check why revenue is R0
 * Usage: node scripts/debug-booking-revenue.js
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
  console.log('💡 To fix this, make sure .env.local has:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=your-url');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugRevenue() {
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];
  
  console.log('🔍 Debugging Today\'s Revenue Issue\n');
  console.log(`📅 Today's date: ${todayISO}\n`);

  try {
    // Get completed bookings for today
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, total_amount, price_snapshot, customer_name, booking_date, status')
      .eq('booking_date', todayISO)
      .eq('status', 'completed');

    if (error) throw error;

    console.log(`Found ${bookings?.length || 0} completed booking(s) for today\n`);

    if (!bookings || bookings.length === 0) {
      console.log('❌ No completed bookings found for today!');
      return;
    }

    let totalFromAmount = 0;
    let totalFromSnapshot = 0;
    let fixedAmounts = [];

    bookings.forEach((b, idx) => {
      console.log(`\n[${idx + 1}] Booking: ${b.id}`);
      console.log(`   Customer: ${b.customer_name || 'N/A'}`);
      
      const amount = b.total_amount || 0;
      totalFromAmount += amount;
      console.log(`   total_amount: ${amount} cents (R${(amount / 100).toFixed(2)})`);
      
      let snapshotAmount = 0;
      if (b.price_snapshot) {
        try {
          const snapshot = typeof b.price_snapshot === 'string' 
            ? JSON.parse(b.price_snapshot) 
            : b.price_snapshot;
          
          console.log(`   price_snapshot exists: YES`);
          console.log(`   price_snapshot keys: ${Object.keys(snapshot).join(', ')}`);
          
          snapshotAmount = snapshot?.total || snapshot?.totalAmount || 0;
          if (snapshotAmount > 0) {
            totalFromSnapshot += snapshotAmount;
            console.log(`   ✅ Found in snapshot: ${snapshotAmount} cents (R${(snapshotAmount / 100).toFixed(2)})`);
            if (amount === 0) {
              fixedAmounts.push({ id: b.id, amount: snapshotAmount });
              console.log(`   🔧 NEEDS FIX: total_amount is 0, but snapshot has ${snapshotAmount} cents`);
            }
          } else {
            console.log(`   ⚠️  Snapshot exists but no total/totalAmount field found`);
            console.log(`   Snapshot content: ${JSON.stringify(snapshot, null, 2).substring(0, 200)}...`);
          }
        } catch (e) {
          console.log(`   ❌ Error parsing price_snapshot: ${e.message}`);
        }
      } else {
        console.log(`   ❌ No price_snapshot available`);
      }
      
      const finalAmount = amount > 0 ? amount : snapshotAmount;
      console.log(`   → Would use: ${finalAmount} cents (R${(finalAmount / 100).toFixed(2)})`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total from total_amount: ${totalFromAmount} cents = R${(totalFromAmount / 100).toFixed(2)}`);
    console.log(`   Total from price_snapshot: ${totalFromSnapshot} cents = R${(totalFromSnapshot / 100).toFixed(2)}`);
    console.log(`   Combined total: ${totalFromAmount + totalFromSnapshot} cents = R${((totalFromAmount + totalFromSnapshot) / 100).toFixed(2)}`);
    console.log('='.repeat(60));

    if (fixedAmounts.length > 0) {
      console.log(`\n🔧 ${fixedAmounts.length} booking(s) need to be fixed:`);
      fixedAmounts.forEach(b => {
        console.log(`   - ${b.id}: Should be ${b.amount} cents (R${(b.amount / 100).toFixed(2)})`);
      });
      console.log(`\n💡 Run: node scripts/fix-specific-booking.js ${fixedAmounts[0].id}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugRevenue();

