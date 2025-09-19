import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    console.log('🚀 Starting proposal generation...');
    const { type, businessPlan, proposalType, modes, selectedGrant, pdfAnalysis, source, key, documentId } = await request.json();
    console.log('📝 Request body received');

    // Validate required fields
    if (!type || !businessPlan) {
      console.error('❌ Missing required fields:', { type, businessPlan: !!businessPlan });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type and businessPlan are required'
      }, { status: 400 });
    }

    // Use modes array if provided, otherwise fall back to single proposalType
    const proposalModes = modes && modes.length > 0 ? modes : [proposalType];

    if (!proposalModes || proposalModes.length === 0) {
      console.error('❌ No proposal modes specified');
      return NextResponse.json({
        success: false,
        error: 'At least one proposal mode must be specified'
      }, { status: 400 });
    }

    // For grant_match type, ensure grant is provided
    if (proposalModes.includes('grant_match') && !selectedGrant) {
      console.error('❌ Grant required for grant_match type');
      return NextResponse.json({
        success: false,
        error: 'Grant information is required for grant proposal matching'
      }, { status: 400 });
    }

    console.log('✅ Validation passed, generating proposals for modes:', proposalModes);

    // Generate proposals for each selected mode
    const generatedProposals = [];
    const documentIds = [];

    for (const mode of proposalModes) {
      try {
        console.log(`🔄 Generating ${mode} proposal...`);

        // Use selectedGrant for grant_match mode, null for others
        const grantInfo = mode === 'grant_match' ? selectedGrant : null;

        // Generate proposal using AI (temporarily using mock for demo)
        const proposalContent = await generateProposalWithAI(mode, businessPlan, grantInfo, pdfAnalysis);
        console.log(`✅ ${mode} proposal generated successfully`);

        // Save the generated proposal to database - skip for production demo
        let savedDocumentId = null;
        try {
          const saveResult = await saveProposalToDatabase(proposalContent, mode, grantInfo);
          savedDocumentId = saveResult.documentId;
          documentIds.push(savedDocumentId);
          console.log(`✅ ${mode} proposal saved to database with ID:`, savedDocumentId);
        } catch (saveError) {
          console.error(`⚠️ Failed to save ${mode} proposal to database:`, saveError.message);
          // Create a mock document ID for demo
          savedDocumentId = `demo-${mode}-${Date.now()}`;
          documentIds.push(savedDocumentId);
        }

        generatedProposals.push({
          mode,
          content: proposalContent,
          grant: grantInfo,
          documentId: savedDocumentId
        });

      } catch (modeError) {
        console.error(`❌ Failed to generate ${mode} proposal:`, modeError.message);
        // Continue with other modes even if one fails
        generatedProposals.push({
          mode,
          error: modeError.message,
          grant: mode === 'grant_match' ? selectedGrant : null
        });
      }
    }

    return NextResponse.json({
      success: true,
      proposals: generatedProposals,
      metadata: {
        modes: proposalModes,
        selectedGrant: selectedGrant || null,
        source,
        pdfAnalysis: !!pdfAnalysis,
        generatedAt: new Date().toISOString(),
        totalProposals: generatedProposals.length
      },
      documentIds
    });

  } catch (error) {
    console.error('💥 Proposal generation error:', error);

    // Provide specific error messages based on error type
    let errorMessage = 'Failed to generate proposal';
    let statusCode = 500;

    if (error.message.includes('API key')) {
      errorMessage = 'OpenAI API configuration error';
      statusCode = 503;
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'API rate limit exceeded. Please try again in a few minutes.';
      statusCode = 429;
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      errorMessage = 'Network error. Please check your connection and try again.';
      statusCode = 503;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: statusCode });
  }
}

async function generateProposalWithAI(proposalType, businessPlan, grant, pdfAnalysis) {
  try {
    console.log('🤖 Generating proposal (using mock for demo)...');

    // Mock AI response for demo purposes
    const proposalTitle = PROPOSAL_TYPES[proposalType] || proposalType;
    const grantInfo = grant ? `for ${grant.title}` : '';

    // Use PDF analysis data if available for richer content
    const analysisInfo = pdfAnalysis ? `

## PDF Analysis Summary

${pdfAnalysis.planText.substring(0, 500)}...

Based on the comprehensive analysis of the uploaded business plan document, this ${proposalTitle.toLowerCase()} is strategically positioned for success.` : '';

    const mockContent = `# ${proposalTitle} ${grantInfo}${analysisInfo}

## Executive Summary

Based on the provided business plan, this ${proposalTitle.toLowerCase()} presents a compelling opportunity for funding. Our business demonstrates strong market potential, experienced leadership, and a clear path to profitability.

## Business Overview

The business plan outlines a comprehensive strategy with well-defined market opportunities and competitive advantages. Our company is positioned to capitalize on emerging trends and deliver exceptional value to customers.

## Financial Requirements

- Requested Amount: $250,000
- Use of Funds: Working capital, equipment, and growth initiatives
- Repayment Terms: 36-60 months (if applicable)
- Expected ROI: 25% annually

## Market Analysis

Our target market shows significant growth potential with strong demand for our products/services. Market research indicates favorable conditions for business expansion and revenue growth.

## Management Team

Our experienced leadership team brings together the necessary skills and expertise to execute this business plan successfully and ensure responsible use of funds.

## Financial Projections

- Year 1 Revenue: $500,000
- Year 2 Revenue: $750,000
- Year 3 Revenue: $1,000,000
- Break-even: Month 18
- ROI: 25% annually

## Implementation Timeline

Q1: Initial setup and team expansion
Q2: Product development and market entry
Q3: Marketing and customer acquisition
Q4: Scale operations and expand market reach

## Risk Assessment

We have identified key business risks and developed comprehensive mitigation strategies to protect investor interests and ensure business continuity.

## Conclusion

This ${proposalTitle.toLowerCase()} represents a well-researched, low-risk, high-return opportunity. We are committed to transparent communication, responsible financial management, and delivering on our projected outcomes.

---

Generated on: ${new Date().toLocaleDateString()}
Proposal Type: ${proposalTitle}
${grant ? `Grant: ${grant.title}` : ''}`;

    console.log('📥 Mock proposal generated');

    if (!mockContent || mockContent.trim().length === 0) {
      throw new Error('Generated content is empty');
    }

    return mockContent;

  } catch (error) {
    console.error('🚨 Proposal generation error:', error);
    throw new Error(`Proposal generation error: ${error.message}`);
  }
}

const PROPOSAL_TYPES = {
  grant_match: 'Grant Proposal',
  bank_loan: 'Bank Loan Application',
  investor_pitch: 'Investor Pitch',
  general_loan: 'General Loan Application'
};

async function saveProposalToDatabase(content, proposalType, grant) {
  try {
    const title = grant ?
      `${PROPOSAL_TYPES[proposalType]} - ${grant.title}` :
      PROPOSAL_TYPES[proposalType];

    // Skip database save for production demo - return mock ID
    console.log('✅ Mock proposal saved (database save skipped for production demo)');
    console.log('📝 Proposal content length:', content.length);
    console.log('📄 Title:', title);

    return { documentId: 'demo-doc-' + Date.now() };
  } catch (error) {
    console.error('Database save error:', error);
    throw error;
  }
}