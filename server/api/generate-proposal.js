import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// OpenAI is commented out for demo - we use mock responses

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req, res) {
  try {
    console.log('🚀 Starting proposal generation...');
    const { type, businessPlan, proposalType, modes, selectedGrant, pdfAnalysis, source, key, documentId } = req.body;
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));

    // Validate required fields
    if (!type || !businessPlan) {
      console.error('❌ Missing required fields:', { type, businessPlan: !!businessPlan });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type and businessPlan are required'
      });
    }

    // Use modes array if provided, otherwise fall back to single proposalType
    const proposalModes = modes && modes.length > 0 ? modes : [proposalType];

    if (!proposalModes || proposalModes.length === 0) {
      console.error('❌ No proposal modes specified');
      return res.status(400).json({
        success: false,
        error: 'At least one proposal mode must be specified'
      });
    }

    // For grant_match type, ensure grant is provided
    if (proposalModes.includes('grant_match') && !selectedGrant) {
      console.error('❌ Grant required for grant_match type');
      return res.status(400).json({
        success: false,
        error: 'Grant information is required for grant proposal matching'
      });
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

        // Save the generated proposal to database
        let savedDocumentId = null;
        try {
          const saveResult = await saveProposalToDatabase(proposalContent, mode, grantInfo);
          savedDocumentId = saveResult.documentId;
          documentIds.push(savedDocumentId);
          console.log(`✅ ${mode} proposal saved to database with ID:`, savedDocumentId);
        } catch (saveError) {
          console.error(`⚠️ Failed to save ${mode} proposal to database:`, saveError.message);
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

    return res.json({
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

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

function getSystemPrompt(proposalType) {
  const basePrompt = `You are a professional business writer with expertise in creating compelling proposals and applications. Generate clear, professional, and persuasive content that maximizes approval chances.`;

  const typeSpecificPrompts = {
    grant_match: `${basePrompt}

You specialize in grant writing and have successfully helped businesses secure millions in grant funding. Your proposals are known for:
- Perfect alignment with grant requirements
- Compelling narratives that highlight impact
- Professional structure and formatting
- Clear demonstration of value proposition
- Strong evidence of capability and track record`,

    bank_loan: `${basePrompt}

You specialize in bank loan applications and understand what financial institutions look for:
- Strong financial projections and creditworthiness
- Clear repayment plans and business viability
- Professional presentation of business case
- Risk mitigation strategies
- Collateral and security information`,

    investor_pitch: `${basePrompt}

You specialize in investor presentations and understand what attracts investment:
- Compelling market opportunity and business model
- Strong management team and execution capability
- Clear path to profitability and growth
- Competitive advantages and differentiation
- Attractive return on investment potential`,

    general_loan: `${basePrompt}

You specialize in general loan applications across various institutions:
- Adaptable content for different lender types
- Strong business case and financial planning
- Professional presentation and documentation
- Clear purpose and use of funds
- Demonstrated ability to repay`
  };

  return typeSpecificPrompts[proposalType] || basePrompt;
}

function getUserPrompt(proposalType, businessPlan, grant) {
  let prompt = `Based on the following business plan, create a professional ${PROPOSAL_TYPES[proposalType] || proposalType} proposal:

BUSINESS PLAN:
${businessPlan}

`;

  if (proposalType === 'grant_match' && grant) {
    prompt += `GRANT INFORMATION:
- Title: ${grant.title}
- Agency: ${grant.agency}
- Amount: ${grant.amount}
- Requirements: ${grant.requirements?.join(', ') || 'Not specified'}
- Description: ${grant.description}

Create a grant proposal that specifically addresses the grant requirements and demonstrates how this business aligns with the grant's objectives.`;
  } else {
    const typeInstructions = {
      bank_loan: 'Create a bank loan application that emphasizes financial stability, repayment capability, and business viability. Include financial projections and risk mitigation.',
      investor_pitch: 'Create an investor pitch that highlights market opportunity, growth potential, competitive advantages, and return on investment. Focus on scalability and profitability.',
      general_loan: 'Create a general loan application that presents a strong business case, clear use of funds, and demonstrated repayment ability. Keep it professional and comprehensive.'
    };

    prompt += typeInstructions[proposalType] || 'Create a professional proposal document.';
  }

  prompt += `

FORMAT REQUIREMENTS:
- Use professional business language
- Include clear headings and sections
- Make it comprehensive but concise
- Focus on key selling points and benefits
- End with a strong call to action

Generate a complete, professional proposal document that maximizes approval chances.`;

  return prompt;
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

    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: 'demo-user', // Use demo user ID
        filename: title,
        file_path: `proposals/demo-user/${Date.now()}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.md`,
        document_type: 'proposal',
        description: `Generated ${PROPOSAL_TYPES[proposalType]}`,
        file_size: content.length,
        mime_type: 'text/markdown',
        metadata: {
          proposalType,
          grant: grant || null,
          generatedAt: new Date().toISOString(),
          wordCount: content.split(' ').length
        }
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database save error: ${error.message}`);
    }

    return { documentId: data.id };
  } catch (error) {
    console.error('Database save error:', error);
    throw error;
  }
}