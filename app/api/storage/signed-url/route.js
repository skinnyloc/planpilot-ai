import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * R2 Storage API Route for Signed URL Generation
 * Handles storage operations server-side to protect credentials
 */

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

    const { action, key, contentType, expiresIn = 3600 } = await request.json();

    // Validate required fields
    if (!action || !key) {
      return NextResponse.json(
        { error: 'Action and key are required' },
        { status: 400 }
      );
    }

    // Validate R2 configuration
    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      console.error('R2 credentials not configured');
      return NextResponse.json(
        { error: 'Storage service not configured' },
        { status: 500 }
      );
    }

    let command;
    let signedUrl;

    switch (action) {
      case 'upload':
        if (!contentType) {
          return NextResponse.json(
            { error: 'contentType is required for upload' },
            { status: 400 }
          );
        }
        command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          ContentType: contentType,
        });
        signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
        break;

      case 'download':
        command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        });
        signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
        break;

      case 'delete':
        command = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        });
        signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: upload, download, or delete' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      signedUrl,
      key,
      action,
      expiresIn
    });

  } catch (error) {
    console.error('Storage signed URL error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate signed URL',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Direct upload endpoint
export async function PUT(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const key = formData.get('key');

    if (!file || !key) {
      return NextResponse.json(
        { error: 'File and key are required' },
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

    const buffer = Buffer.from(await file.arrayBuffer());

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await r2Client.send(command);

    return NextResponse.json({
      success: true,
      key,
      size: buffer.length,
      contentType: file.type
    });

  } catch (error) {
    console.error('Direct upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  try {
    const configured = !!(process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
    return NextResponse.json({
      healthy: configured,
      service: 'R2 Storage API',
      bucket: BUCKET_NAME
    });
  } catch (error) {
    return NextResponse.json({ healthy: false, error: error.message });
  }
}