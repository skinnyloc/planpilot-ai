import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "placeholder",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

export async function GET(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's documents for analysis
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Analyze documents for cleanup suggestions
    const suggestions = {
      oldDocuments: [],
      largeFiles: [],
      duplicates: [],
      tempFiles: [],
      oldDocumentsSize: 0,
      largeFilesSize: 0,
      duplicatesSize: 0,
      tempFilesSize: 0,
      totalPotentialSavings: 0
    };

    // Find old documents (older than 6 months, not accessed recently)
    const oldDocs = documents.filter(doc => {
      const createdAt = new Date(doc.created_at);
      const lastAccessed = doc.last_accessed ? new Date(doc.last_accessed) : createdAt;
      return createdAt < sixMonthsAgo && lastAccessed < oneMonthAgo;
    });

    suggestions.oldDocuments = oldDocs.map(doc => ({
      id: doc.id,
      name: doc.original_filename,
      size: doc.file_size,
      created_at: doc.created_at,
      last_accessed: doc.last_accessed
    }));
    suggestions.oldDocumentsSize = oldDocs.reduce((sum, doc) => sum + doc.file_size, 0);

    // Find large files (> 10MB)
    const largeDocs = documents.filter(doc => doc.file_size > 10 * 1024 * 1024);
    suggestions.largeFiles = largeDocs.map(doc => ({
      id: doc.id,
      name: doc.original_filename,
      size: doc.file_size,
      type: doc.mime_type
    }));
    suggestions.largeFilesSize = largeDocs.reduce((sum, doc) => sum + doc.file_size, 0);

    // Find potential duplicates (same name or similar size)
    const duplicateGroups = {};
    documents.forEach(doc => {
      const key = `${doc.original_filename}_${doc.file_size}`;
      if (!duplicateGroups[key]) {
        duplicateGroups[key] = [];
      }
      duplicateGroups[key].push(doc);
    });

    Object.values(duplicateGroups).forEach(group => {
      if (group.length > 1) {
        // Keep the most recent, mark others as duplicates
        const sorted = group.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const duplicates = sorted.slice(1);

        suggestions.duplicates.push(...duplicates.map(doc => ({
          id: doc.id,
          name: doc.original_filename,
          size: doc.file_size,
          created_at: doc.created_at,
          keepId: sorted[0].id
        })));

        suggestions.duplicatesSize += duplicates.reduce((sum, doc) => sum + doc.file_size, 0);
      }
    });

    // Find temporary files (files with temp-like names or in temp folders)
    const tempPatterns = [/temp/i, /tmp/i, /draft/i, /backup/i, /copy/i];
    const tempDocs = documents.filter(doc =>
      tempPatterns.some(pattern =>
        pattern.test(doc.original_filename) ||
        pattern.test(doc.description || '')
      )
    );

    suggestions.tempFiles = tempDocs.map(doc => ({
      id: doc.id,
      name: doc.original_filename,
      size: doc.file_size,
      reason: getTempReason(doc)
    }));
    suggestions.tempFilesSize = tempDocs.reduce((sum, doc) => sum + doc.file_size, 0);

    // Calculate total potential savings
    suggestions.totalPotentialSavings =
      suggestions.oldDocumentsSize +
      suggestions.duplicatesSize +
      suggestions.tempFilesSize;

    return NextResponse.json({
      success: true,
      data: suggestions,
      summary: {
        totalDocuments: documents.length,
        totalSize: documents.reduce((sum, doc) => sum + doc.file_size, 0),
        potentialSavings: suggestions.totalPotentialSavings,
        savingsPercentage: documents.length > 0
          ? (suggestions.totalPotentialSavings / documents.reduce((sum, doc) => sum + doc.file_size, 0)) * 100
          : 0
      }
    });

  } catch (error) {
    console.error('Storage cleanup analysis error:', error);

    return NextResponse.json(
      {
        error: 'Failed to analyze storage for cleanup',
        details: error.message
      },
      { status: 500 }
    );
  }
}

function getTempReason(document) {
  const filename = document.original_filename.toLowerCase();
  const description = (document.description || '').toLowerCase();

  if (filename.includes('temp') || description.includes('temp')) {
    return 'Temporary file';
  }
  if (filename.includes('draft') || description.includes('draft')) {
    return 'Draft document';
  }
  if (filename.includes('backup') || description.includes('backup')) {
    return 'Backup file';
  }
  if (filename.includes('copy') || description.includes('copy')) {
    return 'Copy of document';
  }
  return 'Potentially temporary';
}