export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { fileUrl } = await request.json();

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'File URL is required' },
        { status: 400 }
      );
    }

    // For now, we'll simulate business plan analysis
    // In a real implementation, you would:
    // 1. Download the file from the URL
    // 2. Extract text from PDF/Word documents
    // 3. Use OpenAI to analyze the extracted text

    const analysisPrompt = `
      Analyze this business plan and extract the following key information:
      - Business name
      - Industry/sector
      - Funding amount needed
      - Business location
      - Business stage (startup, growth, expansion, etc.)
      - Target market description
      - Key products/services
      - Competitive advantages

      Please provide structured data that can be used for grant matching.
    `;

    // Simulate analysis for demo purposes
    // In production, you would use the actual file content
    const mockExtractedData = {
      businessName: 'TechStart Solutions',
      industry: 'Technology / Software',
      fundingAmount: '$250,000',
      location: 'San Francisco, CA',
      businessStage: 'Early-stage startup',
      targetMarket: 'Small to medium businesses looking for digital transformation solutions',
      keyProducts: ['Cloud-based CRM platform', 'Business analytics dashboard'],
      competitiveAdvantages: ['AI-powered insights', 'Affordable pricing', 'Easy integration'],
    };

    // TODO: Implement actual file processing and OpenAI analysis
    // const response = await openai.chat.completions.create({
    //   model: 'gpt-4',
    //   messages: [
    //     {
    //       role: 'system',
    //       content: 'You are an expert business analyst. Extract key information from business plans for grant matching purposes.'
    //     },
    //     {
    //       role: 'user',
    //       content: `${analysisPrompt}\n\nBusiness Plan Content:\n${extractedText}`
    //     }
    //   ],
    //   temperature: 0.3,
    // });

    return NextResponse.json({
      success: true,
      extractedData: mockExtractedData,
      message: 'Business plan analyzed successfully',
    });

  } catch (error) {
    console.error('Business plan analysis error:', error);

    return NextResponse.json(
      {
        error: 'Failed to analyze business plan',
        details: error.message
      },
      { status: 500 }
    );
  }
}