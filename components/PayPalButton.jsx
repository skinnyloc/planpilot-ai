'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Loader2, AlertCircle, Shield } from 'lucide-react';

export default function PayPalButton({ planId, billingCycle = 'monthly', onSuccess, onError, onCancel }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // Removed demo mode - PayPal is now live
  const paypalButtonRef = useRef(null);
  const { user } = useUser();

  // PayPal is now live - always configured
  const isPayPalConfigured = true;

  useEffect(() => {
    if (!user) return;

    // Load PayPal SDK
    const loadPayPalSDK = () => {
      return new Promise((resolve, reject) => {
        if (window.paypal) {
          resolve(window.paypal);
          return;
        }

        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
        script.setAttribute('data-sdk-integration-source', 'button-factory');
        script.onload = () => resolve(window.paypal);
        script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
        document.body.appendChild(script);
      });
    };

    const initializePayPal = async () => {
      try {
        setError(null);

        // PayPal is live - no demo mode

        const paypal = await loadPayPalSDK();

        if (paypalButtonRef.current) {
          paypalButtonRef.current.innerHTML = '';
        }

        // Determine plan ID based on billing cycle
        const planIdMap = {
          'monthly': 'P-021407488D8484329NDEOG2A',  // $19.99 plan
          'yearly': 'P-5HR698674T6427033NDEOFSY'    // $199.99 plan
        };

        const subscriptionPlanId = planIdMap[billingCycle];

        const buttons = paypal.Buttons({
          style: {
            shape: 'rect',
            color: 'gold',
            layout: 'vertical',
            label: 'subscribe'
          },

          createSubscription: function(data, actions) {
            return actions.subscription.create({
              plan_id: subscriptionPlanId
            });
          },

          onApprove: function(data, actions) {
            console.log('Subscription successful:', data);
            setIsProcessing(false);

            // Call success callback
            if (onSuccess) {
              onSuccess({
                subscriptionID: data.subscriptionID,
                details: data
              });
            }

            // Show success alert as per your original code
            alert(data.subscriptionID);
          },

          onCancel: (data) => {
            console.log('Subscription cancelled:', data);
            setIsProcessing(false);

            if (onCancel) {
              onCancel(data);
            }
          },

          onError: (error) => {
            console.error('PayPal subscription error:', error);
            setError('Subscription system error. Please try again.');
            setIsProcessing(false);

            if (onError) {
              onError(error);
            }
          }
        });

        if (buttons.isEligible()) {
          await buttons.render(paypalButtonRef.current);
          setIsLoading(false);
        } else {
          throw new Error('PayPal buttons not eligible');
        }

      } catch (error) {
        console.error('PayPal initialization error:', error);
        setError('Failed to load PayPal. Please refresh the page.');
        setIsLoading(false);
      }
    };

    initializePayPal();
  }, [user, planId, billingCycle, onSuccess, onError, onCancel]);

  // Demo mode handler
  const handleDemoPayment = () => {
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);

      if (onSuccess) {
        onSuccess({
          orderID: 'demo-order-' + Date.now(),
          paymentID: 'demo-payment-' + Date.now(),
          details: { payer: { payer_id: 'demo-payer' } }
        });
      }

      // Redirect to success page
      window.location.href = `/payment/success?token=demo-order&PayerID=demo-payer`;
    }, 2000);
  };

  if (!user) {
    return (
      <div className="bg-muted/50 border border-border rounded-lg p-4 text-center">
        <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Please sign in to continue with payment
        </p>
      </div>
    );
  }

  // Demo mode removed - PayPal is live

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
        <p className="text-sm text-red-700 mb-3">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-red-600 hover:text-red-700 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {(isLoading || isProcessing) && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">
              {isLoading ? 'Loading PayPal...' : 'Processing payment...'}
            </span>
          </div>
        </div>
      )}

      {/* PayPal Button Container */}
      <div
        ref={paypalButtonRef}
        className={`min-h-[50px] ${(isLoading || isProcessing) ? 'opacity-50' : ''}`}
      />

      {/* Security Notice */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3 w-3" />
        <span>Secure payment powered by PayPal</span>
      </div>
    </div>
  );
}