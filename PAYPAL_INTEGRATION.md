# PayPal Integration Guide

This document describes the complete PayPal checkout and webhook system implementation for PlanPilot Pro subscriptions.

## 🚀 Quick Start

1. **Install Dependencies** (already installed)
   ```bash
   npm install @paypal/paypal-server-sdk @supabase/supabase-js crypto-js @clerk/nextjs
   ```

2. **Configure Environment Variables**
   ```bash
   npm run setup-paypal
   ```
   This will prompt you for your PayPal sandbox credentials and update your `.env.local` file.

3. **Set up Database Tables**
   Run the Supabase migration:
   ```sql
   -- Apply migrations/002_payment_system.sql to your Supabase database
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🔧 System Architecture

### API Routes

#### `/api/checkout` (POST)
- Creates PayPal orders for subscription payments
- Validates user authentication via Clerk
- Supports both monthly ($19.99) and yearly ($199.99) billing cycles
- Returns PayPal order ID for frontend integration

**Request Body:**
```json
{
  "planId": "pro",
  "billingCycle": "monthly" | "yearly"
}
```

**Response:**
```json
{
  "orderId": "PAYPAL_ORDER_ID",
  "status": "CREATED",
  "links": [...]
}
```

#### `/api/webhooks/paypal` (POST)
- Handles PayPal webhook events
- Verifies webhook signatures for security
- Processes payment completions and failures
- Updates user plans in Supabase
- Logs all transactions

**Supported Events:**
- `PAYMENT.CAPTURE.COMPLETED` - Successful payment
- `PAYMENT.CAPTURE.DENIED` - Failed payment
- `PAYMENT.CAPTURE.DECLINED` - Declined payment

### Frontend Components

#### `PayPalButton` Component
Located at: `src/components/PayPalButton.jsx`

**Features:**
- Dynamically loads PayPal SDK
- Handles payment flow (create order, approve, capture)
- Shows loading states and error handling
- Secure payment processing with user feedback

**Usage:**
```jsx
<PayPalButton
  planId="pro"
  billingCycle="monthly"
  onSuccess={handlePaymentSuccess}
  onError={handlePaymentError}
  onCancel={handlePaymentCancel}
/>
```

#### Updated Pricing Page
Located at: `app/pricing/page.jsx`

**New Features:**
- Monthly/yearly billing toggle
- Integrated PayPal Smart Buttons
- Real-time pricing updates
- Sandbox mode indicators removed for production-ready UI

### Database Schema

#### `payment_transactions` Table
Stores all payment records with full audit trail:

```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  payment_id VARCHAR NOT NULL UNIQUE,
  order_id VARCHAR NOT NULL,
  plan_id VARCHAR NOT NULL,
  billing_cycle VARCHAR NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR NOT NULL,
  payment_method VARCHAR DEFAULT 'paypal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `profiles` Table Updates
Extended with subscription management fields:

```sql
ALTER TABLE profiles ADD COLUMN
  plan VARCHAR DEFAULT 'free',
  plan_status VARCHAR DEFAULT 'inactive',
  billing_cycle VARCHAR,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  subscription_started_at TIMESTAMP WITH TIME ZONE
```

### Security Features

#### Webhook Signature Verification
- Validates PayPal webhook signatures using PayPal SDK
- Prevents unauthorized webhook processing
- Configurable via `PAYPAL_WEBHOOK_ID` environment variable

#### Payment Amount Validation
- Server-side validation of payment amounts
- Prevents price manipulation attacks
- Enforces exact pricing match: $19.99 monthly, $199.99 yearly

#### Row Level Security (RLS)
- Users can only access their own payment transactions
- Service role access for webhook processing
- Secure plan upgrade functions

## 🔐 Environment Variables

### Required Variables
```env
# PayPal Configuration (Sandbox)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_SECRET=your_client_secret_here

# Optional for webhook verification
PAYPAL_WEBHOOK_ID=your_webhook_id_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_public_key
CLERK_SECRET_KEY=your_clerk_secret_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:5173
```

## 🔄 Payment Flow

### 1. User Initiates Payment
1. User clicks PayPal button on pricing page
2. Frontend calls `/api/checkout` with plan details
3. Server creates PayPal order with user/plan metadata
4. PayPal SDK renders payment interface

### 2. Payment Processing
1. User completes payment via PayPal
2. PayPal calls our webhook: `/api/webhooks/paypal`
3. Server verifies webhook signature and payment details
4. User plan upgraded in Supabase database
5. Payment transaction logged for audit trail

### 3. Success Handling
1. User redirected to `/payment/success` page
2. Success page shows confirmation and feature access
3. User can navigate to dashboard or start using Pro features

## 🧪 Testing

### PayPal Sandbox Setup
1. Create PayPal Developer account: https://developer.paypal.com/
2. Create sandbox application
3. Note Client ID and Secret
4. Use sandbox test accounts for payments

### Test Payment Flow
1. Run `npm run setup-paypal` to configure credentials
2. Visit `http://localhost:5173/pricing`
3. Click PayPal button
4. Use PayPal sandbox credentials:
   - **Test Buyer:** `sb-buyer@personal.example.com` / `password123`
   - **Test Seller:** Your sandbox business account

### Webhook Testing
1. Install ngrok: `npm install -g ngrok`
2. Expose local webhook: `ngrok http 5173`
3. Configure webhook URL in PayPal Developer dashboard:
   - URL: `https://your-ngrok-url.ngrok.io/api/webhooks/paypal`
   - Events: `PAYMENT.CAPTURE.COMPLETED`

## 🚨 Error Handling

### Payment Failures
- Network errors: Retry mechanism with user feedback
- PayPal API errors: Graceful fallback with error messages
- Authentication errors: Redirect to sign-in

### Webhook Failures
- Invalid signatures: Logged and rejected
- Duplicate payments: Idempotency handling
- Database errors: Comprehensive logging for debugging

### User Experience
- Loading states during payment processing
- Clear error messages for failed payments
- Fallback options for JavaScript-disabled users

## 📊 Monitoring & Analytics

### Transaction Logging
All payment events are logged with:
- User ID and payment details
- Timestamp and status
- Error messages and stack traces
- PayPal order and transaction IDs

### Database Queries
Useful queries for monitoring:

```sql
-- Recent successful payments
SELECT * FROM payment_transactions
WHERE status = 'completed'
ORDER BY created_at DESC LIMIT 10;

-- Active Pro subscribers
SELECT COUNT(*) FROM profiles
WHERE plan = 'pro' AND plan_status = 'active';

-- Payment success rate (last 30 days)
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM payment_transactions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY status;
```

## 🚀 Production Deployment

### Environment Changes
1. Update PayPal environment to 'live' in API routes
2. Use production PayPal credentials
3. Configure production webhook endpoints
4. Set `NODE_ENV=production`

### Security Checklist
- [ ] Enable webhook signature verification
- [ ] Use HTTPS for all endpoints
- [ ] Validate all environment variables are set
- [ ] Enable database RLS policies
- [ ] Monitor payment transaction logs

### Performance Optimization
- PayPal SDK loaded asynchronously
- Database connections pooled
- Error handling prevents user experience degradation
- Retry mechanisms for transient failures

## 📞 Support & Troubleshooting

### Common Issues

**PayPal buttons not loading:**
- Check `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is set
- Verify internet connection for SDK loading
- Check browser console for JavaScript errors

**Webhook not receiving events:**
- Verify webhook URL is publicly accessible
- Check PayPal Developer dashboard webhook configuration
- Ensure webhook signature verification is correct

**Payment completed but plan not upgraded:**
- Check webhook logs for processing errors
- Verify Supabase connection and permissions
- Review payment_transactions table for duplicate entries

### Debug Commands
```bash
# Check PayPal configuration
npm run setup-paypal

# View recent logs (if using PM2 or similar)
pm2 logs

# Test database connection
npm run test-db  # You may need to create this script
```

## 📝 License & Compliance

This integration complies with:
- PayPal Developer Agreement
- PCI DSS requirements (payments handled by PayPal)
- GDPR (transaction data retention policies)
- SOC 2 Type II (Supabase infrastructure)

For production use, ensure compliance with:
- Local payment regulations
- Tax collection requirements
- Data privacy laws
- Financial reporting standards