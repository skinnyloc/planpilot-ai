'use client';

import { useState, useEffect } from 'react';
import { Wand2, Loader2, FileText, Download } from 'lucide-react';

export default function BusinessPlansPage() {
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

        // Simulate AI generation - replace with actual API call
        setTimeout(() => {
            const generatedContent = `# Executive Summary

${idea.business_name} is ${idea.years_in_business > 0 ? `an established business with ${idea.years_in_business} years` : 'a new venture'} focused on ${idea.problem_solved || 'solving key market challenges'}.

## Mission Statement
${idea.mission_statement || 'To provide exceptional value to our customers while building sustainable growth.'}

# Company Description

Located at ${idea.business_address || 'our strategic location'}, ${idea.business_name} operates in the ${idea.industry || 'dynamic'} industry with a clear focus on ${idea.target_market || 'our target audience'}.

# Problem & Opportunity

The primary problem we address is: ${idea.problem_solved || 'significant market gaps that need innovative solutions'}.

Our competitive advantage lies in: ${idea.competitive_advantage || 'our unique approach and deep market understanding'}.

# Market Analysis

Target Market: ${idea.target_market || 'We serve a diverse customer base with varying needs and preferences.'}

Business Goals: ${idea.business_goals || 'Our primary objectives include sustainable growth, market expansion, and customer satisfaction.'}

# Organization and Management

The business is strategically positioned in ${idea.location || 'key market locations'} to maximize operational efficiency and customer reach.

# Products or Services

Core Concept: ${idea.concept || 'Our innovative approach combines industry best practices with cutting-edge solutions.'}

Revenue Model: ${idea.revenue_model || 'We generate revenue through multiple streams designed for long-term sustainability.'}

# Marketing and Sales Strategy

Our marketing approach focuses on reaching ${idea.target_market || 'our ideal customers'} through targeted campaigns and strategic partnerships.

# Financial Projections

Startup Costs: $${idea.startup_costs || '50,000'}

We project steady growth over the next three years based on market analysis and our unique positioning.

${idea.extra_prompt ? `

# Additional Considerations

${idea.extra_prompt}` : ''}`;

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

        // Simulate save/export - replace with actual functionality
        setTimeout(() => {
            alert('Business plan saved and exported successfully!');
            setIsSaving(false);
        }, 1000);
    };

    const formatMarkdown = (content) => {
        return content
            .replace(/^# (.+)$/gm, '<h1 style="font-size: 1.5rem; font-weight: bold; color: #fafafa; margin: 1.5rem 0 0.75rem 0;">$1</h1>')
            .replace(/^## (.+)$/gm, '<h2 style="font-size: 1.25rem; font-weight: 600; color: #f59e0b; margin: 1.25rem 0 0.5rem 0;">$1</h2>')
            .replace(/^### (.+)$/gm, '<h3 style="font-size: 1.1rem; font-weight: 600; color: #fafafa; margin: 1rem 0 0.5rem 0;">$3</h3>')
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