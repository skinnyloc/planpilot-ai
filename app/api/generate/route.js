import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { openaiService, contentGenerator } from '@/lib/ai/openai';
import { TemplateManager, ContentEnhancer, CONTENT_TYPES, GRANT_TYPES } from '@/lib/ai/templates';
import { documentService } from '@/lib/storage';

/**
 * AI Content Generation API Route
 *
 * POST: Generate AI content based on type and parameters
 * Supports: business plans, grant proposals, pitch decks, and more
 */
export async function POST(request) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      type,
      ideaId,
      mode = 'generate', // 'generate', 'regenerate', 'enhance'
      grant,
      parameters = {},
      stream = false,
      saveToDocuments = true
    } = body;

    // Validate required parameters
    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Content type is required' },
        { status: 400 }
      );
    }

    // Validate content type
    const validTypes = Object.values(CONTENT_TYPES);
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid content type. Supported types: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get template and validate parameters
    let template;
    if (type === CONTENT_TYPES.GRANT_PROPOSAL && grant) {
      template = TemplateManager.getGrantTemplate(grant);
      if (!template) {
        return NextResponse.json(
          { success: false, error: `Invalid grant type: ${grant}` },
          { status: 400 }
        );
      }
    } else {
      template = TemplateManager.getTemplate(type);
    }

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found for specified type' },
        { status: 400 }
      );
    }

    // Load business idea if ideaId provided
    let businessIdea = null;
    if (ideaId) {
      const { data: idea, error: ideaError } = await supabase
        .from('business_ideas')
        .select('*')
        .eq('id', ideaId)
        .eq('user_id', userId)
        .single();

      if (ideaError) {
        console.error('Error loading business idea:', ideaError);
      } else {
        businessIdea = idea;
        // Merge business idea data into parameters
        parameters.businessName = parameters.businessName || idea.name;
        parameters.businessIdea = parameters.businessIdea || idea.summary;
        parameters.industry = parameters.industry || idea.industry;
        parameters.targetMarket = parameters.targetMarket || idea.target_market;
      }
    }

    // Validate template parameters
    if (template.getParameters) {
      const validation = TemplateManager.validateParameters(type, parameters);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: 'Invalid parameters', details: validation.errors },
          { status: 400 }
        );
      }
    }

    // Build prompt based on type and template
    let prompt;
    try {
      if (type === CONTENT_TYPES.BUSINESS_PLAN) {
        prompt = template.buildPrompt(parameters);
      } else if (type === CONTENT_TYPES.GRANT_PROPOSAL) {
        prompt = template.buildPrompt(parameters);
      } else if (type === CONTENT_TYPES.PITCH_DECK) {
        prompt = template.buildPrompt(parameters);
      } else {
        // Generic template building
        prompt = template.buildPrompt ? template.buildPrompt(parameters) : template.prompt;
      }
    } catch (error) {
      console.error('Error building prompt:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to build generation prompt' },
        { status: 500 }
      );
    }

    // Estimate tokens and check limits
    const estimatedTokens = TemplateManager.estimateTokens(type);
    const maxTokens = Math.min(estimatedTokens, 4000);

    // Generate content
    let generationResult;
    try {
      if (stream) {
        // Handle streaming response
        return handleStreamingGeneration(prompt, userId, maxTokens);
      } else {
        // Generate content synchronously
        generationResult = await openaiService.generateContent({
          prompt,
          maxTokens,
          temperature: 0.7,
          userId,
          stream: false
        });
      }
    } catch (error) {
      console.error('Content generation error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to generate content' },
        { status: 500 }
      );
    }

    if (!generationResult.success) {
      return NextResponse.json(
        { success: false, error: generationResult.error || 'Generation failed' },
        { status: 500 }
      );
    }

    // Enhance and format content
    const formattedContent = ContentEnhancer.formatContent(generationResult.content, type);
    const contentMetrics = ContentEnhancer.extractMetrics(formattedContent);

    // Prepare generation metadata
    const generationMetadata = {
      type,
      grant,
      ideaId,
      parameters,
      usage: generationResult.usage,
      model: generationResult.model,
      mode,
      timestamp: new Date().toISOString(),
      metrics: contentMetrics
    };

    // Save to documents if requested
    let documentId = null;
    if (saveToDocuments) {
      try {
        const documentTitle = generateDocumentTitle(type, grant, parameters);
        const documentResult = await saveGeneratedContent({
          userId,
          title: documentTitle,
          content: formattedContent,
          type,
          grant,
          metadata: generationMetadata
        });

        if (documentResult.success) {
          documentId = documentResult.document.id;
        }
      } catch (error) {
        console.error('Error saving generated content:', error);
        // Don't fail the whole request if saving fails
      }
    }

    // Log generation activity
    try {
      await logGenerationActivity({
        userId,
        type,
        grant,
        ideaId,
        documentId,
        usage: generationResult.usage,
        success: true
      });
    } catch (error) {
      console.error('Error logging generation activity:', error);
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      content: formattedContent,
      metadata: generationMetadata,
      documentId,
      usage: generationResult.usage,
      metrics: contentMetrics
    });

  } catch (error) {
    console.error('Generation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle streaming content generation
 */
async function handleStreamingGeneration(prompt, userId, maxTokens) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const generator = openaiService.generateStreamingContent({
          prompt,
          maxTokens,
          temperature: 0.7,
          userId,
          stream: true
        });

        for await (const chunk of generator) {
          const data = `data: ${JSON.stringify(chunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        // Send completion signal
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();

      } catch (error) {
        console.error('Streaming error:', error);
        const errorData = `data: ${JSON.stringify({ error: error.message })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

/**
 * Save generated content to documents storage
 */
async function saveGeneratedContent({
  userId,
  title,
  content,
  type,
  grant,
  metadata
}) {
  try {
    // Create a text file with the content
    const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const file = new File([blob], fileName, { type: 'text/markdown' });

    // Upload to storage
    const uploadResult = await documentService.uploadDocument(userId, file, {
      document_type: getDocumentType(type),
      description: `AI-generated ${type.replace('_', ' ')} ${grant ? `(${grant})` : ''}`,
      tags: ['ai-generated', type, ...(grant ? [grant] : [])],
      generation_metadata: metadata
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.error);
    }

    // Save to database with generation metadata
    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        ...uploadResult.document,
        generation_metadata: metadata
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, document };

  } catch (error) {
    console.error('Error saving generated content:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate document title based on content type and parameters
 */
function generateDocumentTitle(type, grant, parameters) {
  const timestamp = new Date().toLocaleDateString();

  switch (type) {
    case CONTENT_TYPES.BUSINESS_PLAN:
      const businessName = parameters.businessName || 'Business';
      return `${businessName} Business Plan - ${timestamp}`;

    case CONTENT_TYPES.GRANT_PROPOSAL:
      const grantName = grant ? grant.toUpperCase() : 'Grant';
      const projectTitle = parameters.projectTitle || parameters.businessName || 'Project';
      return `${grantName} Grant Proposal - ${projectTitle} - ${timestamp}`;

    case CONTENT_TYPES.PITCH_DECK:
      const companyName = parameters.businessName || 'Company';
      return `${companyName} Pitch Deck - ${timestamp}`;

    default:
      return `AI Generated ${type.replace('_', ' ')} - ${timestamp}`;
  }
}

/**
 * Map content type to document type
 */
function getDocumentType(contentType) {
  const mapping = {
    [CONTENT_TYPES.BUSINESS_PLAN]: 'business_plan',
    [CONTENT_TYPES.GRANT_PROPOSAL]: 'grant_proposal',
    [CONTENT_TYPES.PITCH_DECK]: 'pitch_deck',
    [CONTENT_TYPES.MARKET_ANALYSIS]: 'research_document',
    [CONTENT_TYPES.FINANCIAL_PLAN]: 'financial_document'
  };

  return mapping[contentType] || 'other';
}

/**
 * Log generation activity for analytics
 */
async function logGenerationActivity({
  userId,
  type,
  grant,
  ideaId,
  documentId,
  usage,
  success
}) {
  try {
    await supabase
      .from('generation_logs')
      .insert({
        user_id: userId,
        content_type: type,
        grant_type: grant,
        business_idea_id: ideaId,
        document_id: documentId,
        tokens_used: usage?.totalTokens || 0,
        success,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging generation activity:', error);
  }
}

/**
 * GET: Get generation templates and capabilities
 */
export async function GET(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const templates = TemplateManager.getAllTemplates();
    const contentTypes = Object.values(CONTENT_TYPES);
    const grantTypes = Object.values(GRANT_TYPES);

    return NextResponse.json({
      success: true,
      templates,
      contentTypes,
      grantTypes,
      capabilities: {
        streaming: true,
        maxTokens: 4000,
        supportedFormats: ['markdown', 'text'],
        rateLimit: '10 requests per minute'
      }
    });

  } catch (error) {
    console.error('Get templates error:', error);
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}