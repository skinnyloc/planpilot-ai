import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.text();
        const event = JSON.parse(body);

        // Log the webhook event for debugging
        console.log('PayPal Webhook Event:', {
            event_type: event.event_type,
            id: event.id,
            create_time: event.create_time,
            resource_type: event.resource_type
        });

        // Handle different webhook events
        switch (event.event_type) {
            case 'BILLING.SUBSCRIPTION.CREATED':
                console.log('Subscription created:', event.resource);
                // Handle subscription creation
                await handleSubscriptionCreated(event.resource);
                break;

            case 'BILLING.SUBSCRIPTION.ACTIVATED':
                console.log('Subscription activated:', event.resource);
                // Handle subscription activation
                await handleSubscriptionActivated(event.resource);
                break;

            case 'BILLING.SUBSCRIPTION.CANCELLED':
                console.log('Subscription cancelled:', event.resource);
                // Handle subscription cancellation
                await handleSubscriptionCancelled(event.resource);
                break;

            case 'BILLING.SUBSCRIPTION.SUSPENDED':
                console.log('Subscription suspended:', event.resource);
                // Handle subscription suspension
                await handleSubscriptionSuspended(event.resource);
                break;

            case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
                console.log('Payment failed:', event.resource);
                // Handle payment failure
                await handlePaymentFailed(event.resource);
                break;

            case 'PAYMENT.SALE.COMPLETED':
                console.log('Payment completed:', event.resource);
                // Handle successful payment
                await handlePaymentCompleted(event.resource);
                break;

            default:
                console.log('Unhandled event type:', event.event_type);
        }

        return NextResponse.json({
            success: true,
            message: 'Webhook processed successfully'
        });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 400 }
        );
    }
}

async function handleSubscriptionCreated(subscription) {
    // TODO: Store subscription in your database
    // Example: Save user subscription status, subscription ID, etc.
    console.log('Processing subscription creation:', {
        subscription_id: subscription.id,
        status: subscription.status,
        plan_id: subscription.plan_id,
        subscriber: subscription.subscriber
    });
}

async function handleSubscriptionActivated(subscription) {
    // TODO: Activate user's pro features
    // Example: Update user's subscription status to active
    console.log('Activating subscription:', {
        subscription_id: subscription.id,
        status: subscription.status
    });
}

async function handleSubscriptionCancelled(subscription) {
    // TODO: Deactivate user's pro features
    // Example: Update user's subscription status to cancelled
    console.log('Cancelling subscription:', {
        subscription_id: subscription.id,
        status: subscription.status
    });
}

async function handleSubscriptionSuspended(subscription) {
    // TODO: Suspend user's pro features
    // Example: Update user's subscription status to suspended
    console.log('Suspending subscription:', {
        subscription_id: subscription.id,
        status: subscription.status
    });
}

async function handlePaymentFailed(payment) {
    // TODO: Handle failed payment (notify user, retry logic, etc.)
    console.log('Processing payment failure:', {
        payment_id: payment.id,
        subscription_id: payment.billing_agreement_id
    });
}

async function handlePaymentCompleted(payment) {
    // TODO: Process successful payment
    console.log('Processing successful payment:', {
        payment_id: payment.id,
        amount: payment.amount,
        subscription_id: payment.billing_agreement_id
    });
}

// Allow GET for testing
export async function GET() {
    return NextResponse.json({
        message: 'PayPal webhook endpoint is active',
        timestamp: new Date().toISOString()
    });
}