import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req, res) {
  try {
    // For demo purposes, we'll use a mock user ID since we don't have auth setup
    const userId = 'demo-user';

    const type = req.query.type;

    // Build query
    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Filter by type if specified
    if (type && type !== 'all') {
      query = query.eq('document_type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        error: 'Failed to fetch documents'
      });
    }

    // Map response fields to expected API format
    const mappedDocuments = (data || []).map(doc => ({
      ...doc,
      title: doc.filename,
      storage_key: doc.file_path
    }));

    return res.json({
      success: true,
      documents: mappedDocuments
    });

  } catch (error) {
    console.error('Documents API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch documents',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export async function POST(req, res) {
  try {
    // For demo purposes, we'll use a mock user ID since we don't have auth setup
    const userId = 'demo-user';

    const { title, document_type, storage_key, description, file_size, mime_type } = req.body;

    // Validate required fields
    if (!title || !document_type || !storage_key) {
      return res.status(400).json({
        error: 'Title, document_type, and storage_key are required'
      });
    }

    // Map new API fields to existing table schema
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        filename: title, // Use title as filename
        file_path: storage_key, // Use storage_key as file_path
        document_type,
        description,
        file_size,
        mime_type: mime_type || 'application/pdf'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({
        error: 'Failed to create document record'
      });
    }

    // Map response back to expected API format
    const responseDocument = {
      ...data,
      title: data.filename,
      storage_key: data.file_path
    };

    return res.json({
      success: true,
      document: responseDocument
    });

  } catch (error) {
    console.error('Documents POST API error:', error);
    return res.status(500).json({
      error: 'Failed to create document',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export async function DELETE(req, res) {
  try {
    // For demo purposes, we'll use a mock user ID since we don't have auth setup
    const userId = 'demo-user';
    const documentId = req.params?.id || req.query?.id;

    if (!documentId) {
      return res.status(400).json({
        error: 'Document ID is required'
      });
    }

    // Delete the document record
    const { data, error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId) // Ensure user can only delete their own documents
      .select()
      .single();

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({
        error: 'Failed to delete document'
      });
    }

    if (!data) {
      return res.status(404).json({
        error: 'Document not found or access denied'
      });
    }

    return res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Documents DELETE API error:', error);
    return res.status(500).json({
      error: 'Failed to delete document',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}