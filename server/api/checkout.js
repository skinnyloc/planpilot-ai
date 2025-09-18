import { Client } from '@paypal/paypal-server-sdk';
import { LogLevel } from '@paypal/paypal-server-sdk';

// Configure PayPal client for sandbox environment
const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID,
    oAuthClientSecret: process.env.PAYPAL_SECRET,
  },
  timeout: 0,
  environment: 'sandbox', // Change to 'live' for production
  logging: {
    logLevel: LogLevel.INFO,
    logRequest: { logBody: true },
    logResponse: { logHeaders: true }
  }
});

export async function POST(request, response) {
  try {
    // Get user ID from Clerk via headers
    const userId = request.headers['x-user-id'] || 'demo-user';

    if (!userId) {
      return response.status(401).json({
        error: 'Authentication required'
      });
    }

    const body = request.body;
    const { planId, billingCycle = 'monthly' } = body;

    // Validate plan and get pricing
    const planPricing = {
      'pro': {
        monthly: { amount: '19.99', currency: 'USD' },
        yearly: { amount: '199.99', currency: 'USD' }
      }
    };

    if (!planPricing[planId] || !planPricing[planId][billingCycle]) {
      return response.status(400).json({
        error: 'Invalid plan or billing cycle'
      });
    }

    const pricing = planPricing[planId][billingCycle];

    // Create PayPal order
    const ordersController = client.ordersController;

    const orderRequest = {
      body: {
        intent: 'CAPTURE',
        purchaseUnits: [
          {
            amount: {
              currencyCode: pricing.currency,
              value: pricing.amount
            },
            description: `PlanPilot Pro - ${billingCycle} subscription`,
            customId: `${userId}_${planId}_${billingCycle}`, // Store user and plan info
            invoiceId: `${userId}_${Date.now()}` // Unique invoice ID
          }
        ],
        applicationContext: {
          returnUrl: `${process.env.APP_URL || 'http://localhost:5173'}/payment/success`,
          cancelUrl: `${process.env.APP_URL || 'http://localhost:5173'}/pricing`,
          brandName: 'PlanPilot',
          userAction: 'PAY_NOW',
          paymentMethod: {
            payerSelected: 'PAYPAL',
            payeePreferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          }
        }
      },
      prefer: 'return=representation'
    };

    const { body: order, ...httpResponse } = await ordersController.ordersCreate(orderRequest);

    if (httpResponse.statusCode !== 201) {
      console.error('PayPal order creation failed:', httpResponse);
      return response.status(500).json({
        error: 'Failed to create payment order'
      });
    }

    // Log successful order creation
    console.log('PayPal order created:', {
      orderId: order.id,
      userId,
      planId,
      billingCycle,
      amount: pricing.amount
    });

    return response.json({
      orderId: order.id,
      status: order.status,
      links: order.links
    });

  } catch (error) {
    console.error('Checkout API error:', error);

    // Handle different types of errors
    if (error.name === 'ApiError') {
      return response.status(502).json({
        error: 'Payment service error',
        details: error.message
      });
    }

    return response.status(500).json({
      error: 'Internal server error'
    });
  }
}