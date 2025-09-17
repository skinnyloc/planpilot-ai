import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    console.log('🚀 Test API called');
    const body = await request.json();
    console.log('📝 Request body:', JSON.stringify(body, null, 2));

    // Simple validation
    if (!body.businessPlan) {
      return NextResponse.json(
        { success: false, error: 'Business plan is required' },
        { status: 400 }
      );
    }

    console.log('✅ Starting OpenAI test...');

    // Simple OpenAI call
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Create a short business proposal based on this business plan: ${body.businessPlan}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    console.log('✅ OpenAI response received');

    return NextResponse.json({
      success: true,
      content,
      test: true
    });

  } catch (error) {
    console.error('💥 Test API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code || 'unknown'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Test API is working',
    timestamp: new Date().toISOString()
  });
}