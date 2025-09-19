import { useState } from 'react';
import { usePlanGating, FEATURES } from '@/lib/utils/planGating';
import UpgradeModal from './UpgradeModal';
import ProFeatureBanner from './ProFeatureBanner';

/**
 * FeatureGate Component
 *
 * A wrapper component that handles feature gating with different display modes.
 * Can show banners, modals, or completely block content based on configuration.
 */
export default function FeatureGate({
  feature,
  children,
  fallback = null,
  mode = 'banner', // 'banner', 'modal', 'block', 'replace'
  bannerVariant = 'default',
  source = 'feature-gate',
  customMessage = null,
  showReadOnlyVersion = false,
  readOnlyContent = null,
  className = ''
}) {
  const { checkFeatureAccess, canUseFeature, loading } = usePlanGating();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg p-6">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  const featureAccess = checkFeatureAccess(feature);
  const hasAccess = canUseFeature(feature);

  // If user has access, render children normally
  if (hasAccess) {
    return <div className={className}>{children}</div>;
  }

  // Handle different modes when access is denied
  switch (mode) {
    case 'modal':
      return (
        <div className={className}>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <div className="text-gray-600">
              Click to unlock {featureAccess.feature.name}
            </div>
          </button>
          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            feature={featureAccess.feature}
            source={source}
            customMessage={customMessage}
          />
        </div>
      );

    case 'block':
      return (
        <div className={className}>
          {fallback || (
            <div className="text-center py-12 px-6 bg-gray-50 rounded-lg">
              <div className="text-gray-600 mb-4">
                {featureAccess.feature.name} requires PlanPilot Pro
              </div>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Upgrade Now
              </button>
              <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                feature={featureAccess.feature}
                source={source}
                customMessage={customMessage}
              />
            </div>
          )}
        </div>
      );

    case 'replace':
      return (
        <div className={className}>
          <ProFeatureBanner
            feature={featureAccess.feature}
            source={source}
            variant={bannerVariant}
            customMessage={customMessage}
          />
        </div>
      );

    case 'banner':
    default:
      return (
        <div className={className}>
          <ProFeatureBanner
            feature={featureAccess.feature}
            source={source}
            variant={bannerVariant}
            customMessage={customMessage}
            className="mb-6"
          />
          {showReadOnlyVersion && readOnlyContent ? (
            <div className="opacity-75 pointer-events-none">
              {readOnlyContent}
            </div>
          ) : (
            <div className="opacity-50 pointer-events-none">
              {children}
            </div>
          )}
        </div>
      );
  }
}

// Convenience components for specific features
export function BusinessPlanGate({ children, ...props }) {
  return (
    <FeatureGate feature={FEATURES.BUSINESS_PLAN_GENERATION} {...props}>
      {children}
    </FeatureGate>
  );
}

export function GrantProposalGate({ children, ...props }) {
  return (
    <FeatureGate feature={FEATURES.GRANT_PROPOSAL_CREATION} {...props}>
      {children}
    </FeatureGate>
  );
}

export function DocumentCreationGate({ children, ...props }) {
  return (
    <FeatureGate feature={FEATURES.DOCUMENT_CREATION} {...props}>
      {children}
    </FeatureGate>
  );
}

export function DocumentExportGate({ children, ...props }) {
  return (
    <FeatureGate feature={FEATURES.DOCUMENT_EXPORT} {...props}>
      {children}
    </FeatureGate>
  );
}