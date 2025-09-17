-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  payment_id VARCHAR NOT NULL UNIQUE,
  order_id VARCHAR NOT NULL,
  plan_id VARCHAR NOT NULL,
  billing_cycle VARCHAR NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  payment_method VARCHAR NOT NULL DEFAULT 'paypal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Update profiles table to include payment-related fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS plan VARCHAR DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS plan_status VARCHAR DEFAULT 'inactive' CHECK (plan_status IN ('inactive', 'active', 'cancelled', 'expired')),
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR CHECK (billing_cycle IN ('monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_cancelled_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_status ON profiles(plan_status);

-- Enable Row Level Security (RLS)
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_transactions
CREATE POLICY "Users can view their own payment transactions" ON payment_transactions
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

-- Create policy for service role (for webhook processing)
CREATE POLICY "Service role can manage all payment transactions" ON payment_transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create function to update user plan (for webhook)
CREATE OR REPLACE FUNCTION update_user_plan(
  p_user_id VARCHAR,
  p_plan VARCHAR,
  p_plan_status VARCHAR,
  p_billing_cycle VARCHAR,
  p_next_billing_date TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    plan = p_plan,
    plan_status = p_plan_status,
    billing_cycle = p_billing_cycle,
    next_billing_date = p_next_billing_date,
    subscription_started_at = CASE
      WHEN subscription_started_at IS NULL THEN NOW()
      ELSE subscription_started_at
    END,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;

-- Create function to check if user has active pro plan
CREATE OR REPLACE FUNCTION user_has_pro_plan(user_id VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan VARCHAR;
  user_status VARCHAR;
  next_billing TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT plan, plan_status, next_billing_date
  INTO user_plan, user_status, next_billing
  FROM profiles
  WHERE id = user_id;

  -- Check if user has pro plan and it's active and not expired
  RETURN (
    user_plan = 'pro' AND
    user_status = 'active' AND
    (next_billing IS NULL OR next_billing > NOW())
  );
END;
$$;

COMMENT ON TABLE payment_transactions IS 'Stores all payment transactions from PayPal and other payment providers';
COMMENT ON FUNCTION update_user_plan IS 'Updates user plan status after successful payment';
COMMENT ON FUNCTION user_has_pro_plan IS 'Checks if user has an active pro subscription';