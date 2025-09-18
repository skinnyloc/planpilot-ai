import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(req, res) {
  try {
    // For demo purposes, we'll use a mock user ID since we don't have auth setup
    const userId = 'demo-user';

    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({
        error: 'Filename and contentType are required'
      });
    }

    // Validate file type
    if (contentType !== 'application/pdf') {
      return res.status(400).json({
        error: 'Only PDF files are allowed'
      });
    }

    // Generate unique key
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${userId}/${timestamp}_${sanitizedFilename}`;

    // Create the put object command
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // Generate signed URL (expires in 5 minutes)
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });

    return res.json({
      success: true,
      signedUrl,
      key,
      filename: sanitizedFilename
    });

  } catch (error) {
    console.error('R2 sign upload error:', error);
    return res.status(500).json({
      error: 'Failed to generate upload URL',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}