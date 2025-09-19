/**
 * AI-Powered Proposal Generation Service
 * Generates tailored grant proposals based on business plan data and grant requirements
 */

export async function generateTailoredProposal(grant, businessData, customizations) {
  try {
    // Call our API to generate the proposal using OpenAI
    const response = await fetch('/api/generate-proposal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant,
        businessData,
        customizations
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate proposal');
    }

    const result = await response.json();
    return result.proposal;

  } catch (error) {
    console.error('Proposal generation failed:', error);

    // Return a fallback proposal structure
    return generateFallbackProposal(grant, businessData, customizations);
  }
}

/**
 * Generate a fallback proposal when AI service is unavailable
 */
function generateFallbackProposal(grant, businessData, customizations) {
  const sections = [];

  // Executive Summary
  sections.push({
    title: 'Executive Summary',
    content: `${businessData.businessName || 'Our Company'} is seeking ${grant.maxAmount ? `$${grant.maxAmount.toLocaleString()}` : 'funding'} through the ${grant.title} to ${getProjectObjective(grant, businessData)}.

Our ${businessData.industry || 'innovative'} business is positioned to ${getBusinessGoal(businessData)} and create significant impact in ${businessData.location || 'our target market'}.

Key highlights:
- ${businessData.businessStage || 'Growing'} business with strong market potential
- Experienced team with proven track record
- Clear path to commercialization and sustainability
- Alignment with grant objectives and community benefit`
  });

  // Project Description
  sections.push({
    title: 'Project Description',
    content: `This project will ${getProjectDescription(grant, businessData)}.

Objectives:
- Develop and implement ${businessData.keyProducts?.[0] || 'innovative solutions'}
- Create measurable impact in ${businessData.targetMarket || 'target markets'}
- Generate sustainable revenue and job opportunities
- Establish partnerships with key stakeholders

${customizations.emphasizeInnovation ? '\nInnovation Focus:\nOur approach leverages cutting-edge technology and innovative methodologies to deliver superior results and competitive advantages.' : ''}

${customizations.highlightImpact ? '\nCommunity Impact:\nThis project will create positive economic and social impact through job creation, community development, and increased local business activity.' : ''}`
  });

  // Financial Information
  if (customizations.includeFinancials) {
    sections.push({
      title: 'Financial Plan',
      content: `Budget Overview:
Total Project Cost: ${grant.maxAmount ? `$${grant.maxAmount.toLocaleString()}` : '$XXX,XXX'}
Grant Request: ${grant.maxAmount ? `$${grant.maxAmount.toLocaleString()}` : '$XXX,XXX'}

Budget Allocation:
- Personnel (40%): $${Math.round((grant.maxAmount || 100000) * 0.4).toLocaleString()}
- Equipment & Technology (25%): $${Math.round((grant.maxAmount || 100000) * 0.25).toLocaleString()}
- Operations & Marketing (20%): $${Math.round((grant.maxAmount || 100000) * 0.2).toLocaleString()}
- Administrative (10%): $${Math.round((grant.maxAmount || 100000) * 0.1).toLocaleString()}
- Contingency (5%): $${Math.round((grant.maxAmount || 100000) * 0.05).toLocaleString()}

Financial Projections:
Year 1 Revenue: $XXX,XXX
Year 2 Revenue: $XXX,XXX
Year 3 Revenue: $XXX,XXX

Return on Investment: XXX% over 3 years`
    });
  }

  // Timeline
  if (customizations.addTimeline) {
    sections.push({
      title: 'Project Timeline',
      content: `Phase 1 (Months 1-3): Planning & Setup
- Finalize project specifications
- Assemble project team
- Establish partnerships
- Begin initial development

Phase 2 (Months 4-8): Development & Implementation
- Core development activities
- Testing and validation
- Marketing preparation
- Staff training

Phase 3 (Months 9-12): Launch & Optimization
- Product/service launch
- Market entry activities
- Performance monitoring
- Optimization and scaling

Milestones:
- Month 3: Project setup complete
- Month 6: Development 50% complete
- Month 9: Beta testing complete
- Month 12: Full market launch`
    });
  }

  // Team Information
  if (customizations.includeTeam) {
    sections.push({
      title: 'Team & Qualifications',
      content: `Our experienced team brings together expertise in ${businessData.industry || 'multiple disciplines'} with a proven track record of success.

Key Team Members:
- Leadership Team: Experienced executives with industry expertise
- Technical Team: Skilled professionals with relevant qualifications
- Advisory Board: Industry experts and mentors

Qualifications:
- Combined XX+ years of industry experience
- Proven track record of successful projects
- Strong network of industry contacts
- Commitment to excellence and innovation`
    });
  }

  // Custom Focus Areas
  if (customizations.customFocus) {
    sections.push({
      title: 'Strategic Focus Areas',
      content: customizations.customFocus
    });
  }

  // Conclusion
  sections.push({
    title: 'Conclusion',
    content: `${businessData.businessName || 'Our company'} is uniquely positioned to successfully execute this project and deliver meaningful results. With strong alignment to the ${grant.title} objectives, experienced leadership, and a clear path to success, we respectfully request your consideration for funding.

This investment will not only advance our business goals but also contribute to broader economic development, job creation, and community benefit. We look forward to partnering with ${grant.agency} to achieve these shared objectives.

Thank you for your consideration. We are prepared to provide additional information as needed and look forward to discussing this opportunity further.`
  });

  return {
    title: `Grant Proposal: ${grant.title}`,
    grantId: grant.id,
    businessName: businessData.businessName,
    generatedAt: new Date().toISOString(),
    qualityScore: calculateQualityScore(sections, grant, businessData),
    strengths: identifyStrengths(grant, businessData, customizations),
    improvements: suggestImprovements(grant, businessData, customizations),
    sections,
    actionItems: generateActionItems(grant),
    estimatedCompletionTime: `${15 + (customizations.includeTeam ? 5 : 0) + (customizations.includeFinancials ? 5 : 0)} hours`
  };
}

function getProjectObjective(grant, businessData) {
  if (grant.tags?.includes('innovation')) {
    return 'advance innovative technology solutions and drive market transformation';
  }
  if (grant.tags?.includes('rural')) {
    return 'stimulate economic growth and create opportunities in rural communities';
  }
  if (grant.tags?.includes('clean-energy')) {
    return 'develop sustainable energy solutions and reduce environmental impact';
  }
  return 'expand operations, create jobs, and drive economic growth';
}

function getBusinessGoal(businessData) {
  if (businessData.businessStage?.includes('startup')) {
    return 'establish market presence and achieve sustainable growth';
  }
  if (businessData.businessStage?.includes('growth')) {
    return 'scale operations and expand market reach';
  }
  return 'advance our mission and create lasting value';
}

function getProjectDescription(grant, businessData) {
  const focus = grant.tags?.[0] || businessData.industry || 'business development';
  return `focus on ${focus} initiatives that align with grant objectives and deliver measurable outcomes`;
}

function calculateQualityScore(sections, grant, businessData) {
  let score = 60; // Base score

  // Add points for completeness
  if (sections.length >= 5) score += 10;
  if (businessData.businessName) score += 5;
  if (businessData.industry) score += 5;
  if (businessData.targetMarket) score += 5;

  // Add points for grant alignment
  if (grant.eligibility?.businessStage?.includes(businessData.businessStage)) score += 10;
  if (businessData.fundingAmount <= grant.maxAmount) score += 5;

  return Math.min(score, 100);
}

function identifyStrengths(grant, businessData, customizations) {
  const strengths = [];

  if (businessData.businessName) strengths.push('Clear business identity');
  if (businessData.industry) strengths.push('Defined industry focus');
  if (customizations.emphasizeInnovation) strengths.push('Innovation emphasis');
  if (customizations.includeFinancials) strengths.push('Financial planning');
  if (customizations.addTimeline) strengths.push('Detailed timeline');

  return strengths.length > 0 ? strengths : ['Professional presentation', 'Clear objectives'];
}

function suggestImprovements(grant, businessData, customizations) {
  const improvements = [];

  if (!businessData.targetMarket) improvements.push('Add target market analysis');
  if (!businessData.keyProducts?.length) improvements.push('Detail key products/services');
  if (!customizations.includeTeam) improvements.push('Include team qualifications');
  if (grant.competitiveness === 'high') improvements.push('Add competitive differentiation');

  return improvements;
}

function generateActionItems(grant) {
  return [
    'Review and customize the generated proposal content',
    'Add specific financial details and projections',
    'Include supporting documentation and appendices',
    'Have the proposal reviewed by subject matter experts',
    `Submit before the ${grant.deadline} deadline`,
    'Prepare for potential follow-up questions or presentations'
  ];
}