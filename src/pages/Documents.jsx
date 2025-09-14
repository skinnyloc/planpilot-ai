
import React, { useState, useEffect } from 'react';
import { BusinessPlan } from '@/api/entities';
import { Proposal } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Mail, Save, Lock } from 'lucide-react';
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEntitlements } from '../components/useEntitlements'; // Corrected import path
import SubscriptionModal from '../components/SubscriptionModal';

export default function Documents() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

    const { entitlements, loading: entitlementsLoading } = useEntitlements();

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const plans = await BusinessPlan.list();
            const proposals = await Proposal.list();

            const formattedPlans = plans
                .filter(p => p.pdf_url)
                .map(p => ({
                    id: `plan-${p.id}`,
                    name: p.name,
                    type: 'Business Plan',
                    date: p.created_date,
                    url: p.pdf_url,
                    mode: 'N/A'
                }));

            const formattedProposals = proposals
                .filter(p => p.pdf_url)
                .map(p => ({
                    id: `prop-${p.id}`,
                    name: p.grant_title ? `${p.business_name} - ${p.grant_title}` : `${p.business_name} - General Proposal`,
                    type: 'Grant Proposal',
                    date: p.created_date,
                    url: p.pdf_url,
                    mode: p.proposal_modes?.join(', ') || (p.mode === 'BANK_INVESTOR' ? 'Bank/Investor' : 'Matched Grant')
                }));

            const allDocs = [...formattedPlans, ...formattedProposals];
            allDocs.sort((a, b) => new Date(b.date) - new Date(a.date));
            setDocuments(allDocs);
        } catch (error) {
            console.error("Failed to fetch documents:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleDownload = (doc) => {
        if (!entitlements.canExport) {
            setShowSubscriptionModal(true);
            return;
        }
        window.open(doc.url, '_blank');
    };
    
    const handleSave = async () => {
        if (!entitlements.canExport) {
            setShowSubscriptionModal(true);
            return;
        }
        // This function re-fetches the documents, simulating a "save" or "refresh"
        await fetchDocuments();
    }

    const handleEmail = (docName) => {
        if (!entitlements.canExport) {
            setShowSubscriptionModal(true);
            return;
        }
        alert(`Emailing ${docName}... (functionality in development)`);
    };

    if (entitlementsLoading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-navy-800">Document Management</h1>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        style={{ backgroundColor: '#000000', color: '#FFD000', borderRadius: '12px', padding: '10px 16px' }}
                        onClick={handleSave}
                        disabled={!entitlements.canExport}
                      >
                          {!entitlements.canExport && <Lock className="mr-2 h-4 w-4" />}
                          <Save className="mr-2 h-4 w-4" /> Save
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Save document</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            </div>
            <p className="text-slate-600">Download, email, or print your generated documents.</p>
            
            <Card>
                <CardHeader>
                    <CardTitle>Your Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p>Loading documents...</p>
                    ) : documents.length === 0 ? (
                        <p>No documents generated yet. Create a business plan or grant proposal to see it here.</p>
                    ) : (
                        <div className="space-y-4">
                            {documents.map(doc => (
                                <div key={doc.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <FileText className="h-8 w-8 text-navy-800" />
                                        <div>
                                            <p className="font-semibold">{doc.name}</p>
                                            <p className="text-sm text-slate-500">{doc.type} | Mode: {doc.mode} | Created: {format(new Date(doc.date), 'MMM d, yyyy')}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 self-end sm:self-center">
                                        <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                                            {!entitlements.canExport && <Lock className="mr-2 h-4 w-4" />}
                                            <Download className="mr-2 h-4 w-4" /> Download
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleEmail(doc.name)}>
                                            {!entitlements.canExport && <Lock className="mr-2 h-4 w-4" />}
                                            <Mail className="mr-2 h-4 w-4" /> Email
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <SubscriptionModal 
                isOpen={showSubscriptionModal} 
                onClose={() => setShowSubscriptionModal(false)} 
            />
        </div>
    );
}
