
import React, { useState, useEffect } from 'react';
import { BusinessIdea, BusinessPlan } from '@/api/entities';
import { openaiClient } from '@/lib/ai/openai-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Loader2, FileText, Download, Lock, TestTube } from 'lucide-react';
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

    // Test states
    const [isTestingOpenAI, setIsTestingOpenAI] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [testError, setTestError] = useState(null);
    
    const { entitlements, loading } = useEntitlements();

    useEffect(() => {
        const fetchIdeas = async () => {
            const ideaList = await BusinessIdea.list();
            setIdeas(ideaList);
        };
        fetchIdeas();
    }, []);

    const handleGenerate = async () => {
        console.log('handleGenerate called', {
            canGenerate: entitlements.canGenerate,
            selectedIdeaId,
            hasIdeas: ideas.length > 0
        });

        if (!entitlements.canGenerate) {
            console.log('Cannot generate - entitlements check failed');
            setShowSubscriptionModal(true);
            return;
        }

        if (!selectedIdeaId) {
            console.log('No idea selected');
            return;
        }

        const idea = ideas.find(i => i.id === selectedIdeaId);
        if (!idea) {
            console.log('Idea not found for ID:', selectedIdeaId);
            return;
        }

        console.log('Starting generation for idea:', idea.business_name);
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
            console.log('Calling OpenAI client with prompt length:', prompt.length);

            // Use our client-side OpenAI service
            const response = await openaiClient.generateContent({
                prompt,
                model: 'gpt-3.5-turbo', // Use a more cost-effective model for testing
                maxTokens: 3500,
                temperature: 0.7
            });

            console.log('OpenAI response received:', {
                hasContent: !!response.content,
                contentLength: response.content?.length,
                success: response.success
            });

            setGeneratedPlan({
                ideaId: selectedIdeaId,
                content: response.content,
                business_name: idea.business_name,
                pdf_url: null
            });

            console.log('Generated plan set successfully');
        } catch (error) {
            console.error("Error generating business plan:", {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            alert(`Error generating business plan: ${error.message}`);
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

    // Isolated OpenAI test function
    const testOpenAIDirect = async () => {
        setIsTestingOpenAI(true);
        setTestResult(null);
        setTestError(null);

        console.log('=== STARTING ISOLATED OPENAI TEST (BYPASS ALL BASE44) ===');

        try {
            const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

            console.log('Direct API Key Check:', {
                hasKey: !!apiKey,
                keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING',
                envVarName: 'VITE_OPENAI_API_KEY'
            });

            if (!apiKey) {
                throw new Error('VITE_OPENAI_API_KEY not found in environment variables');
            }

            const prompt = "Write a 2-sentence business plan for a coffee shop.";

            console.log('Making DIRECT fetch to OpenAI API...');

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 150,
                    temperature: 0.7
                })
            });

            console.log('Direct OpenAI Response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('OpenAI API Error Details:', errorData);
                throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            console.log('OpenAI Response Data:', data);

            const content = data.choices[0]?.message?.content;

            if (!content) {
                throw new Error('No content returned from OpenAI');
            }

            setTestResult(content);
            console.log('=== DIRECT OPENAI TEST SUCCESSFUL ===');

        } catch (err) {
            console.error('=== DIRECT OPENAI TEST FAILED ===', {
                message: err.message,
                stack: err.stack,
                name: err.name
            });
            setTestError(err.message);
        } finally {
            setIsTestingOpenAI(false);
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

            {/* Debug Test Card */}
            <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                    <CardTitle className="text-orange-800">🧪 OpenAI Debug Test</CardTitle>
                    <p className="text-sm text-orange-700">
                        Test OpenAI directly (bypasses all base44 entities and hooks)
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={testOpenAIDirect}
                        disabled={isTestingOpenAI}
                        variant="outline"
                        className="w-full border-orange-300 text-orange-800 hover:bg-orange-100"
                    >
                        {isTestingOpenAI ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Testing Direct OpenAI...
                            </>
                        ) : (
                            <>
                                <TestTube className="mr-2 h-4 w-4" />
                                Test OpenAI Direct
                            </>
                        )}
                    </Button>

                    {testError && (
                        <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                            <strong>Test Error:</strong> {testError}
                        </div>
                    )}

                    {testResult && (
                        <div className="p-3 bg-green-100 border border-green-300 rounded text-green-700 text-sm">
                            <strong>Test Success:</strong> {testResult}
                        </div>
                    )}

                    <div className="text-xs text-orange-600">
                        API Key Status: {import.meta.env.VITE_OPENAI_API_KEY ? '✅ Present' : '❌ Missing'}
                    </div>
                </CardContent>
            </Card>

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
