// Test R2 storage connection
import { S3Client, ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

console.log('🔍 Testing R2 Storage connection...');

// Configure S3 client for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function testR2Connection() {
  try {
    console.log('\n📊 R2 Configuration:');
    console.log('Account ID:', process.env.R2_ACCOUNT_ID || 'NOT SET');
    console.log('Endpoint:', process.env.R2_ENDPOINT || 'NOT SET');
    console.log('Bucket:', process.env.R2_BUCKET_NAME || 'NOT SET');
    console.log('Access Key:', process.env.R2_ACCESS_KEY_ID?.substring(0, 8) + '...' || 'NOT SET');
    console.log('Secret Key:', process.env.R2_SECRET_ACCESS_KEY?.substring(0, 8) + '...' || 'NOT SET');

    // Test listing buckets
    console.log('\n🗂️ Testing bucket access...');
    const listCommand = new ListBucketsCommand({});
    const buckets = await r2Client.send(listCommand);

    console.log('✅ R2 connection successful!');
    console.log('Available buckets:', buckets.Buckets?.map(b => b.Name).join(', ') || 'none');

    // Test uploading a small test file
    console.log('\n📤 Testing file upload...');
    const testContent = 'This is a test file uploaded to R2 storage';
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: 'test/connection-test.txt',
      Body: testContent,
      ContentType: 'text/plain',
    });

    await r2Client.send(uploadCommand);
    console.log('✅ File upload successful!');

    console.log('\n🎉 R2 Storage connection test complete - ALL WORKING!');

  } catch (error) {
    console.error('❌ R2 Storage connection failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testR2Connection();