import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    // For demo purposes, we'll use a test user ID
    const userId = 'demo_user';

    const { businessIdea, grant, proposalModes } = await request.json();

    // Validate required fields
    if (!businessIdea || !proposalModes || proposalModes.length === 0) {
      return NextResponse.json(
        { error: 'Business idea and proposal modes are required' },
        { status: 400 }
      );
    }

    // Get user profile data from business idea or use defaults
    const userProfile = {
      firstName: businessIdea.ownerFirstName || 'Business',
      lastName: businessIdea.ownerLastName || 'Owner',
      email: businessIdea.ownerEmail || 'owner@business.com',
      username: businessIdea.ownerUsername || 'business_owner'
    };

    // Use the actual business idea data passed to the API
    const selectedBusinessIdea = {
      id: businessIdea.id || 'user-idea',
      businessName: businessIdea.businessName || businessIdea.business_name,
      industry: businessIdea.industry,
      targetMarket: businessIdea.targetMarket,
      problemSolved: businessIdea.problemSolved,
      businessModel: businessIdea.businessModel,
      competitiveAdvantage: businessIdea.competitiveAdvantage,
      businessAddress: businessIdea.businessAddress || {
        street: 'User Address',
        city: 'User City',
        state: 'User State',
        zipCode: 'User ZIP'
      },
      yearsInBusiness: businessIdea.yearsInBusiness || 'New',
      businessStage: businessIdea.businessStage || 'startup',
      teamSize: businessIdea.teamSize || '1 founder',
      fundingStatus: businessIdea.fundingStatus || 'Seeking Funding',
      revenueGoals: businessIdea.revenueGoals || {
        monthly: 'Not specified',
        yearly: 'Not specified'
      },
      marketingChannels: businessIdea.marketingChannels || ['Digital Marketing']
    };

    // Create comprehensive business plan content
    const businessPlanContent = `
BUSINESS PROFILE:
Business Name: ${selectedBusinessIdea.businessName}
Owner: ${userProfile.firstName} ${userProfile.lastName}
Email: ${userProfile.email}
Business Address: ${selectedBusinessIdea.businessAddress.street}, ${selectedBusinessIdea.businessAddress.city}, ${selectedBusinessIdea.businessAddress.state} ${selectedBusinessIdea.businessAddress.zipCode}
Industry: ${selectedBusinessIdea.industry}
Years in Business: ${selectedBusinessIdea.yearsInBusiness}
Business Stage: ${selectedBusinessIdea.businessStage}
Team Size: ${selectedBusinessIdea.teamSize}

BUSINESS OVERVIEW:
Problem Solved: ${selectedBusinessIdea.problemSolved}
Target Market: ${selectedBusinessIdea.targetMarket}
Business Model: ${selectedBusinessIdea.businessModel}
Competitive Advantage: ${selectedBusinessIdea.competitiveAdvantage}

FINANCIAL INFORMATION:
Monthly Revenue Goal: ${selectedBusinessIdea.revenueGoals?.monthly || 'Not specified'}
Yearly Revenue Goal: ${selectedBusinessIdea.revenueGoals?.yearly || 'Not specified'}
Funding Status: ${selectedBusinessIdea.fundingStatus}

MARKETING & OPERATIONS:
Marketing Channels: ${selectedBusinessIdea.marketingChannels.join(', ')}
    `.trim();

    // Generate proposals for each mode
    const proposals = [];
    for (const mode of proposalModes) {
      const proposal = await generateProposalForMode(mode, businessPlanContent, userId, userProfile, selectedBusinessIdea);
      proposals.push(proposal);
    }

    // Don't save to documents automatically - just return for preview
    // User can choose to save later via "Save to Documents" button
    const savedProposals = [];

    const response = {
      success: true,
      proposals: savedProposals,
      generatedContent: proposals.map(p => p.content),
      generatedProposals: proposals, // Include full proposal data for saving later
      count: savedProposals.length
    };


    return NextResponse.json(response);

  } catch (error) {
    console.error('Proposals generate route error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate proposals',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

async function generateProposalForMode(mode, businessPlanContent, userId, userProfile, businessIdea) {
  const templates = {
    'Bank': {
      title: 'Bank Loan Application',
      description: 'Professional bank loan application based on your business plan',
      filename: 'bank_loan_application.md'
    },
    'Investor': {
      title: 'Investor Pitch Presentation',
      description: 'Comprehensive investor pitch presentation',
      filename: 'investor_pitch.md'
    },
    'Loan': {
      title: 'General Loan Application',
      description: 'General loan application document',
      filename: 'loan_application.md'
    },
    'Match a Grant': {
      title: 'Grant Proposal Match',
      description: 'Grant proposal matched to available opportunities',
      filename: 'grant_proposal.md'
    }
  };

  const template = templates[mode] || templates['Loan'];

  let content;

  try {
    // Enhanced system prompt based on proposal type - designed to expand sparse inputs into professional letters
    const systemPrompts = {
      'Bank': `You are an expert business loan specialist and professional writer. Your task is to transform any input—even minimal or informal notes—into a compelling, comprehensive bank loan application.

CRITICAL REQUIREMENTS:
- Expand sparse information into detailed, professional prose
- Infer reasonable business details that align with the provided information
- Use sophisticated business language and formal structure
- Include specific financial projections, collateral details, and risk mitigation
- Address banker concerns about creditworthiness and repayment ability
- Create a narrative that demonstrates deep business understanding
- Transform bullet points into flowing paragraphs
- Add professional context and industry insights
- Ensure the letter reads as if written by an experienced business owner`,

      'Investor': `You are a seasoned investment banker and business strategist. Transform any input into a polished, compelling investor pitch that could secure funding from sophisticated investors.

CRITICAL REQUIREMENTS:
- Elevate basic ideas into comprehensive investment opportunities
- Expand on market size, competitive landscape, and growth potential
- Create detailed financial models and scaling strategies
- Use investor-focused language emphasizing ROI and exit strategies
- Infer market dynamics and competitive advantages from limited input
- Structure content for maximum investor appeal
- Transform casual descriptions into professional investment narratives
- Add strategic insights and market analysis
- Ensure the pitch demonstrates thorough market understanding`,

      'Loan': `You are a professional loan consultant with decades of experience crafting successful loan applications. Transform any input—from rough notes to basic ideas—into a comprehensive, persuasive loan application.

CRITICAL REQUIREMENTS:
- Expand minimal information into detailed business narratives
- Create professional loan documentation that meets lender standards
- Infer reasonable business operations and financial details
- Use formal business communication style throughout
- Address standard lender requirements and concerns
- Transform incomplete thoughts into complete business cases
- Add industry context and market justification
- Ensure the application demonstrates business viability and planning`,

      'Match a Grant': `You are an expert grant writer with a track record of securing millions in grant funding. Transform any input into a professional, detailed grant proposal that aligns perfectly with grant objectives.

CRITICAL REQUIREMENTS:
- Expand basic business concepts into compelling grant-worthy projects
- Create detailed project descriptions with clear social/economic impact
- Infer and articulate community benefits and outcomes
- Use grant-specific language emphasizing measurable results
- Transform simple ideas into comprehensive project proposals
- Add detailed implementation timelines and success metrics
- Ensure alignment with typical grant funding priorities
- Create professional narratives that demonstrate grant readiness`
    };

    // Enhanced user prompt designed to handle sparse inputs and generate professional content
    const userPrompt = `Transform the following business information into a comprehensive, professional ${template.title}. Even if the input seems minimal or informal, expand it into a polished, detailed document that could be submitted to actual lenders/investors.

BUSINESS OWNER INFORMATION:
Name: ${userProfile.firstName} ${userProfile.lastName}
Email: ${userProfile.email}

BUSINESS INFORMATION PROVIDED:
${businessPlanContent}

TRANSFORMATION REQUIREMENTS:
1. EXPAND SPARSE DETAILS: If information seems basic, infer and add reasonable professional details that align with the business concept
2. PROFESSIONAL LANGUAGE: Transform any casual language into sophisticated business terminology
3. COMPREHENSIVE STRUCTURE: Create a complete ${template.title.toLowerCase()} with all standard sections, even if you need to infer some details
4. FINANCIAL DEPTH: Expand basic revenue goals into detailed financial projections with supporting rationale
5. MARKET INTELLIGENCE: Add relevant market context and industry insights that support the business case
6. RISK MITIGATION: Address potential concerns proactively with specific mitigation strategies
7. COMPELLING NARRATIVE: Create a story that demonstrates deep business understanding and planning
8. PROFESSIONAL FORMATTING: Use formal business document structure with clear sections and headers
9. LENGTH AND DETAIL: Aim for 1500-2000 words with substantive content in each section
10. CREDIBILITY: Write as if created by an experienced business owner with professional advisors

CRITICAL: If the provided business information is minimal, you must intelligently expand it while staying true to the core concept. Add reasonable assumptions about operations, market position, competitive advantages, and financial planning that would be expected for this type of business.

Business Name: ${businessIdea.businessName}
Document Type: ${template.title}
Industry Context: ${businessIdea.industry}

Create a document that could actually be submitted for funding consideration.`;

    // Use OpenAI to generate professional proposal content with enhanced parameters
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompts[mode] || systemPrompts['Loan']
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      max_tokens: 4000, // Increased for more comprehensive content
      temperature: 0.3, // Lower temperature for more consistent, professional output
      presence_penalty: 0.1, // Slight penalty to reduce repetition
      frequency_penalty: 0.1, // Encourage varied language
    });

    content = completion.choices[0]?.message?.content || `# ${template.title}

**Prepared for:** ${userProfile.firstName} ${userProfile.lastName}
**Business:** ${businessIdea.businessName}
**Date:** ${new Date().toLocaleDateString()}
**Contact:** ${userProfile.email}

---

## Executive Summary

Dear ${userProfile.firstName} ${userProfile.lastName},

This ${template.title.toLowerCase()} for ${businessIdea.businessName} presents a compelling opportunity for funding based on your comprehensive business profile. Your business demonstrates strong market potential in the ${businessIdea.industry} sector, experienced leadership, and a clear path to profitability.

**Business Address:** ${businessIdea.businessAddress.street}, ${businessIdea.businessAddress.city}, ${businessIdea.businessAddress.state} ${businessIdea.businessAddress.zipCode}

## Business Overview

**Company Profile:**
${businessIdea.businessName} addresses a critical market need: ${businessIdea.problemSolved}

**Target Market:** ${businessIdea.targetMarket}

**Business Model:** ${businessIdea.businessModel}

**Competitive Advantage:** ${businessIdea.competitiveAdvantage}

**Business Stage:** ${businessIdea.businessStage} (${businessIdea.yearsInBusiness} years in operation)

## Financial Requirements & Projections

Based on your business goals, ${userProfile.firstName}, we project:

- **Monthly Revenue Target:** ${businessIdea.revenueGoals?.monthly || 'Not specified'}
- **Annual Revenue Target:** ${businessIdea.revenueGoals?.yearly || 'Not specified'}
- **Current Funding Status:** ${businessIdea.fundingStatus}
- **Requested Amount:** $250,000
- **Use of Funds:** Working capital, equipment, and growth initiatives
- **Repayment Terms:** 36-60 months

## Market Analysis

Your target market in the ${businessIdea.industry} industry shows significant growth potential. The market demand for solutions addressing "${businessIdea.problemSolved}" continues to grow, creating favorable conditions for ${businessIdea.businessName}'s expansion.

## Management & Operations

**Team Structure:** ${businessIdea.teamSize}
**Marketing Strategy:** Utilizing ${businessIdea.marketingChannels.join(', ')}

## Risk Assessment & Mitigation

We have identified key business risks and developed comprehensive mitigation strategies to protect investor/lender interests and ensure business continuity for ${businessIdea.businessName}.

## Conclusion

This ${template.title.toLowerCase()} for ${businessIdea.businessName} represents a strategic investment opportunity. ${userProfile.firstName} ${userProfile.lastName} and the team are committed to transparent communication, responsible financial management, and delivering on projected outcomes.

We appreciate your consideration of this proposal and look forward to discussing how this funding will accelerate ${businessIdea.businessName}'s growth in the ${businessIdea.industry} market.

**Sincerely,**
${userProfile.firstName} ${userProfile.lastName}
Founder/CEO, ${businessIdea.businessName}
${userProfile.email}

---

*Generated on: ${new Date().toLocaleDateString()}*
*Proposal Type: ${template.title}*
*Business: ${businessIdea.businessName}*
`;
  } catch (openaiError) {
    console.error('OpenAI API Error:', openaiError);

    // Enhanced fallback template with personalization
    content = `# ${template.title}

**Prepared for:** ${userProfile.firstName} ${userProfile.lastName}
**Business:** ${businessIdea.businessName}
**Date:** ${new Date().toLocaleDateString()}
**Contact:** ${userProfile.email}

---

## Executive Summary

Dear ${userProfile.firstName} ${userProfile.lastName},

This ${template.title.toLowerCase()} for ${businessIdea.businessName} presents a compelling opportunity for funding. Your business demonstrates strong market potential in the ${businessIdea.industry} sector, experienced leadership, and a clear path to profitability.

## Business Overview

**Company Information:**
- **Business Name:** ${businessIdea.businessName}
- **Owner:** ${userProfile.firstName} ${userProfile.lastName}
- **Industry:** ${businessIdea.industry}
- **Business Stage:** ${businessIdea.businessStage}
- **Address:** ${businessIdea.businessAddress.street}, ${businessIdea.businessAddress.city}, ${businessIdea.businessAddress.state} ${businessIdea.businessAddress.zipCode}

**Business Description:**
${businessIdea.problemSolved}

**Target Market:** ${businessIdea.targetMarket}

**Business Model:** ${businessIdea.businessModel}

## Financial Requirements

- **Monthly Revenue Goal:** ${businessIdea.revenueGoals?.monthly || 'Not specified'}
- **Annual Revenue Goal:** ${businessIdea.revenueGoals?.yearly || 'Not specified'}
- **Current Funding Status:** ${businessIdea.fundingStatus}
- **Requested Amount:** $250,000
- **Use of Funds:** Working capital, equipment, and growth initiatives
- **Repayment Terms:** 36-60 months

## Team & Operations

**Team Size:** ${businessIdea.teamSize}
**Marketing Channels:** ${businessIdea.marketingChannels.join(', ')}

## Market Analysis

The ${businessIdea.industry} market shows significant growth potential with strong demand for solutions like those offered by ${businessIdea.businessName}.

**Competitive Advantage:** ${businessIdea.competitiveAdvantage}

## Conclusion

This ${template.title.toLowerCase()} for ${businessIdea.businessName} represents a solid business opportunity with strong growth potential. ${userProfile.firstName} ${userProfile.lastName} and the team are committed to achieving the projected financial goals and delivering value to stakeholders.

**Contact Information:**
${userProfile.firstName} ${userProfile.lastName}
${userProfile.email}
${businessIdea.businessName}

---

*Generated on: ${new Date().toLocaleDateString()}*
*Proposal Type: ${template.title}*
*Note: Generated using enhanced template*
`;
  }

  return {
    ...template,
    content,
    mode,
    businessName: businessIdea.businessName,
    ownerName: `${userProfile.firstName} ${userProfile.lastName}`,
    email: userProfile.email
  };
}