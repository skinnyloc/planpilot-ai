export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "placeholder",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

export async function POST(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { type, businessPlan, proposalType, modes, selectedGrant, pdfAnalysis, source, key, documentId } = await request.json();

    // Validate required fields
    if (!type || !businessPlan) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type and businessPlan are required'
      }, { status: 400 });
    }

    // Use modes array if provided, otherwise fall back to single proposalType
    const proposalModes = modes && modes.length > 0 ? modes : [proposalType];

    if (!proposalModes || proposalModes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one proposal mode must be specified'
      }, { status: 400 });
    }

    // For grant_match type, ensure grant is provided
    if (proposalModes.includes('grant_match') && !selectedGrant) {
      return NextResponse.json({
        success: false,
        error: 'Grant information is required for grant proposal matching'
      }, { status: 400 });
    }

    // Generate proposals for each selected mode
    const generatedProposals = [];
    const documentIds = [];

    for (const mode of proposalModes) {
      try {
        // Use selectedGrant for grant_match mode, null for others
        const grantInfo = mode === 'grant_match' ? selectedGrant : null;

        // Generate proposal using AI
        const proposalContent = await generateProposalWithAI(mode, businessPlan, grantInfo, pdfAnalysis);

        // Save the generated proposal to database
        let savedDocumentId = null;
        try {
          const saveResult = await saveProposalToDatabase(proposalContent, mode, grantInfo, userId);
          savedDocumentId = saveResult.documentId;
          documentIds.push(savedDocumentId);
        } catch (saveError) {
          // Create a temporary document ID if save fails
          savedDocumentId = `temp-${mode}-${Date.now()}`;
          documentIds.push(savedDocumentId);
        }

        generatedProposals.push({
          mode,
          content: proposalContent,
          grant: grantInfo,
          documentId: savedDocumentId
        });

      } catch (modeError) {
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
    // Provide specific error messages based on error type
    let errorMessage = 'Failed to generate proposal';
    let statusCode = 500;

    if (error.message.includes('API key')) {
      errorMessage = 'AI service configuration error';
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
      error: errorMessage
    }, { status: statusCode });
  }
}

async function generateProposalWithAI(proposalType, businessPlan, grant, pdfAnalysis) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('AI service not configured');
    }

    const proposalTitle = PROPOSAL_TYPES[proposalType] || proposalType;
    const grantInfo = grant ? `for ${grant.title}: ${grant.description}` : '';

    // Build comprehensive prompt
    let systemMessage = `You are an expert business consultant and proposal writer. Generate a professional, detailed ${proposalTitle.toLowerCase()} that is compelling and well-structured.`;

    let userPrompt = `Create a comprehensive ${proposalTitle} ${grantInfo}

Business Plan Context:
${businessPlan}

${pdfAnalysis ? `Additional Analysis:
${pdfAnalysis.planText}` : ''}

${grant ? `Grant Requirements:
- Title: ${grant.title}
- Agency: ${grant.agency}
- Description: ${grant.description}
- Eligibility: ${grant.eligibility_criteria || 'Standard business eligibility'}
- Amount: ${grant.funding_amount || 'Variable'}

Tailor the proposal specifically to this grant's requirements.` : ''}

Generate a professional proposal with these sections:
1. Executive Summary
2. Business Overview
3. ${grant ? 'Grant Alignment & Impact' : 'Financial Requirements'}
4. Market Analysis
5. Management Team
6. Financial Projections
7. Implementation Timeline
8. Risk Assessment
9. Conclusion

Make it compelling, specific, and actionable.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('AI service unavailable');
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No content generated');
    }

    const content = data.choices[0].message.content;

    if (!content || content.trim().length === 0) {
      throw new Error('Generated content is empty');
    }

    return content;

  } catch (error) {
    throw new Error(`Proposal generation error: ${error.message}`);
  }
}

const PROPOSAL_TYPES = {
  grant_match: 'Grant Proposal',
  bank_loan: 'Bank Loan Application',
  investor_pitch: 'Investor Pitch',
  general_loan: 'General Loan Application'
};

async function saveProposalToDatabase(content, proposalType, grant, userId) {
  try {
    const title = grant ?
      `${PROPOSAL_TYPES[proposalType]} - ${grant.title}` :
      PROPOSAL_TYPES[proposalType];

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Return a temporary ID if database not configured
      return { documentId: 'temp-' + Date.now() };
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        title: title,
        document_type: proposalType,
        content: content,
        storage_key: `proposals/${userId}/${Date.now()}-${proposalType}.md`,
        file_size: content.length,
        mime_type: 'text/markdown',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return { documentId: data.id };
  } catch (error) {
    throw error;
  }
}