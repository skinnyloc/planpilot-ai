import { useState } from 'react';
import { Settings, Crown, User, CreditCard } from 'lucide-react';

/**
 * Demo Controls - For testing the gating system
 * This would be removed in production
 */
export default function DemoControls() {
  const [isOpen, setIsOpen] = useState(false);

  const simulateProUser = () => {
    // This is a demo function - in production, plan changes would happen via payment
    alert('🎉 Demo: You are now simulated as a Pro user!\n\n(In production, this would be handled by actual payment processing)');

    // For demo purposes, you could store this in localStorage
    localStorage.setItem('demo_user_plan', 'pro');
    localStorage.setItem('demo_user_status', 'active');
    window.location.reload();
  };

  const simulatePaidUser = () => {
    // Simulates a user who has paid and has active access to AI features
    alert('💳 Demo: You are now simulated as a Paid user!\n\nThis enables:\n• AI letter generation\n• Business plan creation\n• Grant proposal writing\n• All Pro features');

    localStorage.setItem('demo_user_plan', 'pro');
    localStorage.setItem('demo_user_status', 'active');
    localStorage.setItem('demo_paid_features', 'true');
    window.location.reload();
  };

  const simulateFreeUser = () => {
    alert('📱 Demo: You are now simulated as a Free user!\n\n(In production, users start as free by default)');

    localStorage.setItem('demo_user_plan', 'free');
    localStorage.setItem('demo_user_status', 'inactive');
    localStorage.removeItem('demo_paid_features');
    window.location.reload();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
        title="Demo Controls"
      >
        <Settings className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 z-50 min-w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Demo Controls</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ×
        </button>
      </div>

      <p className="text-xs text-gray-600 mb-4">
        Test the gating system by simulating different user types:
      </p>

      <div className="space-y-2">
        <button
          onClick={simulateFreeUser}
          className="w-full flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm"
        >
          <User className="h-4 w-4" />
          Simulate Free User
        </button>

        <button
          onClick={simulatePaidUser}
          className="w-full flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm"
        >
          <CreditCard className="h-4 w-4" />
          Simulate Paid User
        </button>

        <button
          onClick={simulateProUser}
          className="w-full flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          <Crown className="h-4 w-4" />
          Simulate Pro User
        </button>
      </div>

      <div className="text-xs text-gray-500 mt-4 space-y-1">
        <div>Plan: {localStorage.getItem('demo_user_plan') || 'Free'}</div>
        <div>Status: {localStorage.getItem('demo_user_status') || 'inactive'}</div>
        {localStorage.getItem('demo_paid_features') && (
          <div className="text-green-600 font-medium">✓ AI Features Enabled</div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t text-xs text-gray-500">
        <strong>Note:</strong> This demo panel would be removed in production. Real plan changes happen via payment processing.
      </div>
    </div>
  );
}