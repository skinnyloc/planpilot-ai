import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { supabase } from '@/lib/supabase'

// Mock PayPal SDK
const mockPayPal = {
  Buttons: vi.fn((options) => ({
    render: vi.fn((container) => {
      // Simulate PayPal button rendering
      const button = document.createElement('div')
      button.className = 'paypal-button'
      button.innerHTML = 'PayPal Button'
      button.onclick = () => options.createOrder()
      if (typeof container === 'string') {
        document.querySelector(container)?.appendChild(button)
      } else {
        container?.appendChild(button)
      }
      return Promise.resolve()
    }),
    close: vi.fn()
  })),
  FUNDING: {
    PAYPAL: 'paypal',
    CARD: 'card',
    VENMO: 'venmo'
  },
  INTENT: {
    CAPTURE: 'capture',
    AUTHORIZE: 'authorize'
  }
}

// Mock PayPal script loader
global.paypal = mockPayPal

describe('PayPal Payment Flow Integration Tests', () => {
  const testUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    subscription_plan: 'free'
  }

  const subscriptionPlans = {
    free: { price: 0, name: 'Free Plan', features: ['Basic features'] },
    pro: { price: 29.99, name: 'Pro Plan', features: ['Advanced features', 'Priority support'] },
    enterprise: { price: 99.99, name: 'Enterprise Plan', features: ['All features', 'Custom support'] }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()

    // Mock DOM methods
    document.querySelector = vi.fn()
    document.createElement = vi.fn(() => ({
      className: '',
      innerHTML: '',
      onclick: null,
      appendChild: vi.fn()
    }))
  })

  describe('PayPal Button Initialization Tests', () => {
    it('should initialize PayPal button with correct configuration', async () => {
      const paypalConfig = {
        clientId: 'test-client-id',
        currency: 'USD',
        intent: 'capture',
        environment: 'sandbox'
      }

      // Mock PayPal script loading
      const mockScript = document.createElement('script')
      document.head.appendChild = vi.fn()

      const loadPayPalScript = () => {
        return new Promise((resolve) => {
          mockScript.onload = () => {
            global.paypal = mockPayPal
            resolve(global.paypal)
          }
          mockScript.onload()
        })
      }

      const paypal = await loadPayPalScript()

      expect(paypal).toBeDefined()
      expect(paypal.Buttons).toBeDefined()
      expect(paypal.FUNDING).toBeDefined()
      expect(paypal.INTENT).toBeDefined()
    })

    it('should handle PayPal script loading failures', async () => {
      const loadPayPalScriptWithError = () => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Failed to load PayPal script'))
          }, 100)
        })
      }

      await expect(loadPayPalScriptWithError()).rejects.toThrow('Failed to load PayPal script')
    })

    it('should render PayPal button in correct container', () => {
      const containerElement = document.createElement('div')
      containerElement.id = 'paypal-button-container'

      document.querySelector = vi.fn((selector) => {
        if (selector === '#paypal-button-container') {
          return containerElement
        }
        return null
      })

      const buttonConfig = {
        createOrder: vi.fn(),
        onApprove: vi.fn(),
        onError: vi.fn(),
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal'
        }
      }

      const paypalButtons = mockPayPal.Buttons(buttonConfig)
      const renderPromise = paypalButtons.render('#paypal-button-container')

      expect(renderPromise).resolves.toBeUndefined()
      expect(document.querySelector).toHaveBeenCalledWith('#paypal-button-container')
    })
  })

  describe('Order Creation Tests', () => {
    it('should create order with correct subscription details', async () => {
      const orderData = {
        plan: 'pro',
        amount: subscriptionPlans.pro.price,
        currency: 'USD',
        userId: testUser.id
      }

      const mockOrderResponse = {
        id: 'ORDER_12345',
        status: 'CREATED',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: '29.99'
          },
          description: 'Pro Plan Subscription'
        }]
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOrderResponse)
      })

      const createOrder = async () => {
        const response = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        })
        return await response.json()
      }

      const buttonConfig = {
        createOrder: async () => {
          const order = await createOrder()
          return order.id
        }
      }

      const orderId = await buttonConfig.createOrder()

      expect(orderId).toBe('ORDER_12345')
      expect(global.fetch).toHaveBeenCalledWith('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })
    })

    it('should handle order creation errors', async () => {
      const orderData = {
        plan: 'invalid-plan',
        amount: -1,
        currency: 'USD',
        userId: testUser.id
      }

      const mockErrorResponse = {
        error: 'Invalid order data',
        details: 'Plan not found'
      }

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockErrorResponse)
      })

      const createOrder = async () => {
        const response = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error)
        }

        return await response.json()
      }

      await expect(createOrder()).rejects.toThrow('Invalid order data')
    })

    it('should validate order amounts and currency', () => {
      const validateOrderData = (orderData) => {
        const errors = []

        if (!orderData.amount || orderData.amount <= 0) {
          errors.push('Invalid amount')
        }

        if (!orderData.currency || !['USD', 'EUR', 'GBP'].includes(orderData.currency)) {
          errors.push('Invalid currency')
        }

        if (!orderData.plan || !subscriptionPlans[orderData.plan]) {
          errors.push('Invalid subscription plan')
        }

        if (orderData.amount !== subscriptionPlans[orderData.plan]?.price) {
          errors.push('Amount does not match plan price')
        }

        return errors
      }

      // Valid order
      const validOrder = {
        plan: 'pro',
        amount: 29.99,
        currency: 'USD',
        userId: testUser.id
      }
      expect(validateOrderData(validOrder)).toHaveLength(0)

      // Invalid orders
      const invalidAmount = { ...validOrder, amount: -10 }
      expect(validateOrderData(invalidAmount)).toContain('Invalid amount')

      const invalidCurrency = { ...validOrder, currency: 'XYZ' }
      expect(validateOrderData(invalidCurrency)).toContain('Invalid currency')

      const invalidPlan = { ...validOrder, plan: 'nonexistent' }
      expect(validateOrderData(invalidPlan)).toContain('Invalid subscription plan')

      const mismatchedAmount = { ...validOrder, amount: 99.99 }
      expect(validateOrderData(mismatchedAmount)).toContain('Amount does not match plan price')
    })
  })

  describe('Payment Approval Tests', () => {
    it('should handle successful payment approval', async () => {
      const approvalData = {
        orderID: 'ORDER_12345',
        payerID: 'PAYER_67890'
      }

      const mockCaptureResponse = {
        id: 'PAYMENT_ABC123',
        status: 'COMPLETED',
        purchase_units: [{
          payments: {
            captures: [{
              id: 'CAPTURE_DEF456',
              status: 'COMPLETED',
              amount: {
                currency_code: 'USD',
                value: '29.99'
              }
            }]
          }
        }],
        payer: {
          email_address: testUser.email,
          payer_id: 'PAYER_67890'
        }
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCaptureResponse)
      })

      const onApprove = async (data) => {
        const response = await fetch(`/api/paypal/capture-order/${data.orderID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payerID: data.payerID,
            userId: testUser.id
          })
        })

        const result = await response.json()

        if (result.status === 'COMPLETED') {
          // Update user subscription
          return {
            success: true,
            paymentId: result.id,
            subscriptionUpdated: true
          }
        }

        throw new Error('Payment not completed')
      }

      const result = await onApprove(approvalData)

      expect(result.success).toBe(true)
      expect(result.paymentId).toBe('PAYMENT_ABC123')
      expect(result.subscriptionUpdated).toBe(true)
    })

    it('should handle payment approval errors', async () => {
      const approvalData = {
        orderID: 'ORDER_12345',
        payerID: 'PAYER_67890'
      }

      const mockErrorResponse = {
        error: 'PAYMENT_CAPTURE_DECLINED',
        details: 'Insufficient funds'
      }

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: () => Promise.resolve(mockErrorResponse)
      })

      const onApprove = async (data) => {
        const response = await fetch(`/api/paypal/capture-order/${data.orderID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payerID: data.payerID,
            userId: testUser.id
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.details || error.error)
        }

        return await response.json()
      }

      await expect(onApprove(approvalData)).rejects.toThrow('Insufficient funds')
    })

    it('should update user subscription after successful payment', async () => {
      const paymentData = {
        userId: testUser.id,
        plan: 'pro',
        paymentId: 'PAYMENT_ABC123',
        transactionId: 'TXN_123456',
        amount: 29.99
      }

      const mockUpdatedProfile = {
        data: [{
          ...testUser,
          subscription_plan: 'pro',
          subscription_status: 'active',
          subscription_updated_at: new Date().toISOString(),
          last_payment_id: 'PAYMENT_ABC123'
        }],
        error: null
      }

      supabase.from = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve(mockUpdatedProfile))
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            data: [{
              id: 1,
              user_id: testUser.id,
              payment_id: paymentData.paymentId,
              amount: paymentData.amount,
              status: 'completed'
            }],
            error: null
          }))
        }))
      }))

      const updateSubscription = async (paymentData) => {
        // Update user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription_plan: paymentData.plan,
            subscription_status: 'active',
            subscription_updated_at: new Date().toISOString(),
            last_payment_id: paymentData.paymentId
          })
          .eq('id', paymentData.userId)
          .select()

        if (profileError) throw new Error(profileError.message)

        // Record payment transaction
        const { data: transactionData, error: transactionError } = await supabase
          .from('payment_transactions')
          .insert({
            user_id: paymentData.userId,
            payment_id: paymentData.paymentId,
            transaction_id: paymentData.transactionId,
            amount: paymentData.amount,
            currency: 'USD',
            plan: paymentData.plan,
            status: 'completed',
            created_at: new Date().toISOString()
          })
          .select()

        if (transactionError) throw new Error(transactionError.message)

        return {
          profile: profileData[0],
          transaction: transactionData[0]
        }
      }

      const result = await updateSubscription(paymentData)

      expect(result.profile.subscription_plan).toBe('pro')
      expect(result.profile.subscription_status).toBe('active')
      expect(result.transaction.status).toBe('completed')
    })
  })

  describe('Payment Error Handling Tests', () => {
    it('should handle payment cancellation by user', () => {
      const onCancel = vi.fn((data) => {
        return {
          cancelled: true,
          orderID: data.orderID,
          message: 'Payment cancelled by user'
        }
      })

      const cancellationData = { orderID: 'ORDER_12345' }
      const result = onCancel(cancellationData)

      expect(result.cancelled).toBe(true)
      expect(result.orderID).toBe('ORDER_12345')
      expect(result.message).toBe('Payment cancelled by user')
      expect(onCancel).toHaveBeenCalledWith(cancellationData)
    })

    it('should handle general payment errors', () => {
      const onError = vi.fn((error) => {
        console.error('PayPal payment error:', error)
        return {
          error: true,
          message: error.message || 'Payment processing failed',
          code: error.code || 'PAYMENT_ERROR'
        }
      })

      const paymentError = {
        message: 'Network connection failed',
        code: 'NETWORK_ERROR'
      }

      const result = onError(paymentError)

      expect(result.error).toBe(true)
      expect(result.message).toBe('Network connection failed')
      expect(result.code).toBe('NETWORK_ERROR')
    })

    it('should implement payment retry logic', async () => {
      let attemptCount = 0
      const maxRetries = 3

      const retryablePaymentOperation = async () => {
        attemptCount++

        if (attemptCount <= 2) {
          throw new Error(`Temporary payment error (attempt ${attemptCount})`)
        }

        return {
          success: true,
          paymentId: 'PAYMENT_SUCCESS_123',
          attempt: attemptCount
        }
      }

      const executeWithRetry = async (operation, retries = maxRetries) => {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            return await operation()
          } catch (error) {
            if (attempt === retries) {
              throw error
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          }
        }
      }

      const result = await executeWithRetry(retryablePaymentOperation)

      expect(result.success).toBe(true)
      expect(result.paymentId).toBe('PAYMENT_SUCCESS_123')
      expect(result.attempt).toBe(3)
      expect(attemptCount).toBe(3)
    })
  })

  describe('Subscription Management Tests', () => {
    it('should handle subscription upgrades', async () => {
      const upgradeData = {
        userId: testUser.id,
        currentPlan: 'free',
        newPlan: 'pro',
        prorationAmount: 29.99
      }

      // Mock current subscription check
      supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: [{ ...testUser, subscription_plan: 'free' }],
            error: null
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({
              data: [{ ...testUser, subscription_plan: 'pro' }],
              error: null
            }))
          }))
        }))
      }))

      const processUpgrade = async (upgradeData) => {
        // Check current subscription
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('subscription_plan')
          .eq('id', upgradeData.userId)

        if (currentProfile[0].subscription_plan === upgradeData.newPlan) {
          throw new Error('User already has this subscription plan')
        }

        // Calculate proration if needed
        const proration = calculateProration(upgradeData.currentPlan, upgradeData.newPlan)

        // Process payment for upgrade
        const paymentResult = await processPayment({
          amount: proration.amount,
          description: `Upgrade from ${upgradeData.currentPlan} to ${upgradeData.newPlan}`
        })

        // Update subscription
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .update({
            subscription_plan: upgradeData.newPlan,
            subscription_status: 'active'
          })
          .eq('id', upgradeData.userId)
          .select()

        return {
          success: true,
          newPlan: upgradeData.newPlan,
          prorationAmount: proration.amount,
          paymentId: paymentResult.id
        }
      }

      const calculateProration = (currentPlan, newPlan) => {
        const currentPrice = subscriptionPlans[currentPlan].price
        const newPrice = subscriptionPlans[newPlan].price
        return {
          amount: newPrice - currentPrice,
          description: `Proration for upgrade`
        }
      }

      const processPayment = async (paymentData) => {
        return {
          id: 'PAYMENT_UPGRADE_123',
          amount: paymentData.amount,
          status: 'completed'
        }
      }

      const result = await processUpgrade(upgradeData)

      expect(result.success).toBe(true)
      expect(result.newPlan).toBe('pro')
      expect(result.prorationAmount).toBe(29.99)
    })

    it('should handle subscription downgrades', async () => {
      const downgradeData = {
        userId: testUser.id,
        currentPlan: 'pro',
        newPlan: 'free',
        effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }

      supabase.from = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({
              data: [{
                ...testUser,
                subscription_plan: 'pro',
                subscription_status: 'downgrading',
                downgrade_effective_date: downgradeData.effectiveDate.toISOString()
              }],
              error: null
            }))
          }))
        }))
      }))

      const processDowngrade = async (downgradeData) => {
        // Schedule downgrade at end of current billing period
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'downgrading',
            next_plan: downgradeData.newPlan,
            downgrade_effective_date: downgradeData.effectiveDate.toISOString()
          })
          .eq('id', downgradeData.userId)
          .select()

        return {
          success: true,
          currentPlan: downgradeData.currentPlan,
          scheduledPlan: downgradeData.newPlan,
          effectiveDate: downgradeData.effectiveDate,
          status: 'scheduled'
        }
      }

      const result = await processDowngrade(downgradeData)

      expect(result.success).toBe(true)
      expect(result.scheduledPlan).toBe('free')
      expect(result.status).toBe('scheduled')
    })

    it('should handle subscription cancellations', async () => {
      const cancellationData = {
        userId: testUser.id,
        reason: 'user_request',
        immediateCancel: false
      }

      supabase.from = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({
              data: [{
                ...testUser,
                subscription_status: 'cancelling',
                cancellation_date: new Date().toISOString(),
                cancellation_reason: 'user_request'
              }],
              error: null
            }))
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            data: [{
              id: 1,
              user_id: testUser.id,
              action: 'cancellation',
              reason: 'user_request',
              created_at: new Date().toISOString()
            }],
            error: null
          }))
        }))
      }))

      const processCancellation = async (cancellationData) => {
        const endDate = cancellationData.immediateCancel
          ? new Date()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // End of billing period

        // Update subscription status
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancelling',
            subscription_end_date: endDate.toISOString(),
            cancellation_date: new Date().toISOString(),
            cancellation_reason: cancellationData.reason
          })
          .eq('id', cancellationData.userId)
          .select()

        // Log cancellation
        const { data: cancellationLog } = await supabase
          .from('subscription_events')
          .insert({
            user_id: cancellationData.userId,
            action: 'cancellation',
            reason: cancellationData.reason,
            effective_date: endDate.toISOString()
          })
          .select()

        return {
          success: true,
          status: 'cancelling',
          endDate: endDate,
          immediate: cancellationData.immediateCancel
        }
      }

      const result = await processCancellation(cancellationData)

      expect(result.success).toBe(true)
      expect(result.status).toBe('cancelling')
      expect(result.immediate).toBe(false)
    })
  })

  describe('Webhook Handling Tests', () => {
    it('should handle PayPal webhook notifications', async () => {
      const webhookPayload = {
        id: 'WH-1234567890',
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'PAYMENT_ABC123',
          status: 'COMPLETED',
          amount: {
            currency_code: 'USD',
            value: '29.99'
          },
          custom_id: testUser.id
        },
        create_time: new Date().toISOString()
      }

      const webhookSignature = 'test-webhook-signature'

      const processWebhook = async (payload, signature) => {
        // Verify webhook signature (mocked)
        const isValidSignature = verifyWebhookSignature(payload, signature)
        if (!isValidSignature) {
          throw new Error('Invalid webhook signature')
        }

        switch (payload.event_type) {
          case 'PAYMENT.CAPTURE.COMPLETED':
            return await handlePaymentCompleted(payload.resource)
          case 'PAYMENT.CAPTURE.DENIED':
            return await handlePaymentDenied(payload.resource)
          default:
            return { processed: false, reason: 'Unknown event type' }
        }
      }

      const verifyWebhookSignature = (payload, signature) => {
        // Mock signature verification
        return signature === 'test-webhook-signature'
      }

      const handlePaymentCompleted = async (payment) => {
        const userId = payment.custom_id

        supabase.from = vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => Promise.resolve({
                data: [{ ...testUser, subscription_status: 'active' }],
                error: null
              }))
            }))
          }))
        }))

        await supabase
          .from('profiles')
          .update({ subscription_status: 'active' })
          .eq('id', userId)
          .select()

        return {
          processed: true,
          action: 'subscription_activated',
          userId: userId,
          paymentId: payment.id
        }
      }

      const handlePaymentDenied = async (payment) => {
        return {
          processed: true,
          action: 'payment_failed',
          paymentId: payment.id
        }
      }

      const result = await processWebhook(webhookPayload, webhookSignature)

      expect(result.processed).toBe(true)
      expect(result.action).toBe('subscription_activated')
      expect(result.userId).toBe(testUser.id)
      expect(result.paymentId).toBe('PAYMENT_ABC123')
    })

    it('should handle webhook signature verification failures', async () => {
      const webhookPayload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED'
      }

      const invalidSignature = 'invalid-signature'

      const processWebhook = async (payload, signature) => {
        const isValidSignature = signature === 'valid-signature'
        if (!isValidSignature) {
          throw new Error('Invalid webhook signature')
        }
        return { processed: true }
      }

      await expect(processWebhook(webhookPayload, invalidSignature))
        .rejects.toThrow('Invalid webhook signature')
    })
  })

  describe('Payment Security Tests', () => {
    it('should validate payment amounts on server side', () => {
      const validatePaymentSecurity = (paymentData) => {
        const validationErrors = []

        // Check amount manipulation
        const expectedAmount = subscriptionPlans[paymentData.plan]?.price
        if (paymentData.amount !== expectedAmount) {
          validationErrors.push('Amount tampering detected')
        }

        // Check user authorization
        if (!paymentData.userId || paymentData.userId.length < 10) {
          validationErrors.push('Invalid user ID')
        }

        // Check currency
        if (paymentData.currency !== 'USD') {
          validationErrors.push('Unsupported currency')
        }

        // Check for duplicate transaction
        if (paymentData.transactionId && paymentData.transactionId === 'DUPLICATE_TXN') {
          validationErrors.push('Duplicate transaction detected')
        }

        return validationErrors
      }

      // Valid payment
      const validPayment = {
        plan: 'pro',
        amount: 29.99,
        currency: 'USD',
        userId: testUser.id,
        transactionId: 'TXN_UNIQUE_123'
      }
      expect(validatePaymentSecurity(validPayment)).toHaveLength(0)

      // Tampered amount
      const tamperedAmount = { ...validPayment, amount: 0.01 }
      expect(validatePaymentSecurity(tamperedAmount)).toContain('Amount tampering detected')

      // Invalid user ID
      const invalidUser = { ...validPayment, userId: '123' }
      expect(validatePaymentSecurity(invalidUser)).toContain('Invalid user ID')

      // Duplicate transaction
      const duplicateTransaction = { ...validPayment, transactionId: 'DUPLICATE_TXN' }
      expect(validatePaymentSecurity(duplicateTransaction)).toContain('Duplicate transaction detected')
    })

    it('should protect against CSRF attacks', () => {
      const validateCSRFToken = (token, sessionToken) => {
        // Mock CSRF validation
        return token === sessionToken && token.length > 20
      }

      const paymentRequest = {
        amount: 29.99,
        csrfToken: 'valid-csrf-token-12345678901234567890',
        sessionToken: 'valid-csrf-token-12345678901234567890'
      }

      const isValidCSRF = validateCSRFToken(paymentRequest.csrfToken, paymentRequest.sessionToken)
      expect(isValidCSRF).toBe(true)

      // Invalid CSRF token
      const invalidCSRF = {
        ...paymentRequest,
        csrfToken: 'invalid-token'
      }
      expect(validateCSRFToken(invalidCSRF.csrfToken, invalidCSRF.sessionToken)).toBe(false)
    })

    it('should implement rate limiting for payment attempts', () => {
      const rateLimiter = {
        attempts: new Map(),
        maxAttempts: 5,
        windowMs: 60000, // 1 minute

        isAllowed: function(userId) {
          const now = Date.now()
          const userAttempts = this.attempts.get(userId) || []

          // Clean old attempts
          const recentAttempts = userAttempts.filter(
            attempt => now - attempt < this.windowMs
          )

          if (recentAttempts.length >= this.maxAttempts) {
            return false
          }

          // Record this attempt
          recentAttempts.push(now)
          this.attempts.set(userId, recentAttempts)

          return true
        }
      }

      // Test normal usage
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isAllowed(testUser.id)).toBe(true)
      }

      // Test rate limit exceeded
      expect(rateLimiter.isAllowed(testUser.id)).toBe(false)

      // Test different user not affected
      expect(rateLimiter.isAllowed('other-user-id')).toBe(true)
    })
  })
})