import { supabase } from '../supabase.js';

/**
 * Business Ideas Service
 * Handles all database operations for business ideas
 */

/**
 * Get all business ideas for the current user
 * @param {string} userId - User ID from authentication
 * @returns {Promise<Array>} Array of business ideas
 */
export async function getUserBusinessIdeas(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check if user is in demo mode
    if (userId.includes('demo')) {
      console.log('Demo mode: returning mock business ideas');
      return [
        {
          id: '1',
          name: 'EcoClean Solutions',
          industry: 'Environmental Services',
          business_stage: 'planning',
          problem_solved: 'Traditional cleaning products are harmful to the environment and employee health',
          target_market: 'Commercial businesses and offices',
          ready_for_plan: true,
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z'
        },
        {
          id: '2',
          name: 'FoodWaste Tracker',
          industry: 'Technology',
          business_stage: 'idea',
          problem_solved: 'Restaurants waste 30% of food due to poor inventory management',
          target_market: 'Restaurants and food service businesses',
          ready_for_plan: false,
          created_at: '2024-01-10T00:00:00Z',
          updated_at: '2024-01-12T00:00:00Z'
        }
      ];
    }

    const { data, error } = await supabase
      .from('business_ideas')
      .select('*')
      .eq('user_id', userId)
      .order('last_modified', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching business ideas:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getUserBusinessIdeas failed:', error);
    // If Supabase fails and user seems to be in demo mode, return demo data
    if (userId?.includes('demo') || error.message.includes('Failed to fetch')) {
      console.log('Falling back to demo data due to connection error');
      return [];
    }
    throw error;
  }
}

/**
 * Create a new business idea
 * @param {string} userId - User ID from authentication
 * @param {Object} businessData - Business idea data
 * @returns {Promise<Object>} Created business idea
 */
export async function createBusinessIdea(userId, businessData) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Prepare the data for insertion
    const insertData = {
      user_id: userId,
      name: businessData.businessName,
      summary: businessData.summary || '',
      problem: businessData.problem || null,
      solution: businessData.solution || null,
      industry: businessData.industry,
      business_address: businessData.businessAddress || {},
      years_in_business: businessData.yearsInBusiness,
      business_stage: businessData.businessStage,
      problem_solved: businessData.problemSolved,
      target_market: businessData.targetMarket,
      business_model: businessData.businessModel,
      competitive_advantage: businessData.competitiveAdvantage,
      revenue_goals: businessData.revenueGoals || {},
      team_size: businessData.teamSize,
      key_roles: businessData.keyRoles,
      funding_status: businessData.fundingStatus,
      funding_needs: businessData.fundingNeeds || null,
      marketing_channels: businessData.marketingChannels || [],
      additional_context: businessData.additionalContext,
      tags: businessData.tags || [],
      ready_for_plan: businessData.readyForPlan || false
    };

    const { data, error } = await supabase
      .from('business_ideas')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating business idea:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('createBusinessIdea failed:', error);
    throw error;
  }
}

/**
 * Update an existing business idea
 * @param {string} ideaId - Business idea ID
 * @param {string} userId - User ID from authentication
 * @param {Object} businessData - Updated business idea data
 * @returns {Promise<Object>} Updated business idea
 */
export async function updateBusinessIdea(ideaId, userId, businessData) {
  try {
    if (!ideaId || !userId) {
      throw new Error('Idea ID and User ID are required');
    }

    // Prepare the data for update
    const updateData = {
      name: businessData.businessName,
      summary: businessData.summary || '',
      problem: businessData.problem || null,
      solution: businessData.solution || null,
      industry: businessData.industry,
      business_address: businessData.businessAddress || {},
      years_in_business: businessData.yearsInBusiness,
      business_stage: businessData.businessStage,
      problem_solved: businessData.problemSolved,
      target_market: businessData.targetMarket,
      business_model: businessData.businessModel,
      competitive_advantage: businessData.competitiveAdvantage,
      revenue_goals: businessData.revenueGoals || {},
      team_size: businessData.teamSize,
      key_roles: businessData.keyRoles,
      funding_status: businessData.fundingStatus,
      funding_needs: businessData.fundingNeeds || null,
      marketing_channels: businessData.marketingChannels || [],
      additional_context: businessData.additionalContext,
      tags: businessData.tags || [],
      ready_for_plan: businessData.readyForPlan || false
    };

    const { data, error } = await supabase
      .from('business_ideas')
      .update(updateData)
      .eq('id', ideaId)
      .eq('user_id', userId) // Ensure user can only update their own ideas
      .select()
      .single();

    if (error) {
      console.error('Error updating business idea:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('updateBusinessIdea failed:', error);
    throw error;
  }
}

/**
 * Delete a business idea
 * @param {string} ideaId - Business idea ID
 * @param {string} userId - User ID from authentication
 * @returns {Promise<void>}
 */
export async function deleteBusinessIdea(ideaId, userId) {
  try {
    if (!ideaId || !userId) {
      throw new Error('Idea ID and User ID are required');
    }

    const { error } = await supabase
      .from('business_ideas')
      .delete()
      .eq('id', ideaId)
      .eq('user_id', userId); // Ensure user can only delete their own ideas

    if (error) {
      console.error('Error deleting business idea:', error);
      throw error;
    }
  } catch (error) {
    console.error('deleteBusinessIdea failed:', error);
    throw error;
  }
}

/**
 * Get a single business idea by ID
 * @param {string} ideaId - Business idea ID
 * @param {string} userId - User ID from authentication
 * @returns {Promise<Object>} Business idea
 */
export async function getBusinessIdeaById(ideaId, userId) {
  try {
    if (!ideaId || !userId) {
      throw new Error('Idea ID and User ID are required');
    }

    const { data, error } = await supabase
      .from('business_ideas')
      .select('*')
      .eq('id', ideaId)
      .eq('user_id', userId) // Ensure user can only access their own ideas
      .single();

    if (error) {
      console.error('Error fetching business idea:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('getBusinessIdeaById failed:', error);
    throw error;
  }
}

/**
 * Toggle the "ready for plan" status of a business idea
 * @param {string} ideaId - Business idea ID
 * @param {string} userId - User ID from authentication
 * @param {boolean} readyForPlan - New ready for plan status
 * @returns {Promise<Object>} Updated business idea
 */
export async function toggleReadyForPlan(ideaId, userId, readyForPlan) {
  try {
    if (!ideaId || !userId) {
      throw new Error('Idea ID and User ID are required');
    }

    const { data, error } = await supabase
      .from('business_ideas')
      .update({ ready_for_plan: readyForPlan })
      .eq('id', ideaId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling ready for plan status:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('toggleReadyForPlan failed:', error);
    throw error;
  }
}

/**
 * Get business ideas ready for plan generation
 * @param {string} userId - User ID from authentication
 * @returns {Promise<Array>} Array of business ideas ready for plan generation
 */
export async function getBusinessIdeasReadyForPlan(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data, error } = await supabase
      .from('business_ideas')
      .select('*')
      .eq('user_id', userId)
      .eq('ready_for_plan', true)
      .order('last_modified', { ascending: false });

    if (error) {
      console.error('Error fetching business ideas ready for plan:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getBusinessIdeasReadyForPlan failed:', error);
    throw error;
  }
}

/**
 * Search business ideas by text
 * @param {string} userId - User ID from authentication
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of matching business ideas
 */
export async function searchBusinessIdeas(userId, searchTerm) {
  try {
    if (!userId || !searchTerm) {
      throw new Error('User ID and search term are required');
    }

    const { data, error } = await supabase
      .from('business_ideas')
      .select('*')
      .eq('user_id', userId)
      .or(`name.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%,industry.ilike.%${searchTerm}%,target_market.ilike.%${searchTerm}%`)
      .order('last_modified', { ascending: false });

    if (error) {
      console.error('Error searching business ideas:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('searchBusinessIdeas failed:', error);
    throw error;
  }
}