
import React, { useState, useEffect, useMemo } from 'react';
import { BusinessIdea } from '@/api/entities';
import { Grant } from '@/api/entities';
import { Proposal } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Wand2, Loader2, Download, AlertCircle, Lock } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { generateAndSaveProposal } from '@/api/functions';
import ReactMarkdown from 'react-markdown';
import { useEntitlements } from '../components/useEntitlements'; // Fixed import path
import SubscriptionModal from '../components/SubscriptionModal';

const GrantList = ({ onSelect, selectedGrantId }) => {
    const [grants, setGrants] = useState([]);
    useEffect(() => {
        const fetchGrants = async () => {
            const thisMonthKey = format(new Date(), 'yyyy-MM');
            const nextMonthKey = format(addMonths(new Date(), 1), 'yyyy-MM');
            const fetchedGrants = await Grant.filter({ month_key: { '$in': [thisMonthKey, nextMonthKey] } });
            setGrants(fetchedGrants);
        };
        fetchGrants();
    }, []);

    return (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {grants.map(grant => (
                <div key={grant.id} className={`border p-3 rounded-lg ${selectedGrantId === grant.id ? 'ring-2 ring-blue-500' : ''}`}>
                    <h4 className="font-semibold">{grant.title}</h4>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-slate-500">{grant.sponsor} | Due: {format(new Date(grant.due_date), 'MMM d, yyyy')}</p>
                        <Button size="sm" variant={selectedGrantId === grant.id ? 'default' : 'outline'} onClick={() => onSelect(grant)}>{selectedGrantId === grant.id ? 'Selected' : 'Select'}</Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function GrantProposals() {
    const [ideas, setIdeas] = useState([]);
    const [selectedIdea, setSelectedIdea] = useState(null);
    const [selectedGrant, setSelectedGrant] = useState(null);
    const [proposalModes, setProposalModes] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedProposal, setGeneratedProposal] = useState(null);
    const [error, setError] = useState('');
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

    const { entitlements, loading } = useEntitlements();

    useEffect(() => {
        const fetchIdeas = async () => setIdeas(await BusinessIdea.list());
        fetchIdeas();
    }, []);
    
    const MODES = ["Bank", "Investor", "Loan", "Match a Grant"];
    
    const handleModeChange = (mode, checked) => {
        setProposalModes(prev => 
            checked ? [...prev, mode] : prev.filter(m => m !== mode)
        );
    };

    const handleGenerate = async () => {
        if (!entitlements.canGenerate) {
            setShowSubscriptionModal(true);
            return;
        }
        
        setError('');
        if (!selectedIdea) { setError('Please select a business idea.'); return; }
        if (proposalModes.length === 0) { setError('Please select at least one proposal mode.'); return; }
        if (proposalModes.includes('Match a Grant') && !selectedGrant) { setError('Please select a grant for matched mode.'); return; }

        setIsGenerating(true);
        setGeneratedProposal(null);

        try {
            const result = await generateAndSaveProposal({
                businessIdea: selectedIdea,
                grant: proposalModes.includes('Match a Grant') ? selectedGrant : null,
                proposalModes: proposalModes,
            });

            if (result.data.error) {
                setError(result.data.error);
            } else {
                setGeneratedProposal(result.data);
            }
        } catch (e) {
            console.error("Error generating proposal:", e);
            setError('An unexpected error occurred during generation.');
        } finally {
            setIsGenerating(false);
        }
    };

    const isGenerateDisabled = !selectedIdea || proposalModes.length === 0 || (proposalModes.includes('Match a Grant') && !selectedGrant) || isGenerating;

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-navy-800">Grant Proposal Generator</h1>
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>1. Select Business Idea</CardTitle></CardHeader>
                        <CardContent>
                            <Select onValueChange={id => setSelectedIdea(ideas.find(i => i.id === id))}>
                                <SelectTrigger><SelectValue placeholder="Choose a business..." /></SelectTrigger>
                                <SelectContent>{ideas.map(i => <SelectItem key={i.id} value={i.id}>{i.business_name}</SelectItem>)}</SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>2. Select Proposal Mode</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                             {MODES.map(mode => (
                                <div key={mode} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`mode-${mode}`} 
                                        checked={proposalModes.includes(mode)} 
                                        onCheckedChange={(checked) => handleModeChange(mode, checked)}
                                    />
                                    <Label htmlFor={`mode-${mode}`}>{mode}</Label>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    {/* Conditionally render Grant selection based on 'Match a Grant' being selected in proposalModes */}
                    {proposalModes.includes('Match a Grant') && (
                        <Card>
                            <CardHeader><CardTitle>3. Select Grant</CardTitle></CardHeader>
                            <CardContent>
                                <GrantList onSelect={setSelectedGrant} selectedGrantId={selectedGrant?.id} />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Generate Proposal</CardTitle></CardHeader>
                        <CardContent>
                            <Button onClick={handleGenerate} disabled={isGenerateDisabled} className="w-full">
                                {!entitlements.canGenerate ? <Lock className="mr-2 h-4 w-4" /> : isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                Generate Proposal
                            </Button>
                            {error && <p className="text-red-500 text-sm mt-2"><AlertCircle className="inline mr-1 h-4 w-4"/>{error}</p>}
                        </CardContent>
                    </Card>

                    {generatedProposal && (
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Generated Proposal</CardTitle>
                                    <Button asChild variant="outline"><a href={generatedProposal.pdf_url} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4"/>Download PDF</a></Button>
                                </div>
                            </CardHeader>
                            <CardContent className="prose max-w-none">
                                <ReactMarkdown>{generatedProposal.content}</ReactMarkdown>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
            
            <SubscriptionModal 
                isOpen={showSubscriptionModal} 
                onClose={() => setShowSubscriptionModal(false)} 
            />
        </div>
    );
}
