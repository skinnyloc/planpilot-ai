'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Loader2, AlertCircle, Shield } from 'lucide-react';

export default function PayPalButton({ planId, billingCycle = 'monthly', onSuccess, onError, onCancel }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const paypalButtonRef = useRef(null);
  const { user } = useUser();

  // Check if PayPal is configured
  const isPayPalConfigured = import.meta.env.VITE_PAYPAL_CLIENT_ID &&
    import.meta.env.VITE_PAYPAL_CLIENT_ID !== 'YOUR_PAYPAL_CLIENT_ID_HERE';

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
        script.src = `https://www.paypal.com/sdk/js?client-id=Ab6MKwY3DX3P0K441jv6tZXbhHmXbtnK3K4dQLYldKjXMjquLusIsvTui17G_l03gJsCkgaY0Wa-mX7f&vault=true&intent=subscription`;
        script.setAttribute('data-sdk-integration-source', 'button-factory');
        script.onload = () => resolve(window.paypal);
        script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
        document.body.appendChild(script);
      });
    };

    const initializePayPal = async () => {
      try {
        setError(null);

        // Check if PayPal is configured (always true now with hardcoded client ID)
        if (!true) {
          setDemoMode(true);
          setIsLoading(false);
          return;
        }

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

  if (demoMode) {
    return (
      <div className="space-y-4">
        {/* Demo Mode Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <AlertCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-blue-700 mb-2">
            <strong>Demo Mode</strong> - PayPal not configured
          </p>
          <p className="text-xs text-blue-600">
            Run <code>npm run setup-paypal</code> to configure real payments
          </p>
        </div>

        {/* Demo Payment Button */}
        <button
          onClick={handleDemoPayment}
          disabled={isProcessing}
          className={`w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-6 rounded-xl transition-all duration-200 text-lg ${
            isProcessing ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105 hover:shadow-lg'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Demo Payment...
            </div>
          ) : (
            'Continue with Demo Payment'
          )}
        </button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            This is a demo - no real payment will be processed
          </p>
        </div>
      </div>
    );
  }

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