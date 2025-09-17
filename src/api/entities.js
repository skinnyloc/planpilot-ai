import { supabase } from '@/lib/supabase';

// Mock entities that work with Supabase instead of base44
export const BusinessIdea = {
  list: async () => {
    // Return demo data for now, can be replaced with Supabase queries later
    return [
      {
        id: 'demo-idea-1',
        business_name: 'Demo Coffee Shop',
        business_address: '123 Main St, Demo City',
        years_in_business: 0,
        problem_solved: 'Providing quality coffee in an underserved area',
        concept: 'A neighborhood coffee shop focused on community and quality',
        mission_statement: 'To bring people together over great coffee',
        target_market: 'Local residents and remote workers',
        business_goals: 'Break even in year 1, expand to second location in year 3',
        industry: 'Food & Beverage',
        startup_costs: 50000,
        revenue_model: 'Direct sales of coffee, pastries, and merchandise',
        competitive_advantage: 'Community focus and locally sourced ingredients',
        location: 'Downtown area with high foot traffic'
      }
    ];
  },
  create: async (data) => {
    // For now, return the data with an ID - can be replaced with Supabase insert later
    return { id: Date.now().toString(), ...data };
  }
};

export const BusinessPlan = {
  list: async () => [],
  create: async (data) => {
    // For now, return the data with an ID - can be replaced with Supabase insert later
    return { id: Date.now().toString(), ...data };
  }
};

export const GrantProposal = {
  list: async () => [],
  create: async (data) => {
    return { id: Date.now().toString(), ...data };
  }
};

export const CreditRoadmap = {
  list: async () => [],
  create: async (data) => {
    return { id: Date.now().toString(), ...data };
  }
};

export const Grant = {
  list: async () => [],
  create: async (data) => {
    return { id: Date.now().toString(), ...data };
  }
};

export const Proposal = {
  list: async () => [],
  create: async (data) => {
    return { id: Date.now().toString(), ...data };
  }
};

// Mock user authentication - replaced with Clerk integration in useEntitlements
export const User = {
  me: async () => {
    // This is now handled in useEntitlements hook with Clerk
    return null;
  }
};