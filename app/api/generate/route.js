import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { prompt, type = 'general' } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Validate API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Build system message based on type
    let systemMessage = 'You are an expert business consultant and writer. Generate professional, detailed, and actionable business content.';

    if (type === 'business-plan') {
      systemMessage = 'You are an expert business consultant specializing in business plan creation. Generate comprehensive, professional business plans with detailed market analysis, financial projections, and strategic recommendations.';
    } else if (type === 'grant-proposal') {
      systemMessage = 'You are an expert grant writer with extensive experience in securing funding. Create compelling, data-driven grant proposals that demonstrate clear impact, organizational capacity, and project viability.';
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
        max_tokens: 3500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      );
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      return NextResponse.json(
        { error: 'No content generated' },
        { status: 500 }
      );
    }

    const content = data.choices[0].message.content;

    return NextResponse.json({
      success: true,
      content,
      usage: data.usage,
      model: data.model
    });

  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ healthy: false, error: 'API key not configured' });
    }

    return NextResponse.json({ healthy: true, service: 'Content Generation API' });
  } catch (error) {
    return NextResponse.json({ healthy: false, error: error.message });
  }
}