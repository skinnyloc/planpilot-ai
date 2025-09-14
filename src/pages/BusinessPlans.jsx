
import React, { useState, useEffect } from 'react';
import { BusinessIdea, BusinessPlan } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Loader2, FileText, Download, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { exportBusinessPlan } from "@/api/functions";
import { useEntitlements } from '../components/useEntitlements';
import SubscriptionModal from '../components/SubscriptionModal';

export default function BusinessPlans() {
    const [ideas, setIdeas] = useState([]);
    const [selectedIdeaId, setSelectedIdeaId] = useState('');
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    
    const { entitlements, loading } = useEntitlements();

    useEffect(() => {
        const fetchIdeas = async () => {
            const ideaList = await BusinessIdea.list();
            setIdeas(ideaList);
        };
        fetchIdeas();
    }, []);

    const handleGenerate = async () => {
        if (!entitlements.canGenerate) {
            setShowSubscriptionModal(true);
            return;
        }
        
        if (!selectedIdeaId) return;
        const idea = ideas.find(i => i.id === selectedIdeaId);
        if (!idea) return;

        setIsGenerating(true);
        setGeneratedPlan(null);

        const prompt = `
            Create a detailed, professional business plan based on the user's input. Weave their specific details into the narrative naturally. Do not use generic filler sentences.

            **User's Business Details:**
            - Business Name: ${idea.business_name}
            - Business Address: ${idea.business_address || 'Not specified'}
            - Years in Business: ${idea.years_in_business !== undefined ? idea.years_in_business : 'New venture'}
            - Problem this business solves: ${idea.problem_solved || 'Not specified'}
            - Core Concept: ${idea.concept}
            - Mission: ${idea.mission_statement || 'Not specified'}
            - Target Market: ${idea.target_market || 'Not specified'}
            - Goals: ${idea.business_goals || 'Not specified'}
            - Industry: ${idea.industry || 'Not specified'}
            - Startup Costs: $${idea.startup_costs || 0}
            - Revenue Model: ${idea.revenue_model || 'Not specified'}
            - Competitive Advantage: ${idea.competitive_advantage || 'Not specified'}
            - Location: ${idea.location || 'Not specified'}
            - Extra Instructions from user: ${idea.extra_prompt || 'None'}

            **Instructions:**
            1.  Write the Executive Summary, Company Description, and a "Problem & Opportunity" section using the user's details about the business name, address, years in business, and the problem it solves. Make it specific and compelling.
            2.  Format the entire output in Markdown.
            3.  Ensure the following sections are included, keeping the headings exactly as written:
                - # Executive Summary
                - # Company Description
                - # Problem & Opportunity
                - # Market Analysis
                - # Organization and Management
                - # Products or Services
                - # Marketing and Sales Strategy
                - # Financial Projections (Provide a 3-year P&L forecast and key assumptions).
        `;

        try {
            const response = await InvokeLLM({ prompt });
            setGeneratedPlan({ 
                ideaId: selectedIdeaId, 
                content: response, 
                business_name: idea.business_name, 
                pdf_url: null 
            });
        } catch (error) {
            console.error("Error generating business plan:", error);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSaveAndExport = async () => {
        if (!entitlements.canExport) {
            setShowSubscriptionModal(true);
            return;
        }
        
        if (!generatedPlan) return;
        setIsSaving(true);
        
        try {
            const idea = ideas.find(i => i.id === selectedIdeaId);
            const response = await exportBusinessPlan({
                businessIdea: idea,
                content: generatedPlan.content
            });
            const file = new File([response.data], response.headers['x-filename'], { type: 'application/pdf' });
            
            const { UploadFile } = await import('@/api/integrations');
            const { file_url } = await UploadFile({ file });

            const savedPlan = await BusinessPlan.create({
                business_idea_id: generatedPlan.ideaId,
                name: `${generatedPlan.business_name} Business Plan`,
                content: generatedPlan.content,
                pdf_url: file_url
            });
            
            setGeneratedPlan(prev => ({...prev, pdf_url: file_url}));

            const a = document.createElement('a');
            a.href = file_url;
            a.download = `${generatedPlan.business_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_business_plan.pdf`;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error('Error saving or exporting PDF:', error);
            alert('Error saving or exporting PDF. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    return (
        <div className="space-y-8">
            <style>{`
                .unified-preview h1 { font-size: 18px; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.75em; }
                .unified-preview h2 { font-size: 16px; font-weight: 600; margin-top: 1.25em; margin-bottom: 0.5em; }
                .unified-preview h3 { font-size: 14px; font-weight: 600; margin-top: 1em; margin-bottom: 0.5em; }
                .unified-preview p, .unified-preview ul, .unified-preview ol { font-size: 12.5px; line-height: 1.45; }
            `}</style>
            <h1 className="text-3xl font-bold text-navy-800">Business Plan Generator</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Generate a New Plan</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Select value={selectedIdeaId} onValueChange={setSelectedIdeaId}>
                        <SelectTrigger className="w-full sm:w-[300px]">
                            <SelectValue placeholder="Select a business idea" />
                        </SelectTrigger>
                        <SelectContent>
                            {ideas.map(idea => (
                                <SelectItem key={idea.id} value={idea.id}>{idea.business_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleGenerate} disabled={!selectedIdeaId || isGenerating}>
                        {!entitlements.canGenerate ? <Lock className="mr-2 h-4 w-4" /> : isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </Button>
                </CardContent>
            </Card>

            {generatedPlan && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Generated Plan for: {generatedPlan.business_name}</CardTitle>
                            <Button variant="outline" onClick={handleSaveAndExport} disabled={isSaving}>
                                {!entitlements.canExport ? <Lock className="mr-2 h-4 w-4" /> : isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                {isSaving ? 'Saving...' : 'Save & Export PDF'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="prose max-w-none unified-preview">
                        <ReactMarkdown>{generatedPlan.content}</ReactMarkdown>
                    </CardContent>
                </Card>
            )}
            
            {!generatedPlan && !isGenerating && (
                 <div className="text-center py-12 border-2 border-dashed rounded-lg mt-8">
                    <FileText className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">Your generated plan will appear here</h3>
                    <p className="mt-1 text-sm text-slate-500">Select an idea and click "Generate" to create your business plan.</p>
                </div>
            )}
            
            <SubscriptionModal 
                isOpen={showSubscriptionModal} 
                onClose={() => setShowSubscriptionModal(false)} 
            />
        </div>
    );
}
