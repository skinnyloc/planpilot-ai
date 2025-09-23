export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limiting: 5 requests per minute per user
    const rateLimitResult = rateLimit(userId, 5, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before making another request.',
          resetTime: rateLimitResult.resetTime
        },
        { status: 429 }
      );
    }

    const { prompt, type, maxTokens = 3500, temperature = 0.7 } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    let systemMessage = 'You are an expert business consultant and writer. Generate professional, detailed, and actionable business content.';

    if (type === 'business-plan') {
      systemMessage = 'You are an expert business consultant specializing in business plan creation. Generate comprehensive, professional business plans with detailed market analysis, financial projections, and strategic recommendations. Structure your response with clear headings and actionable insights.';
    } else if (type === 'grant-proposal') {
      systemMessage = 'You are an expert grant writer with extensive experience in securing funding. Create compelling, data-driven grant proposals that demonstrate clear impact, organizational capacity, and project viability. Focus on persuasive language and specific outcomes.';
    }

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

    return NextResponse.json({ healthy: true, service: 'AI Generation API' });
  } catch (error) {
    return NextResponse.json({ healthy: false, error: 'Service unavailable' });
  }
}