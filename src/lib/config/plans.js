/**
 * Plan Configuration System
 *
 * Centralized configuration for all subscription plans.
 * Easy to extend for future plans and pricing changes.
 */

export const PLAN_TYPES = {
  FREE: 'Free',
  PRO: 'Pro'
};

export const BILLING_CYCLES = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

export const plans = {
  pro: {
    id: 'pro',
    name: 'PlanPilot Pro',
    tagline: 'Everything you need to build a successful business',
    price: {
      monthly: 19.99,
      yearly: 199.99, // 2 months free
      currency: 'USD',
      symbol: '$'
    },
    billing: BILLING_CYCLES.MONTHLY,
    features: [
      'Unlimited Business Plan Generation',
      'Advanced AI-Powered Business Ideas',
      'Comprehensive Grant Database Access',
      'Professional Grant Proposal Templates',
      'Export to PDF, Word & Excel',
      'Credit Building Guidance & Tools',
      'Priority Customer Support',
      'Advanced Analytics Dashboard',
      'Team Collaboration Features',
      'Custom Branding Options'
    ],
    benefits: [
      {
        title: 'Save 100+ Hours',
        description: 'Automated business plan creation that would take weeks to do manually'
      },
      {
        title: 'Increase Funding Success',
        description: 'Professional-grade proposals that significantly improve approval rates'
      },
      {
        title: 'Expert-Level Guidance',
        description: 'Access to business strategies typically reserved for expensive consultants'
      }
    ],
    popular: true,
    cta: 'Start Your Business Journey',
    guarantees: [
      '30-day money-back guarantee',
      'Cancel anytime',
      'No setup fees'
    ]
  }
};

export const freePlan = {
  id: 'free',
  name: 'Free Plan',
  tagline: 'Get started with basic features',
  price: {
    monthly: 0,
    yearly: 0,
    currency: 'USD',
    symbol: '$'
  },
  billing: BILLING_CYCLES.MONTHLY,
  features: [
    'Basic Business Idea Generator',
    'Limited Business Plan Templates',
    'Access to Grant Database (View Only)',
    'Basic Credit Guide Access',
    'Community Support'
  ],
  limitations: [
    'Limited to 1 business plan per month',
    'No export capabilities',
    'Basic templates only',
    'No priority support'
  ],
  popular: false,
  cta: 'Get Started Free'
};

/**
 * Get plan by ID
 * @param {string} planId - The plan identifier
 * @returns {object|null} Plan object or null if not found
 */
export function getPlanById(planId) {
  if (planId === 'free') return freePlan;
  return plans[planId] || null;
}

/**
 * Get all available plans
 * @returns {array} Array of all plans including free plan
 */
export function getAllPlans() {
  return [freePlan, ...Object.values(plans)];
}

/**
 * Format price for display
 * @param {object} plan - Plan object
 * @param {string} cycle - Billing cycle (monthly/yearly)
 * @returns {string} Formatted price string
 */
export function formatPrice(plan, cycle = 'monthly') {
  const price = plan.price[cycle];
  if (price === 0) return 'Free';

  return `${plan.price.symbol}${price.toFixed(2)}`;
}

/**
 * Get savings amount for yearly billing
 * @param {object} plan - Plan object
 * @returns {number} Savings amount in dollars
 */
export function getYearlySavings(plan) {
  if (!plan.price.yearly || !plan.price.monthly) return 0;

  const yearlyTotal = plan.price.yearly;
  const monthlyTotal = plan.price.monthly * 12;

  return monthlyTotal - yearlyTotal;
}

export default plans;