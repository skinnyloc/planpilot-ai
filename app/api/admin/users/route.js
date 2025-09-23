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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const users = await clerkClient.users.getUserList({
      limit,
      offset,
      orderBy: '-created_at'
    });

    const userIds = users.map(user => user.id);

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        users: [],
        totalCount: 0,
        page,
        limit
      });
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, subscription_status, subscription_plan, subscription_end_date, created_at')
      .in('id', userIds);

    const { data: documentCounts } = await supabase
      .from('documents')
      .select('user_id')
      .in('user_id', userIds);

    const documentCountMap = documentCounts?.reduce((acc, doc) => {
      acc[doc.user_id] = (acc[doc.user_id] || 0) + 1;
      return acc;
    }, {}) || {};

    const enrichedUsers = users.map(user => {
      const profile = profiles?.find(p => p.id === user.id);
      const documentCount = documentCountMap[user.id] || 0;

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
        documentCount,
        profileCreatedAt: profile?.created_at
      };
    });

    return NextResponse.json({
      success: true,
      users: enrichedUsers,
      totalCount: users.length,
      page,
      limit
    });

  } catch (error) {
    console.error('Admin users API error:', error);

    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin();

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await clerkClient.users.deleteUser(userId);

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Admin delete user error:', error);

    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to delete user'
    }, { status: 500 });
  }
}