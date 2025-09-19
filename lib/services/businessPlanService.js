/**
 * Client-side Business Plan Service
 * Uses API routes for secure operations
 */

import { supabase } from '../supabase.js';

/**
 * Generate business plan content using AI API
 */
export async function generateBusinessPlan(businessIdea, userId) {
  try {
    if (!businessIdea || !userId) {
      throw new Error('Business idea and user ID are required');
    }

    // Call the AI API route
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: buildBusinessPlanPrompt(businessIdea),
        type: 'business-plan',
        maxTokens: 3500,
        temperature: 0.7,
        userId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate business plan');
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Error generating business plan:', error);
    throw new Error('Failed to generate business plan: ' + error.message);
  }
}

/**
 * Save business plan to database and storage
 */
export async function saveBusinessPlan(userId, businessPlan, metadata = {}) {
  try {
    // Save to database
    const { data, error } = await supabase
      .from('business_plans')
      .insert([{
        user_id: userId,
        title: metadata.title || 'Untitled Business Plan',
        content: businessPlan,
        industry: metadata.industry,
        target_market: metadata.targetMarket,
        business_idea: metadata.businessIdea,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Also save as document for document management
    const documentKey = `business-plans/${userId}/${data.id}.json`;

    // Upload to storage via API
    const storageResponse = await fetch('/api/storage/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'upload',
        key: documentKey,
        contentType: 'application/json'
      }),
    });

    if (storageResponse.ok) {
      const { signedUrl } = await storageResponse.json();

      const planData = {
        ...data,
        content: businessPlan,
        metadata
      };

      await fetch(signedUrl, {
        method: 'PUT',
        body: JSON.stringify(planData, null, 2),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return data;

  } catch (error) {
    console.error('Error saving business plan:', error);
    throw new Error('Failed to save business plan');
  }
}

/**
 * Get user's business plans
 */
export async function getUserBusinessPlans(userId) {
  try {
    const { data, error } = await supabase
      .from('business_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching business plans:', error);
    throw new Error('Failed to fetch business plans');
  }
}

/**
 * Get business plan by ID
 */
export async function getBusinessPlan(planId, userId) {
  try {
    const { data, error } = await supabase
      .from('business_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching business plan:', error);
    throw new Error('Failed to fetch business plan');
  }
}

/**
 * Update business plan
 */
export async function updateBusinessPlan(planId, updates, userId) {
  try {
    const { data, error } = await supabase
      .from('business_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating business plan:', error);
    throw new Error('Failed to update business plan');
  }
}

/**
 * Delete business plan
 */
export async function deleteBusinessPlan(planId, userId) {
  try {
    // Delete from storage first
    const documentKey = `business-plans/${userId}/${planId}.json`;

    const deleteResponse = await fetch('/api/storage/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete',
        key: documentKey
      }),
    });

    if (deleteResponse.ok) {
      const { signedUrl } = await deleteResponse.json();
      await fetch(signedUrl, { method: 'DELETE' });
    }

    // Delete from database
    const { error } = await supabase
      .from('business_plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;

  } catch (error) {
    console.error('Error deleting business plan:', error);
    throw new Error('Failed to delete business plan');
  }
}

/**
 * Export business plan as PDF
 */
export async function exportBusinessPlanAsPDF(planId, userId) {
  try {
    const plan = await getBusinessPlan(planId, userId);
    if (!plan) {
      throw new Error('Business plan not found');
    }

    // This would typically use a PDF generation library
    // For now, we'll create a downloadable text file
    const content = `
BUSINESS PLAN: ${plan.title}
Generated: ${new Date(plan.created_at).toLocaleDateString()}

${plan.content}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting business plan:', error);
    throw new Error('Failed to export business plan');
  }
}

/**
 * Build business plan prompt
 */
function buildBusinessPlanPrompt(businessIdea) {
  return `Create a comprehensive business plan for the following business:

Business Idea: ${businessIdea}

Please structure the business plan with the following sections:

1. EXECUTIVE SUMMARY
   - Business concept overview
   - Mission statement
   - Key success factors
   - Financial summary

2. COMPANY DESCRIPTION
   - Company history and ownership
   - Products/services offered
   - Location and facilities
   - Competitive advantages

3. MARKET ANALYSIS
   - Industry overview
   - Target market analysis
   - Market size and trends
   - Competitive analysis

4. ORGANIZATION & MANAGEMENT
   - Organizational structure
   - Management team profiles
   - Personnel plan
   - Advisory board

5. MARKETING & SALES STRATEGY
   - Marketing strategy
   - Sales strategy
   - Pricing strategy
   - Distribution channels

6. OPERATIONS PLAN
   - Product/service development
   - Production process
   - Quality control
   - Inventory management

7. FINANCIAL PROJECTIONS
   - Revenue projections (3 years)
   - Expense forecasts
   - Break-even analysis
   - Funding requirements

8. RISK ANALYSIS
   - Market risks
   - Operational risks
   - Financial risks
   - Mitigation strategies

Provide detailed, professional content for each section with specific insights and actionable recommendations. Use data-driven insights where possible and maintain a professional business tone throughout.`;
}