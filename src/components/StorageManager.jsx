import React, { useState, useEffect } from 'react';
import {
  HardDrive, Trash2, BarChart3, AlertTriangle, CheckCircle,
  Calendar, FileText, Folder, ArrowUp, Settings, Crown,
  Database, Clock, TrendingUp, Zap
} from 'lucide-react';
import { getUserStorageUsage } from '../lib/services/documentManagementService';

const StorageManager = ({ userId, onUpgrade }) => {
  const [storageData, setStorageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cleanupStats, setCleanupStats] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadStorageData();
  }, [userId]);

  const loadStorageData = async () => {
    try {
      setLoading(true);
      const usage = await getUserStorageUsage(userId);
      setStorageData(usage);

      // Get cleanup suggestions
      await loadCleanupSuggestions();
    } catch (error) {
      console.error('Failed to load storage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCleanupSuggestions = async () => {
    try {
      const response = await fetch(`/api/storage/cleanup-suggestions?userId=${userId}`);
      const data = await response.json();
      setCleanupStats(data);
    } catch (error) {
      console.error('Failed to load cleanup suggestions:', error);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageStatus = () => {
    if (!storageData) return { status: 'unknown', color: 'gray' };

    const percentage = storageData.percentage_used;
    if (percentage >= 95) return { status: 'critical', color: 'red' };
    if (percentage >= 85) return { status: 'warning', color: 'yellow' };
    if (percentage >= 70) return { status: 'caution', color: 'orange' };
    return { status: 'good', color: 'green' };
  };

  const storageStatus = getStorageStatus();

  const StorageOverview = () => {
    if (!storageData) return null;

    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Storage Overview</h3>
          <div className="flex items-center space-x-2">
            <HardDrive className={`w-5 h-5 text-${storageStatus.color}-600`} />
            <span className={`text-sm font-medium text-${storageStatus.color}-600 capitalize`}>
              {storageStatus.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {formatBytes(storageData.used_bytes)}
            </div>
            <div className="text-sm text-gray-600">Used</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {formatBytes(storageData.total_quota_bytes - storageData.used_bytes)}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {storageData.document_count}
            </div>
            <div className="text-sm text-gray-600">Documents</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Storage Usage</span>
            <span>{storageData.percentage_used.toFixed(1)}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                storageStatus.color === 'red' ? 'bg-red-500' :
                storageStatus.color === 'yellow' ? 'bg-yellow-500' :
                storageStatus.color === 'orange' ? 'bg-orange-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(storageData.percentage_used, 100)}%` }}
            />
          </div>
        </div>

        {/* Storage Alert */}
        {storageData.percentage_used >= 85 && (
          <div className={`p-4 rounded-lg border ${
            storageStatus.color === 'red'
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start">
              <AlertTriangle className={`w-5 h-5 mt-0.5 mr-3 ${
                storageStatus.color === 'red' ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <div>
                <h4 className={`font-medium ${
                  storageStatus.color === 'red' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {storageStatus.color === 'red' ? 'Storage Almost Full' : 'Storage Getting Full'}
                </h4>
                <p className={`text-sm mt-1 ${
                  storageStatus.color === 'red' ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {storageStatus.color === 'red'
                    ? 'You have less than 5% storage remaining. Consider upgrading your plan or cleaning up files.'
                    : 'You have less than 15% storage remaining. Consider cleaning up old files or upgrading your plan.'
                  }
                </p>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className={`mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${
                    storageStatus.color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Total Quota: {formatBytes(storageData.total_quota_bytes)}
          </p>
        </div>
      </div>
    );
  };

  const CleanupSuggestions = () => {
    if (!cleanupStats) return null;

    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cleanup Suggestions</h3>

        <div className="space-y-4">
          {/* Old Documents */}
          {cleanupStats.oldDocuments?.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Old Documents</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    {cleanupStats.oldDocuments.length} documents older than 6 months
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Potential savings: {formatBytes(cleanupStats.oldDocumentsSize)}
                  </p>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Review
                </button>
              </div>
            </div>
          )}

          {/* Large Files */}
          {cleanupStats.largeFiles?.length > 0 && (
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-orange-900">Large Files</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    {cleanupStats.largeFiles.length} files larger than 10MB
                  </p>
                  <p className="text-sm text-orange-600 mt-1">
                    Total size: {formatBytes(cleanupStats.largeFilesSize)}
                  </p>
                </div>
                <button className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                  Review
                </button>
              </div>
            </div>
          )}

          {/* Duplicates */}
          {cleanupStats.duplicates?.length > 0 && (
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-purple-900">Duplicate Files</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    {cleanupStats.duplicates.length} potential duplicates found
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    Potential savings: {formatBytes(cleanupStats.duplicatesSize)}
                  </p>
                </div>
                <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                  Review
                </button>
              </div>
            </div>
          )}

          {/* Temporary Files */}
          {cleanupStats.tempFiles?.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-green-900">Temporary Files</h4>
                  <p className="text-sm text-green-700 mt-1">
                    {cleanupStats.tempFiles.length} temporary files can be safely removed
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Savings: {formatBytes(cleanupStats.tempFilesSize)}
                  </p>
                </div>
                <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                  Clean Now
                </button>
              </div>
            </div>
          )}
        </div>

        {cleanupStats.totalPotentialSavings > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatBytes(cleanupStats.totalPotentialSavings)}
              </div>
              <div className="text-sm text-gray-600">
                Total potential savings
              </div>
              <button className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Start Cleanup
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const StorageBreakdown = () => {
    const breakdown = [
      { name: 'Business Plans', size: 45, color: 'blue' },
      { name: 'Grant Proposals', size: 30, color: 'purple' },
      { name: 'Business Ideas', size: 15, color: 'yellow' },
      { name: 'Uploads', size: 10, color: 'gray' }
    ];

    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Breakdown</h3>

        <div className="space-y-3">
          {breakdown.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full bg-${item.color}-500 mr-3`} />
                <span className="text-sm font-medium text-gray-900">{item.name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-${item.color}-500`}
                    style={{ width: `${item.size}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">{item.size}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const UpgradeModal = () => {
    if (!showUpgradeModal) return null;

    const plans = [
      {
        name: 'Pro',
        storage: '10 GB',
        price: '$9.99/month',
        features: ['10 GB storage', 'Unlimited documents', 'Priority support', 'Advanced analytics']
      },
      {
        name: 'Business',
        storage: '100 GB',
        price: '$29.99/month',
        features: ['100 GB storage', 'Team collaboration', 'API access', 'Custom integrations']
      },
      {
        name: 'Enterprise',
        storage: 'Unlimited',
        price: 'Contact us',
        features: ['Unlimited storage', 'Advanced security', 'Dedicated support', 'Custom solutions']
      }
    ];

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Upgrade Your Storage</h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-6 ${
                    index === 1 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                  }`}
                >
                  {index === 1 && (
                    <div className="text-center mb-4">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <h4 className="text-xl font-semibold text-gray-900">{plan.name}</h4>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-gray-900">{plan.price.split('/')[0]}</span>
                      {plan.price.includes('/') && (
                        <span className="text-gray-600">/{plan.price.split('/')[1]}</span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{plan.storage} storage</p>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      if (onUpgrade) onUpgrade(plan);
                      setShowUpgradeModal(false);
                    }}
                    className={`mt-6 w-full py-2 px-4 rounded-md text-sm font-medium ${
                      index === 1
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.price === 'Contact us' ? 'Contact Sales' : 'Upgrade Now'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Storage Management</h2>
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Crown className="w-4 h-4 mr-2" />
          Upgrade Plan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StorageOverview />
        </div>
        <div>
          <StorageBreakdown />
        </div>
      </div>

      <CleanupSuggestions />

      <UpgradeModal />
    </div>
  );
};

export default StorageManager;