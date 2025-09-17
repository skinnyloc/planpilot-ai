import { supabase } from '../supabase.js';

/**
 * Profile Service
 * Handles user profile operations with Supabase
 */

/**
 * Get user profile from Supabase
 * @param {string} userId - User ID from Clerk
 * @returns {Promise<Object>} Profile data
 */
export async function getUserProfile(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Database query failed: ${error.message}`);
    }

    return {
      success: true,
      profile: profile || null
    };

  } catch (error) {
    console.error('Get user profile error:', error);
    return {
      success: false,
      error: error.message,
      profile: null
    };
  }
}

/**
 * Create or update user profile in Supabase
 * @param {string} userId - User ID from Clerk
 * @param {Object} profileData - Profile data to save
 * @returns {Promise<Object>} Save result
 */
export async function saveUserProfile(userId, profileData) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Prepare profile data for upsert
    const profileRecord = {
      id: userId,
      email: profileData.email || null,
      username: profileData.username || null,
      first_name: profileData.firstName || null,
      last_name: profileData.lastName || null,
      plan: profileData.plan || 'free',
      status: profileData.status || 'active',
      avatar_url: profileData.avatarUrl || null,
      bio: profileData.bio || null,
      updated_at: new Date().toISOString()
    };

    // Use upsert to create or update profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(profileRecord, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database upsert failed: ${error.message}`);
    }

    return {
      success: true,
      profile
    };

  } catch (error) {
    console.error('Save user profile error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update user plan information
 * @param {string} userId - User ID from Clerk
 * @param {Object} planData - Plan data to update
 * @returns {Promise<Object>} Update result
 */
export async function updateUserPlan(userId, planData) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const updateData = {
      plan: planData.plan,
      status: planData.status || 'active',
      next_billing_date: planData.nextBillingDate || null,
      updated_at: new Date().toISOString()
    };

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Plan update failed: ${error.message}`);
    }

    return {
      success: true,
      profile
    };

  } catch (error) {
    console.error('Update user plan error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check username availability
 * @param {string} username - Username to check
 * @param {string} currentUserId - Current user ID (to exclude from check)
 * @returns {Promise<Object>} Availability result
 */
export async function checkUsernameAvailability(username, currentUserId = null) {
  try {
    if (!username) {
      throw new Error('Username is required');
    }

    let query = supabase
      .from('profiles')
      .select('id')
      .eq('username', username);

    // Exclude current user if provided
    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Username check failed: ${error.message}`);
    }

    const isAvailable = !data || data.length === 0;

    return {
      success: true,
      available: isAvailable
    };

  } catch (error) {
    console.error('Check username availability error:', error);
    return {
      success: false,
      error: error.message,
      available: false
    };
  }
}

/**
 * Delete user profile (for account deletion)
 * @param {string} userId - User ID from Clerk
 * @returns {Promise<Object>} Delete result
 */
export async function deleteUserProfile(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      throw new Error(`Profile deletion failed: ${error.message}`);
    }

    return {
      success: true,
      message: 'Profile deleted successfully'
    };

  } catch (error) {
    console.error('Delete user profile error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Search profiles by username or name (for admin/social features)
 * @param {string} searchTerm - Search term
 * @param {number} limit - Result limit
 * @returns {Promise<Object>} Search results
 */
export async function searchProfiles(searchTerm, limit = 10) {
  try {
    if (!searchTerm) {
      throw new Error('Search term is required');
    }

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, avatar_url')
      .or(
        `username.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`
      )
      .limit(limit);

    if (error) {
      throw new Error(`Profile search failed: ${error.message}`);
    }

    return {
      success: true,
      profiles: profiles || []
    };

  } catch (error) {
    console.error('Search profiles error:', error);
    return {
      success: false,
      error: error.message,
      profiles: []
    };
  }
}

/**
 * Get profile statistics (for admin dashboard)
 * @returns {Promise<Object>} Profile statistics
 */
export async function getProfileStats() {
  try {
    // Get total user count
    const { count: totalUsers, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Count query failed: ${countError.message}`);
    }

    // Get plan breakdown
    const { data: planData, error: planError } = await supabase
      .from('profiles')
      .select('plan');

    if (planError) {
      throw new Error(`Plan query failed: ${planError.message}`);
    }

    const planStats = planData.reduce((acc, profile) => {
      const plan = profile.plan || 'free';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {});

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentUsers, error: recentError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recentError) {
      throw new Error(`Recent users query failed: ${recentError.message}`);
    }

    return {
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        recentUsers: recentUsers || 0,
        planBreakdown: planStats
      }
    };

  } catch (error) {
    console.error('Get profile stats error:', error);
    return {
      success: false,
      error: error.message,
      stats: {
        totalUsers: 0,
        recentUsers: 0,
        planBreakdown: {}
      }
    };
  }
}