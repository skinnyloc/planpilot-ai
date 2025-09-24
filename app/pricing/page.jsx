'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, Star, Zap, Shield, Crown } from 'lucide-react';

export default function PricingPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [clientId, setClientId] = useState(null);
    const paypalButtonRef = useRef(null);
    const paypalRendered = useRef(false);

    useEffect(() => {
        // Fetch PayPal client ID from API
        const fetchClientId = async () => {
            try {
                const response = await fetch('/api/paypal/client-id');
                const data = await response.json();
                if (data.clientId) {
                    setClientId(data.clientId);
                }
            } catch (error) {
                console.error('Failed to fetch PayPal client ID:', error);
            }
        };

        fetchClientId();
    }, []);

    useEffect(() => {
        if (!clientId) return;

        // Load PayPal SDK
        if (!window.paypal && !document.querySelector('script[src*="paypal.com/sdk"]')) {
            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
            script.async = true;
            script.onload = () => {
                renderPayPalButton();
            };
            document.head.appendChild(script);
        } else if (window.paypal && !paypalRendered.current) {
            renderPayPalButton();
        }

        return () => {
            // Cleanup if needed
            if (paypalButtonRef.current) {
                paypalButtonRef.current.innerHTML = '';
            }
        };
    }, [clientId]);

    const renderPayPalButton = () => {
        if (window.paypal && paypalButtonRef.current && !paypalRendered.current) {
            paypalRendered.current = true;

            window.paypal.Buttons({
                style: {
                    shape: 'rect',
                    color: 'black',
                    layout: 'vertical',
                    label: 'subscribe',
                    height: 50
                },
                createSubscription: function(data, actions) {
                    return actions.subscription.create({
                        plan_id: 'P-021407488D8484329NDEOG2A'
                    });
                },
                onApprove: function(data, actions) {
                    // Handle successful subscription
                    alert(`Subscription successful! ID: ${data.subscriptionID}`);
                    // Here you can redirect to a success page or update the UI
                    // You might want to call your backend to store the subscription info
                },
                onError: function(err) {
                    console.error('PayPal error:', err);
                    alert('There was an error processing your subscription. Please try again.');
                },
                onCancel: function(data) {
                    console.log('PayPal subscription cancelled:', data);
                }
            }).render(paypalButtonRef.current);
        }
    };

    const features = [
        'Unlimited Business Ideas',
        'Professional Business Plans',
        'Letter Proposals (Bank, Investor, Loan, Grant)',
        'Document Management',
        'PDF Generation & Download',
        'Credit Building Guide',
        'Grant Database Access',
        'Priority Email Support',
        'Regular Feature Updates'
    ];

    const freeFeatures = [
        'Limited Business Ideas (3 max)',
        'Basic Business Plan Templates',
        'Basic Document Storage',
        'Standard Support'
    ];

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header Section */}
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h1 style={{
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    color: '#fafafa',
                    marginBottom: '16px',
                    background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Choose Your Plan
                </h1>
                <p style={{
                    fontSize: '1.25rem',
                    color: '#999',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    Unlock the full potential of PlanPilot AI and take your business to the next level
                </p>
            </div>

            {/* Pricing Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '32px',
                marginBottom: '48px'
            }}>
                {/* Free Plan */}
                <div style={{
                    backgroundColor: '#000',
                    border: '1px solid #333',
                    borderRadius: '16px',
                    padding: '32px',
                    position: 'relative',
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px'
                        }}>
                            <Shield style={{ width: '24px', height: '24px', color: '#666' }} />
                            <h3 style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: '#fafafa',
                                margin: 0
                            }}>
                                Free Plan
                            </h3>
                        </div>
                        <div style={{
                            fontSize: '3rem',
                            fontWeight: 'bold',
                            color: '#fafafa',
                            marginBottom: '8px'
                        }}>
                            $0
                            <span style={{
                                fontSize: '1rem',
                                fontWeight: 'normal',
                                color: '#999'
                            }}>
                                /month
                            </span>
                        </div>
                        <p style={{
                            color: '#999',
                            fontSize: '1rem'
                        }}>
                            Perfect for getting started
                        </p>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <h4 style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: '#fafafa',
                            marginBottom: '16px'
                        }}>
                            What's included:
                        </h4>
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0
                        }}>
                            {freeFeatures.map((feature, index) => (
                                <li key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '12px',
                                    color: '#ccc',
                                    fontSize: '14px'
                                }}>
                                    <Check style={{
                                        width: '16px',
                                        height: '16px',
                                        color: '#666',
                                        flexShrink: 0
                                    }} />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button style={{
                        width: '100%',
                        padding: '14px 24px',
                        backgroundColor: 'transparent',
                        color: '#666',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'not-allowed'
                    }}>
                        Current Plan
                    </button>
                </div>

                {/* Pro Plan */}
                <div style={{
                    backgroundColor: '#000',
                    border: '2px solid #f59e0b',
                    borderRadius: '16px',
                    padding: '32px',
                    position: 'relative',
                    transform: 'scale(1.05)',
                    boxShadow: '0 20px 40px rgba(245, 158, 11, 0.3)'
                }}>
                    {/* Popular Badge */}
                    <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#f59e0b',
                        color: '#000',
                        padding: '6px 24px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <Star style={{ width: '12px', height: '12px' }} />
                        MOST POPULAR
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px'
                        }}>
                            <Crown style={{ width: '24px', height: '24px', color: '#f59e0b' }} />
                            <h3 style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: '#fafafa',
                                margin: 0
                            }}>
                                Pro Plan
                            </h3>
                        </div>
                        <div style={{
                            fontSize: '3rem',
                            fontWeight: 'bold',
                            color: '#f59e0b',
                            marginBottom: '8px'
                        }}>
                            $19.99
                            <span style={{
                                fontSize: '1rem',
                                fontWeight: 'normal',
                                color: '#999'
                            }}>
                                /month
                            </span>
                        </div>
                        <p style={{
                            color: '#999',
                            fontSize: '1rem'
                        }}>
                            Everything you need to succeed
                        </p>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <h4 style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: '#fafafa',
                            marginBottom: '16px'
                        }}>
                            Everything in Free, plus:
                        </h4>
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0
                        }}>
                            {features.map((feature, index) => (
                                <li key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '12px',
                                    color: '#fafafa',
                                    fontSize: '14px'
                                }}>
                                    <Check style={{
                                        width: '16px',
                                        height: '16px',
                                        color: '#f59e0b',
                                        flexShrink: 0
                                    }} />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* PayPal Button Container */}
                    <div
                        ref={paypalButtonRef}
                        style={{
                            width: '100%',
                            minHeight: '50px'
                        }}
                    />

                    {/* Fallback button if PayPal doesn't load */}
                    {typeof window !== 'undefined' && !window.paypal && (
                        <button style={{
                            width: '100%',
                            padding: '14px 24px',
                            backgroundColor: '#f59e0b',
                            color: '#000',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}>
                            <Zap style={{ width: '16px', height: '16px' }} />
                            Loading Payment Options...
                        </button>
                    )}
                </div>
            </div>

            {/* FAQ Section */}
            <div style={{
                backgroundColor: '#000',
                border: '1px solid #f59e0b',
                borderRadius: '16px',
                padding: '32px',
                marginTop: '48px'
            }}>
                <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#fafafa',
                    marginBottom: '24px',
                    textAlign: 'center'
                }}>
                    Frequently Asked Questions
                </h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    <div>
                        <h4 style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: '#f59e0b',
                            marginBottom: '8px'
                        }}>
                            Can I cancel anytime?
                        </h4>
                        <p style={{
                            color: '#ccc',
                            fontSize: '14px',
                            lineHeight: '1.6'
                        }}>
                            Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                        </p>
                    </div>

                    <div>
                        <h4 style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: '#f59e0b',
                            marginBottom: '8px'
                        }}>
                            What payment methods do you accept?
                        </h4>
                        <p style={{
                            color: '#ccc',
                            fontSize: '14px',
                            lineHeight: '1.6'
                        }}>
                            We accept all major credit cards, debit cards, and PayPal through our secure PayPal payment system.
                        </p>
                    </div>

                    <div>
                        <h4 style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: '#f59e0b',
                            marginBottom: '8px'
                        }}>
                            Is there a free trial?
                        </h4>
                        <p style={{
                            color: '#ccc',
                            fontSize: '14px',
                            lineHeight: '1.6'
                        }}>
                            Our free plan gives you access to core features. Upgrade to Pro to unlock unlimited access and advanced features.
                        </p>
                    </div>

                    <div>
                        <h4 style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: '#f59e0b',
                            marginBottom: '8px'
                        }}>
                            Do you offer refunds?
                        </h4>
                        <p style={{
                            color: '#ccc',
                            fontSize: '14px',
                            lineHeight: '1.6'
                        }}>
                            We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.
                        </p>
                    </div>
                </div>
            </div>

            {/* Security Notice */}
            <div style={{
                textAlign: 'center',
                marginTop: '32px',
                padding: '16px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                }}>
                    <Shield style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
                    <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#f59e0b'
                    }}>
                        Secure Payment
                    </span>
                </div>
                <p style={{
                    fontSize: '12px',
                    color: '#999',
                    margin: 0
                }}>
                    Your payment information is processed securely through PayPal. We don't store your payment details.
                </p>
            </div>
        </div>
    );
}