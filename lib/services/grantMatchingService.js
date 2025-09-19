// Enhanced Grant Matching Algorithm with AI-powered analysis

const MOCK_GRANT_DATABASE = [
  {
    id: 'sbir-1',
    title: 'SBIR Phase I Technology Development Grant',
    agency: 'Small Business Administration',
    maxAmount: 256000,
    description: 'Support for small businesses developing innovative technologies with commercial potential',
    eligibility: {
      businessStage: ['startup', 'early-stage'],
      industries: ['technology', 'biotech', 'manufacturing', 'healthcare'],
      employeeCount: { max: 500 },
      location: ['US'],
      fundingRange: { min: 50000, max: 256000 }
    },
    requirements: [
      'For-profit small business',
      'US-based operations',
      'Innovative technology focus',
      'Clear commercialization plan'
    ],
    deadline: '2024-03-15',
    competitiveness: 'high',
    successRate: 15,
    tags: ['technology', 'innovation', 'research', 'development']
  },
  {
    id: 'rural-dev-1',
    title: 'Rural Business Development Grant',
    agency: 'USDA Rural Development',
    maxAmount: 500000,
    description: 'Support for businesses in rural communities to create jobs and stimulate economic growth',
    eligibility: {
      businessStage: ['startup', 'growth', 'expansion'],
      industries: ['agriculture', 'manufacturing', 'technology', 'tourism'],
      location: ['rural'],
      employeeCount: { max: 250 },
      fundingRange: { min: 10000, max: 500000 }
    },
    requirements: [
      'Located in rural area (population < 50,000)',
      'Job creation commitment',
      'Community benefit demonstration',
      'Financial sustainability plan'
    ],
    deadline: '2024-04-01',
    competitiveness: 'medium',
    successRate: 25,
    tags: ['rural', 'agriculture', 'community-development', 'jobs']
  },
  {
    id: 'minority-1',
    title: 'Minority Business Enterprise Development Grant',
    agency: 'Minority Business Development Agency',
    maxAmount: 150000,
    description: 'Support for minority-owned businesses to expand operations and increase competitiveness',
    eligibility: {
      businessStage: ['startup', 'growth'],
      ownership: ['minority-owned'],
      location: ['US'],
      employeeCount: { max: 100 },
      fundingRange: { min: 25000, max: 150000 }
    },
    requirements: [
      'At least 51% minority ownership',
      'Business plan with growth strategy',
      'Financial projections',
      'Market analysis'
    ],
    deadline: '2024-05-30',
    competitiveness: 'medium',
    successRate: 30,
    tags: ['minority-owned', 'diversity', 'business-development']
  },
  {
    id: 'clean-energy-1',
    title: 'Clean Energy Innovation Fund',
    agency: 'Department of Energy',
    maxAmount: 1000000,
    description: 'Funding for innovative clean energy technologies and sustainable business models',
    eligibility: {
      businessStage: ['startup', 'growth'],
      industries: ['clean-energy', 'renewable-energy', 'sustainability'],
      location: ['US'],
      fundingRange: { min: 100000, max: 1000000 }
    },
    requirements: [
      'Clean energy focus',
      'Environmental impact assessment',
      'Technical feasibility study',
      'Market commercialization plan'
    ],
    deadline: '2024-06-15',
    competitiveness: 'high',
    successRate: 12,
    tags: ['clean-energy', 'sustainability', 'innovation', 'environment']
  },
  {
    id: 'women-owned-1',
    title: 'Women-Owned Small Business Grant',
    agency: 'Small Business Administration',
    maxAmount: 75000,
    description: 'Support for women entrepreneurs to start and grow their businesses',
    eligibility: {
      businessStage: ['startup', 'early-stage'],
      ownership: ['women-owned'],
      location: ['US'],
      employeeCount: { max: 50 },
      fundingRange: { min: 5000, max: 75000 }
    },
    requirements: [
      'At least 51% women ownership',
      'Business plan',
      'Financial projections',
      'Mentorship program participation'
    ],
    deadline: '2024-07-01',
    competitiveness: 'medium',
    successRate: 35,
    tags: ['women-owned', 'entrepreneurship', 'small-business']
  }
];

/**
 * Enhanced grant matching algorithm that analyzes business plan data
 * and returns prioritized grant opportunities
 */
export async function findMatchingGrants(businessPlanData, filters = {}) {
  try {
    // Normalize business plan data
    const normalizedData = normalizeBusinessPlanData(businessPlanData);

    // Get all grants and calculate match scores
    let grants = MOCK_GRANT_DATABASE.map(grant => ({
      ...grant,
      matchScore: calculateMatchScore(normalizedData, grant),
      reasons: getMatchReasons(normalizedData, grant),
      recommendations: getRecommendations(normalizedData, grant)
    }));

    // Apply filters
    grants = applyFilters(grants, filters);

    // Sort by match score (highest first)
    grants.sort((a, b) => b.matchScore - a.matchScore);

    // Add ranking and additional analysis
    grants = grants.map((grant, index) => ({
      ...grant,
      rank: index + 1,
      confidence: getConfidenceLevel(grant.matchScore),
      estimatedTimeToApply: estimateApplicationTime(grant),
      nextSteps: getNextSteps(grant)
    }));

    return {
      totalMatches: grants.length,
      topMatches: grants.slice(0, 10),
      allMatches: grants,
      summary: generateMatchSummary(grants, normalizedData)
    };

  } catch (error) {
    console.error('Grant matching failed:', error);
    throw new Error(`Grant matching failed: ${error.message}`);
  }
}

/**
 * Normalize business plan data for consistent matching
 */
function normalizeBusinessPlanData(data) {
  return {
    businessName: data.businessName || '',
    industry: normalizeIndustry(data.industry || ''),
    fundingAmount: parseFundingAmount(data.fundingAmount || '0'),
    location: normalizeLocation(data.location || ''),
    businessStage: normalizeBusinessStage(data.businessStage || ''),
    targetMarket: data.targetMarket || '',
    keyProducts: data.keyProducts || [],
    competitiveAdvantages: data.competitiveAdvantages || [],
    employeeCount: data.employeeCount || 0,
    annualRevenue: data.annualRevenue || 0,
    ownership: data.ownership || 'standard'
  };
}

/**
 * Calculate match score between business and grant (0-100)
 */
function calculateMatchScore(business, grant) {
  let score = 0;
  let maxScore = 0;

  // Industry match (30% weight)
  const industryWeight = 30;
  if (grant.eligibility.industries) {
    maxScore += industryWeight;
    if (grant.eligibility.industries.some(industry =>
      business.industry.toLowerCase().includes(industry.toLowerCase()) ||
      industry.toLowerCase().includes(business.industry.toLowerCase())
    )) {
      score += industryWeight;
    }
  }

  // Funding amount match (25% weight)
  const fundingWeight = 25;
  if (grant.eligibility.fundingRange) {
    maxScore += fundingWeight;
    const { min = 0, max = Infinity } = grant.eligibility.fundingRange;
    if (business.fundingAmount >= min && business.fundingAmount <= max) {
      score += fundingWeight;
    } else if (business.fundingAmount <= max * 1.2) {
      // Partial match if within 20% of max
      score += fundingWeight * 0.7;
    }
  }

  // Business stage match (20% weight)
  const stageWeight = 20;
  if (grant.eligibility.businessStage) {
    maxScore += stageWeight;
    if (grant.eligibility.businessStage.includes(business.businessStage)) {
      score += stageWeight;
    }
  }

  // Location match (15% weight)
  const locationWeight = 15;
  if (grant.eligibility.location) {
    maxScore += locationWeight;
    if (grant.eligibility.location.includes('US') ||
        grant.eligibility.location.some(loc =>
          business.location.toLowerCase().includes(loc.toLowerCase())
        )) {
      score += locationWeight;
    }
  }

  // Employee count match (10% weight)
  const employeeWeight = 10;
  if (grant.eligibility.employeeCount) {
    maxScore += employeeWeight;
    const { max = Infinity } = grant.eligibility.employeeCount;
    if (business.employeeCount <= max) {
      score += employeeWeight;
    }
  }

  // Normalize score to 0-100
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

/**
 * Generate reasons why this grant matches the business
 */
function getMatchReasons(business, grant) {
  const reasons = [];

  if (grant.eligibility.industries?.some(industry =>
    business.industry.toLowerCase().includes(industry.toLowerCase())
  )) {
    reasons.push(`Industry alignment: ${business.industry} matches grant focus`);
  }

  if (grant.eligibility.fundingRange) {
    const { min, max } = grant.eligibility.fundingRange;
    if (business.fundingAmount >= min && business.fundingAmount <= max) {
      reasons.push(`Funding amount of $${business.fundingAmount.toLocaleString()} fits grant range ($${min.toLocaleString()} - $${max.toLocaleString()})`);
    }
  }

  if (grant.eligibility.businessStage?.includes(business.businessStage)) {
    reasons.push(`Business stage "${business.businessStage}" matches grant criteria`);
  }

  return reasons;
}

/**
 * Generate recommendations to improve grant application
 */
function getRecommendations(business, grant) {
  const recommendations = [];

  // Check for missing or weak areas
  if (!business.targetMarket) {
    recommendations.push('Develop a clear target market description');
  }

  if (business.keyProducts.length === 0) {
    recommendations.push('Define key products/services offering');
  }

  if (grant.competitiveness === 'high') {
    recommendations.push('This is a highly competitive grant - ensure your application stands out');
    recommendations.push('Consider getting professional grant writing assistance');
  }

  // Grant-specific recommendations
  if (grant.tags.includes('innovation')) {
    recommendations.push('Emphasize innovative aspects and intellectual property');
  }

  if (grant.tags.includes('jobs')) {
    recommendations.push('Highlight job creation potential and community impact');
  }

  return recommendations;
}

/**
 * Apply user-specified filters to grant results
 */
function applyFilters(grants, filters) {
  let filtered = grants;

  if (filters.maxAmount) {
    filtered = filtered.filter(grant => grant.maxAmount <= filters.maxAmount);
  }

  if (filters.competitiveness) {
    filtered = filtered.filter(grant => grant.competitiveness === filters.competitiveness);
  }

  if (filters.deadline) {
    const deadline = new Date(filters.deadline);
    filtered = filtered.filter(grant => new Date(grant.deadline) <= deadline);
  }

  if (filters.minMatchScore) {
    filtered = filtered.filter(grant => grant.matchScore >= filters.minMatchScore);
  }

  return filtered;
}

/**
 * Generate confidence level based on match score
 */
function getConfidenceLevel(score) {
  if (score >= 80) return 'Very High';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Low';
  return 'Very Low';
}

/**
 * Estimate time needed to complete application
 */
function estimateApplicationTime(grant) {
  const baseTime = 10; // hours

  let multiplier = 1;
  if (grant.competitiveness === 'high') multiplier = 1.5;
  if (grant.maxAmount > 500000) multiplier += 0.5;

  return Math.round(baseTime * multiplier);
}

/**
 * Generate next steps for grant application
 */
function getNextSteps(grant) {
  const steps = [
    'Review full grant guidelines and requirements',
    'Prepare required documentation',
    'Develop detailed project proposal'
  ];

  if (grant.competitiveness === 'high') {
    steps.push('Consider professional grant writing assistance');
  }

  steps.push(`Submit application before ${grant.deadline}`);

  return steps;
}

/**
 * Generate summary of matching results
 */
function generateMatchSummary(grants, business) {
  const highMatches = grants.filter(g => g.matchScore >= 70).length;
  const totalFunding = grants.slice(0, 5).reduce((sum, g) => sum + g.maxAmount, 0);

  return {
    totalOpportunities: grants.length,
    highConfidenceMatches: highMatches,
    potentialFunding: totalFunding,
    recommendedFocus: grants.length > 0 ? grants[0].industry || business.industry : business.industry,
    averageMatchScore: grants.length > 0 ? Math.round(grants.reduce((sum, g) => sum + g.matchScore, 0) / grants.length) : 0
  };
}

// Helper functions
function normalizeIndustry(industry) {
  const industryMap = {
    'tech': 'technology',
    'software': 'technology',
    'it': 'technology',
    'bio': 'biotech',
    'biotechnology': 'biotech',
    'farming': 'agriculture',
    'food': 'agriculture',
    'green': 'clean-energy',
    'renewable': 'clean-energy',
    'solar': 'clean-energy',
    'wind': 'clean-energy'
  };

  const normalized = industry.toLowerCase();
  return industryMap[normalized] || normalized;
}

function parseFundingAmount(amount) {
  if (typeof amount === 'number') return amount;

  // Remove currency symbols and commas
  const cleaned = amount.replace(/[\$,]/g, '');
  const num = parseFloat(cleaned);

  return isNaN(num) ? 0 : num;
}

function normalizeLocation(location) {
  // Add logic to normalize location data
  return location.toLowerCase();
}

function normalizeBusinessStage(stage) {
  const stageMap = {
    'idea': 'startup',
    'concept': 'startup',
    'pre-revenue': 'startup',
    'early': 'early-stage',
    'seed': 'early-stage',
    'growing': 'growth',
    'scaling': 'growth',
    'expanding': 'expansion',
    'mature': 'established'
  };

  const normalized = stage.toLowerCase();
  return stageMap[normalized] || normalized;
}