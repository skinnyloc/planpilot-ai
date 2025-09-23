'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Mail, Search, Filter, Calendar, Tag, Trash2, Eye, Lightbulb, Folder } from 'lucide-react';

export default function DocumentsPage() {
  const [businessIdeas, setBusinessIdeas] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const documentTypes = [
    { value: 'all', label: 'All Documents' },
    { value: 'business_ideas', label: 'Business Ideas' },
    { value: 'business_plan', label: 'Business Plans' },
    { value: 'letter', label: 'Letters' },
    { value: 'proposal', label: 'Proposals' },
    { value: 'grant_proposal', label: 'Grant Proposals' }
  ];

  useEffect(() => {
    loadBusinessIdeas();
  }, []);

  const loadBusinessIdeas = () => {
    const stored = localStorage.getItem('businessIdeas');
    if (stored) {
      setBusinessIdeas(JSON.parse(stored));
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

  const filteredBusinessIdeas = businessIdeas.filter(idea => {
    const matchesSearch = !searchTerm ||
      idea.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.problemSolved.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchTerm ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || doc.document_type === selectedType;
    return matchesSearch && matchesType;
  });

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'business_ideas':
        return <Lightbulb style={{ width: '20px', height: '20px', color: '#f59e0b' }} />;
      case 'business_plan':
        return <FileText style={{ width: '20px', height: '20px', color: '#3b82f6' }} />;
      case 'letter':
        return <Mail style={{ width: '20px', height: '20px', color: '#10b981' }} />;
      case 'proposal':
      case 'grant_proposal':
        return <FileText style={{ width: '20px', height: '20px', color: '#8b5cf6' }} />;
      default:
        return <FileText style={{ width: '20px', height: '20px', color: '#6b7280' }} />;
    }
  };

  const getDocumentTypeLabel = (type) => {
    const typeObj = documentTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#fafafa',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Folder style={{ color: '#f59e0b' }} />
          Documents
        </h1>
        <p style={{ color: '#999', fontSize: '1rem' }}>
          Manage your business ideas, plans, letters, and proposals.
        </p>
      </div>

      {/* Filters */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{
            width: '16px',
            height: '16px',
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999'
          }} />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '40px',
              paddingRight: '16px',
              paddingTop: '12px',
              paddingBottom: '12px',
              border: '1px solid #444',
              borderRadius: '8px',
              backgroundColor: '#333',
              color: '#fff',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Type Filter */}
        <div style={{ position: 'relative', width: 'fit-content' }}>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              appearance: 'none',
              backgroundColor: '#333',
              border: '1px solid #444',
              borderRadius: '8px',
              padding: '12px 40px 12px 16px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value} style={{ backgroundColor: '#333', color: '#fff' }}>
                {type.label}
              </option>
            ))}
          </select>
          <Filter style={{
            width: '16px',
            height: '16px',
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999',
            pointerEvents: 'none'
          }} />
        </div>
      </div>

      {/* Business Ideas Folder */}
      {(selectedType === 'all' || selectedType === 'business_ideas') && (
        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <Folder style={{ color: '#f59e0b', width: '24px', height: '24px' }} />
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#fafafa',
              margin: 0
            }}>
              Business Ideas ({businessIdeas.length})
            </h2>
          </div>

          {filteredBusinessIdeas.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: '#999'
            }}>
              <Lightbulb style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 16px',
                color: '#555'
              }} />
              <p style={{ margin: 0, fontSize: '14px' }}>
                {searchTerm ? 'No business ideas match your search' : 'No business ideas saved yet'}
              </p>
              <p style={{ margin: '4px 0 16px', fontSize: '12px' }}>
                {searchTerm ? 'Try a different search term' : 'Create your first business idea to get started'}
              </p>
              {!searchTerm && (
                <a
                  href="/business-idea"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#f59e0b',
                    color: '#000',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <Lightbulb size={16} />
                  Create Business Idea
                </a>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {filteredBusinessIdeas.map((idea) => (
                <div
                  key={idea.id}
                  style={{
                    backgroundColor: '#333',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    padding: '16px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'start',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '8px'
                      }}>
                        <Lightbulb style={{ color: '#f59e0b', width: '20px', height: '20px' }} />
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#fafafa',
                          margin: 0
                        }}>
                          {idea.businessName}
                        </h3>
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: '#f59e0b',
                          color: '#000',
                          fontSize: '11px',
                          borderRadius: '12px',
                          fontWeight: '500'
                        }}>
                          Business Idea
                        </span>
                      </div>

                      {idea.problemSolved && (
                        <p style={{
                          fontSize: '14px',
                          color: '#ccc',
                          margin: '0 0 12px',
                          lineHeight: '1.4'
                        }}>
                          {idea.problemSolved}
                        </p>
                      )}

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '12px',
                        color: '#999'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar style={{ width: '12px', height: '12px' }} />
                          {idea.createdAt}
                        </div>
                        {idea.targetMarket && (
                          <div>
                            Target: {idea.targetMarket.slice(0, 50)}...
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                      <a
                        href="/business-idea"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          backgroundColor: '#f59e0b',
                          color: '#000',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontWeight: '500'
                        }}
                        title="View/Edit"
                      >
                        <Eye style={{ width: '12px', height: '12px' }} />
                        View
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Other Documents */}
      {(selectedType === 'all' || selectedType !== 'business_ideas') && (
        <>
          {filteredDocuments.length === 0 && selectedType !== 'business_ideas' ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 16px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px'
            }}>
              <FileText style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 16px',
                color: '#555'
              }} />
              <h3 style={{
                fontSize: '18px',
                fontWeight: '500',
                color: '#fafafa',
                margin: '0 0 8px'
              }}>
                {searchTerm || selectedType !== 'all' ? 'No documents found' : 'No documents yet'}
              </h3>
              <p style={{
                color: '#999',
                margin: '0 0 24px',
                fontSize: '14px'
              }}>
                {searchTerm || selectedType !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first business plan or generate a proposal to get started.'
                }
              </p>
              {(!searchTerm && selectedType === 'all') && (
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  <a
                    href="/business-idea"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f59e0b',
                      color: '#000',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Create Business Plan
                  </a>
                  <a
                    href="/grant-proposals"
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #444',
                      color: '#fafafa',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Generate Proposal
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {filteredDocuments.map((document) => (
                <div
                  key={document.id}
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    padding: '24px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'start',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '8px'
                      }}>
                        {getDocumentIcon(document.document_type)}
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#fafafa',
                          margin: 0
                        }}>
                          {document.title}
                        </h3>
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: '#333',
                          color: '#ccc',
                          fontSize: '11px',
                          borderRadius: '12px'
                        }}>
                          {getDocumentTypeLabel(document.document_type)}
                        </span>
                      </div>

                      {document.description && (
                        <p style={{
                          fontSize: '14px',
                          color: '#999',
                          margin: '0 0 12px'
                        }}>
                          {document.description}
                        </p>
                      )}

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar style={{ width: '12px', height: '12px' }} />
                          {new Date(document.created_at).toLocaleDateString()}
                        </div>
                        {document.file_size && (
                          <div>
                            Size: {(document.file_size / 1024).toFixed(1)} KB
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                      <button
                        onClick={() => handleDownload(document)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          backgroundColor: '#f59e0b',
                          color: '#000',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        title="Download"
                      >
                        <Download style={{ width: '12px', height: '12px' }} />
                        Download
                      </button>
                      <button
                        onClick={() => handleEmail(document)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          backgroundColor: '#333',
                          color: '#ccc',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        title="Email"
                      >
                        <Mail style={{ width: '12px', height: '12px' }} />
                        Email
                      </button>
                      <button
                        onClick={() => handleDelete(document)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          backgroundColor: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        title="Delete"
                      >
                        <Trash2 style={{ width: '12px', height: '12px' }} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Stats */}
      {(businessIdeas.length > 0 || documents.length > 0) && (
        <div style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: 'rgba(51, 51, 51, 0.5)',
          borderRadius: '8px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            color: '#999'
          }}>
            <span>
              {businessIdeas.length} business ideas, {documents.length} other documents
            </span>
            <span>
              Total items: {businessIdeas.length + documents.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}