/**
 * Client-side Document Management Service
 * Uses API routes for secure storage operations
 */

import { supabase } from '../supabase.js';

/**
 * Get user's folder structure
 */
export async function getUserFolders(userId) {
  try {
    const { data, error } = await supabase
      .from('document_folders')
      .select('*')
      .or(`is_system_folder.eq.true,user_id.eq.${userId}`)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw new Error('Failed to fetch folders');
  }
}

/**
 * Create a new folder
 */
export async function createFolder(userId, folderData) {
  try {
    const { data, error } = await supabase
      .from('document_folders')
      .insert([{
        ...folderData,
        user_id: userId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw new Error('Failed to create folder');
  }
}

/**
 * Get documents in a folder
 */
export async function getFolderDocuments(folderId, userId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('folder_id', folderId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching folder documents:', error);
    throw new Error('Failed to fetch documents');
  }
}

/**
 * Upload a file using the secure API route
 */
export async function uploadFile(file, key, userId, folderId) {
  try {
    // Get signed URL from API
    const urlResponse = await fetch('/api/storage/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'upload',
        key,
        contentType: file.type,
        expiresIn: 3600
      }),
    });

    if (!urlResponse.ok) {
      throw new Error('Failed to get upload URL');
    }

    const { signedUrl } = await urlResponse.json();

    // Upload file to R2 using signed URL
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }

    // Save document metadata to database
    const { data, error } = await supabase
      .from('documents')
      .insert([{
        name: file.name,
        file_path: key,
        file_size: file.size,
        mime_type: file.type,
        user_id: userId,
        folder_id: folderId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;

  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Get download URL for a file
 */
export async function getDownloadUrl(filePath) {
  try {
    const response = await fetch('/api/storage/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'download',
        key: filePath,
        expiresIn: 3600
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get download URL');
    }

    const { signedUrl } = await response.json();
    return signedUrl;

  } catch (error) {
    console.error('Error getting download URL:', error);
    throw new Error('Failed to get download URL');
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId, filePath, userId) {
  try {
    // Delete from R2 storage
    const deleteResponse = await fetch('/api/storage/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete',
        key: filePath
      }),
    });

    if (deleteResponse.ok) {
      const { signedUrl } = await deleteResponse.json();
      await fetch(signedUrl, { method: 'DELETE' });
    }

    // Delete from database
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;

  } catch (error) {
    console.error('Error deleting document:', error);
    throw new Error('Failed to delete document');
  }
}

/**
 * Search documents by name
 */
export async function searchDocuments(query, userId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching documents:', error);
    throw new Error('Failed to search documents');
  }
}

/**
 * Get document by ID
 */
export async function getDocument(documentId, userId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw new Error('Failed to fetch document');
  }
}

/**
 * Update document metadata
 */
export async function updateDocument(documentId, updates, userId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating document:', error);
    throw new Error('Failed to update document');
  }
}