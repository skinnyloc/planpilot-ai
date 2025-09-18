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
    const userId = request.headers['x-user-id'] || 'demo-user';
    const { orderId } = request.body;

    if (!userId) {
      return response.status(401).json({
        error: 'Authentication required'
      });
    }

    if (!orderId) {
      return response.status(400).json({
        error: 'Order ID is required'
      });
    }

    // Capture PayPal order
    const ordersController = client.ordersController;

    const captureRequest = {
      id: orderId,
      prefer: 'return=representation'
    };

    const { body: order, ...httpResponse } = await ordersController.ordersCapture(captureRequest);

    if (httpResponse.statusCode !== 201) {
      console.error('PayPal order capture failed:', httpResponse);
      return response.status(500).json({
        error: 'Failed to capture payment order'
      });
    }

    // Log successful order capture
    console.log('PayPal order captured:', {
      orderId: order.id,
      userId,
      status: order.status,
      amount: order.purchase_units[0]?.amount?.value
    });

    return response.json({
      orderId: order.id,
      status: order.status,
      details: order
    });

  } catch (error) {
    console.error('Capture order API error:', error);

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