-- Expand business_ideas table to match the comprehensive form structure
-- Add new columns for detailed business information

ALTER TABLE business_ideas
ADD COLUMN IF NOT EXISTS business_address JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS years_in_business VARCHAR,
ADD COLUMN IF NOT EXISTS business_stage VARCHAR,
ADD COLUMN IF NOT EXISTS problem_solved TEXT,
ADD COLUMN IF NOT EXISTS business_model TEXT,
ADD COLUMN IF NOT EXISTS revenue_goals JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS team_size VARCHAR,
ADD COLUMN IF NOT EXISTS key_roles TEXT,
ADD COLUMN IF NOT EXISTS funding_status VARCHAR,
ADD COLUMN IF NOT EXISTS marketing_channels TEXT[],
ADD COLUMN IF NOT EXISTS additional_context TEXT,
ADD COLUMN IF NOT EXISTS ready_for_plan BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update trigger to handle last_modified timestamp
CREATE OR REPLACE FUNCTION update_business_ideas_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_modified = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS business_ideas_updated_at ON business_ideas;
CREATE TRIGGER business_ideas_updated_at
  BEFORE UPDATE ON business_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_business_ideas_timestamps();

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_business_ideas_business_stage ON business_ideas(business_stage);
CREATE INDEX IF NOT EXISTS idx_business_ideas_funding_status ON business_ideas(funding_status);
CREATE INDEX IF NOT EXISTS idx_business_ideas_ready_for_plan ON business_ideas(ready_for_plan);
CREATE INDEX IF NOT EXISTS idx_business_ideas_last_modified ON business_ideas(last_modified DESC);

-- Add constraint to ensure business_address is properly formatted
ALTER TABLE business_ideas
ADD CONSTRAINT valid_business_address
CHECK (
  business_address IS NULL OR (
    jsonb_typeof(business_address) = 'object'
  )
);

-- Add constraint to ensure revenue_goals is properly formatted
ALTER TABLE business_ideas
ADD CONSTRAINT valid_revenue_goals
CHECK (
  revenue_goals IS NULL OR (
    jsonb_typeof(revenue_goals) = 'object'
  )
);

-- Function to get business ideas with full details for a user
CREATE OR REPLACE FUNCTION get_user_business_ideas(p_user_id VARCHAR, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  summary TEXT,
  problem TEXT,
  solution TEXT,
  industry VARCHAR,
  business_address JSONB,
  years_in_business VARCHAR,
  business_stage VARCHAR,
  problem_solved TEXT,
  target_market TEXT,
  business_model TEXT,
  competitive_advantage TEXT,
  revenue_goals JSONB,
  team_size VARCHAR,
  key_roles TEXT,
  funding_status VARCHAR,
  funding_needs VARCHAR,
  marketing_channels TEXT[],
  additional_context TEXT,
  tags TEXT[],
  ready_for_plan BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_modified TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bi.id,
    bi.name,
    bi.summary,
    bi.problem,
    bi.solution,
    bi.industry,
    bi.business_address,
    bi.years_in_business,
    bi.business_stage,
    bi.problem_solved,
    bi.target_market,
    bi.business_model,
    bi.competitive_advantage,
    bi.revenue_goals,
    bi.team_size,
    bi.key_roles,
    bi.funding_status,
    bi.funding_needs,
    bi.marketing_channels,
    bi.additional_context,
    bi.tags,
    bi.ready_for_plan,
    bi.created_at,
    bi.updated_at,
    bi.last_modified
  FROM business_ideas bi
  WHERE bi.user_id = p_user_id
  ORDER BY bi.last_modified DESC, bi.created_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_user_business_ideas IS 'Get all business ideas for a user with full details';
COMMENT ON COLUMN business_ideas.business_address IS 'JSON object containing street, city, state, zipCode';
COMMENT ON COLUMN business_ideas.revenue_goals IS 'JSON object containing monthly and yearly revenue goals';
COMMENT ON COLUMN business_ideas.ready_for_plan IS 'Flag indicating if business idea is ready for business plan generation';
COMMENT ON COLUMN business_ideas.last_modified IS 'Timestamp of last modification for sorting and tracking changes';