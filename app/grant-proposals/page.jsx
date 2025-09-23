'use client';

import { useState, useEffect, useMemo } from 'react';
import { Wand2, Loader2, Download, AlertCircle, ExternalLink } from 'lucide-react';

const GrantList = ({ onSelect, selectedGrantId }) => {
    const [grants, setGrants] = useState([]);

    useEffect(() => {
        // Mock grant data
        const mockGrants = [
            {
                id: 1,
                title: "Small Business Innovation Research (SBIR) Grant",
                sponsor: "National Science Foundation",
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
                award_min: 50000,
                award_max: 1500000
            },
            {
                id: 2,
                title: "Minority Business Development Grant",
                sponsor: "Department of Commerce",
                due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
                award_min: 25000,
                award_max: 250000
            },
            {
                id: 3,
                title: "Women's Business Center Grant",
                sponsor: "Small Business Administration",
                due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
                award_min: 75000,
                award_max: 500000
            }
        ];
        setGrants(mockGrants);
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxHeight: '400px',
            overflowY: 'auto',
            paddingRight: '8px'
        }}>
            {grants.map(grant => (
                <div
                    key={grant.id}
                    style={{
                        backgroundColor: selectedGrantId === grant.id ? '#333' : '#000',
                        border: selectedGrantId === grant.id ? '2px solid #f59e0b' : '1px solid #f59e0b',
                        borderRadius: '8px',
                        padding: '16px',
                        cursor: 'pointer'
                    }}
                    onClick={() => onSelect(grant)}
                >
                    <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#fafafa',
                        marginBottom: '8px'
                    }}>
                        {grant.title}
                    </h4>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <p style={{
                            fontSize: '12px',
                            color: '#999',
                            margin: 0
                        }}>
                            {grant.sponsor} | Due: {new Date(grant.due_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </p>
                        <button
                            style={{
                                backgroundColor: selectedGrantId === grant.id ? '#f59e0b' : 'transparent',
                                color: selectedGrantId === grant.id ? '#000' : '#f59e0b',
                                border: '1px solid #f59e0b',
                                borderRadius: '4px',
                                padding: '4px 12px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}
                        >
                            {selectedGrantId === grant.id ? 'Selected' : 'Select'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function GrantProposalsPage() {
    const [ideas, setIdeas] = useState([]);
    const [selectedIdea, setSelectedIdea] = useState(null);
    const [selectedGrant, setSelectedGrant] = useState(null);
    const [proposalModes, setProposalModes] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedProposal, setGeneratedProposal] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('businessIdeas');
        if (stored) {
            setIdeas(JSON.parse(stored));
        }
    }, []);

    const MODES = ["Bank", "Investor", "Loan", "Match a Grant"];

    const handleModeChange = (mode, checked) => {
        setProposalModes(prev =>
            checked ? [...prev, mode] : prev.filter(m => m !== mode)
        );
    };

    const handleGenerate = async () => {
        setError('');
        if (!selectedIdea) {
            setError('Please select a business idea.');
            return;
        }
        if (proposalModes.length === 0) {
            setError('Please select at least one proposal mode.');
            return;
        }
        if (proposalModes.includes('Match a Grant') && !selectedGrant) {
            setError('Please select a grant for matched mode.');
            return;
        }

        setIsGenerating(true);
        setGeneratedProposal(null);

        // Simulate API call
        setTimeout(() => {
            const proposalContent = `# Grant Proposal

## Executive Summary
**Proposal for:** ${selectedIdea.business_name}
**Proposal Modes:** ${proposalModes.join(', ')}
${selectedGrant ? `**Targeted Grant:** ${selectedGrant.title}` : ''}

## Business Overview
${selectedIdea.business_name} is ${selectedIdea.years_in_business > 0 ? `an established business with ${selectedIdea.years_in_business} years` : 'a new venture'} focused on ${selectedIdea.problem_solved || 'solving key market challenges'}.

## Problem Statement
The primary challenge we address is: ${selectedIdea.problem_solved || 'significant market gaps that need innovative solutions'}.

## Proposed Solution
Our approach leverages ${selectedIdea.competitive_advantage || 'our unique capabilities and market understanding'} to deliver exceptional value.

## Market Opportunity
Target Market: ${selectedIdea.target_market || 'We serve a diverse customer base with varying needs and preferences.'}

## Financial Requirements
Startup Costs: $${selectedIdea.startup_costs || '50,000'}
Revenue Model: ${selectedIdea.revenue_model || 'Multiple revenue streams designed for sustainability and growth.'}

## Implementation Plan
Business Goals: ${selectedIdea.business_goals || 'Our primary objectives include sustainable growth, market expansion, and customer satisfaction.'}

${proposalModes.includes('Match a Grant') && selectedGrant ? `

## Grant Alignment
This proposal specifically addresses the requirements of the ${selectedGrant.title} from ${selectedGrant.sponsor}. We are requesting funding in the range of $${selectedGrant.award_min?.toLocaleString()} - $${selectedGrant.award_max?.toLocaleString()}.` : ''}

${selectedIdea.extra_prompt ? `

## Additional Considerations
${selectedIdea.extra_prompt}` : ''}`;

            setGeneratedProposal({
                content: proposalContent,
                pdf_url: '#'
            });
            setIsGenerating(false);
        }, 2000);
    };

    const formatMarkdown = (content) => {
        return content
            .replace(/^# (.+)$/gm, '<h1 style="font-size: 1.5rem; font-weight: bold; color: #fafafa; margin: 1.5rem 0 0.75rem 0;">$1</h1>')
            .replace(/^## (.+)$/gm, '<h2 style="font-size: 1.25rem; font-weight: 600; color: #f59e0b; margin: 1.25rem 0 0.5rem 0;">$1</h2>')
            .replace(/^### (.+)$/gm, '<h3 style="font-size: 1.1rem; font-weight: 600; color: #fafafa; margin: 1rem 0 0.5rem 0;">$3</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong style="color: #f59e0b;">$1</strong>')
            .replace(/\n\n/g, '</p><p style="color: #ccc; line-height: 1.6; margin-bottom: 1rem;">')
            .replace(/^(.+)$/gm, '<p style="color: #ccc; line-height: 1.6; margin-bottom: 1rem;">$1</p>')
            .replace(/<p style="color: #ccc; line-height: 1.6; margin-bottom: 1rem;"><h/g, '<h')
            .replace(/h[1-3]><\/p>/g, '>');
    };

    const isGenerateDisabled = !selectedIdea || proposalModes.length === 0 || (proposalModes.includes('Match a Grant') && !selectedGrant) || isGenerating;

    return (
        <div style={{ padding: '32px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#fafafa',
                    marginBottom: '8px'
                }}>
                    Grant Proposal Generator
                </h1>
                <p style={{ color: '#999', fontSize: '1rem', margin: 0 }}>
                    Create compelling proposals for funding opportunities.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '32px'
            }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Business Idea Selection */}
                    <div style={{
                        backgroundColor: '#000',
                        border: '1px solid #f59e0b',
                        borderRadius: '12px',
                        padding: '24px'
                    }}>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: '#fafafa',
                            marginBottom: '16px'
                        }}>
                            1. Select Business Idea
                        </h3>
                        <select
                            value={selectedIdea?.id || ''}
                            onChange={(e) => setSelectedIdea(ideas.find(i => i.id === e.target.value))}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #f59e0b',
                                borderRadius: '8px',
                                backgroundColor: '#000',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        >
                            <option value="">Choose a business...</option>
                            {ideas.map(idea => (
                                <option key={idea.id} value={idea.id}>
                                    {idea.business_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Proposal Mode Selection */}
                    <div style={{
                        backgroundColor: '#000',
                        border: '1px solid #f59e0b',
                        borderRadius: '12px',
                        padding: '24px'
                    }}>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: '#fafafa',
                            marginBottom: '16px'
                        }}>
                            2. Select Proposal Mode
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {MODES.map(mode => (
                                <label
                                    key={mode}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        color: '#fafafa'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={proposalModes.includes(mode)}
                                        onChange={(e) => handleModeChange(mode, e.target.checked)}
                                        style={{
                                            width: '16px',
                                            height: '16px',
                                            accentColor: '#f59e0b'
                                        }}
                                    />
                                    {mode}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Grant Selection (conditional) */}
                    {proposalModes.includes('Match a Grant') && (
                        <div style={{
                            backgroundColor: '#000',
                            border: '1px solid #f59e0b',
                            borderRadius: '12px',
                            padding: '24px'
                        }}>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                color: '#fafafa',
                                marginBottom: '16px'
                            }}>
                                3. Select Grant
                            </h3>
                            <GrantList onSelect={setSelectedGrant} selectedGrantId={selectedGrant?.id} />
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Generate Section */}
                    <div style={{
                        backgroundColor: '#000',
                        border: '1px solid #f59e0b',
                        borderRadius: '12px',
                        padding: '24px'
                    }}>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: '#fafafa',
                            marginBottom: '16px'
                        }}>
                            Generate Proposal
                        </h3>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerateDisabled}
                            style={{
                                width: '100%',
                                backgroundColor: isGenerateDisabled ? '#666' : '#f59e0b',
                                color: isGenerateDisabled ? '#999' : '#000',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '14px 24px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: isGenerateDisabled ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                marginBottom: '16px'
                            }}
                        >
                            {isGenerating ? (
                                <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                            ) : (
                                <Wand2 style={{ width: '16px', height: '16px' }} />
                            )}
                            Generate Proposal
                        </button>
                        {error && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#ff6b6b',
                                fontSize: '14px'
                            }}>
                                <AlertCircle style={{ width: '16px', height: '16px' }} />
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Generated Proposal Display */}
                    {generatedProposal && (
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
                                marginBottom: '16px',
                                paddingBottom: '16px',
                                borderBottom: '1px solid #f59e0b'
                            }}>
                                <h3 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    color: '#fafafa',
                                    margin: 0
                                }}>
                                    Generated Proposal
                                </h3>
                                <a
                                    href={generatedProposal.pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        backgroundColor: '#f59e0b',
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '8px 16px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Download style={{ width: '14px', height: '14px' }} />
                                    Download PDF
                                </a>
                            </div>
                            <div
                                style={{
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    padding: '16px',
                                    backgroundColor: '#1a1a1a',
                                    borderRadius: '8px',
                                    border: '1px solid #333'
                                }}
                                dangerouslySetInnerHTML={{ __html: formatMarkdown(generatedProposal.content) }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}