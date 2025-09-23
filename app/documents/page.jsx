'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, Download, Eye, Trash2, Edit3, Calendar, User, Building } from 'lucide-react';

const DocumentCard = ({ document, onView, onEdit, onDelete, onDownload }) => (
    <div style={{
        backgroundColor: '#000',
        border: '1px solid #f59e0b',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px'
    }}>
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            marginBottom: '12px'
        }}>
            <div style={{ flex: 1 }}>
                <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    color: '#fafafa',
                    marginBottom: '8px'
                }}>
                    {document.name}
                </h3>
                <p style={{
                    fontSize: '14px',
                    color: '#f59e0b',
                    fontWeight: '600',
                    marginBottom: '8px'
                }}>
                    {document.type}
                </p>
                <p style={{
                    fontSize: '12px',
                    color: '#999',
                    marginBottom: '4px'
                }}>
                    Created: {new Date(document.created_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </p>
                <p style={{
                    fontSize: '12px',
                    color: '#999'
                }}>
                    Size: {document.file_size}
                </p>
            </div>
            <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={() => onView(document)}
                    style={{
                        backgroundColor: 'transparent',
                        color: '#f59e0b',
                        border: '1px solid #f59e0b',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                >
                    <Eye style={{ width: '12px', height: '12px' }} />
                    View
                </button>
                <button
                    onClick={() => onEdit(document)}
                    style={{
                        backgroundColor: 'transparent',
                        color: '#f59e0b',
                        border: '1px solid #f59e0b',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                >
                    <Edit3 style={{ width: '12px', height: '12px' }} />
                    Edit
                </button>
                <button
                    onClick={() => onDownload(document)}
                    style={{
                        backgroundColor: '#f59e0b',
                        color: '#000',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                >
                    <Download style={{ width: '12px', height: '12px' }} />
                    Download
                </button>
                <button
                    onClick={() => onDelete(document)}
                    style={{
                        backgroundColor: 'transparent',
                        color: '#dc2626',
                        border: '1px solid #dc2626',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                >
                    <Trash2 style={{ width: '12px', height: '12px' }} />
                    Delete
                </button>
            </div>
        </div>
        {document.description && (
            <p style={{
                fontSize: '14px',
                color: '#ccc',
                lineHeight: '1.5',
                marginTop: '8px'
            }}>
                {document.description}
            </p>
        )}
    </div>
);

const DocumentViewer = ({ document, onClose }) => (
    <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
    }}>
        <div style={{
            backgroundColor: '#000',
            border: '1px solid #f59e0b',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '800px',
            maxHeight: '90vh',
            width: '100%',
            overflow: 'auto'
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
                    {document.name}
                </h3>
                <button
                    onClick={onClose}
                    style={{
                        backgroundColor: 'transparent',
                        color: '#f59e0b',
                        border: '1px solid #f59e0b',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                    }}
                >
                    Close
                </button>
            </div>
            <div style={{
                padding: '16px',
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333',
                color: '#ccc',
                lineHeight: '1.6'
            }}>
                <p>Document preview would be displayed here. This could include:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '16px' }}>
                    <li>PDF viewer integration</li>
                    <li>Text document content</li>
                    <li>Image preview</li>
                    <li>Metadata information</li>
                </ul>
                <p style={{ marginTop: '16px', fontStyle: 'italic' }}>
                    File Type: {document.type}<br />
                    Size: {document.file_size}<br />
                    Created: {new Date(document.created_date).toLocaleDateString()}
                </p>
            </div>
        </div>
    </div>
);

export default function DocumentsPage() {
    const [documents, setDocuments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        type: 'all',
        sortBy: 'date_desc'
    });
    const [viewingDocument, setViewingDocument] = useState(null);
    const [stats, setStats] = useState({
        totalDocuments: 0,
        totalSize: '0 MB',
        businessPlans: 0,
        proposals: 0
    });

    useEffect(() => {
        // Load mock documents
        const mockDocuments = [
            {
                id: 1,
                name: "Tech Startup Business Plan 2024",
                type: "Business Plan",
                file_size: "2.4 MB",
                created_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                description: "Comprehensive business plan for technology startup focusing on AI solutions."
            },
            {
                id: 2,
                name: "SBIR Grant Proposal - Phase I",
                type: "Grant Proposal",
                file_size: "1.8 MB",
                created_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                description: "Small Business Innovation Research grant proposal for research and development."
            },
            {
                id: 3,
                name: "Marketing Strategy Document",
                type: "Strategy Document",
                file_size: "1.2 MB",
                created_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
                description: "Detailed marketing strategy and campaign planning document."
            },
            {
                id: 4,
                name: "Financial Projections Q1-Q4",
                type: "Financial Report",
                file_size: "956 KB",
                created_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                description: "Quarterly financial projections and revenue forecasts."
            }
        ];

        setDocuments(mockDocuments);

        // Calculate stats
        const businessPlanCount = mockDocuments.filter(d => d.type === 'Business Plan').length;
        const proposalCount = mockDocuments.filter(d => d.type === 'Grant Proposal').length;

        setStats({
            totalDocuments: mockDocuments.length,
            totalSize: '6.3 MB',
            businessPlans: businessPlanCount,
            proposals: proposalCount
        });
    }, []);

    const handleUpload = async () => {
        setIsUploading(true);
        // Simulate upload
        setTimeout(() => {
            alert('File upload functionality would be implemented here.');
            setIsUploading(false);
        }, 1000);
    };

    const handleView = (document) => {
        setViewingDocument(document);
    };

    const handleEdit = (document) => {
        alert(`Edit functionality for "${document.name}" would be implemented here.`);
    };

    const handleDownload = (document) => {
        alert(`Download "${document.name}" would be implemented here.`);
    };

    const handleDelete = (document) => {
        if (confirm(`Are you sure you want to delete "${document.name}"?`)) {
            setDocuments(prev => prev.filter(d => d.id !== document.id));
        }
    };

    const filteredDocuments = documents.filter(doc => {
        const searchMatch = filters.search ?
            doc.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            doc.description?.toLowerCase().includes(filters.search.toLowerCase()) : true;
        const typeMatch = filters.type === 'all' || doc.type === filters.type;
        return searchMatch && typeMatch;
    }).sort((a, b) => {
        switch (filters.sortBy) {
            case 'date_desc':
                return new Date(b.created_date) - new Date(a.created_date);
            case 'date_asc':
                return new Date(a.created_date) - new Date(b.created_date);
            case 'name_asc':
                return a.name.localeCompare(b.name);
            case 'name_desc':
                return b.name.localeCompare(a.name);
            default:
                return 0;
        }
    });

    const documentTypes = ['all', ...new Set(documents.map(d => d.type))];

    return (
        <div style={{ padding: '32px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#fafafa',
                        marginBottom: '8px'
                    }}>
                        Documents
                    </h1>
                    <p style={{ color: '#999', fontSize: '1rem', margin: 0 }}>
                        Manage your business documents and files.
                    </p>
                </div>
                <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    style={{
                        backgroundColor: isUploading ? '#666' : '#f59e0b',
                        color: isUploading ? '#999' : '#000',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Upload style={{ width: '16px', height: '16px' }} />
                    {isUploading ? 'Uploading...' : 'Upload Document'}
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '32px'
            }}>
                <div style={{
                    backgroundColor: '#000',
                    border: '1px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <FileText style={{ width: '24px', height: '24px', color: '#f59e0b', margin: '0 auto 8px' }} />
                    <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#fafafa',
                        marginBottom: '4px'
                    }}>
                        {stats.totalDocuments}
                    </h3>
                    <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>
                        Total Documents
                    </p>
                </div>
                <div style={{
                    backgroundColor: '#000',
                    border: '1px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <Building style={{ width: '24px', height: '24px', color: '#f59e0b', margin: '0 auto 8px' }} />
                    <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#fafafa',
                        marginBottom: '4px'
                    }}>
                        {stats.businessPlans}
                    </h3>
                    <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>
                        Business Plans
                    </p>
                </div>
                <div style={{
                    backgroundColor: '#000',
                    border: '1px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <User style={{ width: '24px', height: '24px', color: '#f59e0b', margin: '0 auto 8px' }} />
                    <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#fafafa',
                        marginBottom: '4px'
                    }}>
                        {stats.proposals}
                    </h3>
                    <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>
                        Proposals
                    </p>
                </div>
                <div style={{
                    backgroundColor: '#000',
                    border: '1px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <Calendar style={{ width: '24px', height: '24px', color: '#f59e0b', margin: '0 auto 8px' }} />
                    <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#fafafa',
                        marginBottom: '4px'
                    }}>
                        {stats.totalSize}
                    </h3>
                    <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>
                        Total Size
                    </p>
                </div>
            </div>

            {/* Filter Card */}
            <div style={{
                backgroundColor: '#000',
                border: '1px solid #f59e0b',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '32px'
            }}>
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#fafafa',
                    marginBottom: '20px'
                }}>
                    Filter Documents
                </h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                }}>
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={filters.search}
                        onChange={e => setFilters(f => ({...f, search: e.target.value}))}
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
                    />

                    <select
                        value={filters.type}
                        onChange={e => setFilters(f => ({...f, type: e.target.value}))}
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
                        {documentTypes.map(type => (
                            <option key={type} value={type}>
                                {type === 'all' ? 'All Types' : type}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.sortBy}
                        onChange={e => setFilters(f => ({...f, sortBy: e.target.value}))}
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
                        <option value="date_desc">Newest First</option>
                        <option value="date_asc">Oldest First</option>
                        <option value="name_asc">Name A-Z</option>
                        <option value="name_desc">Name Z-A</option>
                    </select>
                </div>
            </div>

            {/* Documents List */}
            <div>
                {filteredDocuments.length > 0 ? (
                    filteredDocuments.map(doc => (
                        <DocumentCard
                            key={doc.id}
                            document={doc}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDownload={handleDownload}
                            onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '48px',
                        backgroundColor: '#000',
                        border: '1px solid #f59e0b',
                        borderRadius: '12px',
                        color: '#999'
                    }}>
                        <FileText style={{ width: '48px', height: '48px', color: '#555', margin: '0 auto 16px' }} />
                        <h3 style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: '#fafafa',
                            marginBottom: '8px'
                        }}>
                            No documents found
                        </h3>
                        <p style={{ margin: 0 }}>
                            Upload your first document or adjust your filters.
                        </p>
                    </div>
                )}
            </div>

            {/* Document Viewer Modal */}
            {viewingDocument && (
                <DocumentViewer
                    document={viewingDocument}
                    onClose={() => setViewingDocument(null)}
                />
            )}
        </div>
    );
}