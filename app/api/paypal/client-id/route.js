import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json(
        { error: 'PayPal not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientId: clientId
    });
  } catch (error) {
    console.error('PayPal client ID error:', error);
    return NextResponse.json(
      { error: 'Failed to get PayPal configuration' },
      { status: 500 }
    );
  }
}