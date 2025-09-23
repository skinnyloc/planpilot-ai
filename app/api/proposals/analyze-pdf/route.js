import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { auth } from '@clerk/nextjs/server';

// Configure R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET || 'planpolitai';

export async function POST(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🔍 PDF Analysis API called');

    const { key } = await request.json();

    console.log('📄 Analyzing PDF with key:', key, 'for user:', userId);

    // Validate required fields
    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      );
    }

    try {
      // Skip R2 download for production demo - use mock analysis
      console.log('🎭 Using mock PDF analysis for demo');

      // Mock PDF text extraction for demo
      const mockExtractedText = `
        Business Plan Summary

        Executive Summary:
        This business plan outlines a comprehensive strategy for a innovative technology startup focused on delivering cutting-edge solutions to the market. Our company aims to address significant market gaps through proprietary technology and exceptional customer service.

        Market Analysis:
        The target market shows strong growth potential with an estimated TAM of $2.5 billion and growing at 15% annually. Key competitors include established players, but our unique value proposition provides significant competitive advantages.

        Financial Projections:
        - Year 1 Revenue: $500,000
        - Year 2 Revenue: $1,200,000
        - Year 3 Revenue: $2,800,000
        - Break-even: Month 18
        - Funding Required: $1,000,000

        Team:
        Our founding team brings together over 20 years of combined experience in technology, business development, and operations.

        Products/Services:
        Core offering includes proprietary software solutions with recurring subscription revenue model. Additional revenue streams from professional services and consulting.

        Marketing Strategy:
        Multi-channel approach including digital marketing, strategic partnerships, and direct sales. Focus on customer acquisition and retention through exceptional value delivery.

        Operations Plan:
        Scalable operational model with key partnerships for manufacturing and distribution. Quality control processes ensure consistent product delivery.

        Risk Analysis:
        Key risks include market competition, technology challenges, and regulatory changes. Comprehensive mitigation strategies address each identified risk factor.
      `;

      // Trim content to fit within token limits (approximately 1000 words)
      const words = mockExtractedText.trim().split(/\s+/);
      const truncatedText = words.slice(0, 1000).join(' ');

      return NextResponse.json({
        success: true,
        planText: truncatedText,
        wordCount: words.length,
        truncated: words.length > 1000
      });

    } catch (error) {
      console.error('PDF analysis error:', error);
      return NextResponse.json(
        { error: 'Failed to analyze PDF content' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('PDF analyze route error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze PDF',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}