import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { source, key, documentId, modes } = await request.json();

    // Validate required fields
    if (!source || !modes || modes.length === 0) {
      return NextResponse.json(
        { error: 'Source and modes are required' },
        { status: 400 }
      );
    }

    if (source === 'pdf' && !key) {
      return NextResponse.json(
        { error: 'Key is required for PDF source' },
        { status: 400 }
      );
    }

    if (source === 'document' && !documentId) {
      return NextResponse.json(
        { error: 'DocumentId is required for document source' },
        { status: 400 }
      );
    }

    let businessPlanContent = '';

    try {
      if (source === 'pdf') {
        // Analyze PDF content
        const analyzeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/proposals/analyze-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization'),
          },
          body: JSON.stringify({ key })
        });

        if (!analyzeResponse.ok) {
          throw new Error('Failed to analyze PDF');
        }

        const analyzeResult = await analyzeResponse.json();
        businessPlanContent = analyzeResult.planText;

      } else if (source === 'document') {
        // Load document from database
        const { data: document, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .eq('user_id', userId)
          .single();

        if (error || !document) {
          throw new Error('Document not found or access denied');
        }

        // For this demo, we'll use a placeholder. In production, you'd load the actual content
        businessPlanContent = `Business Plan: ${document.title}\nType: ${document.document_type}\nCreated: ${document.created_at}`;
      }

      // Generate proposals for each mode
      const proposals = [];
      for (const mode of modes) {
        const proposal = await generateProposalForMode(mode, businessPlanContent, userId);
        proposals.push(proposal);
      }

      // Save generated proposals to documents table
      const savedProposals = [];
      for (const proposal of proposals) {
        const { data: savedDoc, error } = await supabase
          .from('documents')
          .insert({
            user_id: userId,
            title: proposal.title,
            document_type: 'proposal',
            storage_key: `proposals/${userId}/${Date.now()}_${proposal.filename}`,
            description: proposal.description,
            file_size: proposal.content.length,
            mime_type: 'text/markdown'
          })
          .select()
          .single();

        if (!error && savedDoc) {
          savedProposals.push(savedDoc);
        }
      }

      return NextResponse.json({
        success: true,
        proposals: savedProposals,
        count: savedProposals.length
      });

    } catch (error) {
      console.error('Proposal generation error:', error);
      return NextResponse.json(
        { error: 'Failed to generate proposals' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Proposals generate route error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate proposals',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

async function generateProposalForMode(mode, businessPlanContent, userId) {
  const templates = {
    bank: {
      title: 'Bank Loan Application',
      description: 'Professional bank loan application based on your business plan',
      filename: 'bank_loan_application.md'
    },
    investor: {
      title: 'Investor Pitch Presentation',
      description: 'Comprehensive investor pitch presentation',
      filename: 'investor_pitch.md'
    },
    loan: {
      title: 'General Loan Application',
      description: 'General loan application document',
      filename: 'loan_application.md'
    },
    grant: {
      title: 'Grant Proposal Match',
      description: 'Grant proposal matched to available opportunities',
      filename: 'grant_proposal.md'
    }
  };

  const template = templates[mode] || templates.loan;

  // In a real implementation, this would call OpenAI API
  // For demo purposes, we'll generate a basic template
  const content = `# ${template.title}

## Executive Summary

Based on the provided business plan, this ${template.title.toLowerCase()} presents a compelling opportunity for funding. Our business demonstrates strong market potential, experienced leadership, and a clear path to profitability.

## Business Overview

${businessPlanContent.substring(0, 500)}...

## Financial Requirements

- Requested Amount: $250,000
- Use of Funds: Working capital, equipment, and growth initiatives
- Repayment Terms: 36-60 months
- Collateral: Business assets and personal guarantees

## Market Analysis

Our target market shows significant growth potential with strong demand for our products/services. Market research indicates favorable conditions for business expansion and revenue growth.

## Management Team

Our experienced leadership team brings together the necessary skills and expertise to execute this business plan successfully and ensure responsible use of funds.

## Financial Projections

- Year 1 Revenue: $500,000
- Year 2 Revenue: $750,000
- Year 3 Revenue: $1,000,000
- Break-even: Month 18
- ROI: 25% annually

## Risk Assessment

We have identified key business risks and developed comprehensive mitigation strategies to protect investor interests and ensure business continuity.

## Conclusion

This ${template.title.toLowerCase()} represents a low-risk, high-return opportunity. We are committed to transparent communication, responsible financial management, and delivering on our projected outcomes.

---

Generated on: ${new Date().toLocaleDateString()}
Business Plan Source: ${businessPlanContent.length > 0 ? 'Provided Document' : 'User Upload'}
Proposal Type: ${template.title}
`;

  return {
    ...template,
    content,
    mode
  };
}