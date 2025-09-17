import React, { useState } from 'react';
import { FileText, Download, Wand2, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { generateTailoredProposal } from '../lib/services/proposalService';

const ProposalGenerator = ({ selectedGrant, businessPlanData, onProposalGenerated }) => {
  const [generating, setGenerating] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [error, setError] = useState(null);
  const [customizations, setCustomizations] = useState({
    emphasizeInnovation: true,
    includeFinancials: true,
    highlightImpact: true,
    addTimeline: true,
    includeTeam: false,
    customFocus: ''
  });

  const handleGenerate = async () => {
    if (!selectedGrant || !businessPlanData) {
      setError('Please select a grant and upload a business plan first');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const generatedProposal = await generateTailoredProposal(
        selectedGrant,
        businessPlanData,
        customizations
      );

      setProposal(generatedProposal);

      if (onProposalGenerated) {
        onProposalGenerated(generatedProposal);
      }

    } catch (err) {
      console.error('Proposal generation failed:', err);
      setError(err.message || 'Failed to generate proposal');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!proposal) return;

    const content = formatProposalForDownload(proposal);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `proposal_${selectedGrant?.title.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    if (!proposal) return;

    try {
      const content = formatProposalForDownload(proposal);
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatProposalForDownload = (proposal) => {
    return `
GRANT PROPOSAL: ${proposal.title}

${proposal.sections.map(section => `
${section.title.toUpperCase()}
${'='.repeat(section.title.length)}

${section.content}
`).join('\n')}

Generated on: ${new Date().toLocaleDateString()}
Grant: ${selectedGrant?.title}
Agency: ${selectedGrant?.agency}
Deadline: ${selectedGrant?.deadline}
    `.trim();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">AI Proposal Generator</h3>
          <p className="text-sm text-gray-600">
            Generate a tailored grant proposal based on your business plan
          </p>
        </div>
        {proposal && (
          <div className="flex space-x-2">
            <button
              onClick={handleCopyToClipboard}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
          </div>
        )}
      </div>

      {/* Grant Info */}
      {selectedGrant && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900">{selectedGrant.title}</h4>
          <p className="text-blue-700 text-sm mt-1">{selectedGrant.agency}</p>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">Max Amount:</span>
              <span className="ml-2 text-blue-700">${selectedGrant.maxAmount.toLocaleString()}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Deadline:</span>
              <span className="ml-2 text-blue-700">{selectedGrant.deadline}</span>
            </div>
          </div>
        </div>
      )}

      {/* Customization Options */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Proposal Customization</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries({
            emphasizeInnovation: 'Emphasize Innovation & Technology',
            includeFinancials: 'Include Financial Projections',
            highlightImpact: 'Highlight Community Impact',
            addTimeline: 'Add Project Timeline',
            includeTeam: 'Include Team Information'
          }).map(([key, label]) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={customizations[key]}
                onChange={(e) => setCustomizations(prev => ({
                  ...prev,
                  [key]: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <label htmlFor="customFocus" className="block text-sm font-medium text-gray-700">
            Custom Focus Areas (optional)
          </label>
          <textarea
            id="customFocus"
            value={customizations.customFocus}
            onChange={(e) => setCustomizations(prev => ({
              ...prev,
              customFocus: e.target.value
            }))}
            placeholder="Any specific aspects you want to emphasize..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={2}
          />
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        <button
          onClick={handleGenerate}
          disabled={generating || !selectedGrant || !businessPlanData}
          className={`
            inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white
            ${generating || !selectedGrant || !businessPlanData
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
            }
          `}
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
              Generating Proposal...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-3" />
              Generate Tailored Proposal
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Generation Failed</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Generated Proposal */}
      {proposal && (
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
            <div>
              <h4 className="font-medium text-gray-900">{proposal.title}</h4>
              <p className="text-sm text-gray-600">
                Generated on {new Date(proposal.generatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Proposal Quality Score */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-green-800">Proposal Quality Score</span>
              <span className="text-2xl font-bold text-green-600">{proposal.qualityScore}/100</span>
            </div>
            <div className="bg-green-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${proposal.qualityScore}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-green-700">
              <strong>Strengths:</strong> {proposal.strengths.join(', ')}
            </div>
            {proposal.improvements.length > 0 && (
              <div className="mt-1 text-sm text-green-700">
                <strong>Suggested Improvements:</strong> {proposal.improvements.join(', ')}
              </div>
            )}
          </div>

          {/* Proposal Sections */}
          <div className="space-y-6">
            {proposal.sections.map((section, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                <h5 className="font-medium text-gray-900 mb-3">{section.title}</h5>
                <div className="prose prose-sm text-gray-700 whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          {/* Action Items */}
          {proposal.actionItems && proposal.actionItems.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h5 className="font-medium text-yellow-800 mb-2">Next Steps</h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                {proposal.actionItems.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProposalGenerator;