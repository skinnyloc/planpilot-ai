import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserDocuments, deleteDocument } from '@/lib/services/documentStorage';

/**
 * Documents List API Route
 *
 * GET: List user's documents with filtering and pagination
 * DELETE: Delete multiple documents
 */
export async function GET(request) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const options = {
      page: parseInt(searchParams.get('page')) || 1,
      limit: Math.min(parseInt(searchParams.get('limit')) || 20, 100),
      search: searchParams.get('search') || '',
      type: searchParams.get('type') || '',
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    };

    // Get documents using service
    const result = await getUserDocuments(userId, options);

    if (!result.success) {
      console.error('Get documents error:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: result.documents,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1
      }
    });

  } catch (error) {
    console.error('Documents API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { documentIds } = await request.json();

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No document IDs provided' },
        { status: 400 }
      );
    }

    // Delete documents using service
    let deletedCount = 0;
    const errors = [];

    for (const documentId of documentIds) {
      const result = await deleteDocument(documentId, userId);
      if (result.success) {
        deletedCount++;
      } else {
        errors.push(`Failed to delete document ${documentId}: ${result.error}`);
      }
    }

    if (deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'No documents were deleted', errors },
        { status: 500 }
      );
    }

    const response = {
      success: true,
      message: `${deletedCount} document(s) deleted successfully`,
      deletedCount
    };

    if (errors.length > 0) {
      response.warnings = errors;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Delete documents API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}