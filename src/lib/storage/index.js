/**
 * Storage Service Layer
 *
 * Provides an abstraction layer for file storage operations.
 * Currently supports Supabase Storage, designed for easy migration to Cloudflare R2.
 *
 * TODO: CLOUDFLARE R2 MIGRATION
 * 1. Create R2StorageProvider class implementing StorageProvider interface
 * 2. Add R2 configuration in environment variables:
 *    - CLOUDFLARE_R2_ACCESS_KEY_ID
 *    - CLOUDFLARE_R2_SECRET_ACCESS_KEY
 *    - CLOUDFLARE_R2_ENDPOINT
 *    - CLOUDFLARE_R2_BUCKET_NAME
 * 3. Update storage factory to conditionally use R2 provider
 * 4. Migrate existing files using batch migration script
 */

import { SupabaseStorageProvider } from './providers/supabase';

/**
 * Storage Provider Interface
 * All storage providers must implement these methods
 */
export class StorageProvider {
  /**
   * Upload a file to storage
   * @param {string} path - File path in storage
   * @param {File|Buffer} file - File to upload
   * @param {Object} options - Upload options
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async upload(path, file, options = {}) {
    throw new Error('upload method must be implemented');
  }

  /**
   * Download a file from storage
   * @param {string} path - File path in storage
   * @returns {Promise<{success: boolean, data?: any, url?: string, error?: string}>}
   */
  async download(path) {
    throw new Error('download method must be implemented');
  }

  /**
   * Delete a file from storage
   * @param {string} path - File path in storage
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async delete(path) {
    throw new Error('delete method must be implemented');
  }

  /**
   * List files in a directory
   * @param {string} path - Directory path
   * @param {Object} options - List options
   * @returns {Promise<{success: boolean, files?: Array, error?: string}>}
   */
  async list(path, options = {}) {
    throw new Error('list method must be implemented');
  }

  /**
   * Get a public URL for a file
   * @param {string} path - File path in storage
   * @param {Object} options - URL options
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async getPublicUrl(path, options = {}) {
    throw new Error('getPublicUrl method must be implemented');
  }

  /**
   * Get a signed URL for private file access
   * @param {string} path - File path in storage
   * @param {Object} options - Signed URL options (expiry, etc.)
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async getSignedUrl(path, options = {}) {
    throw new Error('getSignedUrl method must be implemented');
  }
}

/**
 * Storage Factory
 * Creates the appropriate storage provider based on configuration
 */
class StorageFactory {
  static createProvider() {
    const provider = process.env.STORAGE_PROVIDER || 'supabase';

    switch (provider.toLowerCase()) {
      case 'supabase':
        return new SupabaseStorageProvider();

      /* TODO: CLOUDFLARE R2 MIGRATION
      case 'r2':
      case 'cloudflare':
        return new R2StorageProvider({
          accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
          endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
          bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME
        });
      */

      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
  }
}

// Export singleton instance
export const storageService = StorageFactory.createProvider();

/**
 * Document Storage Service
 * High-level service for document operations with metadata handling
 */
export class DocumentStorageService {
  constructor(storageProvider) {
    this.storage = storageProvider;
  }

  /**
   * Upload a document with metadata
   * @param {string} userId - User ID
   * @param {File} file - File to upload
   * @param {Object} metadata - Document metadata
   * @returns {Promise<{success: boolean, document?: Object, error?: string}>}
   */
  async uploadDocument(userId, file, metadata = {}) {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate file path
      const timestamp = Date.now();
      const fileExtension = this.getFileExtension(file.name);
      const sanitizedName = this.sanitizeFilename(file.name);
      const filePath = `${userId}/${timestamp}-${sanitizedName}`;

      // Upload to storage
      const uploadResult = await this.storage.upload(filePath, file, {
        contentType: file.type,
        metadata: {
          userId,
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      });

      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error };
      }

      // Return document metadata structure
      const document = {
        user_id: userId,
        filename: `${timestamp}-${sanitizedName}`,
        original_filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        document_type: metadata.document_type || 'other',
        tags: metadata.tags || [],
        description: metadata.description || '',
        storage_url: uploadResult.url
      };

      return { success: true, document };
    } catch (error) {
      console.error('Error uploading document:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download a document
   * @param {string} filePath - File path in storage
   * @returns {Promise<{success: boolean, url?: string, data?: any, error?: string}>}
   */
  async downloadDocument(filePath) {
    try {
      return await this.storage.getSignedUrl(filePath, {
        expiresIn: 3600 // 1 hour
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a document from storage
   * @param {string} filePath - File path in storage
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteDocument(filePath) {
    try {
      return await this.storage.delete(filePath);
    } catch (error) {
      console.error('Error deleting document:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  validateFile(file) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/json'
    ];

    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 50MB limit' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported' };
    }

    return { valid: true };
  }

  /**
   * Sanitize filename for storage
   * @param {string} filename - Original filename
   * @returns {string} Sanitized filename
   */
  sanitizeFilename(filename) {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Get file extension
   * @param {string} filename - Filename
   * @returns {string} File extension
   */
  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }
}

// Export singleton document service
export const documentService = new DocumentStorageService(storageService);