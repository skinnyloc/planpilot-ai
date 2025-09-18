import { NextResponse } from 'next/server';
import { Client } from '@paypal/paypal-server-sdk';
import { LogLevel } from '@paypal/paypal-server-sdk';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

// Configure PayPal client
const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
  },
  timeout: 0,
  environment: process.env.PAYPAL_MODE || 'sandbox',
  logging: {
    logLevel: LogLevel.INFO,
    logRequest: { logBody: true },
    logResponse: { logHeaders: true }
  }
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Update user plan in Supabase
 */
async function upgradeUserPlan(userId, planId, billingCycle, paymentDetails) {
  try {
    // Calculate next billing date
    const nextBillingDate = new Date();
    if (billingCycle === 'yearly') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    // Update user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({
        plan: 'pro',
        plan_status: 'active',
        billing_cycle: billingCycle,
        next_billing_date: nextBillingDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();

    if (profileError) {
      console.error('Profile update error:', profileError);
      throw new Error('Failed to update user profile');
    }

    // Log the payment transaction
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        payment_id: paymentDetails.paymentId,
        order_id: paymentDetails.orderId,
        plan_id: planId,
        billing_cycle: billingCycle,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        status: 'completed',
        payment_method: 'paypal',
        created_at: new Date().toISOString()
      });

    if (transactionError) {
      console.error('Transaction logging error:', transactionError);
      // Don't throw error - profile update succeeded
    }

    console.log('User plan upgraded successfully:', {
      userId,
      planId,
      billingCycle,
      nextBillingDate: nextBillingDate.toISOString()
    });

    return profileData;
  } catch (error) {
    console.error('Plan upgrade error:', error);
    throw error;
  }
}

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
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Capture the PayPal order
    const ordersController = client.ordersController;
    const { body: order, ...httpResponse } = await ordersController.ordersCapture({
      id: orderId,
      body: {},
      prefer: 'return=representation'
    });

    if (httpResponse.statusCode !== 201) {
      console.error('PayPal order capture failed:', httpResponse);
      return NextResponse.json(
        { error: 'Failed to capture payment' },
        { status: 500 }
      );
    }

    // Extract user and plan info from custom_id
    const customId = order.purchaseUnits[0].customId;
    const [orderUserId, planId, billingCycle] = customId.split('_');

    // Verify the user matches the order
    if (orderUserId !== userId) {
      return NextResponse.json(
        { error: 'Order does not belong to authenticated user' },
        { status: 403 }
      );
    }

    // Validate payment amount
    const paidAmount = parseFloat(order.purchaseUnits[0].payments.captures[0].amount.value);
    const expectedAmounts = {
      'pro': { monthly: 19.99, yearly: 199.99 }
    };

    const expectedAmount = expectedAmounts[planId]?.[billingCycle];
    if (!expectedAmount || Math.abs(paidAmount - expectedAmount) > 0.01) {
      throw new Error(`Payment amount mismatch: expected ${expectedAmount}, got ${paidAmount}`);
    }

    // Extract payment details
    const capture = order.purchaseUnits[0].payments.captures[0];
    const paymentDetails = {
      paymentId: capture.id,
      orderId: order.id,
      amount: paidAmount,
      currency: capture.amount.currencyCode
    };

    // Upgrade user plan
    await upgradeUserPlan(userId, planId, billingCycle, paymentDetails);

    console.log('Payment captured and user upgraded:', {
      orderId,
      userId,
      planId,
      billingCycle,
      amount: paidAmount
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
      captureId: capture.id
    });

  } catch (error) {
    console.error('Capture API error:', error);

    // Handle different types of errors
    if (error.name === 'ApiError') {
      return NextResponse.json(
        {
          error: 'Payment service error',
          details: error.message
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}