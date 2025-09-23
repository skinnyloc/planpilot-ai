import { NextResponse } from 'next/server';
import { Client } from '@paypal/paypal-server-sdk';
import { LogLevel } from '@paypal/paypal-server-sdk';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configure PayPal client
const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
  },
  timeout: 0,
  environment: process.env.PAYPAL_MODE || 'sandbox', // Defaults to sandbox
  logging: {
    logLevel: LogLevel.INFO,
    logRequest: { logBody: true },
    logResponse: { logHeaders: true }
  }
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "placeholder",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

/**
 * Verify PayPal webhook signature
 */
async function verifyPayPalSignature(request, rawBody) {
  const headers = {
    'PAYPAL-TRANSMISSION-ID': request.headers.get('PAYPAL-TRANSMISSION-ID'),
    'PAYPAL-CERT-ID': request.headers.get('PAYPAL-CERT-ID'),
    'PAYPAL-TRANSMISSION-SIG': request.headers.get('PAYPAL-TRANSMISSION-SIG'),
    'PAYPAL-TRANSMISSION-TIME': request.headers.get('PAYPAL-TRANSMISSION-TIME'),
    'PAYPAL-AUTH-ALGO': request.headers.get('PAYPAL-AUTH-ALGO')
  };

  // Verify all required headers are present
  const requiredHeaders = [
    'PAYPAL-TRANSMISSION-ID',
    'PAYPAL-CERT-ID',
    'PAYPAL-TRANSMISSION-SIG',
    'PAYPAL-TRANSMISSION-TIME',
    'PAYPAL-AUTH-ALGO'
  ];

  for (const header of requiredHeaders) {
    if (!headers[header]) {
      console.error(`Missing required header: ${header}`);
      return false;
    }
  }

  try {
    const webhooksController = client.webhooksController;

    const verifyRequest = {
      body: {
        transmissionId: headers['PAYPAL-TRANSMISSION-ID'],
        certId: headers['PAYPAL-CERT-ID'],
        authAlgo: headers['PAYPAL-AUTH-ALGO'],
        transmissionSig: headers['PAYPAL-TRANSMISSION-SIG'],
        transmissionTime: headers['PAYPAL-TRANSMISSION-TIME'],
        webhookId: process.env.PAYPAL_WEBHOOK_ID, // You'll need to set this
        webhookEvent: JSON.parse(rawBody)
      }
    };

    const { body: verifyResponse } = await webhooksController.webhooksVerifySignature(verifyRequest);

    return verifyResponse.verificationStatus === 'SUCCESS';
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

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

/**
 * Handle payment completion
 */
async function handlePaymentCompleted(webhookEvent) {
  const { resource } = webhookEvent;
  const orderId = resource.id;

  try {
    // Get order details from PayPal
    const ordersController = client.ordersController;
    const { body: orderDetails } = await ordersController.ordersGet({ id: orderId });

    // Extract user and plan info from custom_id
    const customId = orderDetails.purchaseUnits[0].customId;
    const [userId, planId, billingCycle] = customId.split('_');

    if (!userId || !planId || !billingCycle) {
      throw new Error('Invalid custom_id format');
    }

    // Validate payment amount
    const paidAmount = parseFloat(resource.amount.total);
    const expectedAmounts = {
      'pro': { monthly: 19.99, yearly: 199.99 }
    };

    const expectedAmount = expectedAmounts[planId]?.[billingCycle];
    if (!expectedAmount || Math.abs(paidAmount - expectedAmount) > 0.01) {
      throw new Error(`Payment amount mismatch: expected ${expectedAmount}, got ${paidAmount}`);
    }

    // Extract payment details
    const paymentDetails = {
      paymentId: resource.id,
      orderId: orderId,
      amount: paidAmount,
      currency: resource.amount.currency
    };

    // Upgrade user plan
    await upgradeUserPlan(userId, planId, billingCycle, paymentDetails);

    return { success: true, userId, planId };
  } catch (error) {
    console.error('Payment completion handling error:', error);
    throw error;
  }
}

export async function POST(request) {
  let rawBody = '';

  try {
    // Get raw body for signature verification
    rawBody = await request.text();
    const webhookEvent = JSON.parse(rawBody);

    console.log('Received PayPal webhook:', {
      eventType: webhookEvent.event_type,
      resourceType: webhookEvent.resource_type,
      summary: webhookEvent.summary
    });

    // Verify webhook signature (skip in development if webhook ID not set)
    if (process.env.PAYPAL_WEBHOOK_ID && process.env.NODE_ENV === 'production') {
      const isValidSignature = await verifyPayPalSignature(request, rawBody);
      if (!isValidSignature) {
        console.error('Invalid PayPal webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('Webhook signature verification skipped in development');
    }

    // Handle different webhook events
    switch (webhookEvent.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        const result = await handlePaymentCompleted(webhookEvent);
        console.log('Payment processing completed:', result);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        console.log('Payment failed:', webhookEvent.event_type);
        // Could implement failure handling here
        break;

      default:
        console.log('Unhandled webhook event:', webhookEvent.event_type);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);

    // Log the error with request details for debugging
    console.error('Webhook error details:', {
      error: error.message,
      stack: error.stack,
      rawBody: rawBody.substring(0, 500), // First 500 chars for debugging
      headers: Object.fromEntries(request.headers.entries())
    });

    return NextResponse.json(
      { error: 'Webhook processing failed' },
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