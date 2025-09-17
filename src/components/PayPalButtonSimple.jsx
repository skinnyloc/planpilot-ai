'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, Shield } from 'lucide-react';

export default function PayPalButtonSimple({ planId, billingCycle = 'monthly', onSuccess, onError, onCancel }) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if PayPal is configured
  const isPayPalConfigured = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID &&
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID !== 'YOUR_PAYPAL_CLIENT_ID_HERE';

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

  return (
    <div className="space-y-4">
      {/* Demo Mode Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <AlertCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
        <p className="text-sm text-blue-700 mb-2">
          <strong>Demo Mode</strong> - PayPal integration ready for configuration
        </p>
        <p className="text-xs text-blue-600">
          Run <code>npm run setup-paypal</code> to configure real payments
        </p>
      </div>

      {/* Demo Payment Button */}
      <button
        onClick={handleDemoPayment}
        disabled={isProcessing}
        className={`w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-6 rounded-xl transition-all duration-200 text-lg ${
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

      {/* Security Notice */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Shield className="h-3 w-3" />
        <span>Demo mode - no real payment will be processed</span>
      </div>
    </div>
  );
}