
import React, { useState } from 'react';
import { InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2, BookOpen, Target, Lock, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { exportCreditRoadmap } from "@/api/functions";
import { useEntitlements } from '../components/useEntitlements'; // Corrected import path
import SubscriptionModal from '../components/SubscriptionModal';

const CreditEducationContent = () => (
    <div className="prose max-w-none">
        <h2>Understanding Business Credit</h2>
        <p>Business credit is crucial for securing financing and establishing your company's financial identity, separate from your personal credit. A strong business credit profile can unlock better loan terms, higher credit limits, and more favorable trade terms with suppliers.</p>
        
        <h3>Key Differences: Personal vs. Business Credit</h3>
        <ul>
            <li><strong>Reporting Agencies:</strong> Personal credit is tracked by Equifax, Experian, and TransUnion. Business credit is tracked by Dun & Bradstreet (D&B), Experian Business, and Equifax Small Business.</li>
            <li><strong>Scoring Models:</strong> Personal FICO scores range from 300-850. Business scores, like the D&B PAYDEX score, range from 1-100.</li>
            <li><strong>Impact:</strong> Personal credit affects personal loans and mortgages. Business credit affects business loans, lines of credit, and vendor terms.</li>
        </ul>

        <h3>How to Build Business Credit: A Step-by-Step Guide</h3>
        <ol>
            <li><strong>Incorporate Your Business:</strong> Form an LLC or corporation to create a separate legal entity.</li>
            <li><strong>Get a Federal Employer Identification Number (EIN):</strong> This is like a Social Security number for your business.</li>
            <li><strong>Open a Business Bank Account:</strong> Keep business finances completely separate from personal funds.</li>
            <li><strong>Get a Business Phone Number:</strong> Establish a professional presence.</li>
            <li><strong>Register with Dun & Bradstreet:</strong> Get a D-U-N-S Number, which is essential for building a business credit file.</li>
            <li><strong>Open Trade Lines with Vendors:</strong> Work with suppliers who report payments to business credit bureaus (e.g., Uline, Grainger, Quill). These are often called "vendor credit" or "net-30 accounts."</li>
            <li><strong>Get a Business Credit Card:</strong> Use it for business expenses and pay the balance on time.</li>
            <li><strong>Monitor Your Business Credit:</strong> Regularly check your business credit reports for accuracy and progress.</li>
        </ol>
    </div>
);

export default function CreditGuide() {
    const [generatedRoadmap, setGeneratedRoadmap] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    
    const { entitlements, loading } = useEntitlements();

    const handleGenerateRoadmap = async () => {
        if (!entitlements.canGenerate) {
            setShowSubscriptionModal(true);
            return;
        }
        
        setIsGenerating(true);
        setGeneratedRoadmap(null);

        const prompt = `
            Create a personalized credit-building "roadmap" in Markdown format. The user is a new business owner.
            The roadmap should be structured with actionable steps and a timeline.

            Include the following sections:
            1.  **Phase 1: Foundation (Months 1-3)** - Steps for setting up the business entity correctly for credit building.
            2.  **Phase 2: Initial Credit (Months 4-6)** - Steps for opening first trade lines and business credit cards.
            3.  **Phase 3: Growth (Months 7-12)** - Steps for expanding credit and applying for small loans.
            4.  **Ongoing Best Practices** - Tips for maintaining and improving credit over time.

            Make the advice practical and encouraging.
        `;

        try {
            const response = await InvokeLLM({ prompt });
            setGeneratedRoadmap(response);
        } catch (error) {
            console.error("Error generating credit roadmap:", error);
            setGeneratedRoadmap("Sorry, there was an error generating the roadmap.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleExportPdf = async () => {
        if (!entitlements.canExport) {
            setShowSubscriptionModal(true);
            return;
        }
        
        if (!generatedRoadmap) return;
        
        try {
            const response = await exportCreditRoadmap({
                content: generatedRoadmap
            });
            
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'credit_building_roadmap.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-navy-800">Credit Building Guide</h1>
            
            <Tabs defaultValue="education">
                <TabsList>
                    <TabsTrigger value="education"><BookOpen className="mr-2 h-4 w-4" />Credit Education</TabsTrigger>
                    <TabsTrigger value="roadmap"><Target className="mr-2 h-4 w-4" />Personalized Roadmap</TabsTrigger>
                </TabsList>
                <TabsContent value="education" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>How to Build Business Credit</CardTitle></CardHeader>
                        <CardContent><CreditEducationContent /></CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="roadmap" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Generate Your Personalized Roadmap</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-slate-600 mb-4">Get a step-by-step plan to build your business credit from scratch.</p>
                            <Button onClick={handleGenerateRoadmap} disabled={isGenerating && entitlements.canGenerate}>
                                {!entitlements.canGenerate ? <Lock className="mr-2 h-4 w-4" /> : isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                {isGenerating ? 'Generating...' : 'Generate My Roadmap'}
                            </Button>
                        </CardContent>
                    </Card>
                    
                    {generatedRoadmap && (
                        <Card className="mt-6">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Your Credit Building Roadmap</CardTitle>
                                    <Button variant="outline" onClick={handleExportPdf} disabled={!generatedRoadmap || !entitlements.canExport}>
                                        {!entitlements.canExport ? <Lock className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
                                        Export as PDF
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="prose max-w-none">
                                <ReactMarkdown>{generatedRoadmap}</ReactMarkdown>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
            
            <SubscriptionModal 
                isOpen={showSubscriptionModal} 
                onClose={() => setShowSubscriptionModal(false)} 
            />
        </div>
    );
}
