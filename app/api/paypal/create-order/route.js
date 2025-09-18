import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

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
    const { amount = '9.99', currency = 'USD' } = body;

    // Mock PayPal sandbox order creation for testing
    const mockOrder = {
      id: `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'CREATED',
      links: [
        {
          href: `https://api.sandbox.paypal.com/v2/checkout/orders/ORDER_${Date.now()}`,
          rel: 'self',
          method: 'GET'
        },
        {
          href: `https://www.sandbox.paypal.com/checkoutnow?token=ORDER_${Date.now()}`,
          rel: 'approve',
          method: 'GET'
        }
      ]
    };

    // Log order creation
    console.log('PayPal sandbox order created:', {
      orderId: mockOrder.id,
      userId,
      amount,
      currency
    });

    return NextResponse.json({
      orderId: mockOrder.id,
      status: mockOrder.status,
      links: mockOrder.links
    });

  } catch (error) {
    console.error('Create order API error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
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