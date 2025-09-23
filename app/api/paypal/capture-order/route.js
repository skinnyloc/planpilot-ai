import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { Client } from '@paypal/paypal-server-sdk';
import { LogLevel } from '@paypal/paypal-server-sdk';

// Configure PayPal client
const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
  },
  timeout: 0,
  environment: process.env.PAYPAL_MODE || 'live',
  logging: {
    logLevel: LogLevel.ERROR,
    logRequest: { logBody: false },
    logResponse: { logHeaders: false }
  }
});

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || url === "https://your-project.supabase.co" || key === "your-service-role-key") {
    return null;
  }

  return createClient(url, key);
}

export async function POST(request) {
  try {
    // Verify user is authenticated
    const { userId } = auth();
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

    // Validate PayPal configuration
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    // Capture PayPal order
    const ordersController = client.ordersController;
    const { body: captureData } = await ordersController.ordersCapture({
      id: orderID,
      body: {}
    });

    if (captureData.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Update user's subscription status in database
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            plan: 'pro',
            plan_status: 'active',
            billing_cycle: 'monthly',
            next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (error) {
          console.error('Database update error:', error);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    return NextResponse.json({
      captureID: captureData.id,
      status: captureData.status,
      payer: {
        email: captureData.payer?.email_address
      },
      details: captureData
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to capture order' },
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