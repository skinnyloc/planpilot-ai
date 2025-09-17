/**
 * Comprehensive Document Management Service
 * Handles folders, documents, sharing, search, and storage management
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabase } from '../supabase.js';

// Configure S3 client for R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: import.meta.env.VITE_R2_ENDPOINT || process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'planpolitai';

/**
 * Get user's folder structure
 */
export async function getUserFolders(userId) {
  try {
    const { data, error } = await supabase
      .from('document_folders')
      .select('*')
      .or(`is_system_folder.eq.true,user_id.eq.${userId}`)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Organize into hierarchy
    const folders = data || [];
    const folderMap = new Map();
    const rootFolders = [];

    // Create folder map
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Build hierarchy
    folders.forEach(folder => {
      if (folder.parent_folder_id) {
        const parent = folderMap.get(folder.parent_folder_id);
        if (parent) {
          parent.children.push(folderMap.get(folder.id));
        }
      } else {
        rootFolders.push(folderMap.get(folder.id));
      }
    });

    return rootFolders;

  } catch (error) {
    console.error('Failed to get user folders:', error);
    throw error;
  }
}

/**
 * Create a new folder
 */
export async function createFolder(folderData, userId) {
  try {
    const { data, error } = await supabase
      .from('document_folders')
      .insert({
        ...folderData,
        user_id: userId,
        slug: folderData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      })
      .select()
      .single();

    if (error) throw error;

    return data;

  } catch (error) {
    console.error('Failed to create folder:', error);
    throw error;
  }
}

/**
 * Get documents with advanced filtering and search
 */
export async function getDocuments(userId, options = {}) {
  try {
    const {
      folderId,
      searchTerm = '',
      tags = [],
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      includeShared = false
    } = options;

    let query = supabase
      .from('documents')
      .select(`
        *,
        document_folders(name, icon, color_code),
        document_tag_relationships(document_tags(name, color_code))
      `);

    // User's documents
    if (!includeShared) {
      query = query.eq('user_id', userId);
    }

    // Folder filter
    if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    // Search filter
    if (searchTerm) {
      query = query.or(`original_filename.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,content_preview.ilike.%${searchTerm}%`);
    }

    // Tag filter
    if (tags.length > 0) {
      // This would need a more complex query with joins
      // For now, we'll handle this in the application layer
    }

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // Process documents to flatten tag data
    const processedDocuments = (data || []).map(doc => ({
      ...doc,
      folder: doc.document_folders,
      tags: doc.document_tag_relationships?.map(rel => rel.document_tags) || []
    }));

    return {
      documents: processedDocuments,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };

  } catch (error) {
    console.error('Failed to get documents:', error);
    throw error;
  }
}

/**
 * Upload document with folder organization
 */
export async function uploadDocument(file, metadata, userId, onProgress) {
  try {
    // Generate file path based on folder
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

    let folderPath = 'documents';
    if (metadata.folderId) {
      // Get folder info for path
      const { data: folder } = await supabase
        .from('document_folders')
        .select('slug')
        .eq('id', metadata.folderId)
        .single();

      if (folder) {
        folderPath = `documents/${folder.slug}`;
      }
    }

    const fileName = `${folderPath}/${userId}/${timestamp}_${sanitizedName}`;

    if (onProgress) onProgress(25);

    // Upload to R2
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    await r2Client.send(uploadCommand);

    if (onProgress) onProgress(50);

    // Extract content preview for text files
    let contentPreview = null;
    if (file.type.startsWith('text/') && file.size < 1024 * 1024) { // 1MB limit
      try {
        contentPreview = await file.text();
        contentPreview = contentPreview.substring(0, 500); // First 500 chars
      } catch (e) {
        // Ignore preview extraction errors
      }
    }

    if (onProgress) onProgress(75);

    // Save metadata to database
    const documentData = {
      user_id: userId,
      original_filename: file.name,
      filename: fileName,
      file_path: fileName,
      file_size: file.size,
      mime_type: file.type,
      document_type: metadata.documentType || 'other',
      description: metadata.description || '',
      folder_id: metadata.folderId || null,
      content_preview: contentPreview,
      tags: metadata.tags || [],
      storage_bucket: BUCKET_NAME,
      storage_path: fileName,
      is_public: false,
      metadata: {
        ...metadata,
        uploadMethod: 'direct',
        processingVersion: '1.0'
      }
    };

    const { data, error } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();

    if (error) throw error;

    // Add tags if provided
    if (metadata.tags && metadata.tags.length > 0) {
      await addDocumentTags(data.id, metadata.tags, userId);
    }

    if (onProgress) onProgress(100);

    return {
      ...data,
      url: await getDocumentDownloadUrl(fileName)
    };

  } catch (error) {
    console.error('Upload failed:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

/**
 * Get document download URL
 */
export async function getDocumentDownloadUrl(filePath, expiresIn = 3600) {
  try {
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    });

    const signedUrl = await getSignedUrl(r2Client, getCommand, { expiresIn });
    return signedUrl;

  } catch (error) {
    console.error('Failed to generate download URL:', error);
    throw error;
  }
}

/**
 * Download multiple documents as ZIP
 */
export async function downloadDocumentsAsZip(documentIds, userId) {
  try {
    // Get documents
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .in('id', documentIds)
      .eq('user_id', userId);

    if (error) throw error;

    // This would typically be handled by a backend service
    // For now, we'll return the documents for client-side ZIP creation
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        downloadUrl: await getDocumentDownloadUrl(doc.storage_path)
      }))
    );

    return documentsWithUrls;

  } catch (error) {
    console.error('Failed to prepare documents for ZIP:', error);
    throw error;
  }
}

/**
 * Delete documents (batch operation)
 */
export async function deleteDocuments(documentIds, userId) {
  try {
    // Get documents to delete
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path')
      .in('id', documentIds)
      .eq('user_id', userId);

    if (fetchError) throw fetchError;

    // Delete from R2 storage
    const deletePromises = documents.map(doc =>
      r2Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: doc.storage_path
      }))
    );

    await Promise.allSettled(deletePromises);

    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .in('id', documentIds)
      .eq('user_id', userId);

    if (dbError) throw dbError;

    return { deleted: documentIds.length };

  } catch (error) {
    console.error('Failed to delete documents:', error);
    throw error;
  }
}

/**
 * Move documents to different folder
 */
export async function moveDocuments(documentIds, folderId, userId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update({ folder_id: folderId })
      .in('id', documentIds)
      .eq('user_id', userId)
      .select();

    if (error) throw error;

    return data;

  } catch (error) {
    console.error('Failed to move documents:', error);
    throw error;
  }
}

/**
 * Share document via secure link
 */
export async function shareDocument(documentId, options, userId) {
  try {
    const {
      expiresIn = 7 * 24 * 60 * 60 * 1000, // 7 days
      permissions = ['view'],
      email = null
    } = options;

    const shareToken = generateShareToken();
    const expiresAt = new Date(Date.now() + expiresIn);

    const { data, error } = await supabase
      .from('document_shares')
      .insert({
        document_id: documentId,
        shared_by_user_id: userId,
        shared_with_email: email,
        share_token: shareToken,
        permissions,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      shareUrl: `${window.location.origin}/shared/${shareToken}`
    };

  } catch (error) {
    console.error('Failed to share document:', error);
    throw error;
  }
}

/**
 * Get shared document by token
 */
export async function getSharedDocument(shareToken) {
  try {
    const { data, error } = await supabase
      .from('document_shares')
      .select(`
        *,
        documents(
          id,
          original_filename,
          description,
          file_size,
          mime_type,
          storage_path,
          created_at
        )
      `)
      .eq('share_token', shareToken)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error) throw error;

    // Increment access count
    await supabase
      .from('document_shares')
      .update({
        access_count: data.access_count + 1,
        last_accessed: new Date().toISOString()
      })
      .eq('id', data.id);

    return data;

  } catch (error) {
    console.error('Failed to get shared document:', error);
    throw error;
  }
}

/**
 * Get user storage usage
 */
export async function getUserStorageUsage(userId) {
  try {
    const { data, error } = await supabase
      .rpc('get_user_storage_usage', { target_user_id: userId });

    if (error) throw error;

    return data[0] || {
      total_quota_bytes: 1073741824, // 1GB
      used_bytes: 0,
      document_count: 0,
      percentage_used: 0
    };

  } catch (error) {
    console.error('Failed to get storage usage:', error);
    throw error;
  }
}

/**
 * Add tags to document
 */
export async function addDocumentTags(documentId, tagNames, userId) {
  try {
    // Get or create tags
    const tagPromises = tagNames.map(async (tagName) => {
      const { data: existingTag } = await supabase
        .from('document_tags')
        .select('id')
        .eq('name', tagName)
        .eq('user_id', userId)
        .single();

      if (existingTag) {
        return existingTag.id;
      }

      const { data: newTag, error } = await supabase
        .from('document_tags')
        .insert({
          name: tagName,
          user_id: userId
        })
        .select('id')
        .single();

      if (error) throw error;
      return newTag.id;
    });

    const tagIds = await Promise.all(tagPromises);

    // Create tag relationships
    const relationships = tagIds.map(tagId => ({
      document_id: documentId,
      tag_id: tagId
    }));

    const { error } = await supabase
      .from('document_tag_relationships')
      .insert(relationships);

    if (error) throw error;

    return tagIds;

  } catch (error) {
    console.error('Failed to add document tags:', error);
    throw error;
  }
}

/**
 * Search documents with advanced options
 */
export async function searchDocuments(userId, searchOptions) {
  try {
    const {
      searchTerm = '',
      folderId = null,
      tagFilter = null,
      sortBy = 'created_at',
      sortOrder = 'desc',
      limit = 50,
      offset = 0
    } = searchOptions;

    const { data, error } = await supabase
      .rpc('search_user_documents', {
        target_user_id: userId,
        search_term: searchTerm,
        folder_filter: folderId,
        tag_filter: tagFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit_count: limit,
        offset_count: offset
      });

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('Failed to search documents:', error);
    throw error;
  }
}

/**
 * Generate business plan from business idea
 */
export async function generateBusinessPlanFromIdea(ideaDocumentId, userId) {
  try {
    // Get the business idea document
    const { data: ideaDoc, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', ideaDocumentId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    // Generate business plan using AI
    const response = await fetch('/api/generate-business-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceDocument: ideaDoc,
        userId
      })
    });

    if (!response.ok) throw new Error('Failed to generate business plan');

    const result = await response.json();
    return result.document;

  } catch (error) {
    console.error('Failed to generate business plan:', error);
    throw error;
  }
}

/**
 * Generate grant proposal from business plan
 */
export async function generateGrantProposalFromPlan(planDocumentId, grantId, userId) {
  try {
    // Get the business plan document
    const { data: planDoc, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', planDocumentId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    // Generate proposal using existing service
    const response = await fetch('/api/generate-proposal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessPlanDocument: planDoc,
        grantId,
        userId
      })
    });

    if (!response.ok) throw new Error('Failed to generate grant proposal');

    const result = await response.json();
    return result.document;

  } catch (error) {
    console.error('Failed to generate grant proposal:', error);
    throw error;
  }
}

// Helper functions
function generateShareToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const DOCUMENT_TYPES = {
  BUSINESS_IDEA: 'business_idea',
  BUSINESS_PLAN: 'business_plan',
  GRANT_PROPOSAL: 'grant_proposal',
  FINANCIAL_DOCUMENT: 'financial_document',
  LEGAL_DOCUMENT: 'legal_document',
  MARKETING_MATERIAL: 'marketing_material',
  OTHER: 'other'
};

export const FOLDER_TYPES = {
  BUSINESS_IDEAS: 'business-ideas',
  BUSINESS_PLANS: 'business-plans',
  GRANT_PROPOSALS: 'grant-proposals',
  UPLOADS: 'uploads'
};