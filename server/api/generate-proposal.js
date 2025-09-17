import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req, res) {
  try {
    console.log('🚀 Starting proposal generation...');
    const { type, businessPlan, proposalType, grant } = req.body;
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));

    // Validate required fields
    if (!type || !businessPlan || !proposalType) {
      console.error('❌ Missing required fields:', { type, businessPlan: !!businessPlan, proposalType });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, businessPlan, and proposalType are required'
      });
    }

    // For grant_match type, ensure grant is provided
    if (proposalType === 'grant_match' && !grant) {
      console.error('❌ Grant required for grant_match type');
      return res.status(400).json({
        success: false,
        error: 'Grant information is required for grant proposal matching'
      });
    }

    console.log('✅ Validation passed, generating proposal...');

    // Generate proposal using OpenAI
    const proposalContent = await generateProposalWithAI(proposalType, businessPlan, grant);
    console.log('✅ Proposal generated successfully');

    // Save the generated proposal to database
    let documentId = null;
    try {
      const saveResult = await saveProposalToDatabase(proposalContent, proposalType, grant);
      documentId = saveResult.documentId;
      console.log('✅ Proposal saved to database with ID:', documentId);
    } catch (saveError) {
      console.error('⚠️ Failed to save to database, continuing anyway:', saveError.message);
    }

    return res.json({
      success: true,
      content: proposalContent,
      metadata: {
        proposalType,
        grant: proposalType === 'grant_match' ? grant : null,
        generatedAt: new Date().toISOString(),
        wordCount: proposalContent.split(' ').length
      },
      documentId
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

async function generateProposalWithAI(proposalType, businessPlan, grant) {
  try {
    console.log('🤖 Calling OpenAI API...');

    const systemPrompt = getSystemPrompt(proposalType);
    const userPrompt = getUserPrompt(proposalType, businessPlan, grant);

    console.log('📤 System prompt length:', systemPrompt.length);
    console.log('📤 User prompt length:', userPrompt.length);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use the more cost-effective model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    console.log('📥 OpenAI response received');
    const content = response.choices[0].message.content;

    if (!content || content.trim().length === 0) {
      throw new Error('OpenAI returned empty content');
    }

    return content;

  } catch (error) {
    console.error('🚨 OpenAI API error:', error);

    if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded. Please check your billing.');
    } else if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key configuration.');
    } else if (error.code === 'rate_limit_exceeded') {
      throw new Error('OpenAI rate limit exceeded. Please try again later.');
    } else {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
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
        title,
        content,
        type: 'proposal',
        metadata: {
          proposalType,
          grant: grant || null,
          generatedAt: new Date().toISOString(),
          wordCount: content.split(' ').length
        },
        user_id: 'system' // This should be replaced with actual user ID from auth
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