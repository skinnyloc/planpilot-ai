import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const clientId = process.env.PAYPAL_CLIENT_ID;

        if (!clientId) {
            console.error('PayPal Client ID not found in environment variables');
            return NextResponse.json(
                { error: 'PayPal configuration missing' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            clientId: clientId
        });
    } catch (error) {
        console.error('Error fetching PayPal client ID:', error);
        return NextResponse.json(
            { error: 'Failed to fetch PayPal client ID' },
            { status: 500 }
        );
    }
}