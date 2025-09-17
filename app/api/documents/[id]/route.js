import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDocumentDownloadUrl, deleteDocument, updateDocumentMetadata } from '@/lib/services/documentStorage';

/**
 * Individual Document API Route
 *
 * GET: Get document details and download URL
 * PUT: Update document metadata
 * DELETE: Delete individual document
 */
export async function GET(request, { params }) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const documentId = params.id;

    // Get document and download URL using service
    const result = await getDocumentDownloadUrl(documentId, userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Document not found or access denied' ? 404 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document: result.document,
      downloadUrl: result.downloadUrl
    });

  } catch (error) {
    console.error('Document API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const documentId = params.id;
    const updates = await request.json();

    // Update document metadata using service
    const result = await updateDocumentMetadata(documentId, userId, updates);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error.includes('not found') ? 404 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document: result.document,
      message: 'Document updated successfully'
    });

  } catch (error) {
    console.error('Update document API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const documentId = params.id;

    // Delete document using service
    const result = await deleteDocument(documentId, userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error.includes('not found') ? 404 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Delete document API error:', error);
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}