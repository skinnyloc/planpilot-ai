/**
 * AI Content Generation Templates
 *
 * Provides structured templates and prompts for different types of business content.
 * Each template includes specific prompts, parameters, and formatting guidelines.
 */

/**
 * Content Types Registry
 */
export const CONTENT_TYPES = {
  BUSINESS_PLAN: 'business_plan',
  GRANT_PROPOSAL: 'grant_proposal',
  PITCH_DECK: 'pitch_deck',
  MARKET_ANALYSIS: 'market_analysis',
  FINANCIAL_PLAN: 'financial_plan',
  EXECUTIVE_SUMMARY: 'executive_summary',
  SWOT_ANALYSIS: 'swot_analysis',
  COMPETITIVE_ANALYSIS: 'competitive_analysis'
};

/**
 * Grant Types Registry
 */
export const GRANT_TYPES = {
  SBIR: 'sbir',
  SBA: 'sba',
  RESEARCH: 'research',
  INNOVATION: 'innovation',
  MINORITY_BUSINESS: 'minority_business',
  WOMEN_BUSINESS: 'women_business',
  TECHNOLOGY: 'technology',
  ENVIRONMENTAL: 'environmental',
  EDUCATION: 'education',
  HEALTHCARE: 'healthcare'
};

/**
 * Business Plan Template
 */
export const BusinessPlanTemplate = {
  type: CONTENT_TYPES.BUSINESS_PLAN,
  name: 'Comprehensive Business Plan',
  description: 'A complete business plan with all essential sections',
  estimatedTokens: 3500,
  sections: [
    'Executive Summary',
    'Company Description',
    'Market Analysis',
    'Organization & Management',
    'Marketing & Sales Strategy',
    'Operations Plan',
    'Financial Projections',
    'Risk Analysis'
  ],

  buildPrompt({
    businessName,
    businessIdea,
    industry,
    targetMarket,
    businessModel,
    competitiveAdvantage,
    fundingNeeds,
    timeframe = '3 years'
  }) {
    return `Create a comprehensive business plan for: ${businessName || 'the specified business'}

BUSINESS DETAILS:
- Business Idea: ${businessIdea}
- Industry: ${industry || 'To be determined'}
- Target Market: ${targetMarket || 'To be analyzed'}
- Business Model: ${businessModel || 'To be developed'}
- Competitive Advantage: ${competitiveAdvantage || 'To be identified'}
- Funding Needs: ${fundingNeeds || 'To be calculated'}
- Planning Timeframe: ${timeframe}

Please create a detailed business plan with the following structure:

## 1. EXECUTIVE SUMMARY
- Business concept and value proposition
- Mission and vision statements
- Key success factors and milestones
- Financial highlights and funding requirements
- Management team overview

## 2. COMPANY DESCRIPTION
- Company history and legal structure
- Location and facilities requirements
- Products/services detailed description
- Unique selling propositions
- Competitive advantages

## 3. MARKET ANALYSIS
- Industry overview and trends
- Target market segmentation
- Market size and growth projections
- Customer needs analysis
- Market entry strategy

## 4. COMPETITIVE ANALYSIS
- Direct and indirect competitors
- Competitive positioning matrix
- SWOT analysis
- Barriers to entry
- Competitive response strategies

## 5. MARKETING & SALES STRATEGY
- Brand positioning and messaging
- Marketing channels and tactics
- Sales process and strategy
- Pricing strategy and rationale
- Customer acquisition and retention

## 6. OPERATIONS PLAN
- Production/service delivery process
- Technology requirements
- Quality control measures
- Supply chain management
- Scalability considerations

## 7. MANAGEMENT & ORGANIZATION
- Organizational structure
- Key personnel requirements
- Advisory board composition
- Hiring and training plans
- Compensation strategy

## 8. FINANCIAL PROJECTIONS
- Revenue model and assumptions
- 3-year income statement projections
- Cash flow projections
- Break-even analysis
- Funding requirements and use of funds

## 9. RISK ANALYSIS & MITIGATION
- Market and competitive risks
- Operational and financial risks
- Regulatory and compliance risks
- Risk mitigation strategies
- Contingency planning

## 10. IMPLEMENTATION TIMELINE
- Phase-by-phase implementation plan
- Key milestones and deadlines
- Resource allocation timeline
- Performance metrics and KPIs
- Exit strategy considerations

Provide specific, actionable insights and realistic projections. Use professional business language and include relevant industry benchmarks where possible.`;
  },

  getParameters() {
    return [
      { name: 'businessName', type: 'text', required: false, label: 'Business Name' },
      { name: 'businessIdea', type: 'textarea', required: true, label: 'Business Idea Description' },
      { name: 'industry', type: 'select', required: false, label: 'Industry', options: this.getIndustryOptions() },
      { name: 'targetMarket', type: 'textarea', required: false, label: 'Target Market Description' },
      { name: 'businessModel', type: 'textarea', required: false, label: 'Business Model' },
      { name: 'competitiveAdvantage', type: 'textarea', required: false, label: 'Competitive Advantage' },
      { name: 'fundingNeeds', type: 'text', required: false, label: 'Estimated Funding Needs' },
      { name: 'timeframe', type: 'select', required: false, label: 'Planning Timeframe', options: ['1 year', '3 years', '5 years'], default: '3 years' }
    ];
  },

  getIndustryOptions() {
    return [
      'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing',
      'Education', 'Real Estate', 'Food & Beverage', 'Transportation',
      'Energy', 'Entertainment', 'Agriculture', 'Construction', 'Other'
    ];
  }
};

/**
 * Grant Proposal Templates
 */
export const GrantProposalTemplates = {
  [GRANT_TYPES.SBIR]: {
    type: CONTENT_TYPES.GRANT_PROPOSAL,
    name: 'SBIR Grant Proposal',
    description: 'Small Business Innovation Research grant proposal',
    estimatedTokens: 3000,

    buildPrompt({
      projectTitle,
      businessDescription,
      technicalInnovation,
      commercialization,
      fundingAmount,
      projectDuration,
      phase = 'Phase I'
    }) {
      return `Create an SBIR ${phase} grant proposal for the following project:

PROJECT DETAILS:
- Project Title: ${projectTitle}
- Business: ${businessDescription}
- Technical Innovation: ${technicalInnovation}
- Commercialization Plan: ${commercialization || 'To be developed'}
- Funding Amount: ${fundingAmount}
- Project Duration: ${projectDuration || '6-24 months'}

Structure the proposal according to SBIR requirements:

## 1. PROJECT SUMMARY
- Technical innovation overview
- Commercial potential summary
- Key objectives and deliverables
- Anticipated benefits

## 2. RESEARCH & DEVELOPMENT PLAN
- Technical objectives and approach
- Innovation and technical merit
- Research methodology
- Risk assessment and mitigation

## 3. COMMERCIAL POTENTIAL
- Market opportunity analysis
- Commercialization strategy
- Competitive advantages
- Revenue projections

## 4. COMPANY CAPABILITIES
- Technical expertise and experience
- Facilities and equipment
- Key personnel qualifications
- Past performance record

## 5. BUDGET JUSTIFICATION
- Detailed cost breakdown
- Personnel costs
- Equipment and supplies
- Indirect costs

## 6. TIMELINE AND MILESTONES
- Project phases and timeline
- Key deliverables and milestones
- Performance metrics
- Go/no-go decision points

Emphasize innovation, technical feasibility, and strong commercial potential.`;
    }
  },

  [GRANT_TYPES.SBA]: {
    type: CONTENT_TYPES.GRANT_PROPOSAL,
    name: 'SBA Grant Proposal',
    description: 'Small Business Administration grant proposal',
    estimatedTokens: 2500,

    buildPrompt({
      businessName,
      businessDescription,
      projectDescription,
      communityImpact,
      fundingAmount,
      businessStage
    }) {
      return `Create an SBA grant proposal for the following business:

BUSINESS INFORMATION:
- Business Name: ${businessName}
- Business Description: ${businessDescription}
- Project Description: ${projectDescription}
- Community Impact: ${communityImpact || 'To be detailed'}
- Funding Amount: ${fundingAmount}
- Business Stage: ${businessStage || 'Startup'}

Structure the proposal to meet SBA requirements:

## 1. EXECUTIVE SUMMARY
- Business and project overview
- Funding request and use
- Expected outcomes and impact
- Key qualifications

## 2. BUSINESS DESCRIPTION
- Company background and history
- Products/services offered
- Market opportunity
- Competitive position

## 3. PROJECT DESCRIPTION
- Project goals and objectives
- Implementation plan
- Timeline and milestones
- Success metrics

## 4. COMMUNITY IMPACT
- Job creation potential
- Economic development impact
- Community benefit analysis
- Social responsibility aspects

## 5. FINANCIAL INFORMATION
- Current financial position
- Projected financial performance
- Funding sources and uses
- Return on investment

## 6. MANAGEMENT TEAM
- Key personnel backgrounds
- Relevant experience
- Advisory support
- Organizational structure

Focus on job creation, economic impact, and community benefit.`;
    }
  }
};

/**
 * Pitch Deck Template
 */
export const PitchDeckTemplate = {
  type: CONTENT_TYPES.PITCH_DECK,
  name: 'Investment Pitch Deck',
  description: 'Investor presentation with key business highlights',
  estimatedTokens: 2000,

  buildPrompt({
    businessName,
    problemStatement,
    solution,
    marketSize,
    businessModel,
    traction,
    funding,
    teamInfo
  }) {
    return `Create content for an investor pitch deck presentation:

BUSINESS OVERVIEW:
- Company: ${businessName}
- Problem: ${problemStatement}
- Solution: ${solution}
- Market Size: ${marketSize || 'To be researched'}
- Business Model: ${businessModel || 'To be defined'}
- Traction: ${traction || 'Early stage'}
- Funding Sought: ${funding}
- Team: ${teamInfo || 'Founding team'}

Generate compelling content for each slide:

## SLIDE 1: COMPANY OVERVIEW
- Company name and tagline
- Mission statement
- What you do in one sentence

## SLIDE 2: PROBLEM
- Clear problem definition
- Market pain points
- Problem validation
- Target customer challenges

## SLIDE 3: SOLUTION
- Your unique solution
- Key features and benefits
- Why now?
- Solution differentiation

## SLIDE 4: MARKET OPPORTUNITY
- Total Addressable Market (TAM)
- Serviceable Addressable Market (SAM)
- Market trends and growth
- Customer segments

## SLIDE 5: BUSINESS MODEL
- Revenue streams
- Pricing strategy
- Unit economics
- Scalability factors

## SLIDE 6: TRACTION
- Key metrics and milestones
- Customer testimonials
- Revenue growth
- Market validation

## SLIDE 7: COMPETITIVE LANDSCAPE
- Direct and indirect competitors
- Competitive advantages
- Market positioning
- Barriers to entry

## SLIDE 8: MARKETING STRATEGY
- Customer acquisition strategy
- Marketing channels
- Partnership opportunities
- Go-to-market plan

## SLIDE 9: FINANCIAL PROJECTIONS
- Revenue projections (3-5 years)
- Key assumptions
- Path to profitability
- Unit economics

## SLIDE 10: TEAM
- Founder backgrounds
- Key team members
- Advisory board
- Why this team?

## SLIDE 11: FUNDING
- Funding amount and use
- Previous funding rounds
- Investor returns
- Exit strategy

## SLIDE 12: NEXT STEPS
- Call to action
- Contact information
- Follow-up process

Make each slide content concise, compelling, and investor-focused.`;
  }
};

/**
 * Template Registry
 */
export const TEMPLATES = {
  [CONTENT_TYPES.BUSINESS_PLAN]: BusinessPlanTemplate,
  [CONTENT_TYPES.GRANT_PROPOSAL]: GrantProposalTemplates,
  [CONTENT_TYPES.PITCH_DECK]: PitchDeckTemplate
};

/**
 * Template Utilities
 */
export class TemplateManager {
  /**
   * Get template by type and subtype
   */
  static getTemplate(type, subtype = null) {
    if (type === CONTENT_TYPES.GRANT_PROPOSAL && subtype) {
      return GrantProposalTemplates[subtype];
    }
    return TEMPLATES[type];
  }

  /**
   * Get all available templates
   */
  static getAllTemplates() {
    const templates = [];

    // Add business plan template
    templates.push({
      id: CONTENT_TYPES.BUSINESS_PLAN,
      ...BusinessPlanTemplate
    });

    // Add grant proposal templates
    Object.keys(GrantProposalTemplates).forEach(grantType => {
      templates.push({
        id: `${CONTENT_TYPES.GRANT_PROPOSAL}_${grantType}`,
        grantType,
        ...GrantProposalTemplates[grantType]
      });
    });

    // Add pitch deck template
    templates.push({
      id: CONTENT_TYPES.PITCH_DECK,
      ...PitchDeckTemplate
    });

    return templates;
  }

  /**
   * Validate template parameters
   */
  static validateParameters(templateId, parameters) {
    const template = this.getTemplate(templateId);
    if (!template || !template.getParameters) {
      return { valid: true, errors: [] };
    }

    const requiredParams = template.getParameters().filter(p => p.required);
    const errors = [];

    requiredParams.forEach(param => {
      if (!parameters[param.name] || parameters[param.name].trim() === '') {
        errors.push(`${param.label} is required`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get template by content type and grant type
   */
  static getGrantTemplate(grantType) {
    return GrantProposalTemplates[grantType];
  }

  /**
   * Estimate generation cost (in tokens)
   */
  static estimateTokens(templateId) {
    const template = this.getTemplate(templateId);
    return template?.estimatedTokens || 2000;
  }
}

/**
 * Grant Matching Algorithm
 */
export class GrantMatcher {
  /**
   * Calculate match score between a proposal letter and a grant
   */
  static calculateMatchScore(letter, grant) {
    let score = 0;
    const maxScore = 100;

    // Content similarity analysis (40 points)
    score += this.analyzeContentSimilarity(letter, grant) * 0.4;

    // Keywords matching (25 points)
    score += this.calculateKeywordMatch(letter, grant) * 0.25;

    // Requirements alignment (20 points)
    score += this.checkRequirementsAlignment(letter, grant) * 0.2;

    // Industry/domain matching (10 points)
    score += this.checkDomainMatch(letter, grant) * 0.1;

    // Funding amount appropriateness (5 points)
    score += this.checkFundingAlignment(letter, grant) * 0.05;

    return Math.min(Math.round(score), maxScore);
  }

  /**
   * Analyze content similarity using keyword frequency
   */
  static analyzeContentSimilarity(letter, grant) {
    const letterText = (letter.content || letter.summary || letter.title || '').toLowerCase();
    const grantText = (grant.description + ' ' + grant.requirements.join(' ')).toLowerCase();

    const letterWords = this.extractKeywords(letterText);
    const grantWords = this.extractKeywords(grantText);

    const intersection = letterWords.filter(word => grantWords.includes(word));
    const union = [...new Set([...letterWords, ...grantWords])];

    return union.length > 0 ? (intersection.length / union.length) * 100 : 0;
  }

  /**
   * Calculate keyword matching score
   */
  static calculateKeywordMatch(letter, grant) {
    const letterKeywords = this.getDocumentKeywords(letter);
    const grantKeywords = grant.tags || [];

    const matches = letterKeywords.filter(keyword =>
      grantKeywords.some(grantKeyword =>
        keyword.toLowerCase().includes(grantKeyword.toLowerCase()) ||
        grantKeyword.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    return grantKeywords.length > 0 ? (matches.length / grantKeywords.length) * 100 : 0;
  }

  /**
   * Check requirements alignment
   */
  static checkRequirementsAlignment(letter, grant) {
    const letterContent = (letter.content || letter.summary || '').toLowerCase();
    const requirements = grant.requirements || [];

    const metRequirements = requirements.filter(req =>
      letterContent.includes(req.toLowerCase()) ||
      this.checkSemanticMatch(letterContent, req)
    );

    return requirements.length > 0 ? (metRequirements.length / requirements.length) * 100 : 50;
  }

  /**
   * Check domain/industry matching
   */
  static checkDomainMatch(letter, grant) {
    const letterDomains = this.extractDomains(letter);
    const grantDomains = this.extractDomains(grant);

    const matches = letterDomains.filter(domain =>
      grantDomains.some(grantDomain =>
        domain.toLowerCase() === grantDomain.toLowerCase()
      )
    );

    const totalDomains = Math.max(letterDomains.length, grantDomains.length, 1);
    return (matches.length / totalDomains) * 100;
  }

  /**
   * Check funding amount alignment
   */
  static checkFundingAlignment(letter, grant) {
    // Extract funding amounts from letter content
    const letterContent = letter.content || letter.summary || '';
    const letterAmounts = this.extractFundingAmounts(letterContent);
    const grantAmount = this.parseFundingAmount(grant.amount);

    if (!letterAmounts.length || !grantAmount) return 50; // Neutral score

    const closestAmount = letterAmounts.reduce((closest, amount) =>
      Math.abs(amount - grantAmount) < Math.abs(closest - grantAmount) ? amount : closest
    );

    const difference = Math.abs(closestAmount - grantAmount) / grantAmount;
    return Math.max(0, (1 - difference) * 100);
  }

  /**
   * Extract keywords from document
   */
  static getDocumentKeywords(document) {
    const text = (document.title + ' ' + (document.content || document.summary || '')).toLowerCase();
    const keywords = document.tags || [];

    // Add keywords from content analysis
    const contentKeywords = this.extractKeywords(text);
    const importantKeywords = contentKeywords.filter(word =>
      word.length > 3 && !this.isStopWord(word)
    );

    return [...new Set([...keywords, ...importantKeywords])];
  }

  /**
   * Extract important keywords from text
   */
  static extractKeywords(text) {
    const words = text.match(/\b\w{4,}\b/g) || [];
    return words
      .filter(word => !this.isStopWord(word))
      .slice(0, 20); // Limit to top 20 keywords
  }

  /**
   * Check if word is a stop word
   */
  static isStopWord(word) {
    const stopWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'this', 'that', 'these', 'those', 'will', 'would', 'could', 'should',
      'have', 'has', 'had', 'been', 'being', 'are', 'is', 'was', 'were'
    ];
    return stopWords.includes(word.toLowerCase());
  }

  /**
   * Extract domain information
   */
  static extractDomains(document) {
    const domains = [];
    const text = (document.title + ' ' + (document.content || document.summary || '')).toLowerCase();

    // Technology domains
    if (text.match(/\b(technology|tech|software|hardware|ai|artificial intelligence|machine learning|blockchain)\b/i)) {
      domains.push('technology');
    }

    // Healthcare domains
    if (text.match(/\b(health|medical|healthcare|biotech|pharmaceutical|clinical)\b/i)) {
      domains.push('healthcare');
    }

    // Research domains
    if (text.match(/\b(research|study|analysis|investigation|academic)\b/i)) {
      domains.push('research');
    }

    // Environmental domains
    if (text.match(/\b(environment|climate|green|sustainable|renewable|clean energy)\b/i)) {
      domains.push('environmental');
    }

    // Education domains
    if (text.match(/\b(education|learning|training|academic|school|university)\b/i)) {
      domains.push('education');
    }

    return domains;
  }

  /**
   * Extract funding amounts from text
   */
  static extractFundingAmounts(text) {
    const amounts = [];
    const regex = /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*([kmb])?/gi;
    let match;

    while ((match = regex.exec(text)) !== null) {
      let amount = parseFloat(match[1].replace(/,/g, ''));
      const multiplier = match[2]?.toLowerCase();

      if (multiplier === 'k') amount *= 1000;
      else if (multiplier === 'm') amount *= 1000000;
      else if (multiplier === 'b') amount *= 1000000000;

      amounts.push(amount);
    }

    return amounts;
  }

  /**
   * Parse funding amount from grant
   */
  static parseFundingAmount(amountStr) {
    if (!amountStr) return null;

    const match = amountStr.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*([kmb])?/i);
    if (!match) return null;

    let amount = parseFloat(match[1].replace(/,/g, ''));
    const multiplier = match[2]?.toLowerCase();

    if (multiplier === 'k') amount *= 1000;
    else if (multiplier === 'm') amount *= 1000000;
    else if (multiplier === 'b') amount *= 1000000000;

    return amount;
  }

  /**
   * Check semantic matching between text and requirement
   */
  static checkSemanticMatch(text, requirement) {
    const semanticMappings = {
      'technology innovation': ['tech', 'innovation', 'breakthrough', 'advanced', 'cutting-edge'],
      'commercialization': ['market', 'commercial', 'business', 'revenue', 'customers'],
      'small business': ['startup', 'small', 'entrepreneur', 'business'],
      'job creation': ['employment', 'hiring', 'jobs', 'workforce'],
      'research': ['study', 'analysis', 'investigation', 'academic'],
      'women-owned': ['women', 'female', 'gender'],
      'minority-owned': ['minority', 'diverse', 'inclusion'],
    };

    const reqLower = requirement.toLowerCase();
    const mappings = semanticMappings[reqLower] || [];

    return mappings.some(term => text.includes(term));
  }

  /**
   * Generate match recommendations with reasons
   */
  static generateMatchRecommendations(letter, grants) {
    return grants
      .map(grant => ({
        ...grant,
        matchScore: this.calculateMatchScore(letter, grant),
        matchReasons: this.getMatchReasons(letter, grant)
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Get specific reasons for matching
   */
  static getMatchReasons(letter, grant) {
    const reasons = [];

    // Check keyword matches
    const keywordScore = this.calculateKeywordMatch(letter, grant);
    if (keywordScore > 60) {
      reasons.push('Strong keyword alignment');
    }

    // Check domain matches
    const letterDomains = this.extractDomains(letter);
    const grantDomains = this.extractDomains(grant);
    const domainMatches = letterDomains.filter(d => grantDomains.includes(d));
    if (domainMatches.length > 0) {
      reasons.push(`${domainMatches.join(', ')} focus match`);
    }

    // Check requirements
    const reqScore = this.checkRequirementsAlignment(letter, grant);
    if (reqScore > 70) {
      reasons.push('Meets key requirements');
    }

    // Check funding alignment
    const fundingScore = this.checkFundingAlignment(letter, grant);
    if (fundingScore > 70) {
      reasons.push('Appropriate funding range');
    }

    return reasons.length > 0 ? reasons : ['General compatibility'];
  }
}

/**
 * Proposal Quality Scoring System
 */
export class QualityScorer {
  /**
   * Comprehensive quality assessment of generated proposals
   */
  static assessProposalQuality(content, grant, parameters = {}) {
    const scores = {
      overall: 0,
      grantAlignment: 0,
      contentQuality: 0,
      structure: 0,
      completeness: 0,
      professionalism: 0
    };

    // Grant alignment scoring (30 points)
    scores.grantAlignment = this.scoreGrantAlignment(content, grant);

    // Content quality scoring (25 points)
    scores.contentQuality = this.scoreContentQuality(content);

    // Structure scoring (20 points)
    scores.structure = this.scoreStructure(content);

    // Completeness scoring (15 points)
    scores.completeness = this.scoreCompleteness(content, grant);

    // Professionalism scoring (10 points)
    scores.professionalism = this.scoreProfessionalism(content);

    // Calculate overall score
    scores.overall = Math.round(
      scores.grantAlignment * 0.3 +
      scores.contentQuality * 0.25 +
      scores.structure * 0.2 +
      scores.completeness * 0.15 +
      scores.professionalism * 0.1
    );

    return {
      scores,
      recommendations: this.generateRecommendations(scores, content, grant),
      strengths: this.identifyStrengths(scores, content),
      improvements: this.identifyImprovements(scores, content)
    };
  }

  /**
   * Score grant alignment
   */
  static scoreGrantAlignment(content, grant) {
    let score = 60; // Base score

    const contentLower = content.toLowerCase();
    const requirements = grant.requirements || [];
    const tags = grant.tags || [];

    // Check requirement coverage
    const metRequirements = requirements.filter(req =>
      contentLower.includes(req.toLowerCase()) ||
      this.checkSemanticAlignment(contentLower, req)
    );

    if (requirements.length > 0) {
      score += (metRequirements.length / requirements.length) * 25;
    }

    // Check tag relevance
    const relevantTags = tags.filter(tag =>
      contentLower.includes(tag.toLowerCase())
    );

    if (tags.length > 0) {
      score += (relevantTags.length / tags.length) * 15;
    }

    return Math.min(score, 100);
  }

  /**
   * Score content quality
   */
  static scoreContentQuality(content) {
    let score = 50; // Base score

    // Word count assessment
    const wordCount = content.split(/\s+/).length;
    if (wordCount >= 1500 && wordCount <= 3000) {
      score += 15; // Optimal length
    } else if (wordCount >= 1000) {
      score += 10; // Adequate length
    } else if (wordCount < 500) {
      score -= 10; // Too short
    }

    // Vocabulary diversity
    const uniqueWords = new Set(content.toLowerCase().split(/\s+/));
    const diversityRatio = uniqueWords.size / content.split(/\s+/).length;
    if (diversityRatio > 0.6) {
      score += 10;
    } else if (diversityRatio > 0.4) {
      score += 5;
    }

    // Technical depth indicators
    const technicalTerms = this.countTechnicalTerms(content);
    if (technicalTerms > 10) {
      score += 10;
    } else if (technicalTerms > 5) {
      score += 5;
    }

    // Data and evidence mentions
    const evidenceIndicators = content.match(/\b(data|research|study|analysis|evidence|statistics|findings)\b/gi) || [];
    score += Math.min(evidenceIndicators.length * 2, 15);

    return Math.min(score, 100);
  }

  /**
   * Score document structure
   */
  static scoreStructure(content) {
    let score = 40; // Base score

    // Section headers
    const headers = content.match(/^#+\s+.+$/gm) || [];
    if (headers.length >= 8) {
      score += 20; // Well-structured
    } else if (headers.length >= 5) {
      score += 15; // Adequately structured
    } else if (headers.length >= 3) {
      score += 10; // Basic structure
    }

    // Essential sections check
    const essentialSections = [
      'executive summary', 'summary',
      'problem', 'statement',
      'methodology', 'approach',
      'budget', 'financial',
      'timeline', 'schedule',
      'conclusion'
    ];

    const foundSections = essentialSections.filter(section =>
      content.toLowerCase().includes(section)
    );

    score += (foundSections.length / essentialSections.length) * 20;

    // Logical flow indicators
    const transitionWords = content.match(/\b(therefore|however|furthermore|consequently|additionally|moreover)\b/gi) || [];
    score += Math.min(transitionWords.length * 2, 20);

    return Math.min(score, 100);
  }

  /**
   * Score completeness
   */
  static scoreCompleteness(content, grant) {
    let score = 50; // Base score

    // Required elements based on grant type
    const requiredElements = this.getRequiredElements(grant.type);
    const foundElements = requiredElements.filter(element =>
      content.toLowerCase().includes(element.toLowerCase())
    );

    score += (foundElements.length / requiredElements.length) * 30;

    // Contact information
    if (content.match(/\b[\w.-]+@[\w.-]+\.\w+\b/)) {
      score += 10; // Email found
    }

    // Specific amounts and numbers
    const numbers = content.match(/\$\d+|\d+%|\d+\s+(months?|years?|days?)/g) || [];
    if (numbers.length >= 5) {
      score += 10;
    } else if (numbers.length >= 3) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  /**
   * Score professionalism
   */
  static scoreProfessionalism(content) {
    let score = 70; // Base score

    // Grammar and spelling (basic checks)
    const sentences = content.split(/[.!?]+/);
    const avgSentenceLength = content.split(/\s+/).length / sentences.length;

    if (avgSentenceLength >= 15 && avgSentenceLength <= 25) {
      score += 10; // Good sentence variety
    } else if (avgSentenceLength < 10 || avgSentenceLength > 35) {
      score -= 5; // Too simple or too complex
    }

    // Professional language indicators
    const formalWords = content.match(/\b(therefore|furthermore|consequently|establish|demonstrate|implement|facilitate)\b/gi) || [];
    score += Math.min(formalWords.length, 15);

    // Avoid casual language
    const casualWords = content.match(/\b(really|pretty|very|stuff|things|gonna|wanna)\b/gi) || [];
    score -= casualWords.length * 2;

    // Citations and references
    if (content.includes('References') || content.includes('Bibliography')) {
      score += 5;
    }

    return Math.max(Math.min(score, 100), 0);
  }

  /**
   * Get required elements based on grant type
   */
  static getRequiredElements(grantType) {
    const commonElements = ['budget', 'timeline', 'objective', 'methodology'];

    const typeSpecific = {
      'sbir': ['innovation', 'commercialization', 'technical', 'phase'],
      'sba': ['business plan', 'job creation', 'community impact'],
      'research': ['hypothesis', 'methodology', 'literature review', 'data'],
      'innovation': ['technology', 'innovation', 'market potential'],
      'minority_business': ['diversity', 'inclusion', 'community'],
      'women_business': ['women-owned', 'gender', 'empowerment']
    };

    return [...commonElements, ...(typeSpecific[grantType] || [])];
  }

  /**
   * Count technical terms
   */
  static countTechnicalTerms(content) {
    const technicalIndicators = [
      'algorithm', 'methodology', 'framework', 'protocol', 'analysis',
      'implementation', 'optimization', 'evaluation', 'assessment',
      'validation', 'verification', 'calibration', 'integration'
    ];

    return technicalIndicators.reduce((count, term) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = content.match(regex) || [];
      return count + matches.length;
    }, 0);
  }

  /**
   * Check semantic alignment with requirements
   */
  static checkSemanticAlignment(content, requirement) {
    const semanticMappings = {
      'technology innovation': ['innovation', 'breakthrough', 'cutting-edge', 'advanced'],
      'commercialization': ['market', 'revenue', 'business model', 'customers'],
      'small business': ['startup', 'entrepreneur', 'sme'],
      'job creation': ['employment', 'hiring', 'workforce'],
      'research': ['study', 'investigation', 'analysis'],
      'community impact': ['community', 'social', 'benefit', 'impact']
    };

    const mappings = semanticMappings[requirement.toLowerCase()] || [];
    return mappings.some(term => content.includes(term));
  }

  /**
   * Generate improvement recommendations
   */
  static generateRecommendations(scores, content, grant) {
    const recommendations = [];

    if (scores.grantAlignment < 70) {
      recommendations.push('Address more specific grant requirements and use terminology from the grant description');
    }

    if (scores.contentQuality < 60) {
      recommendations.push('Add more technical details, data, and evidence to support your proposal');
    }

    if (scores.structure < 70) {
      recommendations.push('Improve document structure with clear section headers and logical flow');
    }

    if (scores.completeness < 60) {
      recommendations.push('Include all required sections such as budget, timeline, and methodology');
    }

    if (scores.professionalism < 80) {
      recommendations.push('Use more formal, professional language and avoid casual expressions');
    }

    return recommendations;
  }

  /**
   * Identify proposal strengths
   */
  static identifyStrengths(scores, content) {
    const strengths = [];

    if (scores.grantAlignment >= 85) {
      strengths.push('Excellent alignment with grant requirements');
    }

    if (scores.contentQuality >= 80) {
      strengths.push('High-quality content with good technical depth');
    }

    if (scores.structure >= 85) {
      strengths.push('Well-structured document with clear organization');
    }

    if (scores.completeness >= 85) {
      strengths.push('Comprehensive coverage of all required elements');
    }

    if (scores.professionalism >= 90) {
      strengths.push('Professional presentation and language');
    }

    return strengths.length > 0 ? strengths : ['Solid foundation for grant proposal'];
  }

  /**
   * Identify areas for improvement
   */
  static identifyImprovements(scores, content) {
    const improvements = [];

    if (scores.grantAlignment < 70) {
      improvements.push('Better align content with grant-specific requirements');
    }

    if (scores.contentQuality < 70) {
      improvements.push('Add more supporting evidence and technical details');
    }

    if (scores.structure < 70) {
      improvements.push('Improve document organization and section headers');
    }

    if (scores.completeness < 70) {
      improvements.push('Include missing required sections and elements');
    }

    if (scores.professionalism < 80) {
      improvements.push('Enhance professional tone and language');
    }

    return improvements;
  }
}

/**
 * Content Enhancement Utilities
 */
export class ContentEnhancer {
  /**
   * Enhance generated content with formatting
   */
  static formatContent(content, type) {
    let formatted = content;

    // Add proper spacing and formatting
    formatted = formatted.replace(/##\s/g, '\n## ');
    formatted = formatted.replace(/###\s/g, '\n### ');
    formatted = formatted.replace(/\n\n\n+/g, '\n\n');
    formatted = formatted.trim();

    // Type-specific formatting
    switch (type) {
      case CONTENT_TYPES.BUSINESS_PLAN:
        formatted = this.formatBusinessPlan(formatted);
        break;
      case CONTENT_TYPES.GRANT_PROPOSAL:
        formatted = this.formatGrantProposal(formatted);
        break;
      case CONTENT_TYPES.PITCH_DECK:
        formatted = this.formatPitchDeck(formatted);
        break;
    }

    return formatted;
  }

  /**
   * Format business plan content
   */
  static formatBusinessPlan(content) {
    // Add table of contents
    const toc = this.generateTableOfContents(content);
    return `# Business Plan\n\n## Table of Contents\n${toc}\n\n${content}`;
  }

  /**
   * Format grant proposal content
   */
  static formatGrantProposal(content) {
    // Add cover page elements
    const coverPage = `# Grant Proposal\n\n**Submitted to:** [Grant Agency]\n**Date:** ${new Date().toLocaleDateString()}\n**Prepared by:** [Organization Name]\n\n---\n\n`;
    return coverPage + content;
  }

  /**
   * Format pitch deck content
   */
  static formatPitchDeck(content) {
    // Add slide breaks
    return content.replace(/## SLIDE \d+:/g, '\n---\n\n$&');
  }

  /**
   * Generate table of contents
   */
  static generateTableOfContents(content) {
    const headings = content.match(/^## .+$/gm) || [];
    return headings.map((heading, index) => {
      const title = heading.replace('## ', '');
      return `${index + 1}. ${title}`;
    }).join('\n');
  }

  /**
   * Extract key metrics from content
   */
  static extractMetrics(content) {
    const metrics = {
      wordCount: content.split(/\s+/).length,
      characterCount: content.length,
      sectionCount: (content.match(/^## /gm) || []).length,
      estimatedReadTime: Math.ceil(content.split(/\s+/).length / 200) // 200 words per minute
    };

    return metrics;
  }
}