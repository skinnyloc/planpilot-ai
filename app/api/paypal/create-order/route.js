import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/rate-limit';
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

    // Rate limiting: 3 payment attempts per minute per user
    const rateLimitResult = rateLimit(`payment:${userId}`, 3, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many payment attempts. Please wait before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { amount = '19.99', currency = 'USD', planId = 'pro', billingCycle = 'monthly' } = body;

    // Validate PayPal configuration
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    // Create PayPal order
    const ordersController = client.ordersController;

    const orderRequest = {
      body: {
        intent: 'CAPTURE',
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount
            },
            customId: `${userId}_${planId}_${billingCycle}`,
            description: `PlanPilot AI ${planId} subscription - ${billingCycle}`
          }
        ],
        applicationContext: {
          returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
          brandName: 'PlanPilot AI',
          landingPage: 'BILLING',
          userAction: 'PAY_NOW'
        }
      }
    };

    const { body: order } = await ordersController.ordersCreate(orderRequest);

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      links: order.links
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create order' },
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