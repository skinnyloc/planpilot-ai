import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (\!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    // Build query
    let query = supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Filter by type if specified
    if (type && type \!== "all") {
      query = query.eq("document_type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: data || []
    });

  } catch (error) {
    console.error("Documents API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch documents",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (\!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { title, document_type, storage_key, description, file_size, mime_type } = await request.json();

    // Validate required fields
    if (\!title || \!document_type || \!storage_key) {
      return NextResponse.json(
        { error: "Title, document_type, and storage_key are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("documents")
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
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to create document record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document: data
    });

  } catch (error) {
    console.error("Documents POST API error:", error);
    return NextResponse.json(
      {
        error: "Failed to create document",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
