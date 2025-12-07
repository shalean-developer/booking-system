import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET handler to download invoice/receipt for a booking
 * Requires authentication and verifies booking ownership
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }
    const supabase = await createClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json(
        { ok: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Fetch booking details and verify ownership
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, booking_date, booking_time, service_type, total_amount, payment_reference, status, customer_name, customer_email, customer_phone, address_line1, address_suburb, address_city, created_at')
      .eq('id', bookingId)
      .eq('customer_id', customer.id)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Format dates
    const bookingDate = new Date(booking.booking_date);
    const paymentDate = booking.payment_reference ? new Date(booking.created_at) : null;
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatDateTime = (date: Date) => {
      return date.toLocaleString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Determine document type
    const isReceipt = !!booking.payment_reference;
    const documentType = isReceipt ? 'Receipt' : 'Invoice';
    const documentNumber = booking.payment_reference || booking.id.slice(-8).toUpperCase();

    // Generate invoice/receipt HTML
    const invoice = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${documentType} - ${documentNumber}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      max-width: 800px; 
      margin: 40px auto; 
      padding: 20px;
      background: #f5f5f5;
    }
    .invoice-container {
      background: white;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      border-radius: 8px;
    }
    .header { 
      border-bottom: 3px solid #14b8a6; 
      padding-bottom: 20px; 
      margin-bottom: 30px; 
    }
    .company { 
      font-size: 28px; 
      font-weight: bold; 
      color: #14b8a6; 
      margin-bottom: 5px;
    }
    .company-tagline {
      color: #666;
      font-size: 14px;
    }
    .document-title { 
      font-size: 20px; 
      color: #333; 
      margin-top: 10px;
      font-weight: 600;
    }
    .document-number {
      color: #666;
      font-size: 14px;
      margin-top: 5px;
    }
    .details { 
      margin: 30px 0; 
    }
    .detail-section {
      margin-bottom: 25px;
    }
    .detail-section-title {
      font-weight: 600;
      color: #14b8a6;
      margin-bottom: 10px;
      font-size: 16px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    .detail-row { 
      margin: 8px 0; 
      display: flex;
    }
    .label { 
      font-weight: 600; 
      color: #666;
      min-width: 140px;
    }
    .value {
      color: #333;
    }
    .amount-section {
      background: #f0fdfa;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
      border-left: 4px solid #14b8a6;
    }
    .total { 
      font-size: 28px; 
      font-weight: bold; 
      color: #14b8a6; 
      margin-top: 10px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 10px;
    }
    .status-paid {
      background: #d1fae5;
      color: #065f46;
    }
    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }
    .footer { 
      margin-top: 40px; 
      padding-top: 20px; 
      border-top: 2px solid #e5e7eb; 
      color: #666; 
      font-size: 12px;
      text-align: center;
    }
    .footer-contact {
      margin-top: 10px;
      font-weight: 600;
    }
    .print-button {
      text-align: center;
      margin-top: 20px;
    }
    button {
      background: #14b8a6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover {
      background: #0d9488;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company">Shalean Cleaning Services</div>
      <div class="company-tagline">Professional Cleaning Solutions</div>
      <div class="document-title">${documentType}</div>
      <div class="document-number">${documentType} #${documentNumber}</div>
    </div>

    <div class="details">
      <div class="detail-section">
        <div class="detail-section-title">Booking Information</div>
        <div class="detail-row">
          <span class="label">Booking ID:</span>
          <span class="value">${booking.id}</span>
        </div>
        <div class="detail-row">
          <span class="label">Service Type:</span>
          <span class="value">${booking.service_type || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Service Date:</span>
          <span class="value">${formatDate(bookingDate)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Service Time:</span>
          <span class="value">${booking.booking_time || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="value">
            ${booking.status || 'N/A'}
            ${isReceipt ? '<span class="status-badge status-paid">PAID</span>' : '<span class="status-badge status-pending">PENDING</span>'}
          </span>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">Customer Details</div>
        <div class="detail-row">
          <span class="label">Name:</span>
          <span class="value">${booking.customer_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Email:</span>
          <span class="value">${booking.customer_email || customer.email || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Phone:</span>
          <span class="value">${booking.customer_phone || customer.phone || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Address:</span>
          <span class="value">${booking.address_line1 || ''}${booking.address_suburb ? `, ${booking.address_suburb}` : ''}${booking.address_city ? `, ${booking.address_city}` : ''}</span>
        </div>
      </div>

      ${isReceipt ? `
      <div class="detail-section">
        <div class="detail-section-title">Payment Information</div>
        <div class="detail-row">
          <span class="label">Payment Reference:</span>
          <span class="value">${booking.payment_reference}</span>
        </div>
        <div class="detail-row">
          <span class="label">Payment Date:</span>
          <span class="value">${paymentDate ? formatDateTime(paymentDate) : 'N/A'}</span>
        </div>
      </div>
      ` : ''}
    </div>

    <div class="amount-section">
      <div style="color: #666; font-size: 14px;">Total Amount</div>
      <div class="total">R${((booking.total_amount || 0) / 100).toFixed(2)}</div>
    </div>

    <div class="footer">
      <p><strong>Thank you for choosing Shalean Cleaning Services!</strong></p>
      <div class="footer-contact">
        <p>For support or inquiries:</p>
        <p>Phone: +27 87 153 5250 | Email: support@shalean.com</p>
      </div>
      <p style="margin-top: 15px; font-size: 11px; color: #999;">
        This is an automated ${documentType.toLowerCase()}. Please keep this for your records.
      </p>
    </div>

    <div class="print-button no-print">
      <button onclick="window.print()">Print ${documentType}</button>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Return as HTML
    return new NextResponse(invoice, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="${documentType.toLowerCase()}-${documentNumber}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
