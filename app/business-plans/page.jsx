'use client';

import { useState, useEffect } from 'react';
import {
  ChevronDown,
  Sparkles,
  FileText,
  Plus,
  RefreshCw,
  Download,
  Copy,
  Save,
  Edit,
  Loader2,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { canAccessFeature } from '@/lib/utils/planChecker';
import UpgradePrompt from '@/components/UpgradePrompt';

export default function BusinessPlansPage() {
  const { user, isLoaded } = useUser();
  const canGeneratePlan = canAccessFeature(user, 'business-plan-generation');

  // Business Ideas State
  const [businessIdeas, setBusinessIdeas] = useState([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generationError, setGenerationError] = useState('');
  const [hasResults, setHasResults] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    businessName: '',
    businessIdea: '',
    industry: '',
    targetMarket: '',
    businessModel: '',
    competitiveAdvantage: '',
    fundingNeeds: '',
    timeframe: '3 years'
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  // Load business ideas on mount
  useEffect(() => {
    if (isLoaded && user) {
      loadBusinessIdeas();
    }
  }, [isLoaded, user]);

  const loadBusinessIdeas = async () => {
    try {
      // For now, use static data - in production, load from API
      const staticIdeas = [
        {
          id: '1',
          name: 'EcoClean Solutions',
          summary: 'Eco-friendly cleaning products for businesses',
          industry: 'Environmental Services',
          target_market: 'Commercial businesses and offices'
        },
        {
          id: '2',
          name: 'FoodWaste Tracker',
          summary: 'AI-powered app to reduce restaurant food waste',
          industry: 'Technology',
          target_market: 'Restaurants and food service businesses'
        },
        {
          id: '3',
          name: 'Remote Work Hub',
          summary: 'Co-working spaces in suburban areas',
          industry: 'Real Estate',
          target_market: 'Remote workers and small teams'
        },
        {
          id: '4',
          name: 'Smart Garden System',
          summary: 'IoT-enabled automated gardening system',
          industry: 'Technology',
          target_market: 'Home gardeners and urban farmers'
        },
        {
          id: '5',
          name: 'Local Delivery Network',
          summary: 'Hyperlocal delivery service for small businesses',
          industry: 'Logistics',
          target_market: 'Local businesses and consumers'
        }
      ];
      setBusinessIdeas(staticIdeas);
    } catch (error) {
      console.error('Error loading business ideas:', error);
      setMessage({ type: 'error', text: 'Failed to load business ideas' });
    }
  };

  // Handle idea selection
  const handleIdeaSelect = (ideaId) => {
    setSelectedIdeaId(ideaId);
    const selectedIdea = businessIdeas.find(idea => idea.id === ideaId);

    if (selectedIdea) {
      setFormData({
        businessName: selectedIdea.name,
        businessIdea: selectedIdea.summary,
        industry: selectedIdea.industry || '',
        targetMarket: selectedIdea.target_market || '',
        businessModel: '',
        competitiveAdvantage: '',
        fundingNeeds: '',
        timeframe: '3 years'
      });
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Generate business plan using direct OpenAI client
  const handleGenerate = async () => {
    if (!canGeneratePlan) {
      setMessage({ type: 'error', text: 'Business plan generation requires Pro subscription' });
      return;
    }

    // Validate required fields
    if (!formData.businessIdea.trim()) {
      setMessage({ type: 'error', text: 'Please provide a business idea description' });
      return;
    }

    setIsGenerating(true);
    setGenerationError('');
    setGenerationProgress(0);
    setHasResults(false);

    try {
      console.log('🚀 DIRECT OPENAI GENERATION STARTED');

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 500);

      // Build comprehensive prompt for detailed, professional output
      const prompt = `
        You are a senior business consultant with 20+ years of experience writing comprehensive business plans for successful companies. Create an exceptionally detailed, professional business plan that investors and lenders would find compelling and thorough.

        **CRITICAL REQUIREMENTS:**
        - Write AT LEAST 3-4 paragraphs per section (minimum 300-400 words each)
        - Use specific industry data, market research insights, and financial projections
        - Include concrete numbers, percentages, and realistic timelines
        - Write in a professional, authoritative tone suitable for investors
        - Avoid generic statements - make everything specific to this business
        - Use business terminology and formal language throughout

        **Client's Business Information:**
        - Business Name: ${formData.businessName || 'Professional Business Venture'}
        - Core Business Concept: ${formData.businessIdea}
        - Industry Sector: ${formData.industry || 'Emerging Market'}
        - Primary Target Market: ${formData.targetMarket || 'Professional Market Segment'}
        - Revenue Model: ${formData.businessModel || 'Diversified Revenue Streams'}
        - Competitive Differentiation: ${formData.competitiveAdvantage || 'Innovative Market Approach'}
        - Capital Requirements: ${formData.fundingNeeds || 'Strategic Investment Needs'}
        - Business Timeline: ${formData.timeframe || '3-5 year strategic plan'}

        **MANDATORY SECTIONS - Each must be comprehensive and detailed:**

        # Executive Summary
        Write a compelling 4-5 paragraph executive summary that includes: business concept overview, market opportunity size, competitive advantages, financial highlights, funding requirements, and expected returns. Make it investor-ready.

        # Company Description
        Provide 3-4 detailed paragraphs covering: company history/founding story, mission and vision statements, legal structure, location advantages, core values, and long-term strategic objectives.

        # Problem & Opportunity Analysis
        Write 4-5 paragraphs detailing: specific market problems being solved, market size and growth potential, customer pain points, why this solution is needed now, and the market opportunity timeline.

        # Market Analysis & Industry Overview
        Include 4-5 comprehensive paragraphs covering: industry size and growth trends, target market demographics, market segmentation, customer behavior analysis, and emerging market opportunities.

        # Competitive Analysis
        Provide detailed analysis including: direct and indirect competitors, competitive advantages and disadvantages, market positioning strategy, barriers to entry, and competitive response strategies.

        # Products & Services Portfolio
        Detail all offerings including: product/service descriptions, development stages, intellectual property, pricing strategy, product lifecycle, and future product roadmap.

        # Marketing & Sales Strategy
        Comprehensive plan including: customer acquisition strategies, sales channels, marketing mix (4 P's), digital marketing approach, customer retention strategies, and sales projections.

        # Operations Plan
        Detailed operational framework including: production processes, supply chain management, quality control, technology infrastructure, staffing requirements, and operational scalability.

        # Management & Organization
        Include: organizational structure, key management profiles, advisory board, staffing plan, compensation strategy, and talent acquisition strategy.

        # Financial Projections & Analysis
        Provide detailed 3-year financial forecasts including:
        - Revenue projections with monthly breakdown for Year 1
        - Operating expenses and cost structure
        - Cash flow analysis and break-even calculations
        - Profit & Loss projections
        - Balance sheet projections
        - Key financial ratios and metrics
        - Funding requirements and use of funds
        - Return on investment calculations
        - Financial assumptions and sensitivity analysis

        # Risk Analysis & Mitigation
        Comprehensive risk assessment including: market risks, operational risks, financial risks, competitive risks, regulatory risks, and detailed mitigation strategies for each.

        # Implementation Timeline & Milestones
        Detailed roadmap including: quarterly milestones, key performance indicators, implementation phases, resource allocation timeline, and success metrics.

        **FORMATTING REQUIREMENTS:**
        - Use proper markdown formatting with clear headers
        - Include bullet points and numbered lists where appropriate
        - Add tables for financial data when relevant
        - Ensure professional business document formatting
        - Make the document 8,000-12,000 words minimum for comprehensiveness
      `;

      console.log('📝 Prompt created, length:', prompt.length);

      // Get API key and make direct OpenAI call
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

      console.log('🔑 API Key check:', {
        hasKey: !!apiKey,
        keyPrefix: apiKey ? apiKey.substring(0, 15) + '...' : 'MISSING'
      });

      if (!apiKey) {
        throw new Error('OpenAI API key not configured. Please run the setup script.');
      }

      console.log('🌐 Making direct OpenAI API call...');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a senior business consultant with 20+ years of experience writing comprehensive, investor-ready business plans. Your plans are known for their exceptional detail, professional formatting, and strategic insights that help businesses secure funding and achieve success.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.6
        })
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      console.log('📡 OpenAI Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ OpenAI API Error:', errorData);
        throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('✅ OpenAI Response received successfully');

      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content returned from OpenAI');
      }

      setGeneratedContent(content);
      setHasResults(true);
      setMessage({
        type: 'success',
        text: 'Business plan generated successfully with direct OpenAI integration!'
      });

      console.log('🎉 DIRECT OPENAI GENERATION COMPLETED SUCCESSFULLY');

    } catch (error) {
      console.error('❌ DIRECT OPENAI GENERATION FAILED:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setGenerationError(error.message);
      setMessage({ type: 'error', text: error.message || 'Failed to generate business plan' });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 2000);
    }
  };

  // Handle regenerate
  const handleRegenerate = () => {
    setHasResults(false);
    setGeneratedContent('');
    handleGenerate();
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!generatedContent) return;

    try {
      await navigator.clipboard.writeText(generatedContent);
      setMessage({ type: 'success', text: 'Business plan copied to clipboard!' });

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Copy failed:', error);
      setMessage({ type: 'error', text: 'Failed to copy content. Please try selecting and copying manually.' });

      // Clear error message after 5 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
    }
  };

  // Handle PDF download
  const handleDownload = async () => {
    if (!generatedContent) return;

    try {
      // Dynamically import jsPDF to avoid SSR issues
      const { jsPDF } = await import('jspdf');

      // Create a clean filename
      const businessName = formData.businessName || 'Business';
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `${businessName.replace(/[^a-zA-Z0-9]/g, '_')}_Business_Plan_${timestamp}.pdf`;

      // Create PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set up PDF styling
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxLineWidth = pageWidth - (margin * 2);

      // Add title page
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');

      const title = `${formData.businessName || 'Business Plan'}`;
      const titleLines = pdf.splitTextToSize(title, maxLineWidth);
      pdf.text(titleLines, margin, 40);

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Business Plan', margin, 60);

      pdf.setFontSize(12);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 80);

      // Process content and add to PDF
      let yPosition = 110;
      const lines = generatedContent.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line === '') {
          yPosition += 5; // Add space for empty lines
          continue;
        }

        // Handle headers (lines starting with #)
        if (line.startsWith('#')) {
          const headerLevel = (line.match(/^#+/) || [''])[0].length;
          const headerText = line.replace(/^#+\s*/, '');

          // Add some space before headers
          if (yPosition > 110) yPosition += 10;

          // Check if we need a new page
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = margin;
          }

          // Set header styling
          if (headerLevel === 1) {
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
          } else if (headerLevel === 2) {
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
          } else {
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
          }

          const headerLines = pdf.splitTextToSize(headerText, maxLineWidth);
          pdf.text(headerLines, margin, yPosition);
          yPosition += (headerLines.length * (pdf.getFontSize() * 0.5)) + 10;

        } else {
          // Regular text
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');

          // Check if we need a new page
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = margin;
          }

          const textLines = pdf.splitTextToSize(line, maxLineWidth);
          pdf.text(textLines, margin, yPosition);
          yPosition += (textLines.length * 6) + 3;
        }
      }

      // Add page numbers
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
      }

      // Save the PDF
      pdf.save(filename);

      setMessage({ type: 'success', text: `Business plan downloaded as ${filename}` });

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);

    } catch (error) {
      console.error('PDF download failed:', error);
      setMessage({ type: 'error', text: 'Failed to generate PDF. Please try copying and saving manually.' });

      // Clear error message after 5 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
    }
  };

  // Industry options
  const industryOptions = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing',
    'Education', 'Real Estate', 'Food & Beverage', 'Transportation',
    'Energy', 'Entertainment', 'Agriculture', 'Construction', 'Other'
  ];

  if (!isLoaded) {
    return <div className="animate-pulse p-6">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Please sign in to generate business plans.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          <span className="text-brand-gradient">AI Business Plan</span> Generator
        </h1>
        <p className="text-muted-foreground">
          Generate comprehensive, professional business plans using advanced AI. Choose from your saved ideas or create a custom plan.
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
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Generator Controls */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="space-y-6">
          {/* Idea Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Choose a Business Idea
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Existing Ideas */}
              {businessIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedIdeaId === idea.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleIdeaSelect(idea.id)}
                >
                  <h4 className="font-medium text-foreground mb-1">{idea.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{idea.summary}</p>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-muted px-2 py-1 rounded">{idea.industry}</span>
                  </div>
                </div>
              ))}

              {/* Custom Idea Option */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md flex items-center justify-center ${
                  showCustomForm
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border border-dashed hover:border-primary/50'
                }`}
                onClick={() => {
                  setShowCustomForm(true);
                  setSelectedIdeaId('');
                  setFormData({
                    businessName: '',
                    businessIdea: '',
                    industry: '',
                    targetMarket: '',
                    businessModel: '',
                    competitiveAdvantage: '',
                    fundingNeeds: '',
                    timeframe: '3 years'
                  });
                }}
              >
                <div className="text-center">
                  <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium text-foreground">Create Custom Plan</p>
                  <p className="text-sm text-muted-foreground">Start from scratch</p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Plan Form */}
          {(selectedIdeaId || showCustomForm) && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Business Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Enter business name"
                    className="input-branded w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Industry
                  </label>
                  <div className="relative">
                    <select
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      className="input-branded w-full appearance-none pr-10"
                    >
                      <option value="">Select industry...</option>
                      {industryOptions.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Business Idea Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="businessIdea"
                    value={formData.businessIdea}
                    onChange={handleInputChange}
                    placeholder="Describe your business idea, what problem it solves, and your solution..."
                    rows={3}
                    className="input-branded w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Target Market
                  </label>
                  <textarea
                    name="targetMarket"
                    value={formData.targetMarket}
                    onChange={handleInputChange}
                    placeholder="Who are your customers? Demographics, size, needs..."
                    rows={2}
                    className="input-branded w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Business Model
                  </label>
                  <textarea
                    name="businessModel"
                    value={formData.businessModel}
                    onChange={handleInputChange}
                    placeholder="How will you make money? Revenue streams, pricing..."
                    rows={2}
                    className="input-branded w-full"
                  />
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
                    rows={2}
                    className="input-branded w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Funding Needs
                  </label>
                  <input
                    type="text"
                    name="fundingNeeds"
                    value={formData.fundingNeeds}
                    onChange={handleInputChange}
                    placeholder="e.g., $50,000 for startup costs"
                    className="input-branded w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Generate Button or Upgrade Prompt */}
          {(selectedIdeaId || showCustomForm) && (
            <div className="border-t pt-6">
              {canGeneratePlan ? (
                <div className="flex gap-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !formData.businessIdea.trim()}
                    className="btn-primary flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating Business Plan...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Business Plan
                      </>
                    )}
                  </button>

                  {hasResults && (
                    <button
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-3 rounded-md hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </button>
                  )}
                </div>
              ) : (
                <UpgradePrompt feature="business-plan-generation" />
              )}

              {/* Progress Bar */}
              {isGenerating && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>Generating your business plan...</span>
                    <span>{Math.round(generationProgress)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Panel */}
      {(hasResults || generationError) && (
        <div className="bg-card border border-border rounded-lg">
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-card-foreground">
                  {generationError ? 'Generation Error' : 'Generated Business Plan'}
                </h2>
              </div>

              {hasResults && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {generationError ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Generation Failed</h3>
                <p className="text-muted-foreground mb-4">{generationError}</p>
                <button
                  onClick={handleGenerate}
                  className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-md"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            ) : (
              <div className="prose prose-lg max-w-none text-foreground">
                <div className="whitespace-pre-wrap leading-relaxed text-justify">
                  {generatedContent}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedIdeaId && !showCustomForm && (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Ready to Create Your Business Plan?
          </h3>
          <p className="text-muted-foreground mb-6">
            Select a business idea above or create a custom plan to get started with AI-powered business plan generation.
          </p>
        </div>
      )}
    </div>
  );
}