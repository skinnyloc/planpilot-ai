'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [paymentDetails, setPaymentDetails] = useState(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const payerId = searchParams.get('PayerID');

    if (token && payerId) {
      // Simulate payment processing
      const timer = setTimeout(() => {
        setStatus('success');
        setPaymentDetails({
          orderId: token,
          payerId: payerId
        });
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Processing Your Payment
          </h1>
          <p className="text-muted-foreground mb-6">
            Please wait while we confirm your payment and upgrade your account.
          </p>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              This may take a few moments. Please don't close this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">⚠</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Payment Error
          </h1>
          <p className="text-muted-foreground mb-6">
            There was an issue processing your payment. Please try again.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Return to Pricing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-lg mx-auto p-6">
        {/* Success Icon */}
        <div className="bg-green-50 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Payment Successful!
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Welcome to PlanPilot Pro! Your account has been upgraded successfully.
        </p>

        {/* Features Unlocked */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            🎉 You now have access to:
          </h2>
          <div className="grid gap-3 text-left">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-foreground">Unlimited Business Plan Generation</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-foreground">Advanced AI-Powered Business Ideas</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-foreground">Comprehensive Grant Database Access</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-foreground">Professional Grant Proposal Templates</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-foreground">Export to PDF, Word & Excel</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-foreground">Priority Customer Support</span>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        {paymentDetails && (
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-1">Order ID</p>
            <p className="font-mono text-sm text-foreground">{paymentDetails.orderId}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/business-idea"
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-lg hover:bg-secondary/80 transition-colors"
          >
            Generate Business Plan
          </Link>
        </div>

        {/* Support Note */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Need help getting started? Contact our support team at{' '}
            <a href="mailto:support@planpilot.com" className="text-primary hover:underline">
              support@planpilot.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}