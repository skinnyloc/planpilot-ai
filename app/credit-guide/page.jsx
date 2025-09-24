'use client';

import { useState } from 'react';
import { Wand2, Loader2, BookOpen, Target, Download } from 'lucide-react';
import ProtectedRoute from '@/lib/components/ProtectedRoute';

const CreditEducationContent = () => (
    <div style={{
        color: '#ccc',
        lineHeight: '1.6'
    }}>
        <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#fafafa',
            marginBottom: '16px'
        }}>
            Understanding Business Credit
        </h2>
        <p style={{ marginBottom: '16px' }}>
            Business credit is crucial for securing financing and establishing your company's financial identity, separate from your personal credit. A strong business credit profile can unlock better loan terms, higher credit limits, and more favorable trade terms with suppliers.
        </p>

        <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#f59e0b',
            marginTop: '24px',
            marginBottom: '12px'
        }}>
            Key Differences: Personal vs. Business Credit
        </h3>
        <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#f59e0b' }}>Reporting Agencies:</strong> Personal credit is tracked by Equifax, Experian, and TransUnion. Business credit is tracked by Dun & Bradstreet (D&B), Experian Business, and Equifax Small Business.
            </li>
            <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#f59e0b' }}>Scoring Models:</strong> Personal FICO scores range from 300-850. Business scores, like the D&B PAYDEX score, range from 1-100.
            </li>
            <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#f59e0b' }}>Impact:</strong> Personal credit affects personal loans and mortgages. Business credit affects business loans, lines of credit, and vendor terms.
            </li>
        </ul>

        <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#f59e0b',
            marginTop: '24px',
            marginBottom: '12px'
        }}>
            How to Build Business Credit: A Step-by-Step Guide
        </h3>
        <ol style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#f59e0b' }}>Incorporate Your Business:</strong> Form an LLC or corporation to create a separate legal entity.
            </li>
            <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#f59e0b' }}>Get a Federal Employer Identification Number (EIN):</strong> This is like a Social Security number for your business.
            </li>
            <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#f59e0b' }}>Open a Business Bank Account:</strong> Keep business finances completely separate from personal funds.
            </li>
            <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#f59e0b' }}>Get a Business Phone Number:</strong> Establish a professional presence.
            </li>
            <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#f59e0b' }}>Register with Dun & Bradstreet:</strong> Get a D-U-N-S Number, which is essential for building a business credit file.
            </li>
            <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#f59e0b' }}>Open Trade Lines with Vendors:</strong> Work with suppliers who report payments to business credit bureaus (e.g., Uline, Grainger, Quill). These are often called "vendor credit" or "net-30 accounts."
            </li>
            <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#f59e0b' }}>Get a Business Credit Card:</strong> Use it for business expenses and pay the balance on time.
            </li>
            <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#f59e0b' }}>Monitor Your Business Credit:</strong> Regularly check your business credit reports for accuracy and progress.
            </li>
        </ol>
    </div>
);

function CreditGuideContent() {
    const [generatedRoadmap, setGeneratedRoadmap] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState('education');

    const handleGenerateRoadmap = async () => {
        setIsGenerating(true);
        setGeneratedRoadmap(null);

        // Simulate API call
        setTimeout(() => {
            const roadmapContent = `# Your Personalized Credit Building Roadmap

## Phase 1: Foundation (Months 1-3)

### Month 1: Business Entity Setup
- **Week 1-2:** Choose and register your business structure (LLC, Corporation, etc.)
- **Week 3:** Apply for your Federal Employer Identification Number (EIN) through the IRS
- **Week 4:** Open a dedicated business checking account using your EIN

### Month 2: Professional Presence
- **Week 1:** Obtain a business phone number (separate from personal)
- **Week 2:** Set up a professional business address (can be virtual)
- **Week 3:** Create a basic business website with contact information
- **Week 4:** Register your business with Dun & Bradstreet to get a D-U-N-S Number

### Month 3: Initial Credit Foundation
- **Week 1-2:** Apply for your first business credit card (secured if necessary)
- **Week 3:** Set up accounts with business reporting services
- **Week 4:** Begin tracking all business expenses separately from personal

## Phase 2: Initial Credit (Months 4-6)

### Month 4: Vendor Relationships
- **Week 1:** Research and contact net-30 vendors (Uline, Grainger, Quill)
- **Week 2:** Apply for trade accounts with 2-3 vendors
- **Week 3:** Make small initial purchases to establish payment history
- **Week 4:** Set up automatic payment systems to ensure on-time payments

### Month 5: Credit Building Acceleration
- **Week 1-2:** Apply for additional trade lines with different vendors
- **Week 3:** Consider a small business fuel card or office supply card
- **Week 4:** Review and verify all accounts are reporting to business credit bureaus

### Month 6: First Credit Review
- **Week 1:** Pull your first business credit reports from all three bureaus
- **Week 2:** Dispute any inaccuracies or missing information
- **Week 3:** Analyze your payment patterns and identify areas for improvement
- **Week 4:** Plan for Phase 3 expansion based on current credit profile

## Phase 3: Growth (Months 7-12)

### Months 7-9: Credit Expansion
- **Apply for additional business credit cards with higher limits**
- **Establish relationships with more vendors and suppliers**
- **Consider a small business line of credit**
- **Maintain perfect payment history across all accounts**

### Months 10-12: Advanced Credit Building
- **Apply for your first small business loan or equipment financing**
- **Explore SBA loan options if eligible**
- **Build relationships with local banks and credit unions**
- **Consider joining business trade associations for additional credibility**

## Ongoing Best Practices

### Monthly Tasks
- **Monitor all business credit reports for accuracy**
- **Ensure all payments are made on time or early**
- **Keep credit utilization below 30% on all accounts**
- **Update business information with credit bureaus as needed**

### Quarterly Tasks
- **Review and analyze credit score improvements**
- **Apply for new credit opportunities as your profile strengthens**
- **Reassess your credit needs based on business growth**
- **Consider increasing credit limits on existing accounts**

### Annual Tasks
- **Comprehensive credit report review and cleanup**
- **Evaluate and optimize your credit mix**
- **Plan for major financing needs in the coming year**
- **Review and update your business information across all platforms**

## Success Tips
- **Always pay early or on time - this is the most important factor**
- **Keep detailed records of all business transactions**
- **Separate business and personal finances completely**
- **Be patient - building strong business credit takes time**
- **Stay informed about changes in credit reporting and scoring**

Remember: Building business credit is a marathon, not a sprint. Consistency and patience will reward you with better financing options and business opportunities in the future.`;

            setGeneratedRoadmap(roadmapContent);
            setIsGenerating(false);
        }, 2000);
    };

    const handleExportPdf = async () => {
        if (!generatedRoadmap) return;
        alert('PDF export functionality would be implemented here.');
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
                    Credit Building Guide
                </h1>
                <p style={{ color: '#999', fontSize: '1rem', margin: 0 }}>
                    Build strong business credit to unlock better financing opportunities.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{
                    display: 'flex',
                    backgroundColor: '#000',
                    border: '1px solid #f59e0b',
                    borderRadius: '8px',
                    padding: '4px',
                    width: 'fit-content'
                }}>
                    <button
                        onClick={() => setActiveTab('education')}
                        style={{
                            padding: '12px 16px',
                            backgroundColor: activeTab === 'education' ? '#f59e0b' : 'transparent',
                            color: activeTab === 'education' ? '#000' : '#fafafa',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <BookOpen style={{ width: '16px', height: '16px' }} />
                        Credit Education
                    </button>
                    <button
                        onClick={() => setActiveTab('roadmap')}
                        style={{
                            padding: '12px 16px',
                            backgroundColor: activeTab === 'roadmap' ? '#f59e0b' : 'transparent',
                            color: activeTab === 'roadmap' ? '#000' : '#fafafa',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Target style={{ width: '16px', height: '16px' }} />
                        Personalized Roadmap
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'education' && (
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
                        marginBottom: '24px'
                    }}>
                        How to Build Business Credit
                    </h3>
                    <CreditEducationContent />
                </div>
            )}

            {activeTab === 'roadmap' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                            Generate Your Personalized Roadmap
                        </h3>
                        <p style={{
                            color: '#999',
                            marginBottom: '20px',
                            lineHeight: '1.5'
                        }}>
                            Get a step-by-step plan to build your business credit from scratch.
                        </p>
                        <button
                            onClick={handleGenerateRoadmap}
                            disabled={isGenerating}
                            style={{
                                backgroundColor: isGenerating ? '#666' : '#f59e0b',
                                color: isGenerating ? '#999' : '#000',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '14px 24px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: isGenerating ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {isGenerating ? (
                                <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                            ) : (
                                <Wand2 style={{ width: '16px', height: '16px' }} />
                            )}
                            {isGenerating ? 'Generating...' : 'Generate My Roadmap'}
                        </button>
                    </div>

                    {generatedRoadmap && (
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
                                    Your Credit Building Roadmap
                                </h3>
                                <button
                                    onClick={handleExportPdf}
                                    style={{
                                        backgroundColor: '#f59e0b',
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '8px 16px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Download style={{ width: '14px', height: '14px' }} />
                                    Export as PDF
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
                                dangerouslySetInnerHTML={{ __html: formatMarkdown(generatedRoadmap) }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function CreditGuidePage() {
    return (
        <ProtectedRoute>
            <CreditGuideContent />
        </ProtectedRoute>
    );
}