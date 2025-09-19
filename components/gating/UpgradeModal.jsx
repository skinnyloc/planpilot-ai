import { useState, useEffect } from 'react';
import { X, Star, Zap, TrendingUp, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUpgradeUrl } from '@/lib/utils/planGating';
import { plans, formatPrice } from '@/lib/config/plans';

/**
 * UpgradeModal Component
 *
 * A compelling modal that appears when users try to access Pro features.
 * Designed to be helpful and motivating rather than punitive.
 */
export default function UpgradeModal({
  isOpen,
  onClose,
  feature,
  source = 'modal',
  customMessage = null
}) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const proPlan = plans.pro;

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleUpgrade = () => {
    const upgradeUrl = getUpgradeUrl(source, feature?.name || 'unknown');
    navigate(upgradeUrl);
    onClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 150); // Allow animation to complete
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          isVisible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 ${
            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Header */}
          <div className="text-center pt-8 px-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Unlock {feature?.name || 'This Feature'}
            </h2>
            <p className="text-gray-600 text-lg">
              {customMessage || feature?.upgradeMessage || 'Upgrade to PlanPilot Pro to access this powerful feature'}
            </p>
          </div>

          {/* Benefits Highlight */}
          <div className="px-6 py-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Why entrepreneurs choose Pro:
              </h3>
              <div className="space-y-2">
                {proPlan.benefits.slice(0, 2).map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">{benefit.title}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">Join 10,000+ successful entrepreneurs</span>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="text-center mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-3xl font-bold text-gray-900">{formatPrice(proPlan)}</div>
                <div className="text-gray-600">/month</div>
                <div className="text-sm text-green-600 font-medium mt-1">
                  250x cheaper than hiring a consultant
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
              >
                Upgrade to Pro Now
              </button>
              <button
                onClick={handleClose}
                className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors"
              >
                Maybe later
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-6 space-y-2">
              {proPlan.guarantees.slice(0, 2).map((guarantee, index) => (
                <div key={index} className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Shield className="h-4 w-4 text-green-500" />
                  {guarantee}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}