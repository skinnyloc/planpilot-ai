import React, { useState } from 'react';
import {
  FileText, Award, Lightbulb, Wand2, ArrowRight, Download,
  CheckCircle, Clock, AlertCircle, ExternalLink, Copy, Share
} from 'lucide-react';

const DocumentIntegrations = ({ document, onClose, userId }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [availableGrants, setAvailableGrants] = useState([]);

  const integrations = [
    {
      id: 'create-business-plan',
      name: 'Create Business Plan',
      description: 'Generate a comprehensive business plan from this business idea',
      icon: FileText,
      color: 'blue',
      available: document.document_type === 'business_idea',
      estimatedTime: '3-5 minutes'
    },
    {
      id: 'generate-grant-proposal',
      name: 'Generate Grant Proposal',
      description: 'Create tailored grant proposals for specific funding opportunities',
      icon: Award,
      color: 'purple',
      available: document.document_type === 'business_plan',
      estimatedTime: '2-4 minutes'
    },
    {
      id: 'extract-business-idea',
      name: 'Extract Business Idea',
      description: 'Extract and structure business concept from this document',
      icon: Lightbulb,
      color: 'yellow',
      available: ['business_plan', 'other'].includes(document.document_type),
      estimatedTime: '1-2 minutes'
    },
    {
      id: 'create-pitch-deck',
      name: 'Create Pitch Deck',
      description: 'Generate an investor pitch deck from business plan',
      icon: FileText,
      color: 'green',
      available: document.document_type === 'business_plan',
      estimatedTime: '4-6 minutes'
    }
  ];

  const availableIntegrations = integrations.filter(integration => integration.available);

  const handleIntegration = async (integrationId) => {
    setLoading(true);
    try {
      switch (integrationId) {
        case 'create-business-plan':
          await generateBusinessPlan();
          break;
        case 'generate-grant-proposal':
          await generateGrantProposal();
          break;
        case 'extract-business-idea':
          await extractBusinessIdea();
          break;
        case 'create-pitch-deck':
          await createPitchDeck();
          break;
      }
    } catch (error) {
      console.error('Integration failed:', error);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const generateBusinessPlan = async () => {
    const response = await fetch('/api/generate-business-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceDocumentId: document.id,
        userId
      })
    });

    if (!response.ok) throw new Error('Failed to generate business plan');

    const data = await response.json();
    setResult({
      success: true,
      type: 'business-plan',
      document: data.document,
      message: 'Business plan generated successfully!'
    });
  };

  const generateGrantProposal = async () => {
    if (!selectedGrant) {
      // Load available grants first
      const response = await fetch('/api/grants?limit=10&sortBy=deadline&sortOrder=asc');
      const data = await response.json();
      setAvailableGrants(data.data.grants || []);
      return;
    }

    const response = await fetch('/api/generate-proposal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessPlanDocumentId: document.id,
        grantId: selectedGrant.id,
        userId
      })
    });

    if (!response.ok) throw new Error('Failed to generate grant proposal');

    const data = await response.json();
    setResult({
      success: true,
      type: 'grant-proposal',
      document: data.document,
      grant: selectedGrant,
      message: 'Grant proposal generated successfully!'
    });
  };

  const extractBusinessIdea = async () => {
    const response = await fetch('/api/extract-business-idea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceDocumentId: document.id,
        userId
      })
    });

    if (!response.ok) throw new Error('Failed to extract business idea');

    const data = await response.json();
    setResult({
      success: true,
      type: 'business-idea',
      document: data.document,
      extractedData: data.extractedData,
      message: 'Business idea extracted successfully!'
    });
  };

  const createPitchDeck = async () => {
    const response = await fetch('/api/generate-pitch-deck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessPlanDocumentId: document.id,
        userId
      })
    });

    if (!response.ok) throw new Error('Failed to create pitch deck');

    const data = await response.json();
    setResult({
      success: true,
      type: 'pitch-deck',
      document: data.document,
      slides: data.slides,
      message: 'Pitch deck created successfully!'
    });
  };

  const GrantSelection = () => (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <button
          onClick={() => setAvailableGrants([])}
          className="text-gray-400 hover:text-gray-600 mr-3"
        >
          ←
        </button>
        <h4 className="text-lg font-medium text-gray-900">
          Select Grant Opportunity
        </h4>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {availableGrants.map((grant) => (
          <div
            key={grant.id}
            onClick={() => setSelectedGrant(grant)}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedGrant?.id === grant.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h5 className="font-medium text-gray-900 line-clamp-2">
                  {grant.title}
                </h5>
                <p className="text-sm text-gray-600 mt-1">
                  {grant.agency}
                </p>
                <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                  <span>Max: ${grant.max_amount?.toLocaleString() || 'N/A'}</span>
                  <span>Deadline: {grant.application_deadline ? new Date(grant.application_deadline).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                grant.competitiveness_level === 'high' ? 'bg-red-100 text-red-800' :
                grant.competitiveness_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {grant.competitiveness_level || 'medium'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setAvailableGrants([])}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={() => handleIntegration('generate-grant-proposal')}
          disabled={!selectedGrant || loading}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Proposal'}
        </button>
      </div>
    </div>
  );

  const ResultDisplay = () => (
    <div className="space-y-4">
      <div className="flex items-center">
        <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
        <h4 className="text-lg font-medium text-gray-900">
          {result.message}
        </h4>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <FileText className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
          <div className="flex-1">
            <h5 className="font-medium text-green-800">
              {result.document.original_filename}
            </h5>
            <p className="text-sm text-green-700 mt-1">
              Created: {new Date(result.document.created_at).toLocaleDateString()}
            </p>
            <p className="text-sm text-green-700">
              Size: {(result.document.file_size / 1024).toFixed(1)} KB
            </p>

            {result.type === 'grant-proposal' && result.grant && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="text-sm font-medium text-gray-900">
                  Grant: {result.grant.title}
                </p>
                <p className="text-sm text-gray-600">
                  {result.grant.agency}
                </p>
              </div>
            )}

            {result.extractedData && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Extracted Information:
                </p>
                <div className="space-y-1 text-sm text-gray-600">
                  {result.extractedData.businessName && (
                    <p><strong>Business:</strong> {result.extractedData.businessName}</p>
                  )}
                  {result.extractedData.industry && (
                    <p><strong>Industry:</strong> {result.extractedData.industry}</p>
                  )}
                  {result.extractedData.fundingAmount && (
                    <p><strong>Funding:</strong> {result.extractedData.fundingAmount}</p>
                  )}
                </div>
              </div>
            )}

            {result.slides && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Pitch Deck Generated:
                </p>
                <p className="text-sm text-gray-600">
                  {result.slides.length} slides created covering key business aspects
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => {
            // Download the generated document
            window.open(`/api/documents/${result.document.id}/download`, '_blank');
          }}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </button>
        <button
          onClick={() => {
            // Share the document
            navigator.clipboard.writeText(`${window.location.origin}/documents/${result.document.id}`);
            alert('Link copied to clipboard!');
          }}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Share className="w-4 h-4 mr-2" />
          Share
        </button>
        <button
          onClick={() => {
            // View the document
            window.open(`/documents/${result.document.id}`, '_blank');
          }}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={onClose}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Document Integrations
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Generate new documents from: {document.original_filename}
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating document...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few minutes</p>
            </div>
          ) : result ? (
            <ResultDisplay />
          ) : availableGrants.length > 0 ? (
            <GrantSelection />
          ) : (
            <div>
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Available Actions
                </h4>
                <p className="text-sm text-gray-600">
                  Choose what you'd like to generate from this document:
                </p>
              </div>

              <div className="space-y-4">
                {availableIntegrations.map((integration) => (
                  <button
                    key={integration.id}
                    onClick={() => handleIntegration(integration.id)}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="flex items-start">
                      <integration.icon className={`w-8 h-8 text-${integration.color}-600 mr-4 mt-1`} />
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1">
                          {integration.name}
                        </h5>
                        <p className="text-sm text-gray-600 mb-2">
                          {integration.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {integration.estimatedTime}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {availableIntegrations.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No Integrations Available
                  </h4>
                  <p className="text-gray-600">
                    This document type doesn't support any automatic integrations.
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentIntegrations;