export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || url === "https://your-project.supabase.co" || key === "your-service-role-key") {
    return null;
  }

  return createClient(url, key);
}

export async function GET(request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const type = searchParams.get('type') || 'users';

    if (type === 'users') {
      const users = await clerkClient.users.getUserList({
        limit: 1000
      });

      const userIds = users.map(user => user.id);

      const supabase = getSupabaseClient();
      let profiles = [];
      let documents = [];

      if (supabase) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        const { data: documentsData } = await supabase
          .from('documents')
          .select('user_id, id, title, document_type, created_at, file_size')
          .in('user_id', userIds);

        profiles = profilesData || [];
        documents = documentsData || [];
      }

      const documentCountMap = documents?.reduce((acc, doc) => {
        acc[doc.user_id] = (acc[doc.user_id] || 0) + 1;
        return acc;
      }, {}) || {};

      const exportData = users.map(user => {
        const profile = profiles?.find(p => p.id === user.id);
        const userDocuments = documents?.filter(d => d.user_id === user.id) || [];

        return {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt,
          lastActiveAt: user.lastActiveAt,
          subscriptionStatus: profile?.subscription_status || 'free',
          subscriptionPlan: profile?.subscription_plan || null,
          subscriptionEndDate: profile?.subscription_end_date,
          documentCount: documentCountMap[user.id] || 0,
          totalFileSize: userDocuments.reduce((sum, doc) => sum + (doc.file_size || 0), 0),
          documents: userDocuments.map(doc => ({
            id: doc.id,
            title: doc.title,
            type: doc.document_type,
            createdAt: doc.created_at,
            fileSize: doc.file_size
          }))
        };
      });

      if (format === 'csv') {
        const csvHeaders = [
          'ID', 'Email', 'First Name', 'Last Name', 'Created At', 'Last Active',
          'Subscription Status', 'Subscription Plan', 'Subscription End Date',
          'Document Count', 'Total File Size (bytes)'
        ];

        const csvRows = exportData.map(user => [
          user.id,
          user.email,
          user.firstName || '',
          user.lastName || '',
          user.createdAt,
          user.lastActiveAt || '',
          user.subscriptionStatus,
          user.subscriptionPlan || '',
          user.subscriptionEndDate || '',
          user.documentCount,
          user.totalFileSize
        ]);

        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.map(field =>
            typeof field === 'string' && field.includes(',')
              ? `"${field.replace(/"/g, '""')}"`
              : field
          ).join(','))
        ].join('\n');

        return new Response(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: exportData,
        exportedAt: new Date().toISOString(),
        totalUsers: exportData.length
      });
    }

    if (type === 'documents') {
      const supabase = getSupabaseClient();
      let documents = [];

      if (supabase) {
        const { data: documentsData } = await supabase
          .from('documents')
          .select(`
            *,
            profiles:user_id (
              id
            )
          `)
          .order('created_at', { ascending: false });

        documents = documentsData || [];
      }

      const users = await clerkClient.users.getUserList({
        userIds: [...new Set(documents?.map(d => d.user_id) || [])]
      });

      const userMap = users.reduce((acc, user) => {
        acc[user.id] = {
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName
        };
        return acc;
      }, {});

      const exportData = documents?.map(doc => ({
        id: doc.id,
        title: doc.title,
        documentType: doc.document_type,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        userId: doc.user_id,
        userEmail: userMap[doc.user_id]?.email || 'Unknown',
        userName: `${userMap[doc.user_id]?.firstName || ''} ${userMap[doc.user_id]?.lastName || ''}`.trim() || 'Unknown'
      })) || [];

      if (format === 'csv') {
        const csvHeaders = [
          'ID', 'Title', 'Document Type', 'File Size (bytes)', 'MIME Type',
          'Created At', 'Updated At', 'User ID', 'User Email', 'User Name'
        ];

        const csvRows = exportData.map(doc => [
          doc.id,
          doc.title,
          doc.documentType,
          doc.fileSize,
          doc.mimeType,
          doc.createdAt,
          doc.updatedAt,
          doc.userId,
          doc.userEmail,
          doc.userName
        ]);

        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.map(field =>
            typeof field === 'string' && field.includes(',')
              ? `"${field.replace(/"/g, '""')}"`
              : field
          ).join(','))
        ].join('\n');

        return new Response(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="documents-export-${new Date().toISOString().split('T')[0]}.csv"`
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: exportData,
        exportedAt: new Date().toISOString(),
        totalDocuments: exportData.length
      });
    }

    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });

  } catch (error) {
    console.error('Admin export API error:', error);

    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to export data'
    }, { status: 500 });
  }
}