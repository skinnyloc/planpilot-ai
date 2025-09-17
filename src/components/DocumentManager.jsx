import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, List, Search, Filter, Upload, Download, Trash2, Share2, Eye,
  File, Folder, Plus, MoreHorizontal, Check, X, ArrowUpDown, Tag,
  Calendar, FileText, Archive, Move, Copy, Star, Clock, Users
} from 'lucide-react';
import {
  getUserFolders,
  getUserDocuments,
  uploadDocument,
  bulkDeleteDocuments,
  updateDocument,
  searchDocuments,
  getUserStorageStats
} from '../lib/services/documentService';
import { supabase } from '../lib/supabase.js';

const DocumentManager = ({ userId }) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [storageUsage, setStorageUsage] = useState(null);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  // UI state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [documentToShare, setDocumentToShare] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, [userId]);

  useEffect(() => {
    loadDocuments();
  }, [selectedFolder, searchTerm, sortBy, sortOrder, selectedTags]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadFolders(),
        loadStorageUsage(),
        loadDocuments()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('document_folders')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setFolders(data);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const options = {
        folderId: selectedFolder?.id,
        search: searchTerm,
        sortBy,
        sortOrder,
        limit: 50
      };

      const result = await getUserDocuments(userId, options);
      setDocuments(result);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const loadStorageUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('storage_quotas')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setStorageUsage(data || { used_storage: 0, total_quota: 1073741824, document_count: 0 });
    } catch (error) {
      console.error('Failed to load storage usage:', error);
    }
  };

  const handleUpload = async (files, metadata) => {
    try {
      const uploadPromises = files.map(file =>
        uploadDocument(file, {
          ...metadata,
          folderId: selectedFolder?.id
        }, userId)
      );

      await Promise.all(uploadPromises);
      await loadDocuments();
      await loadStorageUsage();
      setShowUploadModal(false);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedDocuments.size} selected documents?`)) return;

    try {
      await deleteDocuments(Array.from(selectedDocuments), userId);
      await loadDocuments();
      await loadStorageUsage();
      setSelectedDocuments(new Set());
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed: ' + error.message);
    }
  };

  const handleMoveSelected = async (targetFolderId) => {
    try {
      await moveDocuments(Array.from(selectedDocuments), targetFolderId, userId);
      await loadDocuments();
      setSelectedDocuments(new Set());
    } catch (error) {
      console.error('Move failed:', error);
      alert('Move failed: ' + error.message);
    }
  };

  const handleDownloadSelected = async () => {
    try {
      const documentsWithUrls = await downloadDocumentsAsZip(Array.from(selectedDocuments), userId);

      // In a real implementation, this would trigger a ZIP download
      // For now, we'll download files individually
      documentsWithUrls.forEach(doc => {
        const link = document.createElement('a');
        link.href = doc.downloadUrl;
        link.download = doc.original_filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed: ' + error.message);
    }
  };

  const handleShareDocument = async (document) => {
    setDocumentToShare(document);
    setShowShareModal(true);
  };

  const toggleDocumentSelection = (documentId) => {
    const newSelection = new Set(selectedDocuments);
    if (newSelection.has(documentId)) {
      newSelection.delete(documentId);
    } else {
      newSelection.add(documentId);
    }
    setSelectedDocuments(newSelection);
  };

  const selectAllDocuments = () => {
    if (selectedDocuments.size === documents.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(documents.map(doc => doc.id)));
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

  const getFileIcon = (mimeType, documentType) => {
    if (documentType === 'business_plan') return <FileText className="w-8 h-8 text-blue-600" />;
    if (documentType === 'grant_proposal') return <Award className="w-8 h-8 text-purple-600" />;
    if (mimeType?.includes('pdf')) return <File className="w-8 h-8 text-red-600" />;
    if (mimeType?.includes('word')) return <FileText className="w-8 h-8 text-blue-600" />;
    if (mimeType?.includes('image')) return <Image className="w-8 h-8 text-green-600" />;
    return <File className="w-8 h-8 text-gray-600" />;
  };

  const StorageQuotaBar = () => {
    if (!storageUsage) return null;

    const percentage = storageUsage.percentage_used || 0;
    const isNearLimit = percentage > 80;

    return (
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Storage Usage</span>
          <span className="text-sm text-gray-600">
            {formatFileSize(storageUsage.used_bytes)} / {formatFileSize(storageUsage.total_quota_bytes)}
          </span>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isNearLimit ? 'bg-red-500' : percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        {isNearLimit && (
          <p className="text-sm text-red-600 mt-2">
            Storage almost full. Consider upgrading your plan.
          </p>
        )}
      </div>
    );
  };

  const FolderSidebar = () => (
    <div className="w-64 bg-white border-r p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Folders</h3>
        <button className="p-1 hover:bg-gray-100 rounded">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        <button
          onClick={() => setSelectedFolder(null)}
          className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
            !selectedFolder ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Folder className="w-4 h-4 mr-3" />
          All Documents
        </button>

        {folders.map((folder) => (
          <div key={folder.id}>
            <button
              onClick={() => setSelectedFolder(folder)}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                selectedFolder?.id === folder.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Folder className="w-4 h-4 mr-3" style={{ color: folder.color_code }} />
              {folder.name}
            </button>

            {folder.children && folder.children.length > 0 && (
              <div className="ml-6 space-y-1">
                {folder.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedFolder(child)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      selectedFolder?.id === child.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Folder className="w-4 h-4 mr-3" style={{ color: child.color_code }} />
                    {child.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const Toolbar = () => (
    <div className="bg-white border-b p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedFolder ? selectedFolder.name : 'All Documents'}
          </h2>
          <span className="text-sm text-gray-500">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
            showFilters ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </button>

        <select
          value={`${sortBy}_${sortOrder}`}
          onChange={(e) => {
            const [newSortBy, newSortOrder] = e.target.value.split('_');
            setSortBy(newSortBy);
            setSortOrder(newSortOrder);
          }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="created_at_desc">Newest First</option>
          <option value="created_at_asc">Oldest First</option>
          <option value="original_filename_asc">Name A-Z</option>
          <option value="original_filename_desc">Name Z-A</option>
          <option value="file_size_desc">Largest First</option>
          <option value="file_size_asc">Smallest First</option>
        </select>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </button>
      </div>

      {selectedDocuments.size > 0 && (
        <div className="mt-4 flex items-center justify-between bg-blue-50 rounded-lg p-3">
          <span className="text-sm text-blue-700">
            {selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadSelected}
              className="inline-flex items-center px-3 py-1 text-sm text-blue-700 hover:bg-blue-100 rounded"
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </button>
            <button
              onClick={() => {/* Show move modal */}}
              className="inline-flex items-center px-3 py-1 text-sm text-blue-700 hover:bg-blue-100 rounded"
            >
              <Move className="w-4 h-4 mr-1" />
              Move
            </button>
            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center px-3 py-1 text-sm text-red-700 hover:bg-red-100 rounded"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const DocumentGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {documents.map((document) => (
        <div
          key={document.id}
          className={`bg-white rounded-lg border p-4 hover:shadow-lg transition-all cursor-pointer ${
            selectedDocuments.has(document.id) ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              {getFileIcon(document.mime_type, document.document_type)}
              <input
                type="checkbox"
                checked={selectedDocuments.has(document.id)}
                onChange={() => toggleDocumentSelection(document.id)}
                className="ml-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <button className="p-1 hover:bg-gray-100 rounded">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h4 className="font-medium text-gray-900 line-clamp-2 mb-2">
            {document.original_filename}
          </h4>

          {document.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {document.description}
            </p>
          )}

          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(document.created_at)}
            </div>
            <div className="flex items-center">
              <Archive className="w-3 h-3 mr-1" />
              {formatFileSize(document.file_size)}
            </div>
            {document.folder && (
              <div className="flex items-center">
                <Folder className="w-3 h-3 mr-1" />
                {document.folder.name}
              </div>
            )}
          </div>

          {document.tags && document.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {document.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag.name}
                </span>
              ))}
              {document.tags.length > 2 && (
                <span className="text-xs text-gray-500">+{document.tags.length - 2}</span>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => handleShareDocument(document)}
              className="text-gray-400 hover:text-blue-600"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button className="text-gray-400 hover:text-green-600">
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const DocumentList = () => (
    <div className="bg-white">
      <div className="border-b px-6 py-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedDocuments.size === documents.length && documents.length > 0}
            onChange={selectAllDocuments}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-4"
          />
          <div className="grid grid-cols-12 gap-4 w-full text-sm font-medium text-gray-700">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Folder</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Modified</div>
            <div className="col-span-2">Actions</div>
          </div>
        </div>
      </div>

      <div className="divide-y">
        {documents.map((document) => (
          <div
            key={document.id}
            className={`px-6 py-4 hover:bg-gray-50 ${
              selectedDocuments.has(document.id) ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedDocuments.has(document.id)}
                onChange={() => toggleDocumentSelection(document.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-4"
              />
              <div className="grid grid-cols-12 gap-4 w-full">
                <div className="col-span-4 flex items-center">
                  {getFileIcon(document.mime_type, document.document_type)}
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{document.original_filename}</p>
                    {document.description && (
                      <p className="text-sm text-gray-600 line-clamp-1">{document.description}</p>
                    )}
                  </div>
                </div>
                <div className="col-span-2 flex items-center text-sm text-gray-600">
                  {document.folder?.name || 'No folder'}
                </div>
                <div className="col-span-2 flex items-center text-sm text-gray-600">
                  {formatFileSize(document.file_size)}
                </div>
                <div className="col-span-2 flex items-center text-sm text-gray-600">
                  {formatDate(document.created_at)}
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <button
                    onClick={() => handleShareDocument(document)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="text-gray-400 hover:text-green-600">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-50 flex">
      <FolderSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <StorageQuotaBar />
        <Toolbar />

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Upload your first document to get started'}
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <DocumentGrid />
          ) : (
            <DocumentList />
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentManager;