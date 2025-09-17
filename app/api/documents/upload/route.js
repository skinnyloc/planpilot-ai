import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadDocument } from '@/lib/services/documentStorage';

/**
 * Upload Document API Route
 *
 * Handles file uploads with metadata to Supabase Storage
 * and creates corresponding database records.
 */
export async function POST(request) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    const documentType = formData.get('document_type') || 'other';
    const description = formData.get('description') || '';
    const tags = formData.get('tags');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Parse tags
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(',').map(tag => tag.trim());
      }
    }

    // Upload file using document service
    const uploadResult = await uploadDocument(file, userId, {
      document_type: documentType,
      description,
      tags: parsedTags
    });

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: uploadResult.error.includes('Unauthorized') ? 401 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      document: uploadResult.document,
      message: 'Document uploaded successfully'
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}