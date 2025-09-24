import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const clientId = process.env.PAYPAL_CLIENT_ID;

        // Check if we're in development with placeholder values
        if (!clientId || clientId === 'your-paypal-client-id') {
            console.warn('PayPal Client ID not configured for local development');
            return NextResponse.json(
                {
                    error: 'PayPal not configured for localhost',
                    message: 'PayPal integration requires real credentials on live site'
                },
                { status: 503 }
            );
        }

        // Validate client ID format (basic check)
        if (!clientId.startsWith('A') || clientId.length < 50) {
            console.error('Invalid PayPal Client ID format');
            return NextResponse.json(
                { error: 'Invalid PayPal configuration' },
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