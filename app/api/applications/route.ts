import { NextResponse } from 'next/server';
import { sendEmail, generateApplicationConfirmationEmail, generateAdminApplicationNotificationEmail, ApplicationData } from '@/lib/email';
import { supabase } from '@/lib/supabase';

/**
 * API endpoint to handle job application submissions
 * Saves to database and sends confirmation emails to applicant and admin
 */
export async function POST(req: Request) {
  console.log('=== APPLICATION API CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Parse application data
    console.log('Step 1: Parsing application data...');
    const body = await req.json();
    
    console.log('=== APPLICATION SUBMISSION ===');
    console.log('Position:', body.position);
    console.log('Applicant:', body.firstName, body.lastName);
    console.log('Email:', body.email);
    console.log('========================');

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'position', 'coverLetter', 'criminalBackgroundConsent'];
    const missingFields = requiredFields.filter(field => !body[field] && body[field] !== false);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Missing required fields',
          missingFields,
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      console.error('Invalid email format:', body.email);
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    // Check background check consent
    if (!body.criminalBackgroundConsent) {
      console.error('Background check consent not provided');
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Background check consent is required',
        },
        { status: 400 }
      );
    }

    // STEP 2: Save to Database
    console.log('Step 2: Saving application to database...');
    
    const applicationData = {
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email.toLowerCase().trim(),
      phone: body.phone,
      position: body.position,
      cover_letter: body.coverLetter,
      work_experience: body.workExperience || null,
      certifications: body.certifications || null,
      availability: body.availability || null,
      reference_contacts: body.references || null,
      resume_url: body.resumeUrl || null,
      transportation_details: body.transportationDetails || null,
      languages_spoken: body.languagesSpoken || null,
      criminal_background_consent: body.criminalBackgroundConsent,
      status: 'pending',
    };

    const { data: applicationRecord, error: dbError } = await supabase
      .from('applications')
      .insert([applicationData])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Failed to save application to database',
          details: dbError.message,
        },
        { status: 500 }
      );
    }

    console.log('✅ Application saved successfully:', applicationRecord.id);

    // Generate application ID for display
    const applicationId = `APP-${Date.now()}`;

    // STEP 3: Send Emails
    let emailSent = false;
    let emailError = null;
    
    // Check if email service is configured
    if (process.env.RESEND_API_KEY) {
      try {
        console.log('=== EMAIL SENDING ===');
        console.log('SENDER_EMAIL:', process.env.SENDER_EMAIL || 'onboarding@resend.dev');
        console.log('Applicant email:', body.email);
        console.log('Admin email:', process.env.ADMIN_EMAIL || 'careers@shalean.com');
        console.log('Application ID:', applicationId);

        // Prepare email data
        const emailData: ApplicationData = {
          applicationId,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone,
          position: body.position,
          coverLetter: body.coverLetter,
          workExperience: body.workExperience,
          certifications: body.certifications,
          availability: body.availability,
          references: body.references,
          resumeUrl: body.resumeUrl,
          transportationDetails: body.transportationDetails,
          languagesSpoken: body.languagesSpoken,
          criminalBackgroundConsent: body.criminalBackgroundConsent,
        };

        // Send confirmation email to applicant (REQUIRED)
        console.log('📧 Generating applicant email...');
        const applicantEmailData = generateApplicationConfirmationEmail(emailData);
        console.log('✅ Applicant email generated');
        
        console.log('📤 Sending applicant email...');
        await sendEmail(applicantEmailData);
        console.log('✅ Applicant confirmation email sent successfully');
        
        // Send notification email to admin (REQUIRED)
        console.log('📧 Generating admin email...');
        const adminEmailData = generateAdminApplicationNotificationEmail(emailData);
        console.log('✅ Admin email generated');
        
        console.log('📤 Sending admin email...');
        await sendEmail(adminEmailData);
        console.log('✅ Admin notification email sent successfully');
        
        emailSent = true;
        
      } catch (emailErr) {
        console.error('=== EMAIL SENDING FAILED ===');
        console.error('Email error:', emailErr);
        emailError = emailErr instanceof Error ? emailErr.message : 'Unknown email error';
        
        // Email failure is not critical - application is already saved
        console.warn('⚠️ Application saved but emails failed to send');
      }
    } else {
      console.warn('⚠️ RESEND_API_KEY not configured - skipping emails');
      emailError = 'Email service not configured';
    }

    console.log('=== APPLICATION SUBMISSION COMPLETE ===');
    console.log('Database saved:', true);
    console.log('Emails sent:', emailSent);
    console.log('========================================');

    // Return success response
    return NextResponse.json({ 
      ok: true,
      applicationId,
      message: 'Application submitted successfully!',
      applicationSaved: true,
      emailSent,
      emailError: emailSent ? null : emailError
    });

  } catch (error) {
    console.error('=== APPLICATION SUBMISSION FAILED ===');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Failed to process application',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

