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
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Step 2: Proposal Modes
  const [selectedModes, setSelectedModes] = useState([]);
  const proposalModes = [
    { id: 'bank', label: 'Bank', description: 'Bank loan application' },
    { id: 'investor', label: 'Investor', description: 'Investor pitch presentation' },
    { id: 'loan', label: 'Loan', description: 'General loan application' },
    { id: 'grant', label: 'Match a Grant', description: 'Match with available grants' }
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
      const response = await fetch('/api/documents?type=business_plan');
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
    if (!file) return;

    // Validate PDF file
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file only.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get signed upload URL
      const signResponse = await fetch('/api/r2/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: 'uploads'
        })
      });

      if (!signResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, key } = await signResponse.json();

      // Upload file to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      setUploadedFile({ file, key });
      setSelectedSource('upload');
      setSelectedDocument(null);
      toast.success('PDF uploaded successfully');
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

  const handleModeToggle = (modeId) => {
    setSelectedModes(prev =>
      prev.includes(modeId)
        ? prev.filter(id => id !== modeId)
        : [...prev, modeId]
    );
  };

  const canGenerate = () => {
    const hasSource = selectedSource && (uploadedFile || selectedDocument);
    const hasModes = selectedModes.length > 0;
    return hasSource && hasModes;
  };

  const handleGenerateProposal = async () => {
    if (!canGenerate()) {
      setGenerationError('Please select a business plan source and at least one proposal mode');
      return;
    }

    setIsGenerating(true);
    setGenerationError('');

    try {
      const response = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: selectedSource,
          key: uploadedFile?.key,
          documentId: selectedDocument?.id,
          modes: selectedModes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate proposal');
      }

      const result = await response.json();
      toast.success('Proposal generated and saved to Documents!');

      // Reset form
      resetForm();
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

                  {isUploading ? (
                    <div className="space-y-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">Uploading...</p>
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
                    <div className="mt-3 flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-green-600" />
                      {uploadedFile.file.name}
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