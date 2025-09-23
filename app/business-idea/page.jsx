'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, Save, Plus, Edit, Trash2, FileText } from 'lucide-react';

export default function BusinessIdeaPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    problemSolved: '',
    targetMarket: '',
    businessModel: '',
    competitiveAdvantage: '',
    additionalNotes: ''
  });

  const [savedIdeas, setSavedIdeas] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  // Load saved ideas from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('businessIdeas');
    if (stored) {
      setSavedIdeas(JSON.parse(stored));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    if (!formData.businessName.trim()) {
      setMessage('Business name is required');
      return;
    }

    const idea = {
      id: editingId || Date.now(),
      ...formData,
      createdAt: editingId ? savedIdeas.find(idea => idea.id === editingId)?.createdAt : new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString()
    };

    let updatedIdeas;
    if (editingId) {
      updatedIdeas = savedIdeas.map(item => item.id === editingId ? idea : item);
      setMessage('Business idea updated successfully!');
    } else {
      updatedIdeas = [...savedIdeas, idea];
      setMessage('Business idea saved successfully!');
    }

    setSavedIdeas(updatedIdeas);
    localStorage.setItem('businessIdeas', JSON.stringify(updatedIdeas));

    // Clear form
    setFormData({
      businessName: '',
      problemSolved: '',
      targetMarket: '',
      businessModel: '',
      competitiveAdvantage: '',
      additionalNotes: ''
    });
    setIsEditing(false);
    setEditingId(null);

    setTimeout(() => setMessage(''), 3000);
  };

  const handleEdit = (idea) => {
    setFormData(idea);
    setIsEditing(true);
    setEditingId(idea.id);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this business idea?')) {
      const updatedIdeas = savedIdeas.filter(idea => idea.id !== id);
      setSavedIdeas(updatedIdeas);
      localStorage.setItem('businessIdeas', JSON.stringify(updatedIdeas));
      setMessage('Business idea deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleNewIdea = () => {
    setFormData({
      businessName: '',
      problemSolved: '',
      targetMarket: '',
      businessModel: '',
      competitiveAdvantage: '',
      additionalNotes: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
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
          <Lightbulb style={{ color: '#f59e0b' }} />
          Business Ideas
        </h1>
        <p style={{ color: '#999', fontSize: '1rem' }}>
          Create and manage your business ideas to generate comprehensive business plans
        </p>
      </div>

      {/* Success Message */}
      {message && (
        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '24px',
          color: '#f59e0b',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
        {/* Main Form */}
        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#fafafa',
              marginBottom: '16px'
            }}>
              {isEditing ? 'Edit Business Idea' : 'Create New Business Idea'}
            </h2>

            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Business Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ccc',
                  marginBottom: '6px'
                }}>
                  Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Enter your business name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    backgroundColor: '#333',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Problem Solved */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ccc',
                  marginBottom: '6px'
                }}>
                  Problem Your Business Solves
                </label>
                <textarea
                  name="problemSolved"
                  value={formData.problemSolved}
                  onChange={handleInputChange}
                  placeholder="Describe the problem your business addresses..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    backgroundColor: '#333',
                    color: '#fff',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Target Market */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ccc',
                  marginBottom: '6px'
                }}>
                  Target Market
                </label>
                <textarea
                  name="targetMarket"
                  value={formData.targetMarket}
                  onChange={handleInputChange}
                  placeholder="Who are your customers? Demographics, company types, market size..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    backgroundColor: '#333',
                    color: '#fff',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Business Model */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ccc',
                  marginBottom: '6px'
                }}>
                  Business Model
                </label>
                <textarea
                  name="businessModel"
                  value={formData.businessModel}
                  onChange={handleInputChange}
                  placeholder="How will you make money? Revenue streams, pricing strategy..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    backgroundColor: '#333',
                    color: '#fff',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Competitive Advantage */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ccc',
                  marginBottom: '6px'
                }}>
                  Competitive Advantage
                </label>
                <textarea
                  name="competitiveAdvantage"
                  value={formData.competitiveAdvantage}
                  onChange={handleInputChange}
                  placeholder="What makes you different from competitors?"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    backgroundColor: '#333',
                    color: '#fff',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ccc',
                  marginBottom: '6px'
                }}>
                  Additional Notes
                </label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  placeholder="Any additional information or context..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    backgroundColor: '#333',
                    color: '#fff',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid #333'
            }}>
              <button
                onClick={handleSave}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#f59e0b',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <Save size={16} />
                {isEditing ? 'Update Idea' : 'Save Idea'}
              </button>

              {isEditing && (
                <button
                  onClick={handleNewIdea}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'transparent',
                    color: '#f59e0b',
                    border: '1px solid #f59e0b',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} />
                  New Idea
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Saved Ideas Sidebar */}
        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '24px',
          height: 'fit-content'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#fafafa',
              margin: 0
            }}>
              Saved Ideas ({savedIdeas.length})
            </h3>
          </div>

          {savedIdeas.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: '#999'
            }}>
              <Lightbulb size={48} style={{ margin: '0 auto 16px', color: '#555' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>No saved ideas yet</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Create your first business idea</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {savedIdeas.map((idea) => (
                <div
                  key={idea.id}
                  style={{
                    backgroundColor: '#333',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    padding: '16px'
                  }}
                >
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#fafafa',
                    margin: '0 0 8px'
                  }}>
                    {idea.businessName}
                  </h4>
                  <p style={{
                    fontSize: '12px',
                    color: '#999',
                    margin: '0 0 12px',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {idea.problemSolved || 'No description provided'}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    fontSize: '12px'
                  }}>
                    <button
                      onClick={() => handleEdit(idea)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'transparent',
                        color: '#f59e0b',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      <Edit size={12} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(idea.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'transparent',
                        color: '#ff6b6b',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid #444'
                  }}>
                    Created: {idea.createdAt}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}