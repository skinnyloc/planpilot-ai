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

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Simple grants query
    let query = supabase
      .from('grants')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    const { data: grants, error, count } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        grants: grants || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      },
      message: `Found ${count || 0} grants`
    });

  } catch (error) {
    console.error('Grant search error:', error);

    return NextResponse.json(
      {
        error: 'Failed to search grants',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const grantData = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'description', 'agency'];
    for (const field of requiredFields) {
      if (!grantData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Add metadata
    const grantToSave = {
      ...grantData,
      status: 'active',
      verification_status: 'manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId
    };

    const { data, error } = await supabase
      .from('grants')
      .insert(grantToSave)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Grant created successfully'
    });

  } catch (error) {
    console.error('Grant creation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to create grant',
        details: error.message
      },
      { status: 500 }
    );
  }
}