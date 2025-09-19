import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    console.log('📄 Documents API called');

    // Extract query parameters and user ID from headers
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const userId = request.headers.get('x-user-id') || 'demo-user';

    console.log('🔍 Request params:', { type, userId });

    // Mock documents for demo - skip database for production demo
    const mockDocuments = [
      {
        id: '12b1e023-ea62-4e0b-9eec-a49de9b571df',
        filename: 'Business_Plan_Tech_Startup.pdf',
        title: 'Tech Startup Business Plan',
        document_type: 'business_plan',
        description: 'Comprehensive business plan for innovative tech startup',
        file_size: 524288,
        created_at: '2024-09-15T10:30:00Z',
        updated_at: '2024-09-15T10:30:00Z'
      },
      {
        id: '6ceb08ab-ee94-498f-94b5-7c52e8c522f0',
        filename: 'Restaurant_Business_Plan.pdf',
        title: 'Restaurant Business Plan',
        document_type: 'business_plan',
        description: 'Business plan for new restaurant venture',
        file_size: 445600,
        created_at: '2024-09-14T14:20:00Z',
        updated_at: '2024-09-14T14:20:00Z'
      },
      {
        id: 'a06974c0-19ea-4c3d-84ce-76c83bf198fb',
        filename: 'Grant_Proposal_Generated.md',
        title: 'Generated Grant Proposal',
        document_type: 'grant_proposal',
        description: 'AI-generated grant proposal',
        file_size: 12800,
        created_at: '2024-09-18T20:15:00Z',
        updated_at: '2024-09-18T20:15:00Z'
      }
    ];

    // Filter by type if specified
    let filteredDocuments = mockDocuments;
    if (type && type !== "all") {
      filteredDocuments = mockDocuments.filter(doc => doc.document_type === type);
      console.log(`📋 Filtered ${filteredDocuments.length} documents by type: ${type}`);
    }

    return NextResponse.json({
      success: true,
      documents: filteredDocuments,
      total: filteredDocuments.length,
      message: 'Documents retrieved successfully (demo data)'
    });

  } catch (error) {
    console.error("💥 Documents API error:", error);
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
    console.log('📝 Creating new document...');

    const { title, document_type, storage_key, description, file_size, mime_type } = await request.json();
    const userId = request.headers.get('x-user-id') || 'demo-user';

    // Validate required fields
    if (!title || !document_type || !storage_key) {
      return NextResponse.json({
        error: "Title, document_type, and storage_key are required"
      }, { status: 400 });
    }

    // Mock document creation for demo
    const mockDocument = {
      id: 'demo-doc-' + Date.now(),
      user_id: userId,
      title,
      document_type,
      storage_key,
      description,
      file_size,
      mime_type: mime_type || "application/pdf",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('✅ Mock document created:', mockDocument.id);

    return NextResponse.json({
      success: true,
      document: mockDocument
    });

  } catch (error) {
    console.error("💥 Documents POST API error:", error);
    return NextResponse.json({
      error: "Failed to create document",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 });
  }
}