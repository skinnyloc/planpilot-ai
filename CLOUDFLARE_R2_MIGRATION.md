# Cloudflare R2 Migration Guide

This document provides a complete roadmap for migrating from Supabase Storage to Cloudflare R2. The current codebase is already structured to support this migration with minimal changes.

## Why Migrate to Cloudflare R2?

- **Lower Costs**: R2 has no egress fees and competitive storage pricing
- **Better Performance**: Global edge network with lower latency
- **S3 Compatibility**: Uses standard S3 API for easy migration
- **Scalability**: Designed for large-scale applications

## Migration Plan Overview

### Phase 1: Setup and Configuration
1. Create Cloudflare R2 bucket
2. Configure environment variables
3. Install necessary dependencies
4. Create R2 storage provider

### Phase 2: Code Implementation
1. Implement R2StorageProvider class
2. Update storage factory configuration
3. Add migration utilities

### Phase 3: Data Migration
1. Create migration script
2. Test migration process
3. Verify data integrity

### Phase 4: Production Deployment
1. Update environment variables
2. Deploy new code
3. Monitor migration progress

## Detailed Implementation Steps

### Step 1: Cloudflare R2 Setup

1. **Create R2 Bucket**
   - Log into Cloudflare dashboard
   - Navigate to R2 Object Storage
   - Create new bucket: `yourapp-documents`
   - Configure CORS settings if needed

2. **Generate API Credentials**
   - Go to "Manage R2 API tokens"
   - Create token with Object Storage permissions
   - Note down Access Key ID and Secret Access Key

3. **Environment Variables**
   Add to `.env.local`:
   ```env
   # Cloudflare R2 Configuration
   CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key
   CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
   CLOUDFLARE_R2_BUCKET_NAME=yourapp-documents
   CLOUDFLARE_R2_PUBLIC_URL=https://your-custom-domain.com

   # Migration Settings
   STORAGE_PROVIDER=r2  # Change from 'supabase' to 'r2'
   MIGRATION_MODE=true  # Enable during migration
   ```

### Step 2: Install Dependencies

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Step 3: Create R2 Storage Provider

Create `src/lib/storage/providers/r2.js`:

```javascript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider } from '../index.js';

export class R2StorageProvider extends StorageProvider {
  constructor() {
    super();

    this.client = new S3Client({
      region: 'auto', // R2 uses 'auto' region
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
      }
    });

    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  }

  async upload(path, file, options = {}) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: path,
        Body: file,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: options.metadata || {}
      });

      await this.client.send(command);

      const publicUrl = this.publicUrl
        ? \`\${this.publicUrl}/\${path}\`
        : \`\${process.env.CLOUDFLARE_R2_ENDPOINT}/\${this.bucketName}/\${path}\`;

      return {
        success: true,
        url: publicUrl,
        path: path
      };
    } catch (error) {
      console.error('R2 upload error:', error);
      return { success: false, error: error.message };
    }
  }

  async download(path) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: path
      });

      const response = await this.client.send(command);
      return { success: true, data: response.Body };
    } catch (error) {
      console.error('R2 download error:', error);
      return { success: false, error: error.message };
    }
  }

  async delete(path) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: path
      });

      await this.client.send(command);
      return { success: true };
    } catch (error) {
      console.error('R2 delete error:', error);
      return { success: false, error: error.message };
    }
  }

  async list(path, options = {}) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: path,
        MaxKeys: options.limit || 100
      });

      const response = await this.client.send(command);

      const files = (response.Contents || []).map(object => ({
        name: object.Key.split('/').pop(),
        path: object.Key,
        size: object.Size,
        lastModified: object.LastModified,
        etag: object.ETag
      }));

      return { success: true, files };
    } catch (error) {
      console.error('R2 list error:', error);
      return { success: false, error: error.message };
    }
  }

  async getPublicUrl(path, options = {}) {
    try {
      const publicUrl = this.publicUrl
        ? \`\${this.publicUrl}/\${path}\`
        : \`\${process.env.CLOUDFLARE_R2_ENDPOINT}/\${this.bucketName}/\${path}\`;

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('R2 public URL error:', error);
      return { success: false, error: error.message };
    }
  }

  async getSignedUrl(path, options = {}) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: path
      });

      const signedUrl = await getSignedUrl(this.client, command, {
        expiresIn: options.expiresIn || 3600
      });

      return { success: true, url: signedUrl };
    } catch (error) {
      console.error('R2 signed URL error:', error);
      return { success: false, error: error.message };
    }
  }

  async healthCheck() {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        MaxKeys: 1
      });

      await this.client.send(command);
      return { success: true };
    } catch (error) {
      console.error('R2 health check error:', error);
      return { success: false, error: error.message };
    }
  }
}
```

### Step 4: Update Storage Factory

Update `src/lib/storage/index.js`:

```javascript
// Add R2 import
import { R2StorageProvider } from './providers/r2.js';

// Update StorageFactory.createProvider()
class StorageFactory {
  static createProvider() {
    const provider = process.env.STORAGE_PROVIDER || 'supabase';

    switch (provider.toLowerCase()) {
      case 'supabase':
        return new SupabaseStorageProvider();

      case 'r2':
      case 'cloudflare':
        return new R2StorageProvider();

      default:
        throw new Error(\`Unsupported storage provider: \${provider}\`);
    }
  }
}
```

### Step 5: Create Migration Script

Create `scripts/migrate-to-r2.js`:

```javascript
#!/usr/bin/env node

import { supabase } from '../src/lib/supabase.js';
import { R2StorageProvider } from '../src/lib/storage/providers/r2.js';
import { SupabaseStorageProvider } from '../src/lib/storage/providers/supabase.js';

async function migrateDocumentsToR2() {
  console.log('Starting migration to Cloudflare R2...');

  const supabaseStorage = new SupabaseStorageProvider();
  const r2Storage = new R2StorageProvider();

  // Get all documents from database
  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching documents:', error);
    process.exit(1);
  }

  console.log(\`Found \${documents.length} documents to migrate\`);

  let successCount = 0;
  let errorCount = 0;

  for (const doc of documents) {
    try {
      console.log(\`Migrating: \${doc.original_filename}\`);

      // Download from Supabase
      const downloadResult = await supabaseStorage.download(doc.file_path);
      if (!downloadResult.success) {
        throw new Error(\`Download failed: \${downloadResult.error}\`);
      }

      // Upload to R2
      const uploadResult = await r2Storage.upload(
        doc.file_path,
        downloadResult.data,
        {
          contentType: doc.mime_type,
          metadata: {
            originalName: doc.original_filename,
            userId: doc.user_id,
            documentType: doc.document_type
          }
        }
      );

      if (!uploadResult.success) {
        throw new Error(\`Upload failed: \${uploadResult.error}\`);
      }

      console.log(\`✓ Migrated: \${doc.original_filename}\`);
      successCount++;

    } catch (error) {
      console.error(\`✗ Failed to migrate \${doc.original_filename}:\`, error.message);
      errorCount++;
    }
  }

  console.log(\`\nMigration completed:\`);
  console.log(\`✓ Success: \${successCount} documents\`);
  console.log(\`✗ Failed: \${errorCount} documents\`);
}

// Health check
async function healthCheck() {
  console.log('Performing health check...');

  const r2Storage = new R2StorageProvider();
  const healthResult = await r2Storage.healthCheck();

  if (!healthResult.success) {
    console.error('R2 health check failed:', healthResult.error);
    process.exit(1);
  }

  console.log('✓ R2 connection healthy');
}

async function main() {
  await healthCheck();
  await migrateDocumentsToR2();
}

main().catch(console.error);
```

### Step 6: Update Package.json

Add migration script:

```json
{
  "scripts": {
    "migrate-to-r2": "node scripts/migrate-to-r2.js",
    "migrate-check": "node scripts/migration-check.js"
  }
}
```

### Step 7: Create Migration Verification Script

Create `scripts/migration-check.js`:

```javascript
#!/usr/bin/env node

import { supabase } from '../src/lib/supabase.js';
import { R2StorageProvider } from '../src/lib/storage/providers/r2.js';

async function verifyMigration() {
  console.log('Verifying migration...');

  const r2Storage = new R2StorageProvider();

  // Get all documents from database
  const { data: documents, error } = await supabase
    .from('documents')
    .select('*');

  if (error) {
    console.error('Error fetching documents:', error);
    process.exit(1);
  }

  let verifiedCount = 0;
  let missingCount = 0;

  for (const doc of documents) {
    try {
      // Check if file exists in R2
      const result = await r2Storage.getSignedUrl(doc.file_path);

      if (result.success) {
        verifiedCount++;
        console.log(\`✓ Verified: \${doc.original_filename}\`);
      } else {
        missingCount++;
        console.log(\`✗ Missing: \${doc.original_filename}\`);
      }
    } catch (error) {
      missingCount++;
      console.error(\`✗ Error checking \${doc.original_filename}:\`, error.message);
    }
  }

  console.log(\`\nVerification completed:\`);
  console.log(\`✓ Verified: \${verifiedCount} documents\`);
  console.log(\`✗ Missing: \${missingCount} documents\`);

  if (missingCount === 0) {
    console.log('🎉 All documents successfully migrated!');
  } else {
    console.log('⚠️  Some documents may need to be re-migrated');
  }
}

verifyMigration().catch(console.error);
```

## Migration Process

### Pre-Migration Checklist

- [ ] Backup all existing documents
- [ ] Test R2 configuration in development
- [ ] Verify API credentials work
- [ ] Test upload/download functionality
- [ ] Check CORS settings if using browser uploads

### Migration Steps

1. **Prepare Environment**
   ```bash
   # Install dependencies
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

   # Set up environment variables
   cp .env.local .env.local.backup
   # Add R2 configuration to .env.local
   ```

2. **Test R2 Connection**
   ```bash
   npm run migrate-check
   ```

3. **Run Migration**
   ```bash
   npm run migrate-to-r2
   ```

4. **Verify Migration**
   ```bash
   npm run migrate-check
   ```

5. **Switch to R2**
   ```bash
   # Update .env.local
   STORAGE_PROVIDER=r2

   # Deploy application
   npm run build
   ```

### Post-Migration Tasks

- [ ] Monitor application logs for errors
- [ ] Test file uploads and downloads
- [ ] Verify all document operations work
- [ ] Update monitoring and alerts
- [ ] Clean up old Supabase storage (after verification period)

## Rollback Plan

If migration fails or issues occur:

1. **Immediate Rollback**
   ```bash
   # Restore previous environment
   mv .env.local.backup .env.local

   # Redeploy application
   npm run build
   ```

2. **Data Verification**
   - Verify all documents accessible in Supabase
   - Check database integrity
   - Test all functionality

## Cost Comparison

### Supabase Storage
- Storage: $0.021/GB/month
- Egress: $0.09/GB

### Cloudflare R2
- Storage: $0.015/GB/month
- Egress: $0.00/GB (no egress fees)
- Class A Operations: $4.50/million
- Class B Operations: $0.36/million

## Performance Benefits

- **Global CDN**: Files served from nearest edge location
- **Lower Latency**: Reduced download times
- **Better Throughput**: Optimized for high-volume applications
- **No Egress Fees**: Significant cost savings for high-traffic apps

## Monitoring and Alerts

Set up monitoring for:
- Upload success rates
- Download latencies
- Error rates
- Storage costs
- API usage

## Support and Troubleshooting

Common issues and solutions:
- CORS configuration for browser uploads
- API rate limits and handling
- Signed URL expiration management
- Error handling and retries

This migration guide provides a complete roadmap for transitioning to Cloudflare R2 while maintaining system stability and data integrity.