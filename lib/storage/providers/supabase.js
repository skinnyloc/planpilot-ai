/**
 * Supabase Storage Provider
 *
 * Implements the StorageProvider interface for Supabase Storage.
 * Handles file uploads, downloads, deletions with proper error handling.
 */

import { StorageProvider } from '../index.js';
import { supabase, supabaseAdmin } from '../../supabase.js';

export class SupabaseStorageProvider extends StorageProvider {
  constructor() {
    super();
    this.bucketName = 'documents';
    this.client = supabase;
    this.adminClient = supabaseAdmin;
  }

  /**
   * Upload a file to Supabase Storage
   * @param {string} path - File path in storage
   * @param {File|Buffer} file - File to upload
   * @param {Object} options - Upload options
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async upload(path, file, options = {}) {
    try {
      const uploadOptions = {
        contentType: options.contentType || file.type,
        metadata: options.metadata || {},
        upsert: options.upsert || false
      };

      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .upload(path, file, uploadOptions);

      if (error) {
        console.error('Supabase upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL for the uploaded file
      const { data: urlData } = this.client.storage
        .from(this.bucketName)
        .getPublicUrl(path);

      return {
        success: true,
        url: urlData.publicUrl,
        path: data.path,
        fullPath: data.fullPath
      };
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download a file from Supabase Storage
   * @param {string} path - File path in storage
   * @returns {Promise<{success: boolean, data?: any, url?: string, error?: string}>}
   */
  async download(path) {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .download(path);

      if (error) {
        console.error('Supabase download error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Download error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a file from Supabase Storage
   * @param {string} path - File path in storage
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async delete(path) {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        console.error('Supabase delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List files in a directory
   * @param {string} path - Directory path
   * @param {Object} options - List options
   * @returns {Promise<{success: boolean, files?: Array, error?: string}>}
   */
  async list(path, options = {}) {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .list(path, {
          limit: options.limit || 100,
          offset: options.offset || 0,
          sortBy: options.sortBy || { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Supabase list error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, files: data };
    } catch (error) {
      console.error('List error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a public URL for a file
   * @param {string} path - File path in storage
   * @param {Object} options - URL options
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async getPublicUrl(path, options = {}) {
    try {
      const { data } = this.client.storage
        .from(this.bucketName)
        .getPublicUrl(path, {
          transform: options.transform
        });

      return { success: true, url: data.publicUrl };
    } catch (error) {
      console.error('Get public URL error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a signed URL for private file access
   * @param {string} path - File path in storage
   * @param {Object} options - Signed URL options (expiry, etc.)
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async getSignedUrl(path, options = {}) {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .createSignedUrl(path, options.expiresIn || 3600, {
          download: options.download || false,
          transform: options.transform
        });

      if (error) {
        console.error('Supabase signed URL error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, url: data.signedUrl };
    } catch (error) {
      console.error('Get signed URL error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get file information
   * @param {string} path - File path in storage
   * @returns {Promise<{success: boolean, info?: Object, error?: string}>}
   */
  async getFileInfo(path) {
    try {
      // List the specific file to get its info
      const pathParts = path.split('/');
      const fileName = pathParts.pop();
      const directory = pathParts.join('/') || '';

      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .list(directory, {
          search: fileName,
          limit: 1
        });

      if (error) {
        console.error('Supabase file info error:', error);
        return { success: false, error: error.message };
      }

      const fileInfo = data && data.length > 0 ? data[0] : null;
      if (!fileInfo) {
        return { success: false, error: 'File not found' };
      }

      return { success: true, info: fileInfo };
    } catch (error) {
      console.error('Get file info error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Move/rename a file
   * @param {string} fromPath - Current file path
   * @param {string} toPath - New file path
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async move(fromPath, toPath) {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .move(fromPath, toPath);

      if (error) {
        console.error('Supabase move error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Move error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Copy a file
   * @param {string} fromPath - Source file path
   * @param {string} toPath - Destination file path
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async copy(fromPath, toPath) {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .copy(fromPath, toPath);

      if (error) {
        console.error('Supabase copy error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Copy error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if bucket exists and is accessible
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async healthCheck() {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .list('', { limit: 1 });

      if (error) {
        console.error('Supabase health check error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Health check error:', error);
      return { success: false, error: error.message };
    }
  }
}

/*
TODO: CLOUDFLARE R2 MIGRATION - Example R2 Provider Structure

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class R2StorageProvider extends StorageProvider {
  constructor(config) {
    super();
    this.client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });
    this.bucketName = config.bucketName;
  }

  async upload(path, file, options = {}) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: path,
      Body: file,
      ContentType: options.contentType,
      Metadata: options.metadata
    });

    try {
      await this.client.send(command);
      const publicUrl = `${this.endpoint}/${this.bucketName}/${path}`;
      return { success: true, url: publicUrl };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ... implement other methods similarly
}

*/