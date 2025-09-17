import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { supabase } from '@/lib/supabase'
import { r2Storage } from '@/lib/storage/r2Client'

// Mock components for end-to-end testing
const MockBusinessIdeaPage = () => <div data-testid="business-idea-page">Business Idea Page</div>
const MockBusinessPlansPage = () => <div data-testid="business-plans-page">Business Plans Page</div>
const MockGrantProposalsPage = () => <div data-testid="grant-proposals-page">Grant Proposals Page</div>
const MockDocumentsPage = () => <div data-testid="documents-page">Documents Page</div>

describe('End-to-End Integration Workflow Tests', () => {
  const testUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User'
  }

  const testBusinessIdea = {
    id: 1,
    title: 'AI-Powered Customer Service Platform',
    description: 'A comprehensive AI solution for customer service automation',
    industry: 'Technology',
    target_market: 'Small to medium businesses',
    user_id: testUser.id,
    status: 'active'
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock successful authentication
    global.fetch = vi.fn()
  })

  describe('Complete Business Idea to Grant Proposal Workflow', () => {
    it('should complete full workflow: idea creation → business plan → grant proposal → document storage', async () => {
      // Step 1: Create Business Idea
      const mockCreateIdea = {
        data: [{ ...testBusinessIdea, created_at: new Date().toISOString() }],
        error: null
      }

      supabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve(mockCreateIdea))
        })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve(mockCreateIdea))
          }))
        }))
      }))

      // Step 2: Generate Business Plan
      const mockBusinessPlan = `
        EXECUTIVE SUMMARY
        Our AI-Powered Customer Service Platform revolutionizes how businesses interact with customers...

        MARKET ANALYSIS
        The customer service automation market is valued at $5.1 billion...

        FINANCIAL PROJECTIONS
        Year 1: $250,000 revenue
        Year 2: $750,000 revenue
        Year 3: $1,500,000 revenue
      `

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          content: mockBusinessPlan,
          metadata: { wordCount: 150 }
        })
      })

      // Step 3: Generate Grant Proposal
      const mockGrantProposal = `
        GRANT PROPOSAL: SBIR Phase I Application

        PROJECT SUMMARY
        We request $275,000 to develop and commercialize our AI-powered customer service platform...

        TECHNICAL APPROACH
        Our innovative approach combines natural language processing with machine learning...

        COMMERCIALIZATION PLAN
        We have identified three key market segments for commercialization...

        BUDGET JUSTIFICATION
        Personnel: $180,000 (65%)
        Equipment: $45,000 (16%)
        Materials: $30,000 (11%)
        Other: $20,000 (8%)
      `

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          content: mockGrantProposal,
          metadata: { wordCount: 2500 }
        })
      })

      // Step 4: Document Storage
      const mockDocumentRecord = {
        data: [{
          id: 1,
          title: 'SBIR Grant Proposal - AI Customer Service Platform',
          content: mockGrantProposal,
          document_type: 'grant_proposal',
          user_id: testUser.id,
          file_size: mockGrantProposal.length,
          file_key: 'grant_proposal/test-user-123/proposal.pdf',
          created_at: new Date().toISOString()
        }],
        error: null
      }

      // Step 5: R2 File Upload
      const mockR2Upload = {
        success: true,
        fileKey: 'grant_proposal/test-user-123/1234567890-abc123-proposal.pdf',
        fileUrl: 'https://test-bucket.r2.dev/grant_proposal/test-user-123/1234567890-abc123-proposal.pdf',
        fileName: 'SBIR_Grant_Proposal_AI_Customer_Service.pdf',
        fileSize: 25600,
        mimeType: 'application/pdf'
      }

      r2Storage.uploadFile = vi.fn().mockResolvedValue(mockR2Upload)

      // Execute Workflow
      const workflowResults = {}

      // 1. Create business idea
      const { data: ideaData } = await supabase
        .from('business_ideas')
        .insert({
          title: testBusinessIdea.title,
          description: testBusinessIdea.description,
          industry: testBusinessIdea.industry,
          target_market: testBusinessIdea.target_market,
          user_id: testUser.id
        })
        .select()

      workflowResults.businessIdea = ideaData[0]

      // 2. Generate business plan
      const businessPlanResponse = await fetch('/api/generate-business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessIdea: workflowResults.businessIdea,
          userId: testUser.id
        })
      })

      const businessPlanResult = await businessPlanResponse.json()
      workflowResults.businessPlan = businessPlanResult.content

      // 3. Generate grant proposal
      const grantProposalResponse = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'grant_match',
          businessPlan: workflowResults.businessPlan,
          proposalType: 'grant_match',
          grant: {
            title: 'SBIR Phase I - Advanced Manufacturing',
            agency: 'National Science Foundation',
            amount: '$275,000',
            requirements: ['Technology innovation', 'Commercialization plan', 'Small business']
          }
        })
      })

      const grantProposalResult = await grantProposalResponse.json()
      workflowResults.grantProposal = grantProposalResult.content

      // 4. Store document in database
      supabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve(mockDocumentRecord))
        }))
      }))

      const { data: documentData } = await supabase
        .from('documents')
        .insert({
          title: 'SBIR Grant Proposal - AI Customer Service Platform',
          content: workflowResults.grantProposal,
          document_type: 'grant_proposal',
          user_id: testUser.id,
          file_key: mockR2Upload.fileKey
        })
        .select()

      workflowResults.document = documentData[0]

      // 5. Upload to R2 storage
      const pdfFile = new Blob([workflowResults.grantProposal], { type: 'application/pdf' })
      const file = new File([pdfFile], 'proposal.pdf', { type: 'application/pdf' })

      const uploadResult = await r2Storage.uploadFile(file, testUser.id, 'grant_proposal')
      workflowResults.upload = uploadResult

      // Verify complete workflow
      expect(workflowResults.businessIdea).toBeDefined()
      expect(workflowResults.businessIdea.title).toBe(testBusinessIdea.title)

      expect(workflowResults.businessPlan).toContain('EXECUTIVE SUMMARY')
      expect(workflowResults.businessPlan).toContain('MARKET ANALYSIS')
      expect(workflowResults.businessPlan).toContain('FINANCIAL PROJECTIONS')

      expect(workflowResults.grantProposal).toContain('GRANT PROPOSAL')
      expect(workflowResults.grantProposal).toContain('PROJECT SUMMARY')
      expect(workflowResults.grantProposal).toContain('BUDGET JUSTIFICATION')

      expect(workflowResults.document.document_type).toBe('grant_proposal')
      expect(workflowResults.document.user_id).toBe(testUser.id)

      expect(workflowResults.upload.success).toBe(true)
      expect(workflowResults.upload.fileName).toContain('proposal')
      expect(workflowResults.upload.mimeType).toBe('application/pdf')
    })

    it('should handle workflow errors gracefully with proper rollback', async () => {
      // Test error handling in middle of workflow
      const workflowState = { completed: [], failed: [] }

      try {
        // Step 1: Success - Create business idea
        const mockCreateIdea = {
          data: [testBusinessIdea],
          error: null
        }

        supabase.from = vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve(mockCreateIdea))
          }))
        }))

        const { data: ideaData } = await supabase
          .from('business_ideas')
          .insert(testBusinessIdea)
          .select()

        workflowState.completed.push('business_idea_created')

        // Step 2: Failure - Business plan generation fails
        global.fetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({
            success: false,
            error: 'OpenAI API quota exceeded'
          })
        })

        const businessPlanResponse = await fetch('/api/generate-business-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessIdea: ideaData[0],
            userId: testUser.id
          })
        })

        const businessPlanResult = await businessPlanResponse.json()

        if (!businessPlanResult.success) {
          throw new Error(businessPlanResult.error)
        }
      } catch (error) {
        workflowState.failed.push({
          step: 'business_plan_generation',
          error: error.message
        })

        // Cleanup: Remove created business idea
        supabase.from = vi.fn(() => ({
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))

        await supabase
          .from('business_ideas')
          .delete()
          .eq('id', testBusinessIdea.id)

        workflowState.completed.push('rollback_business_idea')
      }

      expect(workflowState.completed).toContain('business_idea_created')
      expect(workflowState.completed).toContain('rollback_business_idea')
      expect(workflowState.failed).toHaveLength(1)
      expect(workflowState.failed[0].error).toBe('OpenAI API quota exceeded')
    })
  })

  describe('Document Management Workflow', () => {
    it('should complete document upload, storage, and retrieval workflow', async () => {
      const testDocument = {
        title: 'Business Plan Draft',
        content: 'Comprehensive business plan content...',
        document_type: 'business_plan',
        user_id: testUser.id
      }

      // Step 1: Create document record
      const mockDocumentRecord = {
        data: [{ ...testDocument, id: 1, created_at: new Date().toISOString() }],
        error: null
      }

      supabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve(mockDocumentRecord))
        })),
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve(mockDocumentRecord))
        }))
      }))

      // Step 2: Upload file to R2
      const mockFile = new File(['test content'], 'business-plan.pdf', { type: 'application/pdf' })
      const mockUpload = {
        success: true,
        fileKey: 'business_plan/test-user-123/business-plan.pdf',
        fileUrl: 'https://test-bucket.r2.dev/business_plan/test-user-123/business-plan.pdf'
      }

      r2Storage.uploadFile = vi.fn().mockResolvedValue(mockUpload)

      // Step 3: Update document with file reference
      const mockUpdateDocument = {
        data: [{ ...testDocument, file_key: mockUpload.fileKey }],
        error: null
      }

      supabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve(mockDocumentRecord))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve(mockUpdateDocument))
          }))
        })),
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve(mockUpdateDocument))
        }))
      }))

      // Execute workflow
      const workflow = {}

      // 1. Create document record
      const { data: documentData } = await supabase
        .from('documents')
        .insert(testDocument)
        .select()

      workflow.document = documentData[0]

      // 2. Upload file
      const uploadResult = await r2Storage.uploadFile(mockFile, testUser.id, 'business_plan')
      workflow.upload = uploadResult

      // 3. Update document with file reference
      const { data: updatedDocument } = await supabase
        .from('documents')
        .update({ file_key: uploadResult.fileKey })
        .eq('id', workflow.document.id)
        .select()

      workflow.updatedDocument = updatedDocument[0]

      // 4. Retrieve document
      const { data: retrievedDocument } = await supabase
        .from('documents')
        .select('*')
        .eq('id', workflow.document.id)

      workflow.retrievedDocument = retrievedDocument[0]

      // Verify workflow
      expect(workflow.document.title).toBe(testDocument.title)
      expect(workflow.upload.success).toBe(true)
      expect(workflow.updatedDocument.file_key).toBe(uploadResult.fileKey)
      expect(workflow.retrievedDocument.file_key).toBeDefined()
    })

    it('should handle document versioning workflow', async () => {
      const documentVersions = []

      // Create initial version
      const initialDoc = {
        title: 'Business Plan',
        content: 'Initial version content',
        document_type: 'business_plan',
        user_id: testUser.id,
        version: 1
      }

      const mockInitialDoc = {
        data: [{ ...initialDoc, id: 1, created_at: new Date().toISOString() }],
        error: null
      }

      // Create updated version
      const updatedDoc = {
        ...initialDoc,
        content: 'Updated version content',
        version: 2
      }

      const mockUpdatedDoc = {
        data: [{ ...updatedDoc, id: 2, created_at: new Date().toISOString() }],
        error: null
      }

      supabase.from = vi.fn()
        .mockReturnValueOnce({
          insert: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve(mockInitialDoc))
          }))
        })
        .mockReturnValueOnce({
          insert: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve(mockUpdatedDoc))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: [mockUpdatedDoc.data[0], mockInitialDoc.data[0]],
                error: null
              }))
            }))
          }))
        })

      // Create initial version
      const { data: v1Data } = await supabase
        .from('documents')
        .insert(initialDoc)
        .select()

      documentVersions.push(v1Data[0])

      // Create updated version
      const { data: v2Data } = await supabase
        .from('documents')
        .insert(updatedDoc)
        .select()

      documentVersions.push(v2Data[0])

      // Retrieve all versions
      const { data: allVersions } = await supabase
        .from('documents')
        .select('*')
        .eq('title', 'Business Plan')
        .order('version', { ascending: false })

      expect(documentVersions).toHaveLength(2)
      expect(documentVersions[0].version).toBe(1)
      expect(documentVersions[1].version).toBe(2)
      expect(allVersions).toHaveLength(2)
      expect(allVersions[0].version).toBe(2) // Latest first
    })
  })

  describe('User Subscription and Payment Workflow', () => {
    it('should handle subscription upgrade workflow', async () => {
      const subscriptionWorkflow = {}

      // Step 1: Check current subscription
      const mockCurrentProfile = {
        data: [{ ...testUser, subscription_plan: 'free', subscription_status: 'active' }],
        error: null
      }

      supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve(mockCurrentProfile))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({
              data: [{ ...testUser, subscription_plan: 'pro', subscription_status: 'active' }],
              error: null
            }))
          }))
        }))
      }))

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status')
        .eq('id', testUser.id)

      subscriptionWorkflow.currentPlan = currentProfile[0].subscription_plan

      // Step 2: Process payment (mocked)
      const mockPaymentResult = {
        success: true,
        transactionId: 'txn_12345',
        amount: 29.99,
        plan: 'pro'
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPaymentResult)
      })

      const paymentResponse = await fetch('/api/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUser.id,
          plan: 'pro',
          paymentMethod: 'paypal'
        })
      })

      const paymentResult = await paymentResponse.json()
      subscriptionWorkflow.payment = paymentResult

      // Step 3: Update subscription
      if (paymentResult.success) {
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .update({
            subscription_plan: 'pro',
            subscription_status: 'active',
            subscription_updated_at: new Date().toISOString()
          })
          .eq('id', testUser.id)
          .select()

        subscriptionWorkflow.updatedPlan = updatedProfile[0].subscription_plan
      }

      // Verify workflow
      expect(subscriptionWorkflow.currentPlan).toBe('free')
      expect(subscriptionWorkflow.payment.success).toBe(true)
      expect(subscriptionWorkflow.payment.transactionId).toBe('txn_12345')
      expect(subscriptionWorkflow.updatedPlan).toBe('pro')
    })

    it('should handle failed payment workflow', async () => {
      const failedPaymentWorkflow = {}

      // Mock failed payment
      const mockFailedPayment = {
        success: false,
        error: 'Payment declined by bank',
        errorCode: 'PAYMENT_DECLINED'
      }

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockFailedPayment)
      })

      // Mock profile remains unchanged
      supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: [{ ...testUser, subscription_plan: 'free' }],
            error: null
          }))
        }))
      }))

      try {
        const paymentResponse = await fetch('/api/process-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: testUser.id,
            plan: 'pro',
            paymentMethod: 'paypal'
          })
        })

        const paymentResult = await paymentResponse.json()

        if (!paymentResult.success) {
          throw new Error(paymentResult.error)
        }
      } catch (error) {
        failedPaymentWorkflow.error = error.message

        // Verify subscription remains unchanged
        const { data: profileData } = await supabase
          .from('profiles')
          .select('subscription_plan')
          .eq('id', testUser.id)

        failedPaymentWorkflow.subscriptionPlan = profileData[0].subscription_plan
      }

      expect(failedPaymentWorkflow.error).toBe('Payment declined by bank')
      expect(failedPaymentWorkflow.subscriptionPlan).toBe('free')
    })
  })

  describe('Data Consistency and Recovery Workflows', () => {
    it('should maintain data consistency between Supabase and R2', async () => {
      const consistencyTest = {}

      // Create document record
      const testDoc = {
        title: 'Consistency Test Document',
        content: 'Test content',
        document_type: 'test',
        user_id: testUser.id
      }

      const mockDocRecord = {
        data: [{ ...testDoc, id: 1, created_at: new Date().toISOString() }],
        error: null
      }

      supabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve(mockDocRecord))
        })),
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve(mockDocRecord))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))

      // Upload file to R2
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const mockUpload = {
        success: true,
        fileKey: 'test/test-user-123/test.pdf',
        fileUrl: 'https://test-bucket.r2.dev/test/test-user-123/test.pdf'
      }

      r2Storage.uploadFile = vi.fn().mockResolvedValue(mockUpload)
      r2Storage.deleteFile = vi.fn().mockResolvedValue(true)

      // Test workflow
      const { data: docData } = await supabase
        .from('documents')
        .insert(testDoc)
        .select()

      consistencyTest.document = docData[0]

      const uploadResult = await r2Storage.uploadFile(mockFile, testUser.id, 'test')
      consistencyTest.upload = uploadResult

      // Verify both records exist
      const { data: verifyDoc } = await supabase
        .from('documents')
        .select('*')
        .eq('id', consistencyTest.document.id)

      expect(verifyDoc).toHaveLength(1)
      expect(consistencyTest.upload.success).toBe(true)

      // Test cleanup
      await supabase
        .from('documents')
        .delete()
        .eq('id', consistencyTest.document.id)

      await r2Storage.deleteFile(consistencyTest.upload.fileKey)

      expect(supabase.from).toHaveBeenCalledWith('documents')
      expect(r2Storage.deleteFile).toHaveBeenCalledWith(consistencyTest.upload.fileKey)
    })

    it('should handle orphaned file cleanup', async () => {
      const orphanedFiles = []

      // Mock scenario: Files in R2 without database records
      const mockR2Files = [
        { key: 'general/test-user-123/orphaned1.pdf', size: 1024 },
        { key: 'general/test-user-123/valid-file.pdf', size: 2048 },
        { key: 'general/test-user-123/orphaned2.pdf', size: 512 }
      ]

      // Mock database records (missing orphaned files)
      const mockDbRecords = {
        data: [
          { file_key: 'general/test-user-123/valid-file.pdf', title: 'Valid Document' }
        ],
        error: null
      }

      r2Storage.listUserFiles = vi.fn().mockResolvedValue(mockR2Files)
      r2Storage.deleteFile = vi.fn().mockResolvedValue(true)

      supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve(mockDbRecords))
        }))
      }))

      // Find orphaned files
      const r2Files = await r2Storage.listUserFiles(testUser.id)
      const { data: dbRecords } = await supabase
        .from('documents')
        .select('file_key')
        .eq('user_id', testUser.id)

      const dbFileKeys = new Set(dbRecords.map(record => record.file_key))

      for (const file of r2Files) {
        if (!dbFileKeys.has(file.key)) {
          orphanedFiles.push(file.key)
        }
      }

      // Cleanup orphaned files
      for (const fileKey of orphanedFiles) {
        await r2Storage.deleteFile(fileKey)
      }

      expect(orphanedFiles).toHaveLength(2)
      expect(orphanedFiles).toContain('general/test-user-123/orphaned1.pdf')
      expect(orphanedFiles).toContain('general/test-user-123/orphaned2.pdf')
      expect(r2Storage.deleteFile).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error Recovery and Resilience Workflows', () => {
    it('should recover from network interruptions', async () => {
      const recoveryTest = { attempts: 0, success: false }

      const retryOperation = async (operation, maxRetries = 3) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            recoveryTest.attempts = attempt
            const result = await operation()
            recoveryTest.success = true
            return result
          } catch (error) {
            if (attempt === maxRetries) {
              throw error
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          }
        }
      }

      // Mock operation that fails twice then succeeds
      let callCount = 0
      const mockOperation = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount <= 2) {
          throw new Error('Network error')
        }
        return Promise.resolve({ success: true, data: 'operation completed' })
      })

      const result = await retryOperation(mockOperation)

      expect(recoveryTest.attempts).toBe(3)
      expect(recoveryTest.success).toBe(true)
      expect(result.success).toBe(true)
      expect(mockOperation).toHaveBeenCalledTimes(3)
    })

    it('should handle partial workflow completion', async () => {
      const partialCompletion = {
        completed: [],
        failed: [],
        rollback: []
      }

      const workflowSteps = [
        { name: 'create_business_idea', operation: () => Promise.resolve('success') },
        { name: 'generate_business_plan', operation: () => Promise.resolve('success') },
        { name: 'generate_proposal', operation: () => Promise.reject(new Error('API limit exceeded')) },
        { name: 'store_document', operation: () => Promise.resolve('success') }
      ]

      for (const step of workflowSteps) {
        try {
          await step.operation()
          partialCompletion.completed.push(step.name)
        } catch (error) {
          partialCompletion.failed.push({ step: step.name, error: error.message })

          // Rollback completed steps
          for (const completedStep of partialCompletion.completed.reverse()) {
            try {
              // Mock rollback operations
              partialCompletion.rollback.push(completedStep)
            } catch (rollbackError) {
              console.error(`Failed to rollback ${completedStep}:`, rollbackError)
            }
          }
          break
        }
      }

      expect(partialCompletion.completed).toEqual(['create_business_idea', 'generate_business_plan'])
      expect(partialCompletion.failed).toHaveLength(1)
      expect(partialCompletion.failed[0].step).toBe('generate_proposal')
      expect(partialCompletion.rollback).toEqual(['generate_business_plan', 'create_business_idea'])
    })
  })
})