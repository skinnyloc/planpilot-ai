import { supabase } from '../supabase.js';

/**
 * Document Storage Service
 * Handles document uploads, downloads, and management with Supabase Storage
 */

/**
 * Upload a document to Supabase Storage and database
 * @param {File} file - File to upload
 * @param {string} userId - User ID
 * @param {Object} metadata - Document metadata
 * @returns {Promise<Object>} Upload result
 */
export async function uploadDocument(file, userId, metadata = {}) {
  try {
    if (!file || !userId) {
      throw new Error('File and user ID are required');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}_${randomId}.${fileExt}`;
    const filePath = `documents/${userId}/${filename}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Insert document record into database
    const documentData = {
      user_id: userId,
      original_filename: file.name,
      filename: filename,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      document_type: metadata.document_type || 'other',
      description: metadata.description || null,
      tags: metadata.tags || [],
      storage_bucket: 'documents',
      storage_path: filePath
    };

    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();

    if (dbError) {
      // If database insert fails, clean up uploaded file
      await supabase.storage.from('documents').remove([filePath]);
      throw new Error(`Database insert failed: ${dbError.message}`);
    }

    return {
      success: true,
      document,
      uploadPath: uploadData.path
    };

  } catch (error) {
    console.error('Document upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get a signed download URL for a document
 * @param {string} documentId - Document ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Download URL result
 */
export async function getDocumentDownloadUrl(documentId, userId) {
  try {
    if (!documentId || !userId) {
      throw new Error('Document ID and user ID are required');
    }

    // Get document info from database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (dbError || !document) {
      throw new Error('Document not found or access denied');
    }

    // Generate signed URL (expires in 1 hour)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.file_path, 3600);

    if (urlError) {
      throw new Error(`Failed to generate download URL: ${urlError.message}`);
    }

    return {
      success: true,
      downloadUrl: urlData.signedUrl,
      document
    };

  } catch (error) {
    console.error('Get download URL error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete a document from both storage and database
 * @param {string} documentId - Document ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Delete result
 */
export async function deleteDocument(documentId, userId) {
  try {
    if (!documentId || !userId) {
      throw new Error('Document ID and user ID are required');
    }

    // Get document info from database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (dbError || !document) {
      throw new Error('Document not found or access denied');
    }

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.file_path]);

    if (storageError) {
      console.warn('Storage delete warning:', storageError.message);
      // Continue with database delete even if storage delete fails
    }

    // Delete record from database
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId);

    if (deleteError) {
      throw new Error(`Database delete failed: ${deleteError.message}`);
    }

    return {
      success: true,
      message: 'Document deleted successfully'
    };

  } catch (error) {
    console.error('Delete document error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get user's documents with filtering and pagination
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Documents result
 */
export async function getUserDocuments(userId, options = {}) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const {
      search = '',
      type = '',
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    // Build query
    let query = supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (search) {
      query = query.or(
        `original_filename.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    if (type) {
      query = query.eq('document_type', type);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: documents, error, count } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return {
      success: true,
      documents: documents || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };

  } catch (error) {
    console.error('Get user documents error:', error);
    return {
      success: false,
      error: error.message,
      documents: [],
      total: 0
    };
  }
}

/**
 * Update document metadata
 * @param {string} documentId - Document ID
 * @param {string} userId - User ID
 * @param {Object} metadata - Updated metadata
 * @returns {Promise<Object>} Update result
 */
export async function updateDocumentMetadata(documentId, userId, metadata) {
  try {
    if (!documentId || !userId) {
      throw new Error('Document ID and user ID are required');
    }

    const updateData = {
      ...(metadata.description !== undefined && { description: metadata.description }),
      ...(metadata.document_type !== undefined && { document_type: metadata.document_type }),
      ...(metadata.tags !== undefined && { tags: metadata.tags }),
      updated_at: new Date().toISOString()
    };

    const { data: document, error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }

    return {
      success: true,
      document
    };

  } catch (error) {
    console.error('Update document metadata error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get document statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Statistics result
 */
export async function getDocumentStats(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get total count and size
    const { data: totalData, error: totalError } = await supabase
      .from('documents')
      .select('file_size')
      .eq('user_id', userId);

    if (totalError) {
      throw new Error(`Failed to get document stats: ${totalError.message}`);
    }

    // Get count by type
    const { data: typeData, error: typeError } = await supabase
      .from('documents')
      .select('document_type')
      .eq('user_id', userId);

    if (typeError) {
      throw new Error(`Failed to get document type stats: ${typeError.message}`);
    }

    // Calculate statistics
    const totalCount = totalData.length;
    const totalSize = totalData.reduce((sum, doc) => sum + (doc.file_size || 0), 0);

    const typeStats = typeData.reduce((acc, doc) => {
      acc[doc.document_type] = (acc[doc.document_type] || 0) + 1;
      return acc;
    }, {});

    return {
      success: true,
      stats: {
        totalCount,
        totalSize,
        typeBreakdown: typeStats
      }
    };

  } catch (error) {
    console.error('Get document stats error:', error);
    return {
      success: false,
      error: error.message,
      stats: {
        totalCount: 0,
        totalSize: 0,
        typeBreakdown: {}
      }
    };
  }
}