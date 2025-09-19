/**
 * Grant Data Service - Handles fetching and managing grant data from multiple sources
 */

import { supabase } from '../supabase.js';

// Grant data source configurations
const GRANT_SOURCES = {
  'grants.gov': {
    name: 'Grants.gov',
    baseUrl: 'https://www.grants.gov/grantsws/rest',
    apiKey: process.env.GRANTS_GOV_API_KEY,
    rateLimit: 1000, // requests per hour
    enabled: true
  },
  'sba': {
    name: 'Small Business Administration',
    baseUrl: 'https://www.sba.gov',
    enabled: true,
    type: 'scraper'
  },
  'usda': {
    name: 'USDA Rural Development',
    baseUrl: 'https://www.rd.usda.gov',
    enabled: true,
    type: 'scraper'
  },
  'nsf': {
    name: 'National Science Foundation',
    baseUrl: 'https://www.research.gov/common/webapi',
    apiKey: process.env.NSF_API_KEY,
    enabled: false // Enable when API key is available
  }
};

/**
 * Fetch grants from Grants.gov API
 */
export async function fetchGrantsGovData() {
  const source = GRANT_SOURCES['grants.gov'];

  if (!source.enabled || !source.apiKey) {
    console.log('Grants.gov API not configured, using mock data');
    return await fetchMockGrantsGovData();
  }

  try {
    // Grants.gov API endpoint for opportunity search
    const url = `${source.baseUrl}/opportunities/search`;

    const params = new URLSearchParams({
      keyword: 'small business',
      oppStatus: 'forecasted|posted',
      rows: 100,
      format: 'json'
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Authorization': `Bearer ${source.apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Grants.gov API error: ${response.status}`);
    }

    const data = await response.json();
    return normalizeGrantsGovData(data);

  } catch (error) {
    console.error('Failed to fetch from Grants.gov:', error);
    // Fallback to mock data
    return await fetchMockGrantsGovData();
  }
}

/**
 * Mock Grants.gov data for development/demo
 */
async function fetchMockGrantsGovData() {
  return [
    {
      opportunityId: 'GRANTS-GOV-001',
      opportunityTitle: 'Small Business Innovation Research (SBIR) Program',
      description: 'Federal program to support small business innovation and commercialization',
      agency: 'Multiple Agencies',
      cfda: '47.041',
      openDate: '2024-01-15',
      closeDate: '2024-06-15',
      awardAmount: { min: 50000, max: 1500000 },
      eligibility: ['Small Business'],
      categories: ['Technology', 'Innovation', 'Research']
    },
    {
      opportunityId: 'GRANTS-GOV-002',
      opportunityTitle: 'Community Development Block Grant',
      description: 'Grants to develop viable urban communities by providing decent housing and suitable living environment',
      agency: 'Department of Housing and Urban Development',
      cfda: '14.218',
      openDate: '2024-02-01',
      closeDate: '2024-05-01',
      awardAmount: { min: 25000, max: 2000000 },
      eligibility: ['Local Government', 'Non-profit'],
      categories: ['Community Development', 'Housing']
    },
    {
      opportunityId: 'GRANTS-GOV-003',
      opportunityTitle: 'Advanced Manufacturing Jobs Program',
      description: 'Support for advanced manufacturing workforce development and technology adoption',
      agency: 'Department of Labor',
      cfda: '17.285',
      openDate: '2024-03-01',
      closeDate: '2024-07-30',
      awardAmount: { min: 100000, max: 3000000 },
      eligibility: ['Small Business', 'Educational Institution'],
      categories: ['Manufacturing', 'Workforce Development']
    }
  ];
}

/**
 * Normalize Grants.gov API response to our database format
 */
function normalizeGrantsGovData(apiData) {
  if (!apiData.OpportunitySearchResult?.opportunities) {
    return [];
  }

  return apiData.OpportunitySearchResult.opportunities.map(opportunity => ({
    grant_number: opportunity.opportunityId,
    title: opportunity.opportunityTitle,
    description: opportunity.description || opportunity.synopsis,
    summary: truncateText(opportunity.description || opportunity.synopsis, 200),
    agency: opportunity.agency,
    cfda_number: opportunity.cfda,
    open_date: parseDate(opportunity.openDate),
    close_date: parseDate(opportunity.closeDate),
    application_deadline: parseDate(opportunity.closeDate, true),
    min_amount: opportunity.awardFloor || null,
    max_amount: opportunity.awardCeiling || null,
    total_funding_available: opportunity.totalFunding || null,
    estimated_awards: opportunity.expectedAwards || null,
    eligible_applicants: parseEligibility(opportunity.eligibility),
    industry_focus: parseCategories(opportunity.categories),
    tags: generateTags(opportunity),
    application_url: `https://www.grants.gov/search-grants.html?fundingOpportunityNumber=${opportunity.opportunityId}`,
    source: 'grants.gov',
    status: 'active',
    verification_status: 'verified',
    last_scraped: new Date().toISOString()
  }));
}

/**
 * Fetch grants from foundation and private sources
 */
export async function fetchFoundationGrants() {
  // This would typically integrate with foundation databases
  // For now, return mock data representing common foundation grants

  return [
    {
      title: 'Gates Foundation Small Business Innovation Grant',
      description: 'Supporting innovative solutions for global health and development challenges',
      agency: 'Bill & Melinda Gates Foundation',
      max_amount: 500000,
      application_deadline: '2024-08-15T23:59:59Z',
      eligible_applicants: ['Small Business', 'Non-profit'],
      industry_focus: ['Healthcare', 'Technology', 'Development'],
      tags: ['global-health', 'innovation', 'development'],
      source: 'foundation',
      category: 'Private'
    },
    {
      title: 'Ford Foundation Economic Opportunity Grant',
      description: 'Supporting businesses that create economic opportunities for disadvantaged communities',
      agency: 'Ford Foundation',
      max_amount: 250000,
      application_deadline: '2024-09-30T23:59:59Z',
      eligible_applicants: ['Small Business', 'Social Enterprise'],
      industry_focus: ['Social Impact', 'Community Development'],
      tags: ['economic-opportunity', 'social-impact', 'community'],
      source: 'foundation',
      category: 'Private'
    }
  ];
}

/**
 * Web scraper for SBA grants (respects robots.txt)
 */
export async function scrapeSBAGrants() {
  try {
    // Check robots.txt compliance first
    const robotsResponse = await fetch('https://www.sba.gov/robots.txt');
    const robotsText = await robotsResponse.text();

    if (robotsText.includes('Disallow: /funding-programs')) {
      console.log('SBA scraping not allowed by robots.txt');
      return [];
    }

    // Mock SBA scraping result for demo
    return [
      {
        title: 'State Trade Expansion Program (STEP)',
        description: 'Helps small businesses enter and succeed in international markets',
        agency: 'Small Business Administration',
        max_amount: 500000,
        application_deadline: '2024-06-30T23:59:59Z',
        eligible_applicants: ['Small Business'],
        industry_focus: ['Export', 'International Trade'],
        tags: ['export', 'international', 'trade'],
        source: 'sba_scraper',
        application_url: 'https://www.sba.gov/funding-programs/grants/state-trade-expansion-program'
      }
    ];

  } catch (error) {
    console.error('SBA scraping failed:', error);
    return [];
  }
}

/**
 * Save grants to Supabase database
 */
export async function saveGrantsToDatabase(grants, sourceId) {
  try {
    const grantsToInsert = grants.map(grant => ({
      ...grant,
      source_id: sourceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('grants')
      .upsert(grantsToInsert, {
        onConflict: 'grant_number',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      throw new Error(`Database save error: ${error.message}`);
    }

    console.log(`Saved ${data?.length || 0} grants to database`);
    return data;

  } catch (error) {
    console.error('Failed to save grants:', error);
    throw error;
  }
}

/**
 * Get grant source by name
 */
export async function getGrantSource(sourceName) {
  try {
    const { data, error } = await supabase
      .from('grant_sources')
      .select('*')
      .eq('name', sourceName)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw error;
    }

    return data;

  } catch (error) {
    console.error('Failed to get grant source:', error);
    return null;
  }
}

/**
 * Update grant source status
 */
export async function updateGrantSourceStatus(sourceId, status, errorMessage = null) {
  try {
    const { error } = await supabase
      .from('grant_sources')
      .update({
        status,
        error_message: errorMessage,
        last_updated: new Date().toISOString()
      })
      .eq('id', sourceId);

    if (error) {
      throw error;
    }

  } catch (error) {
    console.error('Failed to update source status:', error);
    throw error;
  }
}

/**
 * Remove expired grants
 */
export async function removeExpiredGrants() {
  try {
    const { data, error } = await supabase
      .from('grants')
      .update({ status: 'expired' })
      .lt('application_deadline', new Date().toISOString())
      .eq('status', 'active')
      .select();

    if (error) {
      throw error;
    }

    console.log(`Marked ${data?.length || 0} grants as expired`);
    return data;

  } catch (error) {
    console.error('Failed to remove expired grants:', error);
    throw error;
  }
}

/**
 * Search grants with advanced filters
 */
export async function searchGrants(filters = {}) {
  try {
    let query = supabase
      .from('grants')
      .select(`
        *,
        grant_categories(name, color_code, icon),
        grant_sources(name, type)
      `)
      .eq('status', 'active');

    // Apply filters
    if (filters.searchTerm) {
      query = query.or(`title.ilike.%${filters.searchTerm}%, description.ilike.%${filters.searchTerm}%, agency.ilike.%${filters.searchTerm}%`);
    }

    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters.maxAmount) {
      query = query.lte('max_amount', filters.maxAmount);
    }

    if (filters.minAmount) {
      query = query.gte('min_amount', filters.minAmount);
    }

    if (filters.deadline) {
      query = query.gte('application_deadline', filters.deadline);
    }

    if (filters.agency) {
      query = query.eq('agency', filters.agency);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      grants: data || [],
      total: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };

  } catch (error) {
    console.error('Grant search failed:', error);
    throw error;
  }
}

// Helper functions
function parseDate(dateString, includeTime = false) {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (includeTime) {
    return date.toISOString();
  }
  return date.toISOString().split('T')[0];
}

function parseEligibility(eligibility) {
  if (!eligibility) return [];
  if (Array.isArray(eligibility)) return eligibility;
  return [eligibility];
}

function parseCategories(categories) {
  if (!categories) return [];
  if (Array.isArray(categories)) return categories;
  return [categories];
}

function generateTags(opportunity) {
  const tags = [];

  // Add agency-based tags
  if (opportunity.agency) {
    tags.push(opportunity.agency.toLowerCase().replace(/\s+/g, '-'));
  }

  // Add category-based tags
  if (opportunity.categories) {
    const cats = Array.isArray(opportunity.categories) ? opportunity.categories : [opportunity.categories];
    tags.push(...cats.map(cat => cat.toLowerCase().replace(/\s+/g, '-')));
  }

  // Add eligibility-based tags
  if (opportunity.eligibility) {
    const eligibility = Array.isArray(opportunity.eligibility) ? opportunity.eligibility : [opportunity.eligibility];
    tags.push(...eligibility.map(elig => elig.toLowerCase().replace(/\s+/g, '-')));
  }

  return [...new Set(tags)]; // Remove duplicates
}

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}