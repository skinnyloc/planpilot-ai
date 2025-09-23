import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "placeholder",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

export async function POST(request, { params }) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get document from database
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // In a real implementation, you would send the email using a service like SendGrid, Resend, etc.
    // For demo purposes, we'll simulate the email sending
    console.log(`Simulating email send:
      To: ${email}
      Subject: ${document.title}
      Document Type: ${document.document_type}
      Created: ${document.created_at}
    `);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: `Document "${document.title}" sent to ${email}`,
      emailSent: true
    });

  } catch (error) {
    console.error('Document email error:', error);
    return NextResponse.json(
      { error: 'Failed to email document' },
      { status: 500 }
    );
  }
}