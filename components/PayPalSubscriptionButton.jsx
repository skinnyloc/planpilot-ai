'use client';

import { useEffect, useRef, useState } from 'react';

export default function PayPalSubscriptionButton({ billingCycle = 'monthly', onSuccess, onError }) {
  const paypalRef = useRef();
  const [isLoaded, setIsLoaded] = useState(false);

  // PayPal Plan IDs
  const planIds = {
    monthly: 'P-021407488D8484329NDEOG2A',
    yearly: 'P-5HR698674T6427033NDEOFSY'
  };

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  useEffect(() => {
    // Load PayPal SDK
    const loadPayPalScript = () => {
      if (window.paypal) {
        renderPayPalButton();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
      script.addEventListener('load', () => {
        setIsLoaded(true);
        renderPayPalButton();
      });
      document.body.appendChild(script);
    };

    const renderPayPalButton = () => {
      if (paypalRef.current && window.paypal) {
        // Clear previous button
        paypalRef.current.innerHTML = '';

        window.paypal.Buttons({
          style: {
            shape: 'rect',
            color: 'gold',
            layout: 'vertical',
            label: 'subscribe'
          },
          createSubscription: function(data, actions) {
            return actions.subscription.create({
              /* Creates the subscription */
              plan_id: planIds[billingCycle]
            });
          },
          onApprove: function(data, actions) {
            alert(data.subscriptionID); // You can add optional success message for the subscriber here
            if (onSuccess) {
              onSuccess({
                subscriptionID: data.subscriptionID,
                billingCycle: billingCycle
              });
            }
          },
          onError: function(err) {
            console.error('PayPal error:', err);
            if (onError) {
              onError(err);
            }
          }
        }).render(paypalRef.current);
      }
    };

    loadPayPalScript();
  }, [billingCycle, clientId]);

  return (
    <div className="w-full">
      <div ref={paypalRef} className="w-full min-h-[50px]"></div>
      {!isLoaded && (
        <div className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-6 rounded-lg text-center">
          Loading PayPal...
        </div>
      )}
    </div>
  );
}