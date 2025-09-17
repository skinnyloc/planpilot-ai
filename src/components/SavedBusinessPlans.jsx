import React, { useState, useEffect } from 'react';
import { File, Download, Trash2, Eye, Calendar, FileText } from 'lucide-react';
import { getUserBusinessPlans, deleteBusinessPlan, getBusinessPlanDownloadUrl } from '../lib/services/businessPlanService';

const SavedBusinessPlans = ({ onSelectPlan }) => {
  const [businessPlans, setBusinessPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    loadBusinessPlans();
  }, []);

  const loadBusinessPlans = async () => {
    try {
      setLoading(true);
      const plans = await getUserBusinessPlans();
      setBusinessPlans(plans);
      setError(null);
    } catch (err) {
      console.error('Failed to load business plans:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (plan) => {
    try {
      const downloadUrl = await getBusinessPlanDownloadUrl(plan.storage_path);

      // Create temporary link to download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = plan.original_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download file: ' + err.message);
    }
  };

  const handleDelete = async (planId) => {
    if (!confirm('Are you sure you want to delete this business plan?')) {
      return;
    }

    try {
      await deleteBusinessPlan(planId);
      setBusinessPlans(plans => plans.filter(p => p.id !== planId));

      if (selectedPlan?.id === planId) {
        setSelectedPlan(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete business plan: ' + err.message);
    }
  };

  const handleSelect = (plan) => {
    setSelectedPlan(plan);
    if (onSelectPlan) {
      onSelectPlan(plan);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading business plans...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Failed to load business plans: {error}</p>
        <button
          onClick={loadBusinessPlans}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (businessPlans.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Business Plans Yet</h3>
        <p className="text-gray-600 mb-4">Upload your business plan to get started with grant matching</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Saved Business Plans ({businessPlans.length})
        </h3>
        <button
          onClick={loadBusinessPlans}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {businessPlans.map((plan) => (
          <div
            key={plan.id}
            className={`
              border rounded-lg p-4 transition-all cursor-pointer
              ${selectedPlan?.id === plan.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
            onClick={() => handleSelect(plan)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <File className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {plan.original_filename}
                  </h4>

                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(plan.created_at)}
                    </span>
                    <span>{formatFileSize(plan.file_size)}</span>
                  </div>

                  {plan.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {plan.description}
                    </p>
                  )}

                  {plan.tags && plan.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {plan.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(plan);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Select for Grant Matching"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(plan);
                  }}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(plan.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {selectedPlan?.id === plan.id && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-sm text-blue-700">
                  ✓ Selected for grant matching analysis
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedBusinessPlans;