'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Upload, FileText, Award, Search, ChevronDown, AlertCircle, Check } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { canAccessFeature } from '@/lib/utils/planChecker';
import UpgradePrompt from '@/components/UpgradePrompt';
import { toast } from 'sonner';

export default function GrantProposalsPage() {
  const { user } = useUser();
  const canCreateProposals = canAccessFeature(user, 'grant-proposal-creation');

  // Step 1: Business Plan Source
  const [selectedSource, setSelectedSource] = useState(null); // 'upload' or 'document'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [analyzingPdf, setAnalyzingPdf] = useState(false);
  const [pdfAnalysis, setPdfAnalysis] = useState(null);
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Step 2: Proposal Modes
  const [selectedModes, setSelectedModes] = useState([]);
  const [availableGrants, setAvailableGrants] = useState([]);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [loadingGrants, setLoadingGrants] = useState(false);
  const proposalModes = [
    { id: 'bank_loan', label: 'Bank', description: 'Bank loan application' },
    { id: 'investor_pitch', label: 'Investor', description: 'Investor pitch presentation' },
    { id: 'general_loan', label: 'Loan', description: 'General loan application' },
    { id: 'grant_match', label: 'Match a Grant', description: 'Match with available grants' }
  ];

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  // Load saved documents on mount
  useEffect(() => {
    if (user) {
      loadSavedDocuments();
    }
  }, [user]);

  const loadSavedDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const response = await fetch('/api/documents?type=business_plan', {
        headers: {
          'x-user-id': user?.id || 'demo-user'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSavedDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error loading saved documents:', error);
      setSavedDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    console.log('File selected:', file);

    if (!file) {
      console.log('No file selected');
      return;
    }

    // Validate PDF file
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file only.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB.');
      return;
    }

    console.log('Starting file upload for:', file.name);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // TEMPORARY: Skip R2 upload due to environment variable issues
      // Use mock upload for now
      console.log('Using mock upload due to R2 configuration issues');

      // Simulate upload progress
      setUploadProgress(25);
      await new Promise(resolve => setTimeout(resolve, 500));
      setUploadProgress(50);
      await new Promise(resolve => setTimeout(resolve, 500));
      setUploadProgress(75);
      await new Promise(resolve => setTimeout(resolve, 500));
      setUploadProgress(100);

      // Create mock file data
      const mockKey = `uploads/${user?.id || 'demo-user'}/${Date.now()}_${file.name}`;
      const mockUrl = `https://example.com/mock-upload/${mockKey}`;

      // Mock successful upload
      console.log('Mock upload completed successfully');

      setUploadedFile({ file, key: mockKey });
      setSelectedSource('upload');
      setSelectedDocument(null);
      toast.success('PDF uploaded successfully (mock upload)');

      // Analyze the uploaded PDF
      setAnalyzingPdf(true);
      try {
        const analysisResponse = await fetch('/api/proposals/analyze-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || 'demo-user'
          },
          body: JSON.stringify({ key: mockKey })
        });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          setPdfAnalysis(analysisData);
          toast.success('PDF analyzed successfully');
        } else {
          console.error('PDF analysis failed');
          toast.error('PDF analysis failed, but you can still generate proposals');
        }
      } catch (analysisError) {
        console.error('PDF analysis error:', analysisError);
        toast.error('PDF analysis failed, but you can still generate proposals');
      } finally {
        setAnalyzingPdf(false);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload PDF');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDocumentSelect = (document) => {
    setSelectedDocument(document);
    setSelectedSource('document');
    setUploadedFile(null);
  };

  const loadAvailableGrants = async () => {
    try {
      setLoadingGrants(true);
      // Mock grants data - in real implementation, this would call a grants API
      const mockGrants = [
        {
          id: 'grant-1',
          title: 'Small Business Innovation Grant',
          agency: 'SBA',
          amount: '$50,000',
          description: 'Support for innovative small businesses',
          requirements: ['Technology innovation', 'Job creation', 'Revenue under $1M']
        },
        {
          id: 'grant-2',
          title: 'Green Technology Grant',
          agency: 'EPA',
          amount: '$100,000',
          description: 'Environmental technology development',
          requirements: ['Environmental impact', 'Sustainability', 'Clean technology']
        },
        {
          id: 'grant-3',
          title: 'Minority Business Enterprise Grant',
          agency: 'Commerce',
          amount: '$25,000',
          description: 'Support for minority-owned businesses',
          requirements: ['Minority ownership', 'Business plan', 'Growth potential']
        }
      ];
      setAvailableGrants(mockGrants);
    } catch (error) {
      console.error('Error loading grants:', error);
      setAvailableGrants([]);
    } finally {
      setLoadingGrants(false);
    }
  };

  const handleModeToggle = (modeId) => {
    setSelectedModes(prev =>
      prev.includes(modeId)
        ? prev.filter(id => id !== modeId)
        : [...prev, modeId]
    );

    // Load grants when Grant Match mode is selected
    if (modeId === 'grant_match' && !selectedModes.includes(modeId)) {
      loadAvailableGrants();
    }
  };

  const canGenerate = () => {
    const hasSource = selectedSource && (uploadedFile || selectedDocument);
    const hasModes = selectedModes.length > 0;
    const hasGrantIfNeeded = !selectedModes.includes('grant_match') || selectedGrant;
    return hasSource && hasModes && hasGrantIfNeeded;
  };

  const handleGenerateProposal = async () => {
    if (!canGenerate()) {
      setGenerationError('Please select a business plan source and at least one proposal mode');
      return;
    }

    setIsGenerating(true);
    setGenerationError('');

    try {
      const response = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-user'
        },
        body: JSON.stringify({
          type: 'proposal',
          businessPlan: selectedSource === 'upload'
            ? (pdfAnalysis?.planText || 'PDF_CONTENT_PLACEHOLDER')
            : selectedDocument?.title || '',
          proposalType: selectedModes[0] || 'bank_loan', // Use first selected mode
          source: selectedSource,
          key: uploadedFile?.key,
          documentId: selectedDocument?.id,
          modes: selectedModes,
          selectedGrant: selectedGrant,
          pdfAnalysis: pdfAnalysis
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate proposal');
      }

      const result = await response.json();

      if (result.success) {
        const proposalCount = result.proposals?.length || 1;
        const successfulProposals = result.proposals?.filter(p => !p.error)?.length || 1;

        if (successfulProposals === proposalCount) {
          toast.success(`${proposalCount} proposal${proposalCount > 1 ? 's' : ''} generated and saved to Documents!`);
        } else {
          toast.success(`${successfulProposals} of ${proposalCount} proposals generated successfully. Check Documents for details.`);
        }

        // Reset form
        resetForm();
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setGenerationError('Failed to generate proposal. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setSelectedSource(null);
    setUploadedFile(null);
    setSelectedDocument(null);
    setSelectedModes([]);
    setSelectedGrant(null);
    setAvailableGrants([]);
    setPdfAnalysis(null);
    setGenerationError('');
  };

  if (!canCreateProposals) {
    return <UpgradePrompt feature="Grant Proposal Generation" />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Grant Proposal Generator</h1>
        <p className="text-muted-foreground">
          Generate professional proposals from your business plans for grants, loans, and investor pitches.
        </p>
      </div>

      {/* 2-Column Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Choose Business Plan Source */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                1
              </span>
              Choose Your Business Plan Source
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Upload PDF Option */}
              <div className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                selectedSource === 'upload'
                  ? 'border-primary bg-primary/5'
                  : 'border-dashed border-border hover:border-primary/50'
              }`}>
                <div className="text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Upload PDF Business Plan</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload an external PDF business plan document
                  </p>

                  {isUploading || analyzingPdf ? (
                    <div className="space-y-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: isUploading ? `${uploadProgress}%` : '100%' }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isUploading ? 'Uploading...' : 'Analyzing PDF...'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="pdf-upload"
                        disabled={isUploading}
                      />
                      <label
                        htmlFor="pdf-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 cursor-pointer transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        Choose PDF File
                      </label>
                    </>
                  )}

                  {uploadedFile && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="truncate" title={uploadedFile.file.name}>
                          {uploadedFile.file.name.length > 30
                            ? `${uploadedFile.file.name.substring(0, 27)}...`
                            : uploadedFile.file.name}
                        </span>
                      </div>
                      {pdfAnalysis && (
                        <div className="text-xs text-muted-foreground bg-green-50 border border-green-200 rounded p-2">
                          ✓ PDF analyzed successfully - ready for proposal generation
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Saved Documents Option */}
              <div className={`border-2 rounded-lg p-6 transition-all ${
                selectedSource === 'document'
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}>
                <div className="text-center mb-4">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Choose from Saved Business Plans</h3>
                  <p className="text-sm text-muted-foreground">
                    Select from business plans you've created in the app
                  </p>
                </div>

                {loadingDocuments ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading business plans...</p>
                  </div>
                ) : savedDocuments.length > 0 ? (
                  <div className="relative">
                    <select
                      value={selectedDocument?.id || ''}
                      onChange={(e) => {
                        const doc = savedDocuments.find(d => d.id === e.target.value);
                        if (doc) handleDocumentSelect(doc);
                      }}
                      className="w-full p-3 border border-border rounded-lg bg-background text-foreground appearance-none cursor-pointer"
                    >
                      <option value="">Select a business plan...</option>
                      {savedDocuments.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.title} - {new Date(doc.created_at).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No saved business plans found.{' '}
                      <a href="/business-idea" className="text-primary hover:underline">
                        Create one first
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Select Proposal Mode */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                2
              </span>
              Select Proposal Mode
            </h2>
            <p className="text-muted-foreground mb-6">
              Choose one or more proposal types to generate (at least one required).
            </p>

            <div className="space-y-3">
              {proposalModes.map((mode) => (
                <label
                  key={mode.id}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedModes.includes(mode.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedModes.includes(mode.id)}
                    onChange={() => handleModeToggle(mode.id)}
                    className="sr-only"
                  />
                  <div className={`flex items-center justify-center w-5 h-5 border-2 rounded mr-3 ${
                    selectedModes.includes(mode.id)
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  }`}>
                    {selectedModes.includes(mode.id) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{mode.label}</div>
                    <div className="text-sm text-muted-foreground">{mode.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Grant Selection - Show when Grant Match mode is selected */}
            {selectedModes.includes('grant_match') && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Select a Grant to Match
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a grant that best matches your business plan and goals.
                </p>

                {loadingGrants ? (
                  <div className="text-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading available grants...</p>
                  </div>
                ) : availableGrants.length > 0 ? (
                  <div className="space-y-3">
                    {availableGrants.map((grant) => (
                      <label
                        key={grant.id}
                        className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedGrant?.id === grant.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedGrant"
                          checked={selectedGrant?.id === grant.id}
                          onChange={() => setSelectedGrant(grant)}
                          className="sr-only"
                        />
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{grant.title}</div>
                            <div className="text-sm text-blue-600 font-medium">{grant.agency} • {grant.amount}</div>
                          </div>
                          <div className={`flex items-center justify-center w-5 h-5 border-2 rounded-full ${
                            selectedGrant?.id === grant.id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedGrant?.id === grant.id && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{grant.description}</p>
                        <div className="text-xs text-muted-foreground">
                          <strong>Requirements:</strong> {grant.requirements.join(', ')}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No grants available at this time.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Generate Proposal */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-6 sticky top-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Generate Proposal</h2>

            {/* Status Summary */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-4 h-4 rounded-full ${
                  selectedSource ? 'bg-green-500' : 'bg-muted'
                }`} />
                <span className={selectedSource ? 'text-foreground' : 'text-muted-foreground'}>
                  Business plan source selected
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-4 h-4 rounded-full ${
                  selectedModes.length > 0 ? 'bg-green-500' : 'bg-muted'
                }`} />
                <span className={selectedModes.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                  {selectedModes.length > 0 ? `${selectedModes.length} mode(s) selected` : 'Select proposal modes'}
                </span>
              </div>
              {selectedModes.includes('grant_match') && (
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 rounded-full ${
                    selectedGrant ? 'bg-green-500' : 'bg-muted'
                  }`} />
                  <span className={selectedGrant ? 'text-foreground' : 'text-muted-foreground'}>
                    {selectedGrant ? `Grant selected: ${selectedGrant.title}` : 'Select a grant to match'}
                  </span>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateProposal}
              disabled={!canGenerate() || isGenerating}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  Generating...
                </div>
              ) : (
                'Generate Proposal'
              )}
            </button>

            {generationError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{generationError}</span>
              </div>
            )}

            {/* Help Text */}
            <div className="mt-6 text-xs text-muted-foreground">
              <p>
                Your generated proposal will be automatically saved to Documents and can be downloaded or emailed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}