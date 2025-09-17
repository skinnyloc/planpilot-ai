-- Create business_ideas table for storing user business ideas
CREATE TABLE IF NOT EXISTS business_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  summary TEXT NOT NULL,
  problem TEXT,
  solution TEXT,
  industry VARCHAR,
  target_market TEXT,
  business_model TEXT,
  competitive_advantage TEXT,
  funding_needs VARCHAR,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generation_logs table for tracking AI usage
CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type VARCHAR NOT NULL,
  grant_type VARCHAR,
  business_idea_id UUID REFERENCES business_ideas(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  tokens_used INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  generation_params JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add generation metadata to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS generation_metadata JSONB,
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_ideas_user_id ON business_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_business_ideas_created_at ON business_ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_ideas_industry ON business_ideas(industry);

CREATE INDEX IF NOT EXISTS idx_generation_logs_user_id ON generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON generation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_logs_content_type ON generation_logs(content_type);
CREATE INDEX IF NOT EXISTS idx_generation_logs_success ON generation_logs(success);

CREATE INDEX IF NOT EXISTS idx_documents_ai_generated ON documents(ai_generated);
CREATE INDEX IF NOT EXISTS idx_documents_generation_metadata ON documents USING GIN(generation_metadata);

-- Enable Row Level Security (RLS)
ALTER TABLE business_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_ideas
CREATE POLICY "Users can view their own business ideas" ON business_ideas
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own business ideas" ON business_ideas
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own business ideas" ON business_ideas
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own business ideas" ON business_ideas
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- RLS Policies for generation_logs
CREATE POLICY "Users can view their own generation logs" ON generation_logs
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own generation logs" ON generation_logs
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Service role policies for admin operations
CREATE POLICY "Service role can manage all business ideas" ON business_ideas
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all generation logs" ON generation_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at timestamp for business_ideas
CREATE OR REPLACE FUNCTION update_business_ideas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER business_ideas_updated_at
  BEFORE UPDATE ON business_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_business_ideas_updated_at();

-- Function to get user generation statistics
CREATE OR REPLACE FUNCTION get_user_generation_stats(p_user_id VARCHAR)
RETURNS TABLE (
  total_generations BIGINT,
  total_tokens_used BIGINT,
  successful_generations BIGINT,
  content_type_breakdown JSONB,
  recent_generations JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_generations,
    COALESCE(SUM(tokens_used), 0)::BIGINT as total_tokens_used,
    COUNT(*) FILTER (WHERE success = true)::BIGINT as successful_generations,
    COALESCE(
      jsonb_object_agg(
        content_type,
        content_count
      ) FILTER (WHERE content_type IS NOT NULL),
      '{}'::jsonb
    ) as content_type_breakdown,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'content_type', content_type,
          'grant_type', grant_type,
          'tokens_used', tokens_used,
          'success', success,
          'created_at', created_at
        ) ORDER BY created_at DESC
      ) FILTER (WHERE id IS NOT NULL),
      '[]'::jsonb
    ) as recent_generations
  FROM (
    SELECT
      gl.*,
      COUNT(*) OVER (PARTITION BY content_type) as content_count
    FROM generation_logs gl
    WHERE gl.user_id = p_user_id
      AND gl.created_at >= NOW() - INTERVAL '30 days'
    ORDER BY gl.created_at DESC
    LIMIT 20
  ) stats;
END;
$$;

-- Function to check generation limits (example: 100 generations per month for free tier)
CREATE OR REPLACE FUNCTION check_generation_limit(p_user_id VARCHAR, p_plan VARCHAR DEFAULT 'free')
RETURNS TABLE (
  can_generate BOOLEAN,
  current_count BIGINT,
  limit_count BIGINT,
  reset_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  monthly_limit BIGINT;
  current_month_start TIMESTAMP WITH TIME ZONE;
  current_generations BIGINT;
BEGIN
  -- Set limits based on plan
  CASE p_plan
    WHEN 'pro' THEN monthly_limit := 1000;
    WHEN 'free' THEN monthly_limit := 10;
    ELSE monthly_limit := 10;
  END CASE;

  -- Calculate current month start
  current_month_start := date_trunc('month', NOW());

  -- Count generations this month
  SELECT COUNT(*)
  INTO current_generations
  FROM generation_logs
  WHERE user_id = p_user_id
    AND created_at >= current_month_start
    AND success = true;

  RETURN QUERY
  SELECT
    (current_generations < monthly_limit) as can_generate,
    current_generations as current_count,
    monthly_limit as limit_count,
    (current_month_start + INTERVAL '1 month') as reset_date;
END;
$$;

-- Function to mark documents as AI-generated when created from generation API
CREATE OR REPLACE FUNCTION mark_ai_generated_document()
RETURNS TRIGGER AS $$
BEGIN
  -- If generation_metadata is present, mark as AI-generated
  IF NEW.generation_metadata IS NOT NULL THEN
    NEW.ai_generated := TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically mark AI-generated documents
CREATE TRIGGER mark_ai_generated_document_trigger
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION mark_ai_generated_document();

COMMENT ON TABLE business_ideas IS 'User business ideas for AI content generation';
COMMENT ON TABLE generation_logs IS 'Tracks AI content generation usage and analytics';
COMMENT ON FUNCTION get_user_generation_stats IS 'Get comprehensive generation statistics for a user';
COMMENT ON FUNCTION check_generation_limit IS 'Check if user can generate more content based on their plan limits';