/**
 * Plan Gating System
 *
 * Comprehensive system for managing feature access based on user subscription plans.
 * Integrates with Supabase for user data and provides both server-side and client-side utilities.
 */

import { useUser } from '@clerk/clerk-react';
import { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { PLAN_TYPES } from '@/lib/config/plans';

// Feature access mapping
export const FEATURES = {
  BUSINESS_PLAN_GENERATION: 'business_plan_generation',
  GRANT_PROPOSAL_CREATION: 'grant_proposal_creation',
  DOCUMENT_CREATION: 'document_creation',
  DOCUMENT_EXPORT: 'document_export',
  UNLIMITED_GENERATIONS: 'unlimited_generations',
  PRIORITY_SUPPORT: 'priority_support',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  CUSTOM_BRANDING: 'custom_branding'
};

// Plan feature matrix
const PLAN_FEATURES = {
  [PLAN_TYPES.FREE]: {
    [FEATURES.BUSINESS_PLAN_GENERATION]: false,
    [FEATURES.GRANT_PROPOSAL_CREATION]: false,
    [FEATURES.DOCUMENT_CREATION]: false,
    [FEATURES.DOCUMENT_EXPORT]: false,
    [FEATURES.UNLIMITED_GENERATIONS]: false,
    [FEATURES.PRIORITY_SUPPORT]: false,
    [FEATURES.ADVANCED_ANALYTICS]: false,
    [FEATURES.CUSTOM_BRANDING]: false
  },
  [PLAN_TYPES.PRO]: {
    [FEATURES.BUSINESS_PLAN_GENERATION]: true,
    [FEATURES.GRANT_PROPOSAL_CREATION]: true,
    [FEATURES.DOCUMENT_CREATION]: true,
    [FEATURES.DOCUMENT_EXPORT]: true,
    [FEATURES.UNLIMITED_GENERATIONS]: true,
    [FEATURES.PRIORITY_SUPPORT]: true,
    [FEATURES.ADVANCED_ANALYTICS]: true,
    [FEATURES.CUSTOM_BRANDING]: true
  }
};

// Usage limits for free users
export const FREE_PLAN_LIMITS = {
  BUSINESS_PLANS_PER_MONTH: 0,
  GRANT_PROPOSALS_PER_MONTH: 0,
  DOCUMENTS_PER_MONTH: 0
};

/**
 * Check if a user has access to a specific feature
 * @param {string} userPlan - User's current plan
 * @param {string} feature - Feature to check access for
 * @returns {boolean} Whether user has access to the feature
 */
export function hasFeatureAccess(userPlan, feature) {
  const plan = userPlan || PLAN_TYPES.FREE;
  return PLAN_FEATURES[plan]?.[feature] || false;
}

/**
 * Get user's current plan from Supabase profile
 * @param {string} userId - Clerk user ID
 * @returns {Promise<string>} User's plan type
 */
export async function getUserPlan(userId) {
  try {
    if (!userId) return PLAN_TYPES.FREE;

    const user = await User.me();
    return user?.plan || PLAN_TYPES.FREE;
  } catch (error) {
    console.error('Error fetching user plan:', error);
    return PLAN_TYPES.FREE;
  }
}

/**
 * Get user's plan status (active, inactive, trial, etc.)
 * @param {string} userId - Clerk user ID
 * @returns {Promise<string>} User's plan status
 */
export async function getUserPlanStatus(userId) {
  try {
    if (!userId) return 'inactive';

    const user = await User.me();
    return user?.status || 'inactive';
  } catch (error) {
    console.error('Error fetching user plan status:', error);
    return 'inactive';
  }
}

/**
 * Check if user has Pro plan with active status
 * @param {string} userPlan - User's plan
 * @param {string} userStatus - User's status
 * @returns {boolean} Whether user is a Pro user
 */
export function isProUser(userPlan, userStatus) {
  return userPlan === PLAN_TYPES.PRO && userStatus === 'active';
}

/**
 * Get feature access info with upgrade messaging
 * @param {string} feature - Feature to check
 * @param {string} userPlan - User's current plan
 * @returns {object} Access info with messaging
 */
export function getFeatureAccess(feature, userPlan) {
  const hasAccess = hasFeatureAccess(userPlan, feature);

  const featureMessages = {
    [FEATURES.BUSINESS_PLAN_GENERATION]: {
      name: 'Business Plan Generation',
      description: 'Create comprehensive, AI-powered business plans',
      upgradeMessage: 'Unlock unlimited business plan generation with PlanPilot Pro'
    },
    [FEATURES.GRANT_PROPOSAL_CREATION]: {
      name: 'Grant Proposal Creation',
      description: 'Generate professional grant proposals that get funded',
      upgradeMessage: 'Create winning grant proposals with PlanPilot Pro'
    },
    [FEATURES.DOCUMENT_CREATION]: {
      name: 'Document Creation',
      description: 'Create and manage all your business documents',
      upgradeMessage: 'Organize your business with unlimited document creation'
    },
    [FEATURES.DOCUMENT_EXPORT]: {
      name: 'Document Export',
      description: 'Export documents to PDF, Word, and Excel formats',
      upgradeMessage: 'Export your documents in any format with Pro'
    }
  };

  return {
    hasAccess,
    feature: featureMessages[feature] || { name: 'Feature', description: '', upgradeMessage: 'Upgrade to Pro for full access' },
    plan: userPlan
  };
}

/**
 * Custom hook for real-time plan checking
 * @returns {object} Plan information and helper functions
 */
export function usePlanGating() {
  const { user: clerkUser } = useUser();
  const [userPlan, setUserPlan] = useState(PLAN_TYPES.FREE);
  const [userStatus, setUserStatus] = useState('inactive');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const fetchUserPlan = useCallback(async () => {
    if (!clerkUser?.id) {
      setUserPlan(PLAN_TYPES.FREE);
      setUserStatus('inactive');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check for demo mode first
      if (typeof window !== 'undefined') {
        const demoPlan = localStorage.getItem('demo_user_plan');
        const demoStatus = localStorage.getItem('demo_user_status');
        const demoPaidFeatures = localStorage.getItem('demo_paid_features');

        if (demoPlan || demoStatus || demoPaidFeatures) {
          // Use demo values if they exist
          setUserPlan(demoPlan === 'pro' || demoPaidFeatures === 'true' ? PLAN_TYPES.PRO : PLAN_TYPES.FREE);
          setUserStatus(demoStatus === 'active' || demoPaidFeatures === 'true' ? 'active' : 'inactive');
          setLastUpdated(Date.now());
          setLoading(false);
          return;
        }
      }

      // Production mode - fetch from database
      const [plan, status] = await Promise.all([
        getUserPlan(clerkUser.id),
        getUserPlanStatus(clerkUser.id)
      ]);

      setUserPlan(plan);
      setUserStatus(status);
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Error in usePlanGating:', error);
      setUserPlan(PLAN_TYPES.FREE);
      setUserStatus('inactive');
    } finally {
      setLoading(false);
    }
  }, [clerkUser?.id]);

  useEffect(() => {
    fetchUserPlan();
  }, [fetchUserPlan]);

  // Refresh plan data when user updates (e.g., after subscription)
  const refreshPlan = useCallback(() => {
    fetchUserPlan();
  }, [fetchUserPlan]);

  const isPro = isProUser(userPlan, userStatus);

  const checkFeatureAccess = useCallback((feature) => {
    return getFeatureAccess(feature, userPlan);
  }, [userPlan]);

  const canUseFeature = useCallback((feature) => {
    return hasFeatureAccess(userPlan, feature) && userStatus === 'active';
  }, [userPlan, userStatus]);

  return {
    userPlan,
    userStatus,
    isPro,
    loading,
    lastUpdated,
    refreshPlan,
    checkFeatureAccess,
    canUseFeature,
    hasFeatureAccess: (feature) => hasFeatureAccess(userPlan, feature)
  };
}

/**
 * Check if user has reached usage limits (for future implementation)
 * @param {string} userId - User ID
 * @param {string} feature - Feature to check limits for
 * @returns {Promise<object>} Usage information
 */
export async function checkUsageLimits(userId, feature) {
  // This would integrate with usage tracking in the future
  // For now, return basic structure
  return {
    hasReachedLimit: false,
    currentUsage: 0,
    limit: FREE_PLAN_LIMITS[feature] || 0,
    resetDate: null
  };
}

/**
 * Generate upgrade URL with context
 * @param {string} source - Where the upgrade prompt originated
 * @param {string} feature - Feature being gated
 * @returns {string} Upgrade URL with tracking parameters
 */
export function getUpgradeUrl(source, feature) {
  const params = new URLSearchParams({
    source,
    feature,
    utm_source: 'app',
    utm_medium: 'gating',
    utm_campaign: 'upgrade'
  });

  return `/pricing?${params.toString()}`;
}

export default {
  FEATURES,
  PLAN_TYPES,
  hasFeatureAccess,
  getUserPlan,
  getUserPlanStatus,
  isProUser,
  getFeatureAccess,
  usePlanGating,
  checkUsageLimits,
  getUpgradeUrl
};