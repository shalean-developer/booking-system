import { NextResponse } from 'next/server';
import { sendEmail, generateQuoteConfirmationEmail, generateAdminQuoteNotificationEmail, QuoteRequest } from '@/lib/email';
import { supabase } from '@/lib/supabase';
import { calcTotal } from '@/lib/pricing';
import type { ServiceType } from '@/types/booking';

/**
 * API endpoint to handle quote confirmation and send emails to user and admin
 */
export async function POST(req: Request) {
  console.log('=== QUOTE CONFIRMATION API CALLED ===');
  try {
    // Validate request body
    let body: QuoteRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { ok: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['service', 'firstName', 'lastName', 'email', 'phone'];
    const missingFields = requiredFields.filter(field => !body[field as keyof QuoteRequest]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { ok: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate service type
    const validServices: ServiceType[] = ['Standard', 'Deep', 'Move In/Out', 'Airbnb'];
    if (!validServices.includes(body.service as ServiceType)) {
      console.error('Invalid service type:', body.service);
      return NextResponse.json(
        { ok: false, error: `Invalid service type: ${body.service}` },
        { status: 400 }
      );
    }
    
    console.log('=== QUOTE CONFIRMATION ===');
    console.log(JSON.stringify(body, null, 2));
    console.log('========================');

    // Generate unique quote ID
    const quoteId = `QT-${Date.now()}`;
    
    // Calculate estimated price (for internal use, not shown to customer)
    const estimatedPrice = calcTotal({
      service: body.service as ServiceType,
      bedrooms: body.bedrooms || 0,
      bathrooms: body.bathrooms || 1,
      extras: body.extras || []
    });
    
    // Save quote to database
    let quoteSaved = false;
    try {
      const { data, error: dbError } = await supabase
        .from('quotes')
        .insert({
          id: quoteId,
          service_type: body.service,
          bedrooms: body.bedrooms || 0,
          bathrooms: body.bathrooms || 1,
          extras: body.extras || [],
          first_name: body.firstName,
          last_name: body.lastName,
          email: body.email,
          phone: body.phone,
          status: 'pending',
          estimated_price: estimatedPrice
        });
      
      if (dbError) {
        console.error('Database error saving quote:', dbError);
        // Don't fail the request if database save fails - continue with email
      } else {
        console.log('Quote saved to database successfully:', quoteId);
        quoteSaved = true;
      }
    } catch (dbError) {
      console.error('Failed to save quote to database:', dbError);
      // Continue with email even if database save fails
    }
    
    let emailSent = false;
    let emailError = null;

    // Ensure all required fields are present and valid for email generation
    const emailData = {
      service: body.service as ServiceType,
      bedrooms: body.bedrooms || 0,
      bathrooms: body.bathrooms || 1,
      extras: body.extras || [],
      firstName: body.firstName || '',
      lastName: body.lastName || '',
      email: body.email || '',
      phone: body.phone || '',
      quoteId
    };

    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email sending');
      emailError = 'Email service not configured';
    } else {
      // Send confirmation email to user
      try {
        console.log('Generating user email...', { body, quoteId });
        
        console.log('Email data prepared:', emailData);
        const userEmailData = generateQuoteConfirmationEmail(emailData);
        console.log('User email generated successfully');
        
        await sendEmail(userEmailData);
        console.log('Quote confirmation email sent to user successfully');
        emailSent = true;
      } catch (err) {
        console.error('Failed to send quote confirmation email to user:', err);
        console.error('Error details:', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined
        });
        emailError = err instanceof Error ? err.message : 'Unknown email error';
      }

      // Send notification email to admin (don't fail if this fails)
      try {
        console.log('Generating admin email...');
        const adminEmailData = generateAdminQuoteNotificationEmail(emailData);
        console.log('Admin email generated successfully');
        
        await sendEmail(adminEmailData);
        console.log('Admin quote notification email sent successfully');
      } catch (err) {
        console.error('Failed to send admin quote notification email:', err);
        // This is non-critical, so we continue
      }
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return success even if email failed (for now)
    return NextResponse.json({ 
      ok: true,
      quoteId,
      message: 'Quote confirmed successfully!',
      quoteSaved,
      emailSent,
      emailError: emailSent ? null : emailError
    });
  } catch (error) {
    console.error('Quote confirmation error:', error);
    console.error('Error details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Always return JSON, never HTML
    try {
      return NextResponse.json(
        { 
          ok: false, 
          error: error instanceof Error ? error.message : 'Failed to process quote confirmation' 
        },
        { status: 500 }
      );
    } catch (jsonError) {
      console.error('Failed to create JSON response:', jsonError);
      // Fallback response
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Internal server error' 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}
