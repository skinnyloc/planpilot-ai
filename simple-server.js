import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors({
  origin: 'http://localhost:5174',
  credentials: true
}));
app.use(express.json());

// Test route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    openai: !!process.env.OPENAI_API_KEY
  });
});

// Proposal generation route
app.post('/api/generate-proposal', async (req, res) => {
  try {
    console.log('🚀 Starting proposal generation...');
    const { type, businessPlan, proposalType, grant } = req.body;
    console.log('📝 Request received for type:', proposalType);

    // Validate required fields
    if (!type || !businessPlan || !proposalType) {
      console.error('❌ Missing required fields');
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

    // Create the prompt based on proposal type
    let systemPrompt = `You are a professional business writer with expertise in creating compelling proposals and applications. Generate clear, professional, and persuasive content that maximizes approval chances.`;

    let userPrompt = `Based on the following business plan, create a professional ${getProposalTypeLabel(proposalType)} proposal:

BUSINESS PLAN:
${businessPlan}

`;

    if (proposalType === 'grant_match' && grant) {
      userPrompt += `GRANT INFORMATION:
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

      userPrompt += typeInstructions[proposalType] || 'Create a professional proposal document.';
    }

    userPrompt += `

FORMAT REQUIREMENTS:
- Use professional business language
- Include clear headings and sections
- Make it comprehensive but concise
- Focus on key selling points and benefits
- End with a strong call to action

Generate a complete, professional proposal document that maximizes approval chances.`;

    console.log('🤖 Calling OpenAI API...');

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    const content = response.choices[0].message.content;
    console.log('✅ Proposal generated successfully');

    return res.json({
      success: true,
      content,
      metadata: {
        proposalType,
        grant: proposalType === 'grant_match' ? grant : null,
        generatedAt: new Date().toISOString(),
        wordCount: content.split(' ').length
      }
    });

  } catch (error) {
    console.error('💥 Proposal generation error:', error);

    let errorMessage = 'Failed to generate proposal';
    let statusCode = 500;

    if (error.code === 'insufficient_quota') {
      errorMessage = 'OpenAI API quota exceeded. Please check your billing.';
      statusCode = 402;
    } else if (error.code === 'invalid_api_key') {
      errorMessage = 'Invalid OpenAI API key configuration.';
      statusCode = 503;
    } else if (error.code === 'rate_limit_exceeded') {
      errorMessage = 'OpenAI rate limit exceeded. Please try again later.';
      statusCode = 429;
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

function getProposalTypeLabel(proposalType) {
  const labels = {
    grant_match: 'Grant Proposal',
    bank_loan: 'Bank Loan Application',
    investor_pitch: 'Investor Pitch',
    general_loan: 'General Loan Application'
  };
  return labels[proposalType] || proposalType;
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`🤖 OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
});

export default app;