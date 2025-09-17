import { supabase } from '../supabase.js';
import { r2Storage } from '../storage/r2Client.js';

/**
 * Document Service
 * Handles document operations with R2 storage and Supabase metadata
 */

/**
 * Upload a document with full metadata tracking
 * @param {File} file - File to upload
 * @param {string} userId - User ID
 * @param {object} metadata - Document metadata
 * @returns {Promise<object>} Created document record
 */
export async function uploadDocument(file, userId, metadata = {}) {
  try {
    if (!userId) {
      throw new Error('User ID is required for document upload');
    }

    // Validate file
    if (!file || !file.name) {
      throw new Error('Valid file is required');
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 50MB limit');
    }

    // Create initial document record in Supabase with 'uploading' status
    const documentData = {
      user_id: userId,
      original_business_idea_id: metadata.businessIdeaId || null,
      document_type: metadata.documentType || 'general',
      filename: `${Date.now()}-${file.name}`,
      original_filename: file.name,
      file_url: '', // Will be updated after R2 upload
      file_size: file.size,
      mime_type: file.type || 'application/octet-stream',
      r2_key: '', // Will be updated after R2 upload
      title: metadata.title || file.name,
      description: metadata.description || '',
      tags: metadata.tags || [],
      folder_id: metadata.folderId || null,
      upload_status: 'uploading',
      ai_generated: metadata.aiGenerated || false,
      generation_metadata: metadata.generationMetadata || null,
      generation_prompt: metadata.generationPrompt || null
    };

    const { data: document, error: createError } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create document record: ${createError.message}`);
    }

    try {
      // Upload to R2 storage
      const uploadResult = await r2Storage.uploadFile(
        file,
        userId,
        metadata.documentType || 'general',
        {
          documentId: document.id,
          title: metadata.title || file.name
        }
      );

      // Update document record with R2 information
      const { data: updatedDocument, error: updateError } = await supabase
        .from('documents')
        .update({
          file_url: uploadResult.fileUrl,
          r2_key: uploadResult.fileKey,
          upload_status: 'completed',
          processing_status: 'completed'
        })
        .eq('id', document.id)
        .select()
        .single();

      if (updateError) {
        // If updating fails, try to clean up R2 file
        try {
          await r2Storage.deleteFile(uploadResult.fileKey);
        } catch (cleanupError) {
          console.error('Failed to cleanup R2 file:', cleanupError);
        }
        throw new Error(`Failed to update document record: ${updateError.message}`);
      }

      // Log the upload activity
      await logDocumentActivity(document.id, userId, 'created', {
        fileSize: file.size,
        mimeType: file.type,
        r2Key: uploadResult.fileKey
      });

      return updatedDocument;

    } catch (r2Error) {
      // Update document status to failed
      await supabase
        .from('documents')
        .update({ upload_status: 'failed' })
        .eq('id', document.id);

      throw new Error(`File upload failed: ${r2Error.message}`);
    }

  } catch (error) {
    console.error('Document upload failed:', error);
    throw error;
  }
}

/**
 * Get documents for a user with optional filtering
 * @param {string} userId - User ID
 * @param {object} filters - Filter options
 * @returns {Promise<Array>} Array of documents
 */
export async function getUserDocuments(userId, filters = {}) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    let query = supabase
      .from('documents')
      .select(`
        *,
        business_ideas:original_business_idea_id(name),
        document_folders:folder_id(name, color)
      `)
      .eq('user_id', userId)
      .eq('upload_status', 'completed');

    // Apply filters
    if (filters.documentType) {
      query = query.eq('document_type', filters.documentType);
    }

    if (filters.folderId) {
      query = query.eq('folder_id', filters.folderId);
    }

    if (filters.aiGenerated !== undefined) {
      query = query.eq('ai_generated', filters.aiGenerated);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,filename.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    return data || [];

  } catch (error) {
    console.error('Failed to get user documents:', error);
    throw error;
  }
}

/**
 * Get a single document by ID
 * @param {string} documentId - Document ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} Document object
 */
export async function getDocumentById(documentId, userId) {
  try {
    if (!documentId || !userId) {
      throw new Error('Document ID and User ID are required');
    }

    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        business_ideas:original_business_idea_id(name),
        document_folders:folder_id(name, color)
      `)
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch document: ${error.message}`);
    }

    return data;

  } catch (error) {
    console.error('Failed to get document:', error);
    throw error;
  }
}

/**
 * Generate a secure download URL for a document
 * @param {string} documentId - Document ID
 * @param {string} userId - User ID
 * @returns {Promise<string>} Download URL
 */
export async function getDocumentDownloadUrl(documentId, userId) {
  try {
    const document = await getDocumentById(documentId, userId);

    if (!document.r2_key) {
      throw new Error('Document file not found in storage');
    }

    // Generate presigned URL for download
    const downloadUrl = await r2Storage.getDownloadUrl(document.r2_key);

    // Log the download activity
    await logDocumentActivity(documentId, userId, 'downloaded');

    // Update last accessed timestamp
    await supabase
      .from('documents')
      .update({ last_accessed: new Date().toISOString() })
      .eq('id', documentId);

    return downloadUrl;

  } catch (error) {
    console.error('Failed to get download URL:', error);
    throw error;
  }
}

/**
 * Update document metadata
 * @param {string} documentId - Document ID
 * @param {string} userId - User ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated document
 */
export async function updateDocument(documentId, userId, updates) {
  try {
    if (!documentId || !userId) {
      throw new Error('Document ID and User ID are required');
    }

    // Filter allowed update fields
    const allowedFields = [
      'title', 'description', 'tags', 'folder_id', 'is_public', 'access_level'
    ];

    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }

    const { data, error } = await supabase
      .from('documents')
      .update(filteredUpdates)
      .eq('id', documentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }

    // Log the update activity
    await logDocumentActivity(documentId, userId, 'updated', {
      updatedFields: Object.keys(filteredUpdates)
    });

    return data;

  } catch (error) {
    console.error('Failed to update document:', error);
    throw error;
  }
}

/**
 * Delete a document (both from Supabase and R2)
 * @param {string} documentId - Document ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function deleteDocument(documentId, userId) {
  try {
    if (!documentId || !userId) {
      throw new Error('Document ID and User ID are required');
    }

    // Get document details first
    const document = await getDocumentById(documentId, userId);

    // Delete from R2 storage if file exists
    if (document.r2_key) {
      try {
        await r2Storage.deleteFile(document.r2_key);
      } catch (r2Error) {
        console.error('Failed to delete from R2:', r2Error);
        // Continue with database deletion even if R2 deletion fails
      }
    }

    // Delete from Supabase
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete document record: ${error.message}`);
    }

    // Log the deletion activity (this will be handled by the trigger)

  } catch (error) {
    console.error('Failed to delete document:', error);
    throw error;
  }
}

/**
 * Bulk delete documents
 * @param {Array<string>} documentIds - Array of document IDs
 * @param {string} userId - User ID
 * @returns {Promise<object>} Deletion results
 */
export async function bulkDeleteDocuments(documentIds, userId) {
  const results = {
    deleted: [],
    failed: []
  };

  for (const documentId of documentIds) {
    try {
      await deleteDocument(documentId, userId);
      results.deleted.push(documentId);
    } catch (error) {
      results.failed.push({ documentId, error: error.message });
    }
  }

  return results;
}

/**
 * Get user storage statistics
 * @param {string} userId - User ID
 * @returns {Promise<object>} Storage statistics
 */
export async function getUserStorageStats(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get stats from database
    const { data, error } = await supabase
      .rpc('get_user_storage_stats', { p_user_id: userId });

    if (error) {
      throw new Error(`Failed to get storage stats: ${error.message}`);
    }

    return data[0] || {
      total_documents: 0,
      total_size_bytes: 0,
      total_size_mb: 0,
      documents_by_type: {},
      recent_uploads: []
    };

  } catch (error) {
    console.error('Failed to get storage stats:', error);
    throw error;
  }
}

/**
 * Search documents with full-text search
 * @param {string} userId - User ID
 * @param {string} searchTerm - Search term
 * @param {object} filters - Additional filters
 * @returns {Promise<Array>} Search results
 */
export async function searchDocuments(userId, searchTerm, filters = {}) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data, error } = await supabase
      .rpc('search_user_documents', {
        p_user_id: userId,
        p_search_term: searchTerm || '',
        p_document_type: filters.documentType || null,
        p_folder_id: filters.folderId || null,
        p_limit: filters.limit || 50,
        p_offset: filters.offset || 0
      });

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    return data || [];

  } catch (error) {
    console.error('Document search failed:', error);
    throw error;
  }
}

/**
 * Log document activity
 * @param {string} documentId - Document ID
 * @param {string} userId - User ID
 * @param {string} action - Action performed
 * @param {object} metadata - Additional metadata
 * @returns {Promise<void>}
 */
async function logDocumentActivity(documentId, userId, action, metadata = {}) {
  try {
    await supabase
      .from('document_activity_logs')
      .insert({
        document_id: documentId,
        user_id: userId,
        action,
        metadata
      });
  } catch (error) {
    console.error('Failed to log document activity:', error);
    // Don't throw error for logging failures
  }
}

/**
 * Create a new folder
 * @param {string} userId - User ID
 * @param {string} name - Folder name
 * @param {string} parentId - Parent folder ID (optional)
 * @param {object} options - Additional options
 * @returns {Promise<object>} Created folder
 */
export async function createFolder(userId, name, parentId = null, options = {}) {
  try {
    if (!userId || !name) {
      throw new Error('User ID and folder name are required');
    }

    const folderData = {
      user_id: userId,
      name: name.trim(),
      description: options.description || null,
      parent_folder_id: parentId,
      color: options.color || '#3B82F6'
    };

    const { data, error } = await supabase
      .from('document_folders')
      .insert(folderData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create folder: ${error.message}`);
    }

    return data;

  } catch (error) {
    console.error('Failed to create folder:', error);
    throw error;
  }
}

/**
 * Get user folders
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of folders
 */
export async function getUserFolders(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data, error } = await supabase
      .from('document_folders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch folders: ${error.message}`);
    }

    return data || [];

  } catch (error) {
    console.error('Failed to get user folders:', error);
    throw error;
  }
}