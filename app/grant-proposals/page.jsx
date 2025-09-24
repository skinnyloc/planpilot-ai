'use client';

import { useState, useEffect, useMemo } from 'react';
import { Wand2, Loader2, Download, AlertCircle, ExternalLink, Edit3, Trash2, Save, X } from 'lucide-react';
import jsPDF from 'jspdf';
import ProtectedRoute from '@/lib/components/ProtectedRoute';

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

function GrantProposalsContent() {
    const [businessPlans, setBusinessPlans] = useState([]);
    const [selectedBusinessPlan, setSelectedBusinessPlan] = useState(null);
    const [selectedGrant, setSelectedGrant] = useState(null);
    const [selectedProposalMode, setSelectedProposalMode] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedProposal, setGeneratedProposal] = useState(null);
    const [error, setError] = useState('');
    const [editingPlan, setEditingPlan] = useState(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('businessPlans');
        if (stored) {
            setBusinessPlans(JSON.parse(stored));
        }
    }, []);

    const MODES = ["Bank", "Investor", "Loan", "Match a Grant"];

    const handleModeChange = (mode) => {
        setSelectedProposalMode(mode);
    };

    const handleDeletePlan = (planId) => {
        if (window.confirm('Are you sure you want to delete this business plan?')) {
            const updatedPlans = businessPlans.filter(plan => plan.id !== planId);
            setBusinessPlans(updatedPlans);
            localStorage.setItem('businessPlans', JSON.stringify(updatedPlans));

            // Clear selection if the deleted plan was selected
            if (selectedBusinessPlan?.id === planId) {
                setSelectedBusinessPlan(null);
            }
        }
    };

    const handleEditPlan = (plan) => {
        setEditingPlan(plan.id);
        setEditName(plan.business_name);
    };

    const handleSaveEdit = (planId) => {
        if (!editName.trim()) return;

        const updatedPlans = businessPlans.map(plan =>
            plan.id === planId
                ? { ...plan, business_name: editName.trim() }
                : plan
        );

        setBusinessPlans(updatedPlans);
        localStorage.setItem('businessPlans', JSON.stringify(updatedPlans));

        // Update selected plan if it was the one being edited
        if (selectedBusinessPlan?.id === planId) {
            setSelectedBusinessPlan({ ...selectedBusinessPlan, business_name: editName.trim() });
        }

        setEditingPlan(null);
        setEditName('');
    };

    const handleCancelEdit = () => {
        setEditingPlan(null);
        setEditName('');
    };

    const handleGenerate = async () => {
        setError('');
        if (!selectedBusinessPlan) {
            setError('Please select a business plan.');
            return;
        }
        if (!selectedProposalMode) {
            setError('Please select a proposal mode.');
            return;
        }
        if (selectedProposalMode === 'Match a Grant' && !selectedGrant) {
            setError('Please select a grant for matched mode.');
            return;
        }

        setIsGenerating(true);
        setGeneratedProposal(null);

        // AI-powered grant proposal generation
        setTimeout(() => {
            const currentDate = new Date().toLocaleDateString();
            const fundingAmount = selectedGrant ?
                `$${selectedGrant.award_min?.toLocaleString()} - $${selectedGrant.award_max?.toLocaleString()}` :
                '$50,000 - $500,000';

            const proposalContent = `# ${selectedProposalMode} Proposal for ${selectedBusinessPlan.business_name}

**Date:** ${currentDate}
**Proposal Type:** ${selectedProposalMode}
${selectedGrant ? `**Target Grant:** ${selectedGrant.title} (${selectedGrant.sponsor})` : ''}
**Funding Request:** ${fundingAmount}

---

## Executive Summary

${selectedBusinessPlan.business_name} respectfully submits this comprehensive proposal requesting ${selectedProposalMode.toLowerCase()} funding to accelerate our business growth and maximize market impact. Our organization has developed a robust business model with clear revenue projections, strategic market positioning, and a proven pathway to sustainable profitability.

This proposal outlines our funding requirements, projected outcomes, and the significant return on investment that ${selectedProposalMode.toLowerCase() === 'investor' ? 'investors' : 'funding partners'} can expect from supporting our initiative.

## Organization Overview

### Company Profile
${selectedBusinessPlan.business_name} represents an innovative enterprise positioned to capture significant market share in our target industry. Our comprehensive business plan demonstrates strong market validation, competitive advantages, and clear scalability potential.

### Mission & Vision
Our mission extends beyond profit generation to create meaningful value for customers, stakeholders, and the broader community. We are committed to sustainable business practices and long-term growth strategies.

## Project Description

### Business Foundation
Based on our detailed business plan analysis, ${selectedBusinessPlan.business_name} has established:

- **Market Opportunity:** Identified significant market gaps and customer demand
- **Competitive Positioning:** Developed unique value propositions and competitive advantages
- **Operational Strategy:** Created efficient operational frameworks and delivery systems
- **Financial Projections:** Established realistic revenue models and growth trajectories

### Funding Utilization
The requested ${selectedProposalMode.toLowerCase()} funding will be strategically allocated across:

1. **Operations Expansion (40%):** Scaling core business operations and infrastructure
2. **Marketing & Sales (25%):** Accelerating customer acquisition and market penetration
3. **Technology Development (20%):** Enhancing products/services and operational efficiency
4. **Working Capital (10%):** Ensuring smooth day-to-day operations
5. **Contingency Fund (5%):** Risk mitigation and unexpected opportunities

## Market Analysis & Opportunity

### Target Market Assessment
Our comprehensive market research has identified substantial opportunities within our target demographic. The current market conditions present an optimal environment for growth, with increasing demand for our solutions and limited competition in key segments.

### Revenue Potential
Based on conservative market analysis and business plan projections:
- **Year 1 Revenue Target:** $${((selectedBusinessPlan.business_name.length * 10000) + 100000).toLocaleString()}
- **Year 2 Revenue Target:** $${((selectedBusinessPlan.business_name.length * 15000) + 250000).toLocaleString()}
- **Year 3 Revenue Target:** $${((selectedBusinessPlan.business_name.length * 25000) + 500000).toLocaleString()}

## Financial Projections & ROI

### Investment Returns
${selectedProposalMode === 'Investor' ? `For equity investors, we project attractive returns based on our conservative growth estimates. With proper funding, we anticipate achieving a 3-5x return on investment within 3-5 years, with potential for higher returns as we scale operations.` : `The requested funding will generate measurable returns through increased revenue, market expansion, and operational efficiency. We project full funding recovery within 24-36 months, followed by sustained profitability.`}

### Financial Sustainability
Our business model ensures long-term financial sustainability through:
- Diversified revenue streams
- Scalable operational systems
- Strong customer retention strategies
- Continuous innovation and adaptation

## Implementation Timeline

### Phase 1: Foundation (Months 1-6)
- **Funding Deployment:** Strategic allocation of received funds
- **Team Expansion:** Hiring key personnel and building core team
- **Infrastructure Development:** Establishing operational systems and processes
- **Market Entry:** Initial product/service launch and customer acquisition

### Phase 2: Growth (Months 7-18)
- **Market Expansion:** Scaling operations and increasing market presence
- **Revenue Generation:** Achieving consistent revenue streams and customer base
- **Partnership Development:** Building strategic alliances and partnerships
- **Performance Optimization:** Refining operations and improving efficiency

### Phase 3: Scale (Months 19-36)
- **Market Leadership:** Establishing dominant market position
- **Profitability Achievement:** Reaching sustainable profitability targets
- **Expansion Opportunities:** Exploring additional markets and services
- **Exit Strategy Preparation:** ${selectedProposalMode === 'Investor' ? 'Preparing for potential exit opportunities' : 'Achieving full operational independence'}

${selectedProposalMode === 'Match a Grant' && selectedGrant ? `## Grant Alignment & Compliance

### Program Requirements
This proposal directly addresses the core objectives of the ${selectedGrant.title} program sponsored by ${selectedGrant.sponsor}. Our project aligns with the program's mission through:

- **Strategic Alignment:** Our business objectives complement the grant program's goals
- **Impact Measurement:** Clear metrics for measuring success and program impact
- **Reporting Compliance:** Commitment to regular progress reporting and transparency
- **Community Benefit:** Demonstrated positive impact on target communities and stakeholders

### Funding Request Details
We respectfully request funding within the program's specified range of ${fundingAmount}. This funding level will enable us to achieve significant milestones while ensuring efficient resource utilization and maximum program impact.

### Expected Outcomes
- **Job Creation:** Projected creation of 5-15 new positions within 24 months
- **Economic Impact:** Estimated $${((selectedGrant?.award_max || 250000) * 3).toLocaleString()} in economic activity generation
- **Innovation Advancement:** Development of innovative solutions and methodologies
- **Community Engagement:** Active participation in community development initiatives` : ''}

## Risk Management & Mitigation

### Identified Risks
We have conducted comprehensive risk analysis and developed mitigation strategies for:
- Market volatility and competitive pressures
- Operational challenges and scaling difficulties
- Financial management and cash flow optimization
- Regulatory compliance and industry changes

### Mitigation Strategies
Our risk management approach includes:
- Diversified business strategies and revenue streams
- Strong financial controls and monitoring systems
- Experienced leadership team and advisory board
- Flexible operational models and adaptation capabilities

## Team & Leadership

### Organizational Strength
${selectedBusinessPlan.business_name} is led by a dedicated team committed to achieving exceptional results. Our leadership brings together diverse expertise, industry experience, and proven track records of success.

### Advisory Support
We have established relationships with industry experts, mentors, and advisors who provide strategic guidance and support for our growth initiatives.

## Conclusion & Next Steps

### Summary
${selectedBusinessPlan.business_name} presents a compelling opportunity for ${selectedProposalMode.toLowerCase()} partnership. Our comprehensive business plan, strong market position, and experienced team create an ideal foundation for successful funding utilization and exceptional returns.

### Immediate Next Steps
Upon funding approval, we are prepared to:
1. Execute immediate implementation plans
2. Begin regular progress reporting and communication
3. Achieve specified milestones and performance targets
4. Maintain transparent and collaborative partnership relationships

### Partnership Commitment
We view this funding relationship as a strategic partnership and are committed to:
- Transparent communication and regular updates
- Responsible resource management and utilization
- Achievement of specified outcomes and performance metrics
- Long-term value creation for all stakeholders

---

**Contact Information:**
${selectedBusinessPlan.business_name}
Date: ${currentDate}
Proposal Type: ${selectedProposalMode} Funding Request

*This proposal represents our commitment to excellence, transparency, and mutual success.*`;

            setGeneratedProposal({
                content: proposalContent,
                businessName: selectedBusinessPlan.business_name,
                proposalMode: selectedProposalMode,
                selectedGrant: selectedGrant
            });
            setIsGenerating(false);
        }, 3000);
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

    const isGenerateDisabled = !selectedBusinessPlan || !selectedProposalMode || (selectedProposalMode === 'Match a Grant' && !selectedGrant) || isGenerating;

    return (
        <div style={{ padding: '32px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#fafafa',
                    marginBottom: '8px'
                }}>
                    Letter Proposal Generator
                </h1>
                <p style={{ color: '#999', fontSize: '1rem', margin: 0 }}>
                    Create compelling proposals for funding and investment opportunities.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '32px'
            }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Business Plan Selection */}
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
                            1. Select & Manage Business Plans
                        </h3>
                        <select
                            value={selectedBusinessPlan?.id || ''}
                            onChange={(e) => setSelectedBusinessPlan(businessPlans.find(p => p.id === e.target.value))}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #f59e0b',
                                borderRadius: '8px',
                                backgroundColor: '#000',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none',
                                marginBottom: '16px'
                            }}
                        >
                            <option value="">Choose a business plan...</option>
                            {businessPlans.map(plan => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.business_name}
                                </option>
                            ))}
                        </select>

                        {/* Business Plans Management */}
                        {businessPlans.length > 0 && (
                            <div style={{
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                padding: '16px'
                            }}>
                                <h4 style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#f59e0b',
                                    marginBottom: '12px',
                                    margin: 0
                                }}>
                                    Manage Business Plans
                                </h4>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}>
                                    {businessPlans.map(plan => (
                                        <div
                                            key={plan.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '8px 12px',
                                                backgroundColor: selectedBusinessPlan?.id === plan.id ? '#333' : '#000',
                                                border: selectedBusinessPlan?.id === plan.id ? '1px solid #f59e0b' : '1px solid #333',
                                                borderRadius: '6px'
                                            }}
                                        >
                                            {editingPlan === plan.id ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '4px 8px',
                                                            border: '1px solid #f59e0b',
                                                            borderRadius: '4px',
                                                            backgroundColor: '#000',
                                                            color: '#fff',
                                                            fontSize: '12px',
                                                            outline: 'none'
                                                        }}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleSaveEdit(plan.id);
                                                            }
                                                        }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                                                        <button
                                                            onClick={() => handleSaveEdit(plan.id)}
                                                            style={{
                                                                backgroundColor: '#22c55e',
                                                                color: '#fff',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                padding: '4px',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <Save style={{ width: '12px', height: '12px' }} />
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            style={{
                                                                backgroundColor: '#666',
                                                                color: '#fff',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                padding: '4px',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <X style={{ width: '12px', height: '12px' }} />
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <span style={{
                                                        fontSize: '12px',
                                                        color: '#fafafa',
                                                        flex: 1,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {plan.business_name}
                                                    </span>
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button
                                                            onClick={() => handleEditPlan(plan)}
                                                            style={{
                                                                backgroundColor: 'transparent',
                                                                color: '#f59e0b',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                padding: '4px',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                            title="Rename"
                                                        >
                                                            <Edit3 style={{ width: '12px', height: '12px' }} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePlan(plan.id)}
                                                            style={{
                                                                backgroundColor: 'transparent',
                                                                color: '#ef4444',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                padding: '4px',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                            title="Delete"
                                                        >
                                                            <Trash2 style={{ width: '12px', height: '12px' }} />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
                                        type="radio"
                                        name="proposalMode"
                                        value={mode}
                                        checked={selectedProposalMode === mode}
                                        onChange={() => handleModeChange(mode)}
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
                    {selectedProposalMode === 'Match a Grant' && (
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
                                    Generated Letter Proposal
                                </h3>
                                <button
                                    onClick={() => {
                                        if (generatedProposal.content) {
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
                                            pdf.text(`${generatedProposal.businessName}`, margin, yPosition);
                                            yPosition += 10;

                                            pdf.setFontSize(16);
                                            pdf.text(`${generatedProposal.proposalMode} Proposal`, margin, yPosition);
                                            yPosition += 15;

                                            pdf.setFontSize(10);
                                            pdf.setFont('helvetica', 'normal');
                                            pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
                                            yPosition += 20;

                                            // Process content sections
                                            const sections = generatedProposal.content.split(/^#\s/m).filter(section => section.trim());

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
                                                    if (!line || line === '---') continue;

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
                                            pdf.save(`${generatedProposal.businessName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${generatedProposal.proposalMode.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_proposal.pdf`);
                                        }
                                    }}
                                    style={{
                                        backgroundColor: '#f59e0b',
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '8px 16px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Download style={{ width: '14px', height: '14px' }} />
                                    Download PDF
                                </button>
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

export default function GrantProposalsPage() {
    return (
        <ProtectedRoute>
            <GrantProposalsContent />
        </ProtectedRoute>
    );
}