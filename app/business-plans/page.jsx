'use client';

import { useState, useEffect } from 'react';
import { Wand2, Loader2, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import ProtectedRoute from '@/lib/components/ProtectedRoute';

function BusinessPlansContent() {
    const [ideas, setIdeas] = useState([]);
    const [selectedIdeaId, setSelectedIdeaId] = useState('');
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchIdeas = async () => {
            const stored = localStorage.getItem('businessIdeas');
            if (stored) {
                setIdeas(JSON.parse(stored));
            }
        };
        fetchIdeas();
    }, []);

    const handleGenerate = async () => {
        if (!selectedIdeaId) return;
        const idea = ideas.find(i => i.id === selectedIdeaId);
        if (!idea) return;

        setIsGenerating(true);
        setGeneratedPlan(null);

        // AI-powered business plan generation
        setTimeout(() => {
            const generatedContent = `# ${idea.business_name} Business Plan

## Executive Summary

${idea.business_name} represents ${idea.years_in_business > 0 ? `an established enterprise with ${idea.years_in_business} years of proven market presence` : 'an innovative new venture positioned to disrupt the market'}, specifically designed to address ${idea.problem_solved || 'critical market inefficiencies and unmet customer needs'}.

Our mission is clear: ${idea.mission_statement || 'To deliver exceptional value through innovative solutions while building a sustainable, profitable enterprise that benefits all stakeholders.'}

With projected startup costs of $${(idea.startup_costs || 50000).toLocaleString()}, we anticipate breaking even within 18-24 months and achieving sustainable profitability by year three.

## Company Description

### Business Overview
${idea.business_name} is strategically headquartered at ${idea.business_address || 'a prime business location'}, positioning us at the heart of the ${idea.industry || 'dynamic and growing'} industry. Our company specializes in ${idea.concept || 'delivering cutting-edge solutions that combine innovation with practical application'}.

### Industry Analysis
The ${idea.industry || 'target'} industry presents significant opportunities for growth and innovation. Current market trends indicate strong demand for solutions that address ${idea.problem_solved || 'evolving customer needs and technological advancement'}.

## Problem Statement & Market Opportunity

### The Challenge
The market currently faces a critical challenge: ${idea.problem_solved || 'inefficient processes and outdated solutions that fail to meet modern demands'}. This creates a substantial opportunity for innovative companies like ${idea.business_name} to provide superior alternatives.

### Our Solution
We have developed a comprehensive approach that leverages ${idea.competitive_advantage || 'our unique expertise, advanced technology, and deep market understanding'} to deliver solutions that not only address current challenges but anticipate future needs.

## Market Analysis & Strategy

### Target Market
Our primary market consists of ${idea.target_market || 'forward-thinking organizations and individuals who value quality, innovation, and results'}. Through extensive market research, we have identified significant demand within this segment.

### Competitive Advantage
${idea.competitive_advantage || 'Our unique positioning combines industry expertise with innovative technology, allowing us to deliver superior value while maintaining competitive pricing.'}

### Marketing Strategy
Our go-to-market strategy focuses on building strong relationships with our target audience through:
- Digital marketing and content strategy
- Strategic partnerships and networking
- Direct sales and customer referrals
- Industry events and thought leadership

## Products & Services

### Core Offerings
${idea.concept || 'Our flagship products and services are designed to deliver immediate value while building long-term customer relationships.'}

### Revenue Model
${idea.revenue_model || 'We operate on a diversified revenue model that includes direct sales, subscription services, and strategic partnerships, ensuring multiple income streams and reduced risk.'}

## Financial Projections

### Startup Investment
Initial investment requirement: $${(idea.startup_costs || 50000).toLocaleString()}

### Revenue Projections
- Year 1: $${((idea.startup_costs || 50000) * 1.5).toLocaleString()}
- Year 2: $${((idea.startup_costs || 50000) * 3).toLocaleString()}
- Year 3: $${((idea.startup_costs || 50000) * 5).toLocaleString()}

### Break-even Analysis
Based on our conservative projections, we expect to achieve break-even by month 18, with positive cash flow thereafter.

## Operations & Management

### Location Strategy
Our operations are based in ${idea.location || 'strategically selected locations that optimize both operational efficiency and market access'}.

### Business Goals
${idea.business_goals || 'Our primary objectives include: achieving sustainable growth, expanding market presence, maintaining operational excellence, and delivering consistent value to all stakeholders.'}

## Risk Management

We have identified potential risks and developed mitigation strategies including:
- Market diversification
- Strong financial management
- Continuous innovation and adaptation
- Strategic partnerships and alliances

## Implementation Timeline

### Phase 1 (Months 1-6): Foundation
- Secure initial funding
- Establish core operations
- Build initial customer base

### Phase 2 (Months 7-12): Growth
- Scale operations
- Expand market presence
- Develop strategic partnerships

### Phase 3 (Months 13-24): Expansion
- Market expansion
- Product/service enhancement
- Achieve profitability

${idea.extra_prompt ? `
## Additional Strategic Considerations

${idea.extra_prompt}

These additional factors have been carefully integrated into our overall business strategy to ensure comprehensive planning and execution.` : ''}

## Conclusion

${idea.business_name} represents a compelling investment opportunity with strong market potential, experienced leadership, and a clear path to profitability. We are committed to building a sustainable business that delivers value to customers, investors, and the broader community.

With the right support and execution of this business plan, we are confident in our ability to achieve our ambitious goals and establish ${idea.business_name} as a leader in the ${idea.industry || 'industry'}.`;

            setGeneratedPlan({
                ideaId: selectedIdeaId,
                content: generatedContent,
                business_name: idea.business_name,
                pdf_url: null
            });
            setIsGenerating(false);
        }, 2000);
    };

    const handleSaveAndExport = async () => {
        if (!generatedPlan) return;
        setIsSaving(true);

        try {
            // Create professional PDF using jsPDF
            const pdf = new jsPDF();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 20;
            const lineHeight = 6;
            let yPosition = 30;

            // Helper function to add text with word wrapping
            const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
                pdf.setFontSize(fontSize);
                const lines = pdf.splitTextToSize(text, maxWidth);
                pdf.text(lines, x, y);
                return y + (lines.length * lineHeight);
            };

            // Header
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${generatedPlan.business_name}`, margin, yPosition);
            yPosition += 10;

            pdf.setFontSize(16);
            pdf.text('Business Plan', margin, yPosition);
            yPosition += 15;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
            yPosition += 20;

            // Process content sections
            const sections = generatedPlan.content.split(/^#\s/m).filter(section => section.trim());

            sections.forEach((section, index) => {
                const lines = section.split('\n').filter(line => line.trim());
                if (lines.length === 0) return;

                // Check if we need a new page
                if (yPosition > 250) {
                    pdf.addPage();
                    yPosition = 30;
                }

                // Section title
                const title = lines[0].replace(/^#+\s*/, '').trim();
                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                yPosition = addWrappedText(title, margin, yPosition, pageWidth - 2 * margin, 14);
                yPosition += 5;

                // Section content
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // Check for subsections
                    if (line.startsWith('##')) {
                        yPosition += 3;
                        pdf.setFont('helvetica', 'bold');
                        yPosition = addWrappedText(line.replace(/^#+\s*/, ''), margin, yPosition, pageWidth - 2 * margin, 12);
                        pdf.setFont('helvetica', 'normal');
                        yPosition += 3;
                    } else if (line.startsWith('###')) {
                        yPosition += 2;
                        pdf.setFont('helvetica', 'bold');
                        yPosition = addWrappedText(line.replace(/^#+\s*/, ''), margin, yPosition, pageWidth - 2 * margin, 11);
                        pdf.setFont('helvetica', 'normal');
                        yPosition += 2;
                    } else {
                        yPosition = addWrappedText(line, margin, yPosition, pageWidth - 2 * margin);
                        yPosition += 2;
                    }

                    // Add new page if needed
                    if (yPosition > 270) {
                        pdf.addPage();
                        yPosition = 30;
                    }
                }
                yPosition += 8;
            });

            // Download the PDF
            pdf.save(`${generatedPlan.business_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_business_plan.pdf`);

            // Save business plan to localStorage for grant proposals section
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000);
            const businessPlanData = {
                id: `${timestamp}_${random}`,
                business_name: generatedPlan.business_name,
                content: generatedPlan.content,
                created_date: new Date().toISOString(),
                pdf_url: null, // In real app, this would be the uploaded PDF URL
                generated_from_idea_id: generatedPlan.ideaId
            };

            // Save to business plans storage
            const existingPlans = JSON.parse(localStorage.getItem('businessPlans') || '[]');
            const updatedPlans = [businessPlanData, ...existingPlans];
            localStorage.setItem('businessPlans', JSON.stringify(updatedPlans));

            setIsSaving(false);
            alert('Professional business plan downloaded and saved successfully!');
        } catch (error) {
            console.error('Save/export error:', error);
            setIsSaving(false);
            alert('Error creating business plan PDF. Please try again.');
        }
    };

    const formatMarkdown = (content) => {
        return content
            .replace(/^# (.+)$/gm, '<h1 style="font-size: 1.5rem; font-weight: bold; color: #fafafa; margin: 1.5rem 0 0.75rem 0;">$1</h1>')
            .replace(/^## (.+)$/gm, '<h2 style="font-size: 1.25rem; font-weight: 600; color: #f59e0b; margin: 1.25rem 0 0.5rem 0;">$1</h2>')
            .replace(/^### (.+)$/gm, '<h3 style="font-size: 1.1rem; font-weight: 600; color: #fafafa; margin: 1rem 0 0.5rem 0;">$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong style="color: #f59e0b;">$1</strong>')
            .replace(/\n\n/g, '</p><p style="color: #ccc; line-height: 1.6; margin-bottom: 1rem;">')
            .replace(/^(.+)$/gm, '<p style="color: #ccc; line-height: 1.6; margin-bottom: 1rem;">$1</p>')
            .replace(/<p style="color: #ccc; line-height: 1.6; margin-bottom: 1rem;"><h/g, '<h')
            .replace(/h[1-3]><\/p>/g, '>');
    };

    return (
        <div style={{ padding: '32px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#fafafa',
                    marginBottom: '8px'
                }}>
                    Business Plan Generator
                </h1>
                <p style={{ color: '#999', fontSize: '1rem', margin: 0 }}>
                    Generate comprehensive business plans from your saved ideas.
                </p>
            </div>

            {/* Generation Card */}
            <div style={{
                backgroundColor: '#000',
                border: '1px solid #f59e0b',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '32px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px'
                }}>
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#fafafa',
                        margin: 0
                    }}>
                        Generate a New Plan
                    </h3>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#ccc',
                            marginBottom: '8px'
                        }}>
                            Select Business Idea
                        </label>
                        <select
                            value={selectedIdeaId}
                            onChange={(e) => setSelectedIdeaId(e.target.value)}
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                padding: '12px',
                                border: '1px solid #f59e0b',
                                borderRadius: '8px',
                                backgroundColor: '#000',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        >
                            <option value="">Select a business idea</option>
                            {ideas.map(idea => (
                                <option key={idea.id} value={idea.id}>
                                    {idea.business_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!selectedIdeaId || isGenerating}
                        style={{
                            backgroundColor: selectedIdeaId && !isGenerating ? '#f59e0b' : '#666',
                            color: selectedIdeaId && !isGenerating ? '#000' : '#999',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '14px 24px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: selectedIdeaId && !isGenerating ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: 'fit-content'
                        }}
                    >
                        {isGenerating ? (
                            <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <Wand2 style={{ width: '16px', height: '16px' }} />
                        )}
                        {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </button>
                </div>
            </div>

            {/* Generated Plan Display */}
            {generatedPlan && (
                <div style={{
                    backgroundColor: '#000',
                    border: '1px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '24px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px',
                        paddingBottom: '16px',
                        borderBottom: '1px solid #f59e0b'
                    }}>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: '#fafafa',
                            margin: 0
                        }}>
                            Generated Plan for: {generatedPlan.business_name}
                        </h3>
                        <button
                            onClick={handleSaveAndExport}
                            disabled={isSaving}
                            style={{
                                backgroundColor: '#f59e0b',
                                color: '#000',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: isSaving ? 0.7 : 1
                            }}
                        >
                            {isSaving ? (
                                <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                            ) : (
                                <Download style={{ width: '16px', height: '16px' }} />
                            )}
                            {isSaving ? 'Saving...' : 'Save & Export PDF'}
                        </button>
                    </div>

                    <div
                        style={{
                            maxHeight: '600px',
                            overflowY: 'auto',
                            padding: '16px',
                            backgroundColor: '#1a1a1a',
                            borderRadius: '8px',
                            border: '1px solid #333'
                        }}
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(generatedPlan.content) }}
                    />
                </div>
            )}

            {/* Empty State */}
            {!generatedPlan && !isGenerating && (
                <div style={{
                    backgroundColor: '#000',
                    border: '1px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '48px',
                    textAlign: 'center',
                    minHeight: '300px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <FileText style={{ width: '48px', height: '48px', color: '#555', marginBottom: '16px' }} />
                    <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#fafafa',
                        marginBottom: '8px'
                    }}>
                        Your generated plan will appear here
                    </h3>
                    <p style={{
                        color: '#999',
                        fontSize: '14px',
                        margin: 0
                    }}>
                        Select an idea and click "Generate" to create your business plan.
                    </p>
                </div>
            )}
        </div>
    );
}

export default function BusinessPlansPage() {
    return (
        <ProtectedRoute>
            <BusinessPlansContent />
        </ProtectedRoute>
    );
}