// This is a placeholder API route for Vite/React Router setup
// In production, you would implement these routes in your backend server (Express, Fastify, etc.)

export default function handler(req, res) {
  // This route needs to be implemented in your backend server
  // For now, return a development message
  res.status(501).json({
    error: 'API route not implemented',
    message: 'This route needs to be implemented in your backend server for production'
  });
}

// Configure PayPal client for sandbox environment
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
    const { planId, billingCycle = 'monthly' } = body;

    // Validate plan and get pricing
    const planPricing = {
      'pro': {
        monthly: { amount: '19.99', currency: 'USD' },
        yearly: { amount: '199.99', currency: 'USD' }
      }
    };

    if (!planPricing[planId] || !planPricing[planId][billingCycle]) {
      return NextResponse.json(
        { error: 'Invalid plan or billing cycle' },
        { status: 400 }
      );
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
          returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
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
      return NextResponse.json(
        { error: 'Failed to create payment order' },
        { status: 500 }
      );
    }

    // Log successful order creation
    console.log('PayPal order created:', {
      orderId: order.id,
      userId,
      planId,
      billingCycle,
      amount: pricing.amount
    });

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      links: order.links
    });

  } catch (error) {
    console.error('Checkout API error:', error);

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