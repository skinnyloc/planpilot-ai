'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, Download, Eye, Trash2, Edit3, Calendar, User, Building } from 'lucide-react';

const DocumentCard = ({ document, onView, onDelete, onDownload }) => (
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
            maxWidth: '90vw',
            maxHeight: '90vh',
            width: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
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
                flex: 1,
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {document.pdf_content ? (
                    <div style={{
                        width: '100%',
                        height: '70vh',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#000',
                            borderBottom: '1px solid #333',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '500' }}>
                                PDF Viewer
                            </span>
                            <a
                                href={document.pdf_content}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: '#f59e0b',
                                    textDecoration: 'none',
                                    fontSize: '12px',
                                    padding: '4px 8px',
                                    border: '1px solid #f59e0b',
                                    borderRadius: '4px'
                                }}
                            >
                                Open in New Tab
                            </a>
                        </div>
                        <iframe
                            src={document.pdf_content}
                            style={{
                                width: '100%',
                                flex: 1,
                                border: 'none',
                                backgroundColor: '#fff'
                            }}
                            title={`PDF Viewer - ${document.name}`}
                        />
                    </div>
                ) : document.file_object && document.type.includes('Text') ? (
                    <div style={{
                        padding: '24px',
                        color: '#ccc',
                        lineHeight: '1.6',
                        height: '70vh',
                        overflow: 'auto'
                    }}>
                        <h4 style={{
                            color: '#f59e0b',
                            marginBottom: '16px',
                            fontSize: '1.1rem'
                        }}>
                            Text Document Content
                        </h4>
                        <div style={{
                            backgroundColor: '#000',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            padding: '16px',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            whiteSpace: 'pre-wrap'
                        }}>
                            File content would be displayed here for text files.

                            For PDFs, they will render in the PDF viewer above.
                            For other documents, appropriate viewers would be implemented.
                        </div>
                    </div>
                ) : (
                    <div style={{
                        padding: '24px',
                        color: '#ccc',
                        lineHeight: '1.6',
                        height: '70vh',
                        overflow: 'auto'
                    }}>
                        <div style={{
                            textAlign: 'center',
                            padding: '48px 24px'
                        }}>
                            <FileText style={{
                                width: '64px',
                                height: '64px',
                                color: '#f59e0b',
                                margin: '0 auto 16px'
                            }} />
                            <h4 style={{
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                color: '#fafafa',
                                marginBottom: '12px'
                            }}>
                                Document Preview
                            </h4>
                            <p style={{ marginBottom: '20px', color: '#999' }}>
                                Document information:
                            </p>
                            <div style={{
                                backgroundColor: '#000',
                                border: '1px solid #f59e0b',
                                borderRadius: '8px',
                                padding: '16px',
                                textAlign: 'left',
                                maxWidth: '400px',
                                margin: '0 auto'
                            }}>
                                <p style={{ margin: '0 0 8px 0', color: '#f59e0b', fontWeight: '600' }}>
                                    {document.name}
                                </p>
                                <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                                    Type: {document.type}
                                </p>
                                <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                                    Size: {document.file_size}
                                </p>
                                <p style={{ margin: '0', fontSize: '14px' }}>
                                    Created: {new Date(document.created_date).toLocaleDateString()}
                                </p>
                            </div>
                            <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
                                {document.type.includes('PDF') ?
                                    'Upload a PDF file to see it rendered here' :
                                    'This document type can be previewed when uploaded'
                                }
                            </p>
                        </div>
                    </div>
                )}
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
        // Start with empty documents list for production
        setDocuments([]);

        // Initialize empty stats
        setStats({
            totalDocuments: 0,
            totalSize: '0 MB',
            businessPlans: 0,
            proposals: 0
        });
    }, []);

    const handleUpload = async () => {
        // Check if we're in the browser
        if (typeof window === 'undefined') return;

        setIsUploading(true);

        try {
            // Create file input element
            const input = window.document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf,.doc,.docx,.txt';
            input.style.display = 'none';

            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Create new document object
                    const newDocument = {
                        id: Date.now(),
                        name: file.name,
                        type: file.type.includes('pdf') ? 'PDF Document' :
                              file.type.includes('word') ? 'Word Document' :
                              file.type.includes('text') ? 'Text Document' : 'Document',
                        file_size: formatFileSize(file.size),
                        created_date: new Date().toISOString(),
                        description: `Uploaded ${file.name}`,
                        pdf_content: file.type.includes('pdf') ? URL.createObjectURL(file) : null,
                        file_object: file
                    };

                    // Add to documents list
                    setDocuments(prev => {
                        const updatedDocs = [newDocument, ...prev];

                        // Calculate updated stats
                        const businessPlanCount = updatedDocs.filter(d => d.type.includes('Business Plan')).length;
                        const proposalCount = updatedDocs.filter(d => d.type.includes('Proposal')).length;
                        const totalSizeBytes = updatedDocs.reduce((sum, doc) => {
                            const sizeStr = doc.file_size;
                            const sizeNum = parseFloat(sizeStr);
                            const unit = sizeStr.split(' ')[1];
                            let bytes = sizeNum;
                            if (unit === 'KB') bytes = sizeNum * 1024;
                            else if (unit === 'MB') bytes = sizeNum * 1024 * 1024;
                            else if (unit === 'GB') bytes = sizeNum * 1024 * 1024 * 1024;
                            return sum + bytes;
                        }, 0);

                        setStats({
                            totalDocuments: updatedDocs.length,
                            totalSize: formatFileSize(totalSizeBytes),
                            businessPlans: businessPlanCount,
                            proposals: proposalCount
                        });

                        return updatedDocs;
                    });
                }
                setIsUploading(false);
                // Remove input element
                window.document.body.removeChild(input);
            };

            input.oncancel = () => {
                setIsUploading(false);
                window.document.body.removeChild(input);
            };

            // Trigger file dialog
            window.document.body.appendChild(input);
            input.click();

        } catch (error) {
            console.error('Upload error:', error);
            setIsUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleView = (document) => {
        setViewingDocument(document);
    };

    const handleEdit = (document) => {
        alert(`Edit functionality for "${document.name}" would be implemented here.`);
    };

    const handleDownload = (document) => {
        // Check if we're in the browser
        if (typeof window === 'undefined') return;

        // If it's an uploaded file, download the original file
        if (document.file_object) {
            const url = window.URL.createObjectURL(document.file_object);
            const link = window.document.createElement('a');
            link.href = url;
            link.download = document.name;
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            return;
        }

        // For mock documents, create a sample PDF
        const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 750 Td
(${document.name}) Tj
0 -20 Td
(Type: ${document.type}) Tj
0 -20 Td
(Created: ${new Date(document.created_date).toLocaleDateString()}) Tj
0 -20 Td
(Size: ${document.file_size}) Tj
0 -40 Td
(${document.description || 'No description available'}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
0000000526 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
625
%%EOF`;

        // Create blob and download
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = `${document.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
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