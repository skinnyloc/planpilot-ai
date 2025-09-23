export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || url === "https://your-project.supabase.co" || key === "your-service-role-key") {
    // Return null for demo/build environments
    return null;
  }

  return createClient(url, key);
}

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
    const type = searchParams.get("type");

    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: "Database not configured",
        documents: [],
        total: 0
      }, { status: 500 });
    }

    // Query documents from Supabase with RLS
    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (type && type !== "all") {
      query = query.eq('document_type', type);
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: "Failed to fetch documents",
        documents: [],
        total: 0
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      documents: documents || [],
      total: documents?.length || 0,
      message: 'Documents retrieved successfully'
    });

  } catch (error) {
    console.error("Documents API error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch documents",
      documents: [],
      total: 0
    }, { status: 500 });
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

    const { title, document_type, storage_key, description, file_size, mime_type } = await request.json();

    if (!title || !document_type || !storage_key) {
      return NextResponse.json({
        error: "Title, document_type, and storage_key are required"
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json({
        error: "Database not configured"
      }, { status: 500 });
    }

    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        title,
        document_type,
        storage_key,
        description,
        file_size,
        mime_type: mime_type || "application/pdf"
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({
        error: "Failed to create document"
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      document
    });

  } catch (error) {
    console.error("Documents POST API error:", error);
    return NextResponse.json({
      error: "Failed to create document"
    }, { status: 500 });
  }
}