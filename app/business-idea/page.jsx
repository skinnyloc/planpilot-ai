'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Trash2, Plus } from 'lucide-react';
import ProtectedRoute from '@/lib/components/ProtectedRoute';

// Move Field component outside to prevent re-renders
const Field = ({ id, label, value, onChange, type = "text", isTextarea = false, required = false, placeholder = "", error = null }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#ccc',
      marginBottom: '6px'
    }}>
      {label}{required && ' *'}
    </label>
    {isTextarea ? (
      <textarea
        id={id}
        name={id}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        style={{
          width: '100%',
          padding: '12px',
          border: error ? '2px solid #ff6b6b' : '1px solid #f59e0b',
          borderRadius: '8px',
          backgroundColor: '#000',
          color: '#fff',
          fontSize: '14px',
          resize: 'vertical',
          outline: 'none'
        }}
      />
    ) : (
      <input
        id={id}
        name={id}
        type={type}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px',
          border: error ? '2px solid #ff6b6b' : '1px solid #f59e0b',
          borderRadius: '8px',
          backgroundColor: '#000',
          color: '#fff',
          fontSize: '14px',
          outline: 'none'
        }}
      />
    )}
    {error && <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px', margin: '4px 0 0' }}>{error}</p>}
  </div>
);

function BusinessIdeaContent() {
  const [ideas, setIdeas] = useState([]);
  const [currentIdea, setCurrentIdea] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    const stored = localStorage.getItem('businessIdeas');
    if (stored) {
      const parsedIdeas = JSON.parse(stored);

      // Fix any duplicate IDs from old data
      const fixedIdeas = parsedIdeas.map((idea, index) => {
        if (!idea.id || typeof idea.id === 'number' || parsedIdeas.findIndex(i => i.id === idea.id) !== index) {
          const timestamp = Date.now() + index;
          const random = Math.floor(Math.random() * 10000);
          return {
            ...idea,
            id: `${timestamp}_${random}`
          };
        }
        return idea;
      });

      // Save fixed data back to localStorage
      if (JSON.stringify(fixedIdeas) !== JSON.stringify(parsedIdeas)) {
        localStorage.setItem('businessIdeas', JSON.stringify(fixedIdeas));
      }

      setIdeas(fixedIdeas);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!currentIdea.business_name?.trim()) newErrors.business_name = "Business name is required.";
    if (!currentIdea.business_address?.trim()) newErrors.business_address = "Business address is required.";
    if (!currentIdea.problem_solved?.trim()) newErrors.problem_solved = "Problem solved is required.";

    const yearsInBusiness = Number(currentIdea.years_in_business);
    if (isNaN(yearsInBusiness) || yearsInBusiness < 0) {
      newErrors.years_in_business = "Years in business must be a non-negative number.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNew = () => {
    setCurrentIdea({
      business_name: "",
      concept: "",
      extra_prompt: "",
      business_address: "",
      years_in_business: 0,
      problem_solved: "",
      mission_statement: "",
      target_market: "",
      business_goals: "",
      industry: "",
      startup_costs: 0,
      revenue_model: "",
      competitive_advantage: "",
      location: ""
    });
    setErrors({});
  };

  const handleSelect = (idea) => {
    setCurrentIdea(idea);
    setErrors({});
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setCurrentIdea(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSave = async () => {
    if (!currentIdea || !validate()) return;
    setIsSaving(true);

    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const dataToSave = {
      ...currentIdea,
      startup_costs: Number(currentIdea.startup_costs) || 0,
      years_in_business: Number(currentIdea.years_in_business) || 0,
      id: currentIdea.id || `${timestamp}_${random}`,
      createdAt: currentIdea.createdAt || new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString()
    };

    let updatedIdeas;
    if (currentIdea.id) {
      updatedIdeas = ideas.map(item => item.id === currentIdea.id ? dataToSave : item);
    } else {
      updatedIdeas = [...ideas, dataToSave];
    }

    setIdeas(updatedIdeas);
    localStorage.setItem('businessIdeas', JSON.stringify(updatedIdeas));

    // Auto-save to documents section if new business idea
    if (!currentIdea.id && !currentIdea.source) {
      const existingDocuments = JSON.parse(localStorage.getItem('userDocuments') || '[]');
      const docTimestamp = Date.now() + 2;
      const docRandom = Math.floor(Math.random() * 10000);
      const newDocument = {
        id: `${docTimestamp}_${docRandom}`,
        name: `${dataToSave.business_name} - Business Plan`,
        type: "Business Plan",
        file_size: "0 KB",
        created_date: new Date().toISOString(),
        description: `Business plan for ${dataToSave.business_name}`,
        pdf_content: null,
        file_object: null,
        source: 'business_idea',
        business_idea_id: dataToSave.id
      };
      const updatedDocuments = [newDocument, ...existingDocuments];
      localStorage.setItem('userDocuments', JSON.stringify(updatedDocuments));
    }

    setCurrentIdea(null);
    setIsSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this business idea?')) return;

    const updatedIdeas = ideas.filter(idea => idea.id !== id);
    setIdeas(updatedIdeas);
    localStorage.setItem('businessIdeas', JSON.stringify(updatedIdeas));

    // Also remove related document from documents section
    const existingDocuments = JSON.parse(localStorage.getItem('userDocuments') || '[]');
    const filteredDocuments = existingDocuments.filter(doc => doc.business_idea_id !== id);
    localStorage.setItem('userDocuments', JSON.stringify(filteredDocuments));

    if (currentIdea && currentIdea.id === id) {
      setCurrentIdea(null);
    }
  };


  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#fafafa',
          marginBottom: '8px'
        }}>
          Business Idea Input
        </h1>
        <p style={{ color: '#999', fontSize: '1rem', margin: 0 }}>
          Plan, fund, and grow your business, all in one place.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px' }}>
        <div style={{
          backgroundColor: '#000',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
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
              Your Ideas
            </h3>
          </div>

          <button
            onClick={handleNew}
            style={{
              width: '100%',
              backgroundColor: '#f59e0b',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Plus size={16} />
            New Idea
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ideas.map(idea => (
              <div
                key={idea.id}
                onClick={() => handleSelect(idea)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: currentIdea?.id === idea.id ? '#333' : 'transparent',
                  border: currentIdea?.id === idea.id ? '1px solid #f59e0b' : '1px solid transparent',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (currentIdea?.id !== idea.id) {
                    e.target.style.backgroundColor = '#1a1a1a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentIdea?.id !== idea.id) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#fafafa',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {idea.business_name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(idea.id);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#ff6b6b',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          {currentIdea ? (
            <div style={{
              backgroundColor: '#000',
              border: '1px solid #f59e0b',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#fafafa',
                  margin: 0
                }}>
                  {currentIdea.id ? `Editing: ${currentIdea.business_name}` : 'Create New Idea'}
                </h3>
              </div>

              <div style={{ display: 'grid', gap: '0' }}>
                <Field
                  id="business_name"
                  label="Business Name"
                  value={currentIdea.business_name}
                  onChange={handleChange}
                  required
                  error={errors.business_name}
                />
                <Field
                  id="business_address"
                  label="Business Address"
                  value={currentIdea.business_address}
                  onChange={handleChange}
                  required
                  error={errors.business_address}
                />
                <Field
                  id="years_in_business"
                  label="Years in Business"
                  type="number"
                  value={currentIdea.years_in_business}
                  onChange={handleChange}
                  error={errors.years_in_business}
                />
                <Field
                  id="problem_solved"
                  label="Problem Solved"
                  value={currentIdea.problem_solved}
                  onChange={handleChange}
                  isTextarea
                  required
                  error={errors.problem_solved}
                />

                <div style={{ borderTop: '1px solid #f59e0b', margin: '20px 0', paddingTop: '20px' }}>
                  <Field
                    id="concept"
                    label="Concept"
                    value={currentIdea.concept}
                    onChange={handleChange}
                    isTextarea
                  />
                  <Field
                    id="mission_statement"
                    label="Mission Statement"
                    value={currentIdea.mission_statement}
                    onChange={handleChange}
                    isTextarea
                  />
                  <Field
                    id="target_market"
                    label="Target Market"
                    value={currentIdea.target_market}
                    onChange={handleChange}
                    isTextarea
                  />
                  <Field
                    id="business_goals"
                    label="Business Goals"
                    value={currentIdea.business_goals}
                    onChange={handleChange}
                    isTextarea
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <Field
                      id="industry"
                      label="Industry"
                      value={currentIdea.industry}
                      onChange={handleChange}
                    />
                    <Field
                      id="startup_costs"
                      label="Startup Costs ($)"
                      type="number"
                      value={currentIdea.startup_costs}
                      onChange={handleChange}
                    />
                  </div>

                  <Field
                    id="revenue_model"
                    label="Revenue Model"
                    value={currentIdea.revenue_model}
                    onChange={handleChange}
                    isTextarea
                  />
                  <Field
                    id="competitive_advantage"
                    label="Competitive Advantage"
                    value={currentIdea.competitive_advantage}
                    onChange={handleChange}
                    isTextarea
                  />
                  <Field
                    id="location"
                    label="Location"
                    value={currentIdea.location}
                    onChange={handleChange}
                  />
                  <Field
                    id="extra_prompt"
                    label="Extra Instructions for AI"
                    value={currentIdea.extra_prompt}
                    onChange={handleChange}
                    isTextarea
                    placeholder="Tell the AI anything extra to include (tone, niche, special goals, partners, timeline, etc.)."
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    backgroundColor: '#f59e0b',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '14px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: isSaving ? 0.7 : 1,
                    width: 'fit-content'
                  }}
                >
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save Idea'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#000',
              border: '1px solid #f59e0b',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#fafafa',
                marginBottom: '12px'
              }}>
                Select an idea to edit or create a new one.
              </h2>
              <p style={{
                color: '#999',
                fontSize: '1rem',
                margin: 0
              }}>
                This is where you'll define the core of your business venture.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BusinessIdeaPage() {
  return (
    <ProtectedRoute>
      <BusinessIdeaContent />
    </ProtectedRoute>
  );
}