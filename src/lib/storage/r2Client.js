import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Cloudflare R2 Storage Client
 * Provides secure file upload, download, and management capabilities
 */

class R2StorageClient {
  constructor() {
    this.client = null;
    this.bucketName = null;
    this.initialized = false;
    this.init();
  }

  init() {
    try {
      // Get environment variables
      const accountId = import.meta.env.R2_ACCOUNT_ID || import.meta.env.VITE_R2_ACCOUNT_ID;
      const accessKeyId = import.meta.env.R2_ACCESS_KEY_ID || import.meta.env.VITE_R2_ACCESS_KEY_ID;
      const secretAccessKey = import.meta.env.R2_SECRET_ACCESS_KEY || import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
      const bucketName = import.meta.env.R2_BUCKET_NAME || import.meta.env.VITE_R2_BUCKET_NAME;

      if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
        console.warn('R2 credentials not found. Document storage will be disabled.');
        return;
      }

      // Configure S3 client for Cloudflare R2
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      this.bucketName = bucketName;
      this.initialized = true;

      console.log('✅ R2 Storage client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize R2 client:', error);
    }
  }

  isInitialized() {
    return this.initialized;
  }

  /**
   * Generate a unique file key for R2 storage
   * @param {string} userId - User ID
   * @param {string} fileName - Original filename
   * @param {string} documentType - Type of document
   * @returns {string} Unique file key
   */
  generateFileKey(userId, fileName, documentType = 'general') {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    return `${documentType}/${userId}/${timestamp}-${randomSuffix}-${sanitizedFileName}`;
  }

  /**
   * Upload a file to R2 storage
   * @param {File} file - File to upload
   * @param {string} userId - User ID
   * @param {string} documentType - Type of document
   * @param {object} metadata - Additional metadata
   * @returns {Promise<object>} Upload result with file URL and key
   */
  async uploadFile(file, userId, documentType = 'general', metadata = {}) {
    if (!this.isInitialized()) {
      throw new Error('R2 client not initialized. Please configure R2 credentials.');
    }

    try {
      const fileKey = this.generateFileKey(userId, file.name, documentType);

      // Convert File to Buffer for upload
      const buffer = await file.arrayBuffer();

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: new Uint8Array(buffer),
        ContentType: file.type || 'application/octet-stream',
        ContentLength: file.size,
        Metadata: {
          'user-id': userId,
          'document-type': documentType,
          'original-filename': file.name,
          'upload-timestamp': new Date().toISOString(),
          ...metadata
        }
      });

      const result = await this.client.send(command);

      // Generate public URL (if needed) or keep private
      const fileUrl = `https://${this.bucketName}.r2.dev/${fileKey}`;

      return {
        success: true,
        fileKey,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        etag: result.ETag,
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          r2Response: result
        }
      };
    } catch (error) {
      console.error('R2 upload failed:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Generate a presigned URL for secure file download
   * @param {string} fileKey - R2 file key
   * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns {Promise<string>} Presigned download URL
   */
  async getDownloadUrl(fileKey, expiresIn = 3600) {
    if (!this.isInitialized()) {
      throw new Error('R2 client not initialized');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Failed to generate download URL:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  /**
   * Generate a presigned URL for direct file upload
   * @param {string} fileKey - R2 file key
   * @param {string} contentType - File content type
   * @param {number} expiresIn - URL expiration time in seconds (default: 15 minutes)
   * @returns {Promise<string>} Presigned upload URL
   */
  async getUploadUrl(fileKey, contentType, expiresIn = 900) {
    if (!this.isInitialized()) {
      throw new Error('R2 client not initialized');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        ContentType: contentType,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Failed to generate upload URL:', error);
      throw new Error(`Failed to generate upload URL: ${error.message}`);
    }
  }

  /**
   * Delete a file from R2 storage
   * @param {string} fileKey - R2 file key
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(fileKey) {
    if (!this.isInitialized()) {
      throw new Error('R2 client not initialized');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get file metadata from R2
   * @param {string} fileKey - R2 file key
   * @returns {Promise<object>} File metadata
   */
  async getFileMetadata(fileKey) {
    if (!this.isInitialized()) {
      throw new Error('R2 client not initialized');
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const result = await this.client.send(command);

      return {
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
        metadata: result.Metadata || {}
      };
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * List files for a user with optional filtering
   * @param {string} userId - User ID
   * @param {string} documentType - Document type filter (optional)
   * @param {number} maxKeys - Maximum number of keys to return
   * @returns {Promise<Array>} List of files
   */
  async listUserFiles(userId, documentType = null, maxKeys = 1000) {
    if (!this.isInitialized()) {
      throw new Error('R2 client not initialized');
    }

    try {
      const prefix = documentType ? `${documentType}/${userId}/` : `${userId}/`;

      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const result = await this.client.send(command);

      return (result.Contents || []).map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        etag: item.ETag
      }));
    } catch (error) {
      console.error('Failed to list files:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Calculate storage usage for a user
   * @param {string} userId - User ID
   * @returns {Promise<object>} Storage usage statistics
   */
  async getUserStorageUsage(userId) {
    if (!this.isInitialized()) {
      throw new Error('R2 client not initialized');
    }

    try {
      const files = await this.listUserFiles(userId);

      const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
      const totalFiles = files.length;

      return {
        totalFiles,
        totalSize, // bytes
        totalSizeMB: Math.round((totalSize / 1048576) * 100) / 100,
        files
      };
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      throw new Error(`Failed to calculate storage usage: ${error.message}`);
    }
  }

  /**
   * Bulk delete files
   * @param {Array<string>} fileKeys - Array of file keys to delete
   * @returns {Promise<object>} Deletion results
   */
  async bulkDeleteFiles(fileKeys) {
    if (!this.isInitialized()) {
      throw new Error('R2 client not initialized');
    }

    const results = {
      deleted: [],
      failed: []
    };

    for (const fileKey of fileKeys) {
      try {
        await this.deleteFile(fileKey);
        results.deleted.push(fileKey);
      } catch (error) {
        results.failed.push({ fileKey, error: error.message });
      }
    }

    return results;
  }
}

// Export singleton instance
export const r2Storage = new R2StorageClient();

// Export class for testing or multiple instances
export { R2StorageClient };