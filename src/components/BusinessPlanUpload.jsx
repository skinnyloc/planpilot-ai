import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadBusinessPlan, extractBusinessPlanData } from '../lib/services/businessPlanService';

const BusinessPlanUpload = ({ onUploadComplete, onDataExtracted }) => {
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, processing, complete, error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadStatus('uploading');
    setUploadProgress(0);
    setError(null);

    try {
      // Upload file to R2 storage
      const uploadResult = await uploadBusinessPlan(file, (progress) => {
        setUploadProgress(progress);
      });

      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        url: uploadResult.url,
        id: uploadResult.id
      });

      setUploadStatus('processing');
      setUploadProgress(100);

      // Extract business plan data using AI
      const extractedData = await extractBusinessPlanData(uploadResult.url);

      setExtractedData(extractedData);
      setUploadStatus('complete');

      // Notify parent components
      if (onUploadComplete) {
        onUploadComplete(uploadResult);
      }
      if (onDataExtracted) {
        onDataExtracted(extractedData);
      }

    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Upload failed');
      setUploadStatus('error');
    }
  }, [onUploadComplete, onDataExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeFile = () => {
    setUploadedFile(null);
    setExtractedData(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setError(null);
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
      case 'processing':
        return (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <File className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading':
        return `Uploading... ${uploadProgress}%`;
      case 'processing':
        return 'Analyzing business plan...';
      case 'complete':
        return 'Analysis complete';
      case 'error':
        return error || 'Upload failed';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!uploadedFile && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
            }
            ${uploadStatus === 'uploading' ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />

          {isDragActive ? (
            <p className="text-blue-600">Drop your business plan here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Drag and drop your business plan, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports PDF, Word (.doc, .docx), and text files up to 10MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Uploaded File Display */}
      {uploadedFile && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {uploadStatus !== 'idle' && (
                <span className="text-sm text-gray-600">
                  {getStatusText()}
                </span>
              )}

              {(uploadStatus === 'complete' || uploadStatus === 'error') && (
                <button
                  onClick={removeFile}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
            <div className="mt-3">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {uploadStatus === 'error' && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Extracted Data Preview */}
      {extractedData && uploadStatus === 'complete' && (
        <div className="border rounded-lg p-4 bg-green-50 border-green-200">
          <h4 className="font-medium text-green-800 mb-3">Business Plan Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {extractedData.businessName && (
              <div>
                <span className="font-medium text-green-700">Business Name:</span>
                <span className="ml-2 text-green-600">{extractedData.businessName}</span>
              </div>
            )}
            {extractedData.industry && (
              <div>
                <span className="font-medium text-green-700">Industry:</span>
                <span className="ml-2 text-green-600">{extractedData.industry}</span>
              </div>
            )}
            {extractedData.fundingAmount && (
              <div>
                <span className="font-medium text-green-700">Funding Needed:</span>
                <span className="ml-2 text-green-600">${extractedData.fundingAmount}</span>
              </div>
            )}
            {extractedData.location && (
              <div>
                <span className="font-medium text-green-700">Location:</span>
                <span className="ml-2 text-green-600">{extractedData.location}</span>
              </div>
            )}
            {extractedData.businessStage && (
              <div>
                <span className="font-medium text-green-700">Business Stage:</span>
                <span className="ml-2 text-green-600">{extractedData.businessStage}</span>
              </div>
            )}
            {extractedData.targetMarket && (
              <div className="md:col-span-2">
                <span className="font-medium text-green-700">Target Market:</span>
                <span className="ml-2 text-green-600">{extractedData.targetMarket}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessPlanUpload;