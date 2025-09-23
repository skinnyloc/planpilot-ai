import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

// Debug logging
console.log('R2 Configuration Check:');
console.log('- R2_BUCKET env var:', process.env.R2_BUCKET);
console.log('- BUCKET_NAME resolved:', BUCKET_NAME);
console.log('- R2_ENDPOINT:', process.env.R2_ENDPOINT);
console.log('- R2_ACCESS_KEY_ID exists:', !!process.env.R2_ACCESS_KEY_ID);

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

    const { filename, contentType, folder = 'uploads' } = await request.json();

    // Validate required fields
    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'Filename and contentType are required' },
        { status: 400 }
      );
    }

    // Validate R2 configuration
    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !BUCKET_NAME) {
      console.error('R2 configuration missing:');
      console.error('- R2_ENDPOINT:', !!process.env.R2_ENDPOINT);
      console.error('- R2_ACCESS_KEY_ID:', !!process.env.R2_ACCESS_KEY_ID);
      console.error('- R2_SECRET_ACCESS_KEY:', !!process.env.R2_SECRET_ACCESS_KEY);
      console.error('- BUCKET_NAME:', BUCKET_NAME);
      return NextResponse.json(
        { error: 'Storage service not configured properly' },
        { status: 500 }
      );
    }

    // Generate unique key with user folder structure
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${userId}/${timestamp}_${sanitizedFilename}`;

    // Create signed upload URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    return NextResponse.json({
      success: true,
      uploadUrl,
      key,
      bucket: BUCKET_NAME
    });

  } catch (error) {
    console.error('R2 sign upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate upload URL',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}