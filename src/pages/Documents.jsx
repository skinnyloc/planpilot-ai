
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Mail, Save, Lock, Trash2, Eye, Filter } from 'lucide-react';
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUser } from '@clerk/clerk-react';
import { canAccessFeature } from '@/lib/utils/planChecker';
import UpgradePrompt from '@/components/UpgradePrompt';
import { toast } from 'sonner';

export default function Documents() {
    const { user } = useUser();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, business_plan, proposal
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const canExportDocuments = canAccessFeature(user, 'document-export');

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/documents?type=${filter}`, {
                headers: {
                    'x-user-id': user?.id || 'demo-user'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setDocuments(data.documents || []);
            } else {
                console.error('Failed to fetch documents');
                setDocuments([]);
            }
        } catch (error) {
            console.error("Failed to fetch documents:", error);
            setDocuments([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchDocuments();
        }
    }, [user, filter]);

    const handleDownload = (doc) => {
        if (!canExportDocuments) {
            toast.error('Document export requires a Pro subscription');
            return;
        }

        // For proposals saved as markdown, we would need to convert to PDF or open in new tab
        if (doc.mime_type === 'text/markdown') {
            // For now, show content in a new window
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`<pre>${doc.description || 'Document content'}</pre>`);
            newWindow.document.close();
        } else {
            // For PDFs and other files, open direct link
            window.open(doc.file_path, '_blank');
        }
    };

    const handleView = (doc) => {
        // View document content in a modal or new window
        if (doc.mime_type === 'text/markdown') {
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`
                <html>
                    <head><title>${doc.filename}</title></head>
                    <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
                        <h1>${doc.filename}</h1>
                        <pre style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px;">${doc.description || 'No content available'}</pre>
                    </body>
                </html>
            `);
            newWindow.document.close();
        } else {
            window.open(doc.file_path, '_blank');
        }
    };

    const handleDelete = async (doc) => {
        if (deleteConfirm === doc.id) {
            try {
                const response = await fetch(`http://localhost:3001/api/documents/${doc.id}`, {
                    method: 'DELETE',
                    headers: {
                        'x-user-id': user?.id || 'demo-user'
                    }
                });

                if (response.ok) {
                    toast.success('Document deleted successfully');
                    await fetchDocuments();
                } else {
                    toast.error('Failed to delete document');
                }
            } catch (error) {
                console.error('Delete error:', error);
                toast.error('Failed to delete document');
            }
            setDeleteConfirm(null);
        } else {
            setDeleteConfirm(doc.id);
            setTimeout(() => setDeleteConfirm(null), 3000); // Auto-cancel after 3 seconds
        }
    };

    const handleEmail = (doc) => {
        if (!canExportDocuments) {
            toast.error('Document export requires a Pro subscription');
            return;
        }
        toast.info('Email functionality coming soon!');
    };

    const getDocumentTypeLabel = (type) => {
        switch (type) {
            case 'business_plan':
                return 'Business Plan';
            case 'proposal':
                return 'Proposal';
            default:
                return type;
        }
    };

    if (!canAccessFeature(user, 'document-management')) {
        return <UpgradePrompt feature="Document Management" />;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-4">Document Management</h1>
                <p className="text-muted-foreground">
                    View, download, and manage your generated business plans and proposals.
                </p>
            </div>

            {/* Filter Controls */}
            <div className="mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Filter:</span>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('all')}
                    >
                        All Documents
                    </Button>
                    <Button
                        variant={filter === 'business_plan' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('business_plan')}
                    >
                        Business Plans
                    </Button>
                    <Button
                        variant={filter === 'proposal' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('proposal')}
                    >
                        Proposals
                    </Button>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchDocuments}
                    className="ml-auto"
                >
                    <Save className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Your Documents</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            {documents.length} document{documents.length !== 1 ? 's' : ''}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading documents...</p>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-2">No documents found</p>
                            <p className="text-sm text-muted-foreground">
                                {filter === 'all'
                                    ? 'Create a business plan or grant proposal to see it here.'
                                    : `No ${filter.replace('_', ' ')} documents found. Try changing the filter.`
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {documents.map(doc => (
                                <div key={doc.id} className="p-4 border border-border rounded-lg">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <FileText className="h-8 w-8 text-primary mt-1" />
                                            <div className="flex-1">
                                                <p className="font-semibold text-foreground">{doc.filename}</p>
                                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                                                    <span>{getDocumentTypeLabel(doc.document_type)}</span>
                                                    {doc.file_size && (
                                                        <span>{Math.round(doc.file_size / 1024)} KB</span>
                                                    )}
                                                    <span>Created: {format(new Date(doc.created_at), 'MMM d, yyyy h:mm a')}</span>
                                                </div>
                                                {doc.description && (
                                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                                        {doc.description.substring(0, 100)}...
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 self-end sm:self-center">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="outline" size="sm" onClick={() => handleView(doc)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>View document</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDownload(doc)}
                                                            disabled={!canExportDocuments}
                                                        >
                                                            {!canExportDocuments && <Lock className="mr-1 h-3 w-3" />}
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {canExportDocuments ? 'Download document' : 'Pro subscription required'}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEmail(doc)}
                                                            disabled={!canExportDocuments}
                                                        >
                                                            {!canExportDocuments && <Lock className="mr-1 h-3 w-3" />}
                                                            <Mail className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {canExportDocuments ? 'Email document' : 'Pro subscription required'}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant={deleteConfirm === doc.id ? "destructive" : "outline"}
                                                            size="sm"
                                                            onClick={() => handleDelete(doc)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {deleteConfirm === doc.id ? 'Click again to confirm deletion' : 'Delete document'}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
