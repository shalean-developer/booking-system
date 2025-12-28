import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

/**
 * API endpoint to handle public review submissions from the home page
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { name, email, location, rating, reviewText } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!location || !location.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Location is required' },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { ok: false, error: 'Valid rating (1-5) is required' },
        { status: 400 }
      );
    }

    if (!reviewText || !reviewText.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Review text is required' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Send email to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'support@shalean.co.za';
    const stars = '⭐'.repeat(rating);
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Review Submission - Shalean</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #0C53ED 0%, #0842c4 100%);
            color: white; 
            padding: 30px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content { 
            padding: 30px; 
          }
          .review-details { 
            background-color: #f9fafb; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #0C53ED;
          }
          .review-details p {
            margin: 10px 0;
          }
          .review-details strong {
            color: #1f2937;
          }
          .rating {
            font-size: 24px;
            color: #fbbf24;
            margin: 10px 0;
          }
          .review-text {
            background-color: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            margin: 15px 0;
            font-style: italic;
            color: #4b5563;
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            color: #666; 
            font-size: 14px;
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌟 New Review Submission</h1>
          </div>
          
          <div class="content">
            <p>A new review has been submitted from the Shalean website:</p>
            
            <div class="review-details">
              <p><strong>Name:</strong> ${name.trim()}</p>
              ${email ? `<p><strong>Email:</strong> ${email.trim()}</p>` : ''}
              <p><strong>Location:</strong> ${location.trim()}</p>
              <p><strong>Rating:</strong></p>
              <div class="rating">${stars} (${rating}/5)</div>
            </div>
            
            <div>
              <strong>Review:</strong>
              <div class="review-text">
                "${reviewText.trim()}"
              </div>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
              This review was submitted through the home page review form. 
              Please review and consider adding it to the testimonials section.
            </p>
          </div>
          
          <div class="footer">
            <p>Shalean Cleaning Services</p>
            <p>Review submitted at ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email if configured
    if (process.env.RESEND_API_KEY) {
      try {
        await sendEmail({
          to: adminEmail,
          subject: `New Review Submission from ${name.trim()}`,
          html: emailHtml,
        });
        console.log('✅ Review submission email sent to admin');
      } catch (emailError) {
        console.error('Failed to send review email:', emailError);
        // Don't fail the request if email fails
      }
    } else {
      console.warn('RESEND_API_KEY not configured, skipping email notification');
    }

    return NextResponse.json({
      ok: true,
      message: 'Review submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to submit review. Please try again.',
      },
      { status: 500 }
    );
  }
}

