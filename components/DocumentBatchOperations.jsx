import React, { useState } from 'react';
import {
  Download, Move, Trash2, Share2, Tag, Copy, Archive,
  CheckCircle, XCircle, Loader, FolderOpen, Users, Link2
} from 'lucide-react';

const DocumentBatchOperations = ({
  selectedDocuments,
  folders,
  onMove,
  onDelete,
  onDownload,
  onShare,
  onAddTags,
  onClose
}) => {
  const [operation, setOperation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [shareSettings, setShareSettings] = useState({
    expiresIn: 7,
    permissions: ['view'],
    emails: ''
  });

  const operations = [
    {
      id: 'download',
      name: 'Download as ZIP',
      icon: Download,
      description: 'Download all selected documents in a ZIP file',
      color: 'blue'
    },
    {
      id: 'move',
      name: 'Move to Folder',
      icon: Move,
      description: 'Move selected documents to a different folder',
      color: 'green'
    },
    {
      id: 'delete',
      name: 'Delete Documents',
      icon: Trash2,
      description: 'Permanently delete selected documents',
      color: 'red'
    },
    {
      id: 'share',
      name: 'Bulk Share',
      icon: Share2,
      description: 'Create shareable links for all selected documents',
      color: 'purple'
    },
    {
      id: 'tag',
      name: 'Add Tags',
      icon: Tag,
      description: 'Add tags to all selected documents',
      color: 'yellow'
    },
    {
      id: 'duplicate',
      name: 'Duplicate',
      icon: Copy,
      description: 'Create copies of selected documents',
      color: 'gray'
    }
  ];

  const handleOperation = async (operationId) => {
    setLoading(true);
    try {
      switch (operationId) {
        case 'download':
          await onDownload(Array.from(selectedDocuments));
          break;
        case 'move':
          if (!selectedFolder) {
            alert('Please select a destination folder');
            return;
          }
          await onMove(Array.from(selectedDocuments), selectedFolder);
          break;
        case 'delete':
          if (!confirm(`Are you sure you want to delete ${selectedDocuments.size} documents?`)) {
            return;
          }
          await onDelete(Array.from(selectedDocuments));
          break;
        case 'share':
          await handleBulkShare();
          break;
        case 'tag':
          if (!tagInput.trim()) {
            alert('Please enter at least one tag');
            return;
          }
          const tags = tagInput.split(',').map(tag => tag.trim()).filter(Boolean);
          await onAddTags(Array.from(selectedDocuments), tags);
          break;
        case 'duplicate':
          await handleDuplicate();
          break;
      }

      // Close modal on success
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Batch operation failed:', error);
      alert('Operation failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkShare = async () => {
    const sharePromises = Array.from(selectedDocuments).map(documentId =>
      onShare(documentId, {
        expiresIn: shareSettings.expiresIn * 24 * 60 * 60 * 1000,
        permissions: shareSettings.permissions,
        emails: shareSettings.emails.split(',').map(email => email.trim()).filter(Boolean)
      })
    );

    const results = await Promise.allSettled(sharePromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    alert(`Sharing complete: ${successful} successful, ${failed} failed`);
  };

  const handleDuplicate = async () => {
    // This would create copies of the selected documents
    // Implementation depends on your specific requirements
    alert('Duplicate feature coming soon!');
  };

  const MoveForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Destination Folder
        </label>
        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a folder...</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>
      <div className="bg-blue-50 p-3 rounded-md">
        <p className="text-sm text-blue-800">
          {selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''} will be moved to the selected folder.
        </p>
      </div>
    </div>
  );

  const TagForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="business-plan, financial, draft"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-sm text-gray-600 mt-1">
          Enter tags separated by commas. Tags will be added to all selected documents.
        </p>
      </div>
      <div className="bg-yellow-50 p-3 rounded-md">
        <p className="text-sm text-yellow-800">
          Adding tags to {selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''}.
        </p>
      </div>
    </div>
  );

  const ShareForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Link Expires In (days)
        </label>
        <select
          value={shareSettings.expiresIn}
          onChange={(e) => setShareSettings(prev => ({ ...prev, expiresIn: parseInt(e.target.value) }))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={1}>1 day</option>
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Permissions
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={shareSettings.permissions.includes('view')}
              onChange={(e) => {
                const permissions = e.target.checked
                  ? [...shareSettings.permissions, 'view']
                  : shareSettings.permissions.filter(p => p !== 'view');
                setShareSettings(prev => ({ ...prev, permissions }));
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">View</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={shareSettings.permissions.includes('download')}
              onChange={(e) => {
                const permissions = e.target.checked
                  ? [...shareSettings.permissions, 'download']
                  : shareSettings.permissions.filter(p => p !== 'download');
                setShareSettings(prev => ({ ...prev, permissions }));
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Download</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Addresses (optional)
        </label>
        <textarea
          value={shareSettings.emails}
          onChange={(e) => setShareSettings(prev => ({ ...prev, emails: e.target.value }))}
          placeholder="user1@example.com, user2@example.com"
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-sm text-gray-600 mt-1">
          Enter email addresses separated by commas to notify specific users.
        </p>
      </div>

      <div className="bg-purple-50 p-3 rounded-md">
        <p className="text-sm text-purple-800">
          Creating shareable links for {selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''}.
        </p>
      </div>
    </div>
  );

  const DeleteConfirmation = () => (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <XCircle className="w-5 h-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Confirm Deletion
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                You are about to permanently delete {selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''}.
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded-md">
        <p className="text-sm text-gray-700">
          Documents will be removed from all folders and storage. Any shared links will also be invalidated.
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Batch Operations ({selectedDocuments.size} documents)
          </h3>
        </div>

        <div className="p-6">
          {!operation ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {operations.map((op) => (
                <button
                  key={op.id}
                  onClick={() => setOperation(op.id)}
                  className={`p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-${op.color}-500 hover:bg-${op.color}-50 transition-colors text-left`}
                >
                  <op.icon className={`w-8 h-8 text-${op.color}-600 mb-2`} />
                  <h4 className="font-medium text-gray-900 mb-1">{op.name}</h4>
                  <p className="text-sm text-gray-600">{op.description}</p>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div className="flex items-center mb-4">
                <button
                  onClick={() => setOperation(null)}
                  className="text-gray-400 hover:text-gray-600 mr-3"
                >
                  ←
                </button>
                <h4 className="text-lg font-medium text-gray-900">
                  {operations.find(op => op.id === operation)?.name}
                </h4>
              </div>

              {operation === 'move' && <MoveForm />}
              {operation === 'tag' && <TagForm />}
              {operation === 'share' && <ShareForm />}
              {operation === 'delete' && <DeleteConfirmation />}
              {operation === 'download' && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-blue-800">
                    Ready to download {selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''} as a ZIP file.
                  </p>
                </div>
              )}
              {operation === 'duplicate' && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-700">
                    This will create copies of {selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''} in the same folder.
                  </p>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setOperation(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleOperation(operation)}
                    disabled={loading}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                      operation === 'delete'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } disabled:opacity-50`}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Processing...
                      </div>
                    ) : (
                      'Execute'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentBatchOperations;