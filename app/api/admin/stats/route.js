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

export async function GET() {
  try {
    await requireAdmin();

    const totalUsers = await clerkClient.users.getCount();

    const supabase = getSupabaseClient();
    let profiles = [];
    let documents = [];

    if (supabase) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_plan, created_at');

      if (profilesError) {
        console.error('Supabase profiles error:', profilesError);
      } else {
        profiles = profilesData || [];
      }

      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('created_at, document_type, user_id');

      if (documentsError) {
        console.error('Supabase documents error:', documentsError);
      } else {
        documents = documentsData || [];
      }
    }

    const subscriptionStats = profiles?.reduce((acc, profile) => {
      const status = profile.subscription_status || 'free';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}) || { free: totalUsers };

    const planStats = profiles?.reduce((acc, profile) => {
      if (profile.subscription_plan) {
        acc[profile.subscription_plan] = (acc[profile.subscription_plan] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newUsersLast30Days = profiles?.filter(profile =>
      new Date(profile.created_at) > thirtyDaysAgo
    ).length || 0;

    const totalDocuments = documents?.length || 0;
    const documentsLast30Days = documents?.filter(doc =>
      new Date(doc.created_at) > thirtyDaysAgo
    ).length || 0;

    const documentTypeStats = documents?.reduce((acc, doc) => {
      acc[doc.document_type] = (acc[doc.document_type] || 0) + 1;
      return acc;
    }, {}) || {};

    const uniqueActiveUsers = new Set(documents?.map(doc => doc.user_id)).size || 0;

    const upcomingRenewals = profiles?.filter(profile => {
      if (!profile.subscription_end_date) return false;
      const endDate = new Date(profile.subscription_end_date);
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return endDate <= sevenDaysFromNow && endDate > now;
    }).length || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        newUsersLast30Days,
        totalDocuments,
        documentsLast30Days,
        uniqueActiveUsers,
        upcomingRenewals,
        subscriptionStats,
        planStats,
        documentTypeStats
      }
    });

  } catch (error) {
    console.error('Admin stats API error:', error);

    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch admin stats'
    }, { status: 500 });
  }
}