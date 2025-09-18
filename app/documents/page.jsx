'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Mail, Search, Filter, Calendar, Tag, Trash2, Eye } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { canAccessFeature } from '@/lib/utils/planChecker';
import UpgradePrompt from '@/components/UpgradePrompt';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const { user } = useUser();
  const canAccessDocuments = canAccessFeature(user, 'document-management');

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const documentTypes = [
    { value: 'all', label: 'All Documents' },
    { value: 'business_plan', label: 'Business Plans' },
    { value: 'letter', label: 'Letters' },
    { value: 'proposal', label: 'Proposals' },
    { value: 'grant_proposal', label: 'Grant Proposals' }
  ];

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        throw new Error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`);
      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = document.title || 'document';
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const handleEmail = async (document) => {
    try {
      const email = prompt('Enter email address to send document:');
      if (!email) return;

      const response = await fetch(`/api/documents/${document.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to email document');
      }

      toast.success(`Document emailed to ${email}`);
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to email document');
    }
  };

  const handleDelete = async (document) => {
    if (!confirm(`Are you sure you want to delete "${document.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments(prev => prev.filter(doc => doc.id !== document.id));
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchTerm ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || doc.document_type === selectedType;
    return matchesSearch && matchesType;
  });

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'business_plan':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'letter':
        return <Mail className="h-5 w-5 text-green-600" />;
      case 'proposal':
      case 'grant_proposal':
        return <FileText className="h-5 w-5 text-purple-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getDocumentTypeLabel = (type) => {
    const typeObj = documentTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  if (!canAccessDocuments) {
    return <UpgradePrompt feature="Document Management" />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Documents</h1>
        <p className="text-muted-foreground">
          Manage your generated business plans, letters, and proposals.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-8 text-foreground cursor-pointer"
          >
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <Filter className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchTerm || selectedType !== 'all' ? 'No documents found' : 'No documents yet'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || selectedType !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first business plan or generate a proposal to get started.'
            }
          </p>
          {(!searchTerm && selectedType === 'all') && (
            <div className="flex gap-4 justify-center">
              <a
                href="/business-idea"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Business Plan
              </a>
              <a
                href="/grant-proposals"
                className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                Generate Proposal
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments.map((document) => (
            <div
              key={document.id}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getDocumentIcon(document.document_type)}
                    <h3 className="text-lg font-semibold text-foreground">
                      {document.title}
                    </h3>
                    <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                      {getDocumentTypeLabel(document.document_type)}
                    </span>
                  </div>

                  {document.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {document.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(document.created_at).toLocaleDateString()}
                    </div>
                    {document.file_size && (
                      <div>
                        Size: {(document.file_size / 1024).toFixed(1)} KB
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleDownload(document)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    title="Download"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                  <button
                    onClick={() => handleEmail(document)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                    title="Email"
                  >
                    <Mail className="h-3 w-3" />
                    Email
                  </button>
                  <button
                    onClick={() => handleDelete(document)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {documents.length > 0 && (
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>
              Showing {filteredDocuments.length} of {documents.length} documents
            </span>
            <span>
              Total storage: {((documents.reduce((acc, doc) => acc + (doc.file_size || 0), 0)) / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </div>
      )}
    </div>
  );
}