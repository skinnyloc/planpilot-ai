/**
 * Simple Plan Checker - Stable utility functions for plan gating
 * No hooks, no external dependencies, just basic JavaScript
 */

/**
 * Check if user has pro plan
 * @param {object} user - Clerk user object
 * @returns {boolean} - true if user has pro plan
 */
export function isProUser(user) {
  try {
    // Check if user exists and has pro plan
    if (!user) return false;

    // For demo purposes, check localStorage first
    if (typeof window !== 'undefined') {
      const demoPlan = localStorage.getItem('demo_user_plan');
      const demoStatus = localStorage.getItem('demo_user_status');
      const demoPaidFeatures = localStorage.getItem('demo_paid_features');

      // If demo paid features are enabled, return true
      if (demoPaidFeatures === 'true') return true;

      // Check demo plan and status
      if (demoPlan === 'pro' && demoStatus === 'active') return true;
      if (demoPlan === 'free') return false;
    }

    // In production, check against your database via user metadata
    return user.publicMetadata?.plan === 'pro' || false;
  } catch (error) {
    console.error('Error checking user plan:', error);
    return false; // Default to free on error
  }
}

/**
 * Get user plan type
 * @param {object} user - Clerk user object
 * @returns {string} - 'pro' or 'free'
 */
export function getUserPlan(user) {
  return isProUser(user) ? 'pro' : 'free';
}

/**
 * Check if feature requires pro plan
 * @param {string} feature - Feature name
 * @returns {boolean} - true if feature requires pro plan
 */
export function requiresProPlan(feature) {
  const proFeatures = [
    'business-plan-generation',
    'grant-proposal-creation',
    'document-export',
    'advanced-features'
  ];

  return proFeatures.includes(feature);
}

/**
 * Check if user can access feature
 * @param {object} user - Clerk user object
 * @param {string} feature - Feature name
 * @returns {boolean} - true if user can access feature
 */
export function canAccessFeature(user, feature) {
  try {
    // If feature doesn't require pro, allow access
    if (!requiresProPlan(feature)) {
      return true;
    }

    // If feature requires pro, check if user is pro
    return isProUser(user);
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false; // Default to no access on error
  }
}