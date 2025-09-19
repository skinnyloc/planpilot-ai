import { Star, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUpgradeUrl } from '@/lib/utils/planGating';
import { formatPrice, plans } from '@/lib/config/plans';

/**
 * ProFeatureBanner Component
 *
 * An inline banner that appears on pages to promote Pro features.
 * Designed to be non-intrusive but compelling.
 */
export default function ProFeatureBanner({
  feature,
  source = 'banner',
  variant = 'default', // 'default', 'compact', 'prominent'
  customMessage = null,
  className = ''
}) {
  const navigate = useNavigate();
  const proPlan = plans.pro;

  const handleUpgrade = () => {
    const upgradeUrl = getUpgradeUrl(source, feature?.name || 'unknown');
    navigate(upgradeUrl);
  };

  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Star className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {feature?.name || 'Pro Feature'}
              </h3>
              <p className="text-gray-600 text-xs">
                {customMessage || 'Available with Pro plan'}
              </p>
            </div>
          </div>
          <button
            onClick={handleUpgrade}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
          >
            Upgrade
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'prominent') {
    return (
      <div className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6 shadow-lg ${className}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold text-sm opacity-90">PRO FEATURE</span>
            </div>
            <h3 className="text-xl font-bold mb-2">
              Unlock {feature?.name || 'This Feature'}
            </h3>
            <p className="opacity-90 mb-4">
              {customMessage || feature?.upgradeMessage || 'Get access to powerful Pro features that help you succeed faster'}
            </p>
            <div className="flex items-center gap-4 mb-4">
              <div>
                <span className="text-2xl font-bold">{formatPrice(proPlan)}</span>
                <span className="opacity-75">/month</span>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                30-day guarantee
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleUpgrade}
          className="w-full bg-white text-blue-600 hover:bg-gray-50 font-bold py-3 px-6 rounded-xl transition-colors"
        >
          Upgrade to Pro
        </button>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="bg-amber-100 p-3 rounded-full flex-shrink-0">
          <Star className="h-6 w-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {feature?.name || 'Pro Feature'} Available with PlanPilot Pro
          </h3>
          <p className="text-gray-700 mb-4">
            {customMessage || feature?.upgradeMessage || 'Unlock this powerful feature and accelerate your business success'}
          </p>

          {/* Mini benefits */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Instant access
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {formatPrice(proPlan)}/month
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Cancel anytime
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleUpgrade}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              Upgrade to Pro
              <ArrowRight className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600">
              30-day money-back guarantee
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}