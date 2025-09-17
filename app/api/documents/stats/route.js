import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

/**
 * Document Statistics API Route
 *
 * GET: Get user's document statistics and usage information
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

    // Get comprehensive document statistics
    const { data: stats, error } = await supabase
      .rpc('get_user_document_stats', { p_user_id: userId });

    if (error) {
      console.error('Stats query error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    // Get recent documents
    const { data: recentDocuments, error: recentError } = await supabase
      .from('documents')
      .select('id, original_filename, document_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('Recent documents query error:', recentError);
    }

    // Parse stats (function returns single row)
    const parsedStats = stats && stats.length > 0 ? stats[0] : {
      total_documents: 0,
      total_size: 0,
      document_types: {}
    };

    // Convert total_size to human readable format
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Calculate storage limits (example: 1GB for free, 50GB for pro)
    const storageLimit = 1024 * 1024 * 1024; // 1GB in bytes
    const storageUsed = parsedStats.total_size || 0;
    const storagePercentage = (storageUsed / storageLimit) * 100;

    const response = {
      success: true,
      stats: {
        totalDocuments: parsedStats.total_documents || 0,
        totalSize: storageUsed,
        totalSizeFormatted: formatFileSize(storageUsed),
        documentTypes: parsedStats.document_types || {},
        storage: {
          used: storageUsed,
          limit: storageLimit,
          usedFormatted: formatFileSize(storageUsed),
          limitFormatted: formatFileSize(storageLimit),
          percentage: Math.min(storagePercentage, 100)
        },
        recentDocuments: recentDocuments || []
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Document stats API error:', error);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}