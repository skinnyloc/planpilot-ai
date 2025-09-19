import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderID } = body;

    if (!orderID) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Mock PayPal sandbox capture for testing
    const mockCapture = {
      id: `CAPTURE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'COMPLETED',
      amount: {
        currency_code: 'USD',
        value: '9.99'
      },
      payer: {
        payer_id: `PAYER_${Math.random().toString(36).substr(2, 9)}`,
        email_address: 'buyer@example.com'
      },
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString()
    };

    // Update user's subscription status in database
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          plan_status: 'pro',
          plan_type: 'paid',
          subscription_id: mockCapture.id,
          payment_status: 'active',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Database update error:', error);
      } else {
        console.log('User plan updated to pro:', userId);
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    // Log successful capture
    console.log('PayPal sandbox capture completed:', {
      captureId: mockCapture.id,
      orderId: orderID,
      userId,
      amount: mockCapture.amount.value,
      status: mockCapture.status
    });

    return NextResponse.json({
      captureID: mockCapture.id,
      status: mockCapture.status,
      payer: {
        email: mockCapture.payer.email_address
      },
      details: mockCapture
    });

  } catch (error) {
    console.error('Capture order API error:', error);
    return NextResponse.json(
      { error: 'Failed to capture order', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}