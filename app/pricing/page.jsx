'use client';

import { useState } from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PayPalSubscriptionButton from '@/components/PayPalSubscriptionButton';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const navigate = useNavigate();

  const handleSubscriptionSuccess = (data) => {
    console.log('Subscription successful:', data);
    // You can redirect to a success page or show a success message
  };

  const handleSubscriptionError = (error) => {
    console.error('Subscription error:', error);
  };



  const monthlyPrice = 19.99;
  const yearlyPrice = 199.99;
  const currentPrice = billingCycle === 'monthly' ? monthlyPrice : yearlyPrice;

  const features = [
    'Unlimited Business Plan Generation',
    'Advanced AI-Powered Business Ideas',
    'Professional Grant Proposal Writing',
    'Export to PDF/Word formats',
    'Priority Email Support',
    '30-Day Money Back Guarantee'
  ];
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors mb-8"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </button>
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            Turn Your Business Idea Into
            <span className="text-yellow-500 block">Funding Success</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Get professional-grade business plans and funding strategies powered by AI.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-yellow-500 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
                billingCycle === 'yearly'
                  ? 'bg-yellow-500 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">PlanPilot Pro</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-yellow-500">${currentPrice}</span>
                <span className="text-gray-400">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
              </div>
              {billingCycle === 'yearly' && (
                <p className="text-green-400 text-sm">
                  Save ${(monthlyPrice * 12) - yearlyPrice} annually
                </p>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <PayPalSubscriptionButton
              billingCycle={billingCycle}
              onSuccess={handleSubscriptionSuccess}
              onError={handleSubscriptionError}
            />

            <p className="text-center text-sm text-gray-400 mt-4">
              30-day money-back guarantee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}