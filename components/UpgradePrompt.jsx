import { Crown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Simple Upgrade Prompt Component
 * No complex features, just a basic upgrade message
 */
export default function UpgradePrompt({ feature, className = '' }) {
  const featureNames = {
    'business-plan-generation': 'Business Plan Generation',
    'grant-proposal-creation': 'Grant Proposal Creation',
    'document-export': 'Document Export',
    'advanced-features': 'Advanced Features'
  };

  const featureName = featureNames[feature] || 'This Feature';

  return (
    <div className={`bg-gradient-to-r from-primary/10 to-yellow-300/10 border border-primary/30 rounded-lg p-6 text-center shadow-brand ${className}`}>
      {/* Pro Icon */}
      <div className="bg-brand-gradient w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-brand">
        <Crown className="h-6 w-6 text-black" />
      </div>

      {/* Message */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Upgrade to <span className="text-brand-gradient">BizPlan Navigator</span> Pro
      </h3>
      <p className="text-muted-foreground mb-4">
        {featureName} requires a PlanPilot Pro subscription to unlock advanced capabilities and generate professional documents.
      </p>

      {/* Benefits List */}
      <div className="text-sm text-muted-foreground mb-6 space-y-1">
        <div>✨ Unlimited generations</div>
        <div>📄 Professional templates</div>
        <div>💾 Export to PDF, Word & Excel</div>
        <div>🎯 Priority support</div>
      </div>

      {/* Upgrade Button */}
      <Link
        to="/pricing"
        className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg glow-brand"
      >
        Upgrade Now - $19.99/month
        <ArrowRight className="h-4 w-4" />
      </Link>

      {/* Additional Info */}
      <p className="text-xs text-muted-foreground mt-4">
        30-day money-back guarantee • Cancel anytime
      </p>
    </div>
  );
}