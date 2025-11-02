/**
 * Script to check pending bookings from the database
 * Usage: node scripts/check-pending-bookings.js
 * 
 * Make sure your .env.local file has:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)
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

async function checkPendingBookings() {
  console.log('🔍 Checking pending bookings...\n');

  try {
    // Get count of pending bookings
    const { count: pendingCount, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (countError) {
      throw countError;
    }

    console.log(`📊 Total Pending Bookings: ${pendingCount || 0}\n`);

    if (pendingCount === 0) {
      console.log('✅ No pending bookings found!');
      return;
    }

    // Fetch pending bookings with details
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        service_type,
        customer_name,
        customer_email,
        customer_phone,
        address_line1,
        address_suburb,
        address_city,
        status,
        total_amount,
        cleaner_id,
        created_at
      `)
      .eq('status', 'pending')
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true })
      .limit(100);

    if (bookingsError) {
      throw bookingsError;
    }

    console.log(`📋 Found ${bookings.length} pending booking(s):\n`);
    console.log('─'.repeat(100));

    bookings.forEach((booking, index) => {
      const bookingDate = new Date(booking.booking_date).toLocaleDateString();
      const assigned = booking.cleaner_id ? '✅ Assigned' : '⚠️  Unassigned';
      const assignedTo = booking.cleaner_id || 'None';
      
      console.log(`\n${index + 1}. Booking ID: ${booking.id}`);
      console.log(`   Customer: ${booking.customer_name || 'N/A'}`);
      console.log(`   Email: ${booking.customer_email || 'N/A'}`);
      console.log(`   Phone: ${booking.customer_phone || 'N/A'}`);
      console.log(`   Date: ${bookingDate}`);
      console.log(`   Time: ${booking.booking_time || 'N/A'}`);
      console.log(`   Service: ${booking.service_type || 'N/A'}`);
      console.log(`   Amount: R${(booking.total_amount || 0).toFixed(2)}`);
      console.log(`   Status: ${assigned}`);
      console.log(`   Cleaner ID: ${assignedTo}`);
      if (booking.address_line1) {
        console.log(`   Address: ${booking.address_line1}, ${booking.address_suburb || ''}, ${booking.address_city || ''}`);
      }
      console.log(`   Created: ${new Date(booking.created_at).toLocaleString()}`);
    });

    console.log('\n' + '─'.repeat(100));

    // Summary by date
    const bookingsByDate = {};
    bookings.forEach(b => {
      const date = b.booking_date;
      if (!bookingsByDate[date]) {
        bookingsByDate[date] = [];
      }
      bookingsByDate[date].push(b);
    });

    console.log('\n📅 Summary by Date:');
    Object.entries(bookingsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, dateBookings]) => {
        const unassigned = dateBookings.filter(b => !b.cleaner_id).length;
        console.log(`   ${date}: ${dateBookings.length} booking(s) (${unassigned} unassigned)`);
      });

    // Summary by service type
    const bookingsByService = {};
    bookings.forEach(b => {
      const service = b.service_type || 'Unknown';
      bookingsByService[service] = (bookingsByService[service] || 0) + 1;
    });

    console.log('\n🧹 Summary by Service Type:');
    Object.entries(bookingsByService)
      .sort(([, a], [, b]) => b - a)
      .forEach(([service, count]) => {
        console.log(`   ${service}: ${count}`);
      });

    // Unassigned bookings
    const unassigned = bookings.filter(b => !b.cleaner_id || b.cleaner_id === 'manual');
    if (unassigned.length > 0) {
      console.log(`\n⚠️  ${unassigned.length} unassigned booking(s) need attention:`);
      unassigned.slice(0, 10).forEach(b => {
        console.log(`   - ${b.id}: ${b.customer_name} on ${b.booking_date} at ${b.booking_time}`);
      });
      if (unassigned.length > 10) {
        console.log(`   ... and ${unassigned.length - 10} more`);
      }
    }

    console.log('\n✅ Check complete!');
    console.log(`\n💡 To view in admin dashboard: http://localhost:3000/admin/bookings?status=pending`);

  } catch (error) {
    console.error('❌ Error checking pending bookings:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkPendingBookings();

