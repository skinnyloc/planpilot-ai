'use client';

import { useState, useEffect } from 'react';
import {
  Lightbulb,
  Edit,
  Save,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Building2,
  Users,
  Target,
  DollarSign,
  Download,
  FileText,
  Trash2,
  AlertCircle,
  Calendar,
  MapPin,
  Briefcase
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useUser as useAuthUser } from '@/lib/hooks/useUser';
import { canAccessFeature } from '@/lib/utils/planChecker';
import {
  getUserBusinessIdeas,
  createBusinessIdea,
  updateBusinessIdea,
  deleteBusinessIdea,
  toggleReadyForPlan as toggleReadyForPlanService
} from '@/lib/services/businessIdeas';
import UpgradePrompt from '@/components/UpgradePrompt';

export default function BusinessIdeaPage() {
  const { user } = useUser();
  const { userId, loading: authLoading, isAuthenticated } = useAuthUser();
  const canSave = canAccessFeature(user, 'business-plan-generation');

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [savedIdeas, setSavedIdeas] = useState([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Basic Business Profile
    businessName: '',
    businessAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    yearsInBusiness: '',
    industry: '',
    businessStage: '',

    // Step 2: Core Business Information
    problemSolved: '',
    targetMarket: '',
    businessModel: '',
    competitiveAdvantage: '',
    revenueGoals: {
      monthly: '',
      yearly: ''
    },

    // Step 3: Additional Details
    teamSize: '',
    keyRoles: '',
    fundingStatus: '',
    marketingChannels: [],
    additionalContext: '',

    // Meta
    readyForPlan: false,
    createdAt: null,
    updatedAt: null
  });

  // Form validation state
  const [errors, setErrors] = useState({});

  // Industry options
  const industryOptions = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing',
    'Education', 'Real Estate', 'Food & Beverage', 'Transportation',
    'Energy', 'Entertainment', 'Agriculture', 'Construction', 'Consulting',
    'Professional Services', 'Non-Profit', 'Other'
  ];

  // Business stage options
  const businessStageOptions = [
    { value: 'idea', label: 'Idea Stage - Concept development' },
    { value: 'planning', label: 'Planning Stage - Business plan development' },
    { value: 'startup', label: 'Startup Stage - Recently launched (0-2 years)' },
    { value: 'operating', label: 'Operating Stage - Established business (2-5 years)' },
    { value: 'scaling', label: 'Scaling Stage - Growth and expansion (5+ years)' }
  ];

  // Years in business options
  const yearsInBusinessOptions = [
    { value: 'startup', label: 'Startup - Just starting' },
    { value: '1-2', label: '1-2 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '5+', label: '5+ years' }
  ];

  // Funding status options
  const fundingStatusOptions = [
    'Self-funded/Bootstrapped',
    'Friends & Family',
    'Angel Investment',
    'Venture Capital',
    'Bank Loan',
    'Crowdfunding',
    'Government Grant',
    'Seeking Funding',
    'No Funding Needed'
  ];

  // Marketing channels options
  const marketingChannelOptions = [
    'Social Media Marketing',
    'Email Marketing',
    'Content Marketing',
    'SEO/SEM',
    'Traditional Advertising',
    'Networking/Events',
    'Referrals',
    'Direct Sales',
    'Partnerships',
    'Influencer Marketing',
    'Print Media',
    'Radio/TV'
  ];

  // Load saved ideas on component mount
  useEffect(() => {
    if (userId && !authLoading) {
      loadSavedIdeas();
    }
  }, [userId, authLoading]);

  const loadSavedIdeas = async () => {
    if (!userId) return;

    try {
      const ideas = await getUserBusinessIdeas(userId);
      // Transform Supabase data to match component expectations
      const transformedIdeas = ideas.map(idea => ({
        ...idea,
        businessName: idea.name,
        createdAt: new Date(idea.created_at).toISOString().split('T')[0],
        updatedAt: new Date(idea.updated_at).toISOString().split('T')[0],
        readyForPlan: idea.ready_for_plan
      }));
      setSavedIdeas(transformedIdeas);
    } catch (error) {
      console.error('Failed to load business ideas:', error);
      setMessage({ type: 'error', text: 'Failed to load saved business ideas' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleMarketingChannelToggle = (channel) => {
    setFormData(prev => ({
      ...prev,
      marketingChannels: prev.marketingChannels.includes(channel)
        ? prev.marketingChannels.filter(c => c !== channel)
        : [...prev.marketingChannels, channel]
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
        if (!formData.industry) newErrors.industry = 'Industry is required';
        if (!formData.businessStage) newErrors.businessStage = 'Business stage is required';
        if (!formData.yearsInBusiness) newErrors.yearsInBusiness = 'Years in business is required';
        break;

      case 2:
        if (!formData.problemSolved.trim()) newErrors.problemSolved = 'Problem description is required';
        if (!formData.targetMarket.trim()) newErrors.targetMarket = 'Target market is required';
        if (!formData.businessModel.trim()) newErrors.businessModel = 'Business model is required';
        break;

      case 3:
        // Optional step - no required fields
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    if (!canSave) {
      setMessage({ type: 'error', text: 'Business idea saving requires Pro subscription' });
      return;
    }

    if (!userId) {
      setMessage({ type: 'error', text: 'You must be logged in to save business ideas' });
      return;
    }

    if (!validateStep(1) || !validateStep(2)) {
      setMessage({ type: 'error', text: 'Please complete all required fields' });
      return;
    }

    try {
      let savedIdea;
      if (selectedIdeaId) {
        // Update existing idea
        savedIdea = await updateBusinessIdea(selectedIdeaId, userId, formData);
        setMessage({ type: 'success', text: 'Business idea updated successfully!' });
      } else {
        // Create new idea
        savedIdea = await createBusinessIdea(userId, formData);
        setMessage({ type: 'success', text: 'Business idea saved successfully!' });
      }

      // Reload the ideas list to get updated data
      await loadSavedIdeas();
      resetForm();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error('Error saving business idea:', error);
      setMessage({ type: 'error', text: 'Failed to save business idea. Please try again.' });
    }
  };

  const handleEdit = (idea) => {
    setFormData(idea);
    setSelectedIdeaId(idea.id);
    setIsEditing(true);
    setCurrentStep(1);
  };

  const handleDelete = async (ideaId) => {
    if (!userId) {
      setMessage({ type: 'error', text: 'You must be logged in to delete business ideas' });
      return;
    }

    if (confirm('Are you sure you want to delete this business idea?')) {
      try {
        await deleteBusinessIdea(ideaId, userId);
        await loadSavedIdeas(); // Reload list
        if (selectedIdeaId === ideaId) {
          resetForm();
        }
        setMessage({ type: 'success', text: 'Business idea deleted successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        console.error('Error deleting business idea:', error);
        setMessage({ type: 'error', text: 'Failed to delete business idea. Please try again.' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      businessName: '',
      businessAddress: { street: '', city: '', state: '', zipCode: '' },
      yearsInBusiness: '',
      industry: '',
      businessStage: '',
      problemSolved: '',
      targetMarket: '',
      businessModel: '',
      competitiveAdvantage: '',
      revenueGoals: { monthly: '', yearly: '' },
      teamSize: '',
      keyRoles: '',
      fundingStatus: '',
      marketingChannels: [],
      additionalContext: '',
      readyForPlan: false,
      createdAt: null,
      updatedAt: null
    });
    setSelectedIdeaId(null);
    setIsEditing(false);
    setCurrentStep(1);
    setErrors({});
  };

  const handleExportPDF = async (idea) => {
    try {
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 30;

      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Business Idea Profile', margin, yPosition);
      yPosition += 20;

      // Business details
      const sections = [
        { title: 'Basic Information', data: {
          'Business Name': idea.businessName,
          'Industry': idea.industry,
          'Business Stage': idea.businessStage,
          'Years in Business': idea.yearsInBusiness
        }},
        { title: 'Core Business Information', data: {
          'Problem Solved': idea.problemSolved,
          'Target Market': idea.targetMarket,
          'Business Model': idea.businessModel,
          'Competitive Advantage': idea.competitiveAdvantage
        }},
        { title: 'Additional Details', data: {
          'Team Size': idea.teamSize,
          'Funding Status': idea.fundingStatus,
          'Marketing Channels': idea.marketingChannels?.join(', '),
          'Additional Context': idea.additionalContext
        }}
      ];

      for (const section of sections) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(section.title, margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');

        for (const [key, value] of Object.entries(section.data)) {
          if (value && value.trim()) {
            const lines = pdf.splitTextToSize(`${key}: ${value}`, pageWidth - (margin * 2));
            pdf.text(lines, margin, yPosition);
            yPosition += lines.length * 5 + 3;

            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;
            }
          }
        }
        yPosition += 10;
      }

      const filename = `${idea.businessName.replace(/[^a-zA-Z0-9]/g, '_')}_Business_Idea.pdf`;
      pdf.save(filename);

      setMessage({ type: 'success', text: `Business idea exported as ${filename}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error('Export failed:', error);
      setMessage({ type: 'error', text: 'Failed to export PDF. Please try again.' });
    }
  };

  const handleToggleReadyForPlan = async (ideaId) => {
    if (!userId) {
      setMessage({ type: 'error', text: 'You must be logged in to update business ideas' });
      return;
    }

    try {
      // Get the current idea to toggle its status
      const currentIdea = savedIdeas.find(idea => idea.id === ideaId);
      if (!currentIdea) return;

      const newStatus = !currentIdea.readyForPlan;
      await toggleReadyForPlanService(ideaId, userId, newStatus);

      // Reload the ideas list to get updated data
      await loadSavedIdeas();
    } catch (error) {
      console.error('Error toggling ready for plan status:', error);
      setMessage({ type: 'error', text: 'Failed to update status. Please try again.' });
    }
  };

  // Step progress indicator
  const steps = [
    { number: 1, title: 'Business Profile', icon: Building2 },
    { number: 2, title: 'Core Information', icon: Target },
    { number: 3, title: 'Additional Details', icon: Users }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          <span className="text-brand-gradient">Business Ideas</span> Management
        </h1>
        <p className="text-muted-foreground">
          Create comprehensive business profiles to generate detailed business plans
        </p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-lg border flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Saved Ideas Panel */}
        <div className="xl:col-span-1">
          <div className="bg-card border border-border rounded-lg">
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-card-foreground">Saved Ideas</h2>
                <button
                  onClick={resetForm}
                  className="inline-flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  New Idea
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
              {savedIdeas.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No saved ideas yet</p>
                  <p className="text-sm text-muted-foreground">Create your first business idea profile</p>
                </div>
              ) : (
                savedIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className={`border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors ${
                      selectedIdeaId === idea.id ? 'ring-2 ring-primary bg-accent/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-card-foreground">{idea.businessName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                            {idea.industry}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            idea.readyForPlan
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {idea.readyForPlan ? 'Ready' : 'Draft'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {idea.problemSolved || 'No problem description'}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(idea)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleExportPDF(idea)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Download className="h-3 w-3" />
                        Export
                      </button>
                      <button
                        onClick={() => handleToggleReadyForPlan(idea.id)}
                        className={`inline-flex items-center gap-1 text-xs ${
                          idea.readyForPlan
                            ? 'text-green-600 hover:text-green-700'
                            : 'text-blue-600 hover:text-blue-700'
                        }`}
                      >
                        <CheckCircle className="h-3 w-3" />
                        {idea.readyForPlan ? 'Mark Draft' : 'Mark Ready'}
                      </button>
                      <button
                        onClick={() => handleDelete(idea.id)}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Form Panel */}
        <div className="xl:col-span-2">
          <div className="bg-card border border-border rounded-lg">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-card-foreground">
                {isEditing ? 'Edit Business Idea' : 'Create New Business Idea'}
              </h2>

              {/* Progress Indicator */}
              <div className="flex items-center justify-between mt-4">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      currentStep >= step.number
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground text-muted-foreground'
                    }`}>
                      {currentStep > step.number ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <step.icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="ml-2 hidden sm:block">
                      <p className={`text-sm font-medium ${
                        currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-0.5 mx-4 ${
                        currentStep > step.number ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6">
              {/* Step 1: Business Profile */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Business Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        placeholder="Enter your business name"
                        className={`input-branded w-full ${errors.businessName ? 'border-red-500' : ''}`}
                      />
                      {errors.businessName && <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Business Address
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            name="businessAddress.street"
                            value={formData.businessAddress.street}
                            onChange={handleInputChange}
                            placeholder="Street address"
                            className="input-branded w-full"
                          />
                        </div>
                        <input
                          type="text"
                          name="businessAddress.city"
                          value={formData.businessAddress.city}
                          onChange={handleInputChange}
                          placeholder="City"
                          className="input-branded w-full"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            name="businessAddress.state"
                            value={formData.businessAddress.state}
                            onChange={handleInputChange}
                            placeholder="State"
                            className="input-branded w-full"
                          />
                          <input
                            type="text"
                            name="businessAddress.zipCode"
                            value={formData.businessAddress.zipCode}
                            onChange={handleInputChange}
                            placeholder="ZIP"
                            className="input-branded w-full"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Years in Business <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="yearsInBusiness"
                        value={formData.yearsInBusiness}
                        onChange={handleInputChange}
                        className={`input-branded w-full ${errors.yearsInBusiness ? 'border-red-500' : ''}`}
                      >
                        <option value="">Select years in business...</option>
                        {yearsInBusinessOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      {errors.yearsInBusiness && <p className="text-red-500 text-sm mt-1">{errors.yearsInBusiness}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Industry/Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        className={`input-branded w-full ${errors.industry ? 'border-red-500' : ''}`}
                      >
                        <option value="">Select industry...</option>
                        {industryOptions.map(industry => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                      {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Business Stage <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="businessStage"
                        value={formData.businessStage}
                        onChange={handleInputChange}
                        className={`input-branded w-full ${errors.businessStage ? 'border-red-500' : ''}`}
                      >
                        <option value="">Select business stage...</option>
                        {businessStageOptions.map(stage => (
                          <option key={stage.value} value={stage.value}>{stage.label}</option>
                        ))}
                      </select>
                      {errors.businessStage && <p className="text-red-500 text-sm mt-1">{errors.businessStage}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Core Business Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Problem Your Business Solves <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="problemSolved"
                      value={formData.problemSolved}
                      onChange={handleInputChange}
                      placeholder="Describe the specific problem or pain point your business addresses..."
                      rows={3}
                      className={`input-branded w-full ${errors.problemSolved ? 'border-red-500' : ''}`}
                    />
                    {errors.problemSolved && <p className="text-red-500 text-sm mt-1">{errors.problemSolved}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Target Market <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="targetMarket"
                      value={formData.targetMarket}
                      onChange={handleInputChange}
                      placeholder="Who are your customers? Include demographics, company types, market size..."
                      rows={3}
                      className={`input-branded w-full ${errors.targetMarket ? 'border-red-500' : ''}`}
                    />
                    {errors.targetMarket && <p className="text-red-500 text-sm mt-1">{errors.targetMarket}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Business Model <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="businessModel"
                      value={formData.businessModel}
                      onChange={handleInputChange}
                      placeholder="How do you make money? Describe your revenue streams, pricing strategy..."
                      rows={3}
                      className={`input-branded w-full ${errors.businessModel ? 'border-red-500' : ''}`}
                    />
                    {errors.businessModel && <p className="text-red-500 text-sm mt-1">{errors.businessModel}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Competitive Advantage
                    </label>
                    <textarea
                      name="competitiveAdvantage"
                      value={formData.competitiveAdvantage}
                      onChange={handleInputChange}
                      placeholder="What makes you different and better than competitors?"
                      rows={3}
                      className="input-branded w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Monthly Revenue Goal
                      </label>
                      <input
                        type="text"
                        name="revenueGoals.monthly"
                        value={formData.revenueGoals.monthly}
                        onChange={handleInputChange}
                        placeholder="e.g., $50,000"
                        className="input-branded w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Yearly Revenue Goal
                      </label>
                      <input
                        type="text"
                        name="revenueGoals.yearly"
                        value={formData.revenueGoals.yearly}
                        onChange={handleInputChange}
                        placeholder="e.g., $600,000"
                        className="input-branded w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Additional Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Team Size
                      </label>
                      <input
                        type="text"
                        name="teamSize"
                        value={formData.teamSize}
                        onChange={handleInputChange}
                        placeholder="e.g., 5 employees, 2 founders"
                        className="input-branded w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Current Funding Status
                      </label>
                      <select
                        name="fundingStatus"
                        value={formData.fundingStatus}
                        onChange={handleInputChange}
                        className="input-branded w-full"
                      >
                        <option value="">Select funding status...</option>
                        {fundingStatusOptions.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Key Roles & Responsibilities
                    </label>
                    <textarea
                      name="keyRoles"
                      value={formData.keyRoles}
                      onChange={handleInputChange}
                      placeholder="Describe key team members and their roles..."
                      rows={3}
                      className="input-branded w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Marketing Channels Used
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {marketingChannelOptions.map(channel => (
                        <label key={channel} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.marketingChannels.includes(channel)}
                            onChange={() => handleMarketingChannelToggle(channel)}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-foreground">{channel}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Additional Context for AI Personalization
                    </label>
                    <textarea
                      name="additionalContext"
                      value={formData.additionalContext}
                      onChange={handleInputChange}
                      placeholder="Any additional information that would help create a more personalized business plan..."
                      rows={4}
                      className="input-branded w-full"
                    />
                  </div>
                </div>
              )}

              {/* Navigation and Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <div>
                  {currentStep > 1 && (
                    <button
                      onClick={prevStep}
                      className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {currentStep < 3 ? (
                    <button
                      onClick={nextStep}
                      className="btn-primary inline-flex items-center gap-2 px-6 py-2 rounded-md"
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={resetForm}
                        className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80"
                      >
                        Clear Form
                      </button>
                      {canSave ? (
                        <button
                          onClick={handleSave}
                          className="btn-primary inline-flex items-center gap-2 px-6 py-2 rounded-md"
                        >
                          <Save className="h-4 w-4" />
                          {isEditing ? 'Update Idea' : 'Save Idea'}
                        </button>
                      ) : (
                        <UpgradePrompt feature="business-plan-generation" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}