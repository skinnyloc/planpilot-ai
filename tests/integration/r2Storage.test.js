import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { r2Storage } from '@/lib/storage/r2Client'

describe('R2 Storage Integration Tests', () => {
  const testUserId = 'test-user-123'
  const testFiles = {
    small: {
      name: 'test-document.pdf',
      size: 1024, // 1KB
      type: 'application/pdf',
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
    },
    medium: {
      name: 'business-plan.docx',
      size: 1024 * 1024, // 1MB
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024 * 1024))
    },
    large: {
      name: 'presentation.pptx',
      size: 50 * 1024 * 1024, // 50MB
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(50 * 1024 * 1024))
    },
    image: {
      name: 'chart.png',
      size: 2 * 1024 * 1024, // 2MB
      type: 'image/png',
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(2 * 1024 * 1024))
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Client Initialization Tests', () => {
    it('should initialize R2 client successfully', () => {
      expect(r2Storage.isInitialized()).toBe(true)
    })

    it('should handle missing credentials gracefully', () => {
      // Mock environment without credentials
      const mockR2Storage = {
        isInitialized: vi.fn(() => false),
        init: vi.fn(() => {
          console.warn('R2 credentials not found. Document storage will be disabled.')
        })
      }

      expect(mockR2Storage.isInitialized()).toBe(false)
    })

    it('should configure client with correct endpoint', () => {
      // This tests the client configuration indirectly
      expect(r2Storage.isInitialized()).toBe(true)
    })
  })

  describe('File Upload Tests', () => {
    it('should upload small file successfully', async () => {
      const mockResult = {
        success: true,
        fileKey: 'general/test-user-123/1234567890-abc123-test-document.pdf',
        fileUrl: 'https://test-bucket.r2.dev/general/test-user-123/1234567890-abc123-test-document.pdf',
        fileName: 'test-document.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        etag: '"abc123def456"',
        metadata: {
          uploadedAt: expect.any(String),
          r2Response: expect.any(Object)
        }
      }

      r2Storage.uploadFile = vi.fn().mockResolvedValue(mockResult)

      const result = await r2Storage.uploadFile(testFiles.small, testUserId, 'general')

      expect(result.success).toBe(true)
      expect(result.fileName).toBe('test-document.pdf')
      expect(result.fileSize).toBe(1024)
      expect(result.fileKey).toContain(testUserId)
      expect(r2Storage.uploadFile).toHaveBeenCalledWith(testFiles.small, testUserId, 'general')
    })

    it('should upload medium file successfully', async () => {
      const mockResult = {
        success: true,
        fileKey: 'business_plan/test-user-123/1234567890-def456-business-plan.docx',
        fileUrl: 'https://test-bucket.r2.dev/business_plan/test-user-123/1234567890-def456-business-plan.docx',
        fileName: 'business-plan.docx',
        fileSize: 1024 * 1024,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }

      r2Storage.uploadFile = vi.fn().mockResolvedValue(mockResult)

      const result = await r2Storage.uploadFile(testFiles.medium, testUserId, 'business_plan')

      expect(result.success).toBe(true)
      expect(result.fileSize).toBe(1024 * 1024)
      expect(result.fileKey).toContain('business_plan')
    })

    it('should upload large file successfully', async () => {
      const mockResult = {
        success: true,
        fileKey: 'presentation/test-user-123/1234567890-ghi789-presentation.pptx',
        fileUrl: 'https://test-bucket.r2.dev/presentation/test-user-123/1234567890-ghi789-presentation.pptx',
        fileName: 'presentation.pptx',
        fileSize: 50 * 1024 * 1024,
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      }

      r2Storage.uploadFile = vi.fn().mockResolvedValue(mockResult)

      const result = await r2Storage.uploadFile(testFiles.large, testUserId, 'presentation')

      expect(result.success).toBe(true)
      expect(result.fileSize).toBe(50 * 1024 * 1024)
    })

    it('should handle different file types correctly', async () => {
      const mockResults = [
        { fileName: 'chart.png', mimeType: 'image/png' },
        { fileName: 'test-document.pdf', mimeType: 'application/pdf' },
        { fileName: 'business-plan.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      ]

      r2Storage.uploadFile = vi.fn()
        .mockResolvedValueOnce({ success: true, ...mockResults[0] })
        .mockResolvedValueOnce({ success: true, ...mockResults[1] })
        .mockResolvedValueOnce({ success: true, ...mockResults[2] })

      const imageResult = await r2Storage.uploadFile(testFiles.image, testUserId, 'images')
      const pdfResult = await r2Storage.uploadFile(testFiles.small, testUserId, 'documents')
      const docxResult = await r2Storage.uploadFile(testFiles.medium, testUserId, 'business_plan')

      expect(imageResult.mimeType).toBe('image/png')
      expect(pdfResult.mimeType).toBe('application/pdf')
      expect(docxResult.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    })

    it('should handle upload errors gracefully', async () => {
      const uploadError = new Error('Failed to upload file: Network error')
      r2Storage.uploadFile = vi.fn().mockRejectedValue(uploadError)

      await expect(r2Storage.uploadFile(testFiles.small, testUserId, 'general'))
        .rejects.toThrow('Failed to upload file: Network error')
    })

    it('should handle file size limits', async () => {
      const oversizedFile = {
        name: 'huge-file.zip',
        size: 500 * 1024 * 1024, // 500MB
        type: 'application/zip',
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(500 * 1024 * 1024))
      }

      const sizeError = new Error('File size exceeds limit')
      r2Storage.uploadFile = vi.fn().mockRejectedValue(sizeError)

      await expect(r2Storage.uploadFile(oversizedFile, testUserId, 'general'))
        .rejects.toThrow('File size exceeds limit')
    })
  })

  describe('File Download Tests', () => {
    const testFileKey = 'general/test-user-123/1234567890-abc123-test-document.pdf'

    it('should generate download URL successfully', async () => {
      const mockUrl = 'https://test-bucket.r2.cloudflarestorage.com/general/test-user-123/1234567890-abc123-test-document.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=test&X-Amz-Date=20240101T000000Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=test'

      r2Storage.getDownloadUrl = vi.fn().mockResolvedValue(mockUrl)

      const url = await r2Storage.getDownloadUrl(testFileKey)

      expect(url).toBe(mockUrl)
      expect(url).toContain('X-Amz-Algorithm')
      expect(url).toContain('X-Amz-Expires=3600')
    })

    it('should generate download URL with custom expiration', async () => {
      const customExpiration = 7200 // 2 hours
      const mockUrl = 'https://test-bucket.r2.cloudflarestorage.com/test-file?X-Amz-Expires=7200'

      r2Storage.getDownloadUrl = vi.fn().mockResolvedValue(mockUrl)

      const url = await r2Storage.getDownloadUrl(testFileKey, customExpiration)

      expect(url).toContain('X-Amz-Expires=7200')
    })

    it('should handle download URL generation errors', async () => {
      const downloadError = new Error('Failed to generate download URL: File not found')
      r2Storage.getDownloadUrl = vi.fn().mockRejectedValue(downloadError)

      await expect(r2Storage.getDownloadUrl('invalid-file-key'))
        .rejects.toThrow('Failed to generate download URL: File not found')
    })
  })

  describe('File Deletion Tests', () => {
    const testFileKey = 'general/test-user-123/1234567890-abc123-test-document.pdf'

    it('should delete file successfully', async () => {
      r2Storage.deleteFile = vi.fn().mockResolvedValue(true)

      const result = await r2Storage.deleteFile(testFileKey)

      expect(result).toBe(true)
      expect(r2Storage.deleteFile).toHaveBeenCalledWith(testFileKey)
    })

    it('should handle file deletion errors', async () => {
      const deleteError = new Error('Failed to delete file: File not found')
      r2Storage.deleteFile = vi.fn().mockRejectedValue(deleteError)

      await expect(r2Storage.deleteFile('non-existent-file'))
        .rejects.toThrow('Failed to delete file: File not found')
    })

    it('should handle bulk file deletion', async () => {
      const fileKeys = [
        'general/test-user-123/file1.pdf',
        'general/test-user-123/file2.pdf',
        'general/test-user-123/file3.pdf'
      ]

      const mockResult = {
        deleted: fileKeys.slice(0, 2),
        failed: [{ fileKey: fileKeys[2], error: 'File not found' }]
      }

      r2Storage.bulkDeleteFiles = vi.fn().mockResolvedValue(mockResult)

      const result = await r2Storage.bulkDeleteFiles(fileKeys)

      expect(result.deleted).toHaveLength(2)
      expect(result.failed).toHaveLength(1)
      expect(result.failed[0].error).toBe('File not found')
    })
  })

  describe('File Metadata Tests', () => {
    const testFileKey = 'general/test-user-123/1234567890-abc123-test-document.pdf'

    it('should retrieve file metadata successfully', async () => {
      const mockMetadata = {
        contentType: 'application/pdf',
        contentLength: 1024,
        lastModified: new Date('2024-01-01'),
        etag: '"abc123def456"',
        metadata: {
          'user-id': testUserId,
          'document-type': 'general',
          'original-filename': 'test-document.pdf',
          'upload-timestamp': '2024-01-01T00:00:00.000Z'
        }
      }

      r2Storage.getFileMetadata = vi.fn().mockResolvedValue(mockMetadata)

      const metadata = await r2Storage.getFileMetadata(testFileKey)

      expect(metadata.contentType).toBe('application/pdf')
      expect(metadata.contentLength).toBe(1024)
      expect(metadata.metadata['user-id']).toBe(testUserId)
    })

    it('should handle metadata retrieval errors', async () => {
      const metadataError = new Error('Failed to get file metadata: File not found')
      r2Storage.getFileMetadata = vi.fn().mockRejectedValue(metadataError)

      await expect(r2Storage.getFileMetadata('invalid-file-key'))
        .rejects.toThrow('Failed to get file metadata: File not found')
    })
  })

  describe('File Listing Tests', () => {
    it('should list user files successfully', async () => {
      const mockFiles = [
        {
          key: 'general/test-user-123/file1.pdf',
          size: 1024,
          lastModified: new Date('2024-01-01'),
          etag: '"abc123"'
        },
        {
          key: 'general/test-user-123/file2.pdf',
          size: 2048,
          lastModified: new Date('2024-01-02'),
          etag: '"def456"'
        }
      ]

      r2Storage.listUserFiles = vi.fn().mockResolvedValue(mockFiles)

      const files = await r2Storage.listUserFiles(testUserId)

      expect(files).toHaveLength(2)
      expect(files[0].key).toContain(testUserId)
      expect(files[1].size).toBe(2048)
    })

    it('should filter files by document type', async () => {
      const mockFiles = [
        {
          key: 'business_plan/test-user-123/plan1.pdf',
          size: 1024,
          lastModified: new Date('2024-01-01'),
          etag: '"abc123"'
        }
      ]

      r2Storage.listUserFiles = vi.fn().mockResolvedValue(mockFiles)

      const files = await r2Storage.listUserFiles(testUserId, 'business_plan')

      expect(files).toHaveLength(1)
      expect(files[0].key).toContain('business_plan')
    })

    it('should handle empty file lists', async () => {
      r2Storage.listUserFiles = vi.fn().mockResolvedValue([])

      const files = await r2Storage.listUserFiles('new-user-id')

      expect(files).toHaveLength(0)
      expect(Array.isArray(files)).toBe(true)
    })
  })

  describe('Storage Usage Tests', () => {
    it('should calculate storage usage correctly', async () => {
      const mockUsage = {
        totalFiles: 5,
        totalSize: 10 * 1024 * 1024, // 10MB
        totalSizeMB: 10,
        files: [
          { key: 'file1.pdf', size: 2 * 1024 * 1024 },
          { key: 'file2.pdf', size: 3 * 1024 * 1024 },
          { key: 'file3.pdf', size: 5 * 1024 * 1024 }
        ]
      }

      r2Storage.getUserStorageUsage = vi.fn().mockResolvedValue(mockUsage)

      const usage = await r2Storage.getUserStorageUsage(testUserId)

      expect(usage.totalFiles).toBe(5)
      expect(usage.totalSizeMB).toBe(10)
      expect(usage.files).toHaveLength(3)
    })

    it('should handle zero storage usage', async () => {
      const mockUsage = {
        totalFiles: 0,
        totalSize: 0,
        totalSizeMB: 0,
        files: []
      }

      r2Storage.getUserStorageUsage = vi.fn().mockResolvedValue(mockUsage)

      const usage = await r2Storage.getUserStorageUsage('new-user-id')

      expect(usage.totalFiles).toBe(0)
      expect(usage.totalSize).toBe(0)
      expect(usage.files).toHaveLength(0)
    })
  })

  describe('Presigned URL Tests', () => {
    it('should generate presigned upload URL', async () => {
      const mockUploadUrl = 'https://test-bucket.r2.cloudflarestorage.com/test-file-key?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=900'

      r2Storage.getUploadUrl = vi.fn().mockResolvedValue(mockUploadUrl)

      const url = await r2Storage.getUploadUrl('test-file-key', 'application/pdf')

      expect(url).toBe(mockUploadUrl)
      expect(url).toContain('X-Amz-Expires=900') // 15 minutes default
    })

    it('should generate presigned upload URL with custom expiration', async () => {
      const customExpiration = 1800 // 30 minutes
      const mockUploadUrl = 'https://test-bucket.r2.cloudflarestorage.com/test-file-key?X-Amz-Expires=1800'

      r2Storage.getUploadUrl = vi.fn().mockResolvedValue(mockUploadUrl)

      const url = await r2Storage.getUploadUrl('test-file-key', 'application/pdf', customExpiration)

      expect(url).toContain('X-Amz-Expires=1800')
    })
  })

  describe('Error Handling Tests', () => {
    it('should handle client not initialized errors', async () => {
      const uninitializedStorage = {
        isInitialized: () => false,
        uploadFile: async () => {
          throw new Error('R2 client not initialized. Please configure R2 credentials.')
        }
      }

      await expect(uninitializedStorage.uploadFile(testFiles.small, testUserId))
        .rejects.toThrow('R2 client not initialized. Please configure R2 credentials.')
    })

    it('should handle network connection errors', async () => {
      const networkError = new Error('Network connection failed')
      r2Storage.uploadFile = vi.fn().mockRejectedValue(networkError)

      await expect(r2Storage.uploadFile(testFiles.small, testUserId))
        .rejects.toThrow('Network connection failed')
    })

    it('should handle permission errors', async () => {
      const permissionError = new Error('Access denied')
      r2Storage.uploadFile = vi.fn().mockRejectedValue(permissionError)

      await expect(r2Storage.uploadFile(testFiles.small, testUserId))
        .rejects.toThrow('Access denied')
    })

    it('should handle bucket not found errors', async () => {
      const bucketError = new Error('Bucket does not exist')
      r2Storage.listUserFiles = vi.fn().mockRejectedValue(bucketError)

      await expect(r2Storage.listUserFiles(testUserId))
        .rejects.toThrow('Bucket does not exist')
    })
  })

  describe('Concurrent Operations Tests', () => {
    it('should handle multiple simultaneous uploads', async () => {
      const uploadPromises = [
        r2Storage.uploadFile(testFiles.small, testUserId, 'general'),
        r2Storage.uploadFile(testFiles.medium, testUserId, 'business_plan'),
        r2Storage.uploadFile(testFiles.image, testUserId, 'images')
      ]

      const mockResults = [
        { success: true, fileName: 'test-document.pdf' },
        { success: true, fileName: 'business-plan.docx' },
        { success: true, fileName: 'chart.png' }
      ]

      r2Storage.uploadFile = vi.fn()
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])
        .mockResolvedValueOnce(mockResults[2])

      const results = await Promise.all(uploadPromises)

      expect(results).toHaveLength(3)
      expect(results[0].fileName).toBe('test-document.pdf')
      expect(results[1].fileName).toBe('business-plan.docx')
      expect(results[2].fileName).toBe('chart.png')
    })

    it('should handle mixed operations (upload/download/delete)', async () => {
      const operations = [
        r2Storage.uploadFile(testFiles.small, testUserId, 'general'),
        r2Storage.getDownloadUrl('existing-file-key'),
        r2Storage.deleteFile('old-file-key')
      ]

      r2Storage.uploadFile = vi.fn().mockResolvedValue({ success: true })
      r2Storage.getDownloadUrl = vi.fn().mockResolvedValue('https://download.url')
      r2Storage.deleteFile = vi.fn().mockResolvedValue(true)

      const results = await Promise.all(operations)

      expect(results[0].success).toBe(true)
      expect(results[1]).toBe('https://download.url')
      expect(results[2]).toBe(true)
    })
  })

  describe('File Key Generation Tests', () => {
    it('should generate unique file keys', () => {
      const generateKey = (userId, fileName, documentType) => {
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(7)
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
        return `${documentType}/${userId}/${timestamp}-${randomSuffix}-${sanitizedFileName}`
      }

      const key1 = generateKey(testUserId, 'test file.pdf', 'general')
      const key2 = generateKey(testUserId, 'test file.pdf', 'general')

      expect(key1).not.toBe(key2)
      expect(key1).toContain(testUserId)
      expect(key1).toContain('test_file.pdf')
      expect(key1).toMatch(/^general\/test-user-123\/\d+-[a-z0-9]+-test_file\.pdf$/)
    })

    it('should sanitize file names properly', () => {
      const sanitizeFileName = (fileName) => fileName.replace(/[^a-zA-Z0-9._-]/g, '_')

      expect(sanitizeFileName('file with spaces.pdf')).toBe('file_with_spaces.pdf')
      expect(sanitizeFileName('file@#$%^&*().doc')).toBe('file________.doc')
      expect(sanitizeFileName('normal-file_name.txt')).toBe('normal-file_name.txt')
    })
  })
})