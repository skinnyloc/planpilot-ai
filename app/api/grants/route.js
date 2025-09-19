import { NextResponse } from 'next/server';
import { searchGrants } from "@/lib/services/grantDataService.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters = {
      searchTerm: searchParams.get('search') || '',
      categoryId: searchParams.get('category') || null,
      maxAmount: searchParams.get('maxAmount') ? parseInt(searchParams.get('maxAmount')) : null,
      minAmount: searchParams.get('minAmount') ? parseInt(searchParams.get('minAmount')) : null,
      deadline: searchParams.get('deadline') || null,
      agency: searchParams.get('agency') || null,
      tags: searchParams.get('tags') ? searchParams.get('tags').split(',') : [],
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    };

    const result = await searchGrants(filters);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Found ${result.total} grants`
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
    const grantData = await request.json();

    // TODO: Add authentication check for admin users
    // if (!isAdmin(request)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

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
      updated_at: new Date().toISOString()
    };

    // Save to database
    const { supabase } = await import('@/lib/supabase.js');
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