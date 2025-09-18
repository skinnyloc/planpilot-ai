import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { auth } from '@clerk/nextjs';

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
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { key } = await request.json();

    // Validate required fields
    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      );
    }

    // Validate R2 configuration
    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'Storage service not configured' },
        { status: 500 }
      );
    }

    try {
      // Get signed download URL for the PDF
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

      // Download the PDF content
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      const pdfBuffer = await response.arrayBuffer();

      // For now, we'll simulate PDF text extraction
      // In a real implementation, you would use a library like pdf-parse or pdf2pic
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