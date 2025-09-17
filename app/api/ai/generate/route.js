import { NextResponse } from 'next/server';

/**
 * OpenAI API Route for AI Content Generation
 * Handles all AI operations server-side to protect API keys
 */
export async function POST(request) {
  try {
    const { prompt, type, maxTokens = 3500, temperature = 0.7, userId } = await request.json();

    // Validate required fields
    if (!prompt || !userId) {
      return NextResponse.json(
        { error: 'Prompt and userId are required' },
        { status: 400 }
      );
    }

    // Validate API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Build the system message based on type
    let systemMessage = 'You are an expert business consultant and writer. Generate professional, detailed, and actionable business content.';

    if (type === 'business-plan') {
      systemMessage = `You are an expert business consultant specializing in business plan creation. Generate comprehensive, professional business plans with detailed market analysis, financial projections, and strategic recommendations. Structure your response with clear headings and actionable insights.`;
    } else if (type === 'grant-proposal') {
      systemMessage = `You are an expert grant writer with extensive experience in securing funding. Create compelling, data-driven grant proposals that demonstrate clear impact, organizational capacity, and project viability. Focus on persuasive language and specific outcomes.`;
    }

    // Make request to OpenAI
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
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait a moment and try again.' },
          { status: 429 }
        );
      } else if (response.status === 401) {
        return NextResponse.json(
          { error: 'AI service authentication failed' },
          { status: 500 }
        );
      } else {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable' },
          { status: 503 }
        );
      }
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      return NextResponse.json(
        { error: 'No content generated' },
        { status: 500 }
      );
    }

    const content = data.choices[0].message.content;
    const usage = data.usage;

    return NextResponse.json({
      success: true,
      content,
      usage: {
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0
      },
      model: data.model
    });

  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate content',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ healthy: false, error: 'API key not configured' });
    }

    return NextResponse.json({ healthy: true, service: 'AI Generation API' });
  } catch (error) {
    return NextResponse.json({ healthy: false, error: error.message });
  }
}