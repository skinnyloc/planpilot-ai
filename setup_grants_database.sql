-- Comprehensive Grant Database Schema
-- Run this in your Supabase SQL Editor

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS grant_applications CASCADE;
DROP TABLE IF EXISTS grant_analytics CASCADE;
DROP TABLE IF EXISTS grants CASCADE;
DROP TABLE IF EXISTS grant_categories CASCADE;
DROP TABLE IF EXISTS grant_sources CASCADE;

-- =========================================
-- GRANT SOURCES TABLE
-- =========================================

CREATE TABLE grant_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'api', 'scraper', 'manual'
  base_url TEXT,
  api_key_required BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'error'
  error_message TEXT,
  total_grants INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default grant sources
INSERT INTO grant_sources (name, type, base_url, api_key_required) VALUES
('Grants.gov', 'api', 'https://www.grants.gov/grantsws/rest', TRUE),
('SBA Grants', 'scraper', 'https://www.sba.gov/funding-programs/grants', FALSE),
('USDA Rural Development', 'scraper', 'https://www.rd.usda.gov/programs-services', FALSE),
('NSF Grants', 'api', 'https://www.research.gov/common/webapi', TRUE),
('Manual Entry', 'manual', NULL, FALSE);

-- =========================================
-- GRANT CATEGORIES TABLE
-- =========================================

CREATE TABLE grant_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_category_id UUID REFERENCES grant_categories(id),
  color_code TEXT DEFAULT '#3B82F6',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO grant_categories (name, description, color_code, icon) VALUES
('Federal', 'Federal government grants', '#1F2937', 'flag'),
('State', 'State-level grants and funding', '#059669', 'map'),
('Local', 'City and county grants', '#7C3AED', 'home'),
('Private', 'Private foundation and corporate grants', '#DC2626', 'briefcase'),
('Technology', 'Technology and innovation grants', '#2563EB', 'cpu'),
('Agriculture', 'Agricultural and rural development grants', '#16A34A', 'leaf'),
('Healthcare', 'Healthcare and medical research grants', '#DC2626', 'heart'),
('Education', 'Educational grants and programs', '#CA8A04', 'book'),
('Environment', 'Environmental and sustainability grants', '#059669', 'tree'),
('Small Business', 'Small business development grants', '#7C2D12', 'store'),
('Research', 'Research and development grants', '#5B21B6', 'microscope'),
('Minority/Women Owned', 'Grants for minority and women-owned businesses', '#BE185D', 'users');

-- =========================================
-- GRANTS TABLE (Main table)
-- =========================================

CREATE TABLE grants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Basic Information
  title TEXT NOT NULL,
  description TEXT,
  summary TEXT, -- Short summary for listings

  -- Grant Details
  grant_number TEXT UNIQUE, -- Official grant number (e.g., from grants.gov)
  agency TEXT NOT NULL,
  program_name TEXT,
  cfda_number TEXT, -- Catalog of Federal Domestic Assistance number

  -- Financial Information
  min_amount INTEGER, -- Minimum award amount
  max_amount INTEGER, -- Maximum award amount
  total_funding_available INTEGER,
  estimated_awards INTEGER, -- Number of awards expected

  -- Timing
  open_date DATE,
  close_date DATE,
  application_deadline TIMESTAMP WITH TIME ZONE,
  project_start_date DATE,
  project_end_date DATE,

  -- Eligibility
  eligible_applicants TEXT[], -- Array of eligible applicant types
  geographic_scope TEXT[], -- Geographic restrictions
  industry_focus TEXT[], -- Target industries
  business_stages TEXT[], -- Startup, growth, etc.
  employee_count_min INTEGER,
  employee_count_max INTEGER,
  annual_revenue_min INTEGER,
  annual_revenue_max INTEGER,

  -- Requirements
  matching_funds_required BOOLEAN DEFAULT FALSE,
  matching_funds_percentage DECIMAL(5,2),
  cost_sharing_required BOOLEAN DEFAULT FALSE,
  requirements TEXT[], -- Array of specific requirements
  restrictions TEXT[], -- Array of restrictions

  -- Application Process
  application_method TEXT, -- 'online', 'paper', 'email'
  application_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Metadata
  source_id UUID REFERENCES grant_sources(id),
  category_id UUID REFERENCES grant_categories(id),
  tags TEXT[] DEFAULT '{}',
  keywords TEXT[], -- For search optimization

  -- Status and Quality
  status TEXT DEFAULT 'active', -- 'active', 'closed', 'suspended', 'draft'
  verification_status TEXT DEFAULT 'unverified', -- 'verified', 'unverified', 'needs_review'
  competitiveness_level TEXT, -- 'very_high', 'high', 'medium', 'low'
  success_rate DECIMAL(5,2), -- Historical success rate percentage

  -- Content Analysis
  ai_analysis JSONB, -- Store AI analysis of grant content
  match_keywords TEXT[], -- Keywords for matching algorithm

  -- Tracking
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  last_scraped TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- GRANT APPLICATIONS TRACKING
-- =========================================

CREATE TABLE grant_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Links to Clerk user ID
  grant_id UUID REFERENCES grants(id) ON DELETE CASCADE,

  -- Application Details
  application_status TEXT DEFAULT 'interested', -- 'interested', 'started', 'submitted', 'awarded', 'rejected'
  application_date TIMESTAMP WITH TIME ZONE,
  submission_date TIMESTAMP WITH TIME ZONE,
  decision_date TIMESTAMP WITH TIME ZONE,
  award_amount INTEGER,

  -- Tracking
  notes TEXT,
  documents_uploaded INTEGER DEFAULT 0,
  proposal_generated BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, grant_id)
);

-- =========================================
-- GRANT ANALYTICS
-- =========================================

CREATE TABLE grant_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grant_id UUID REFERENCES grants(id) ON DELETE CASCADE,

  -- Analytics Data
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  matches INTEGER DEFAULT 0,
  applications_started INTEGER DEFAULT 0,
  proposals_generated INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(grant_id, date)
);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- Grants table indexes
CREATE INDEX IF NOT EXISTS idx_grants_status ON grants(status);
CREATE INDEX IF NOT EXISTS idx_grants_category ON grants(category_id);
CREATE INDEX IF NOT EXISTS idx_grants_agency ON grants(agency);
CREATE INDEX IF NOT EXISTS idx_grants_deadline ON grants(application_deadline);
CREATE INDEX IF NOT EXISTS idx_grants_amount ON grants(max_amount);
CREATE INDEX IF NOT EXISTS idx_grants_created ON grants(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grants_updated ON grants(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_grants_source ON grants(source_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_grants_title_search ON grants USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_grants_description_search ON grants USING GIN(to_tsvector('english', description));

-- Array indexes for eligibility
CREATE INDEX IF NOT EXISTS idx_grants_eligible_applicants ON grants USING GIN(eligible_applicants);
CREATE INDEX IF NOT EXISTS idx_grants_industry_focus ON grants USING GIN(industry_focus);
CREATE INDEX IF NOT EXISTS idx_grants_tags ON grants USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_grants_keywords ON grants USING GIN(keywords);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_user ON grant_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_grant ON grant_applications(grant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON grant_applications(application_status);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_grant_date ON grant_analytics(grant_id, date);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON grant_analytics(date DESC);

-- =========================================
-- TRIGGERS FOR TIMESTAMP UPDATES
-- =========================================

-- Grant sources trigger
CREATE OR REPLACE FUNCTION update_grant_sources_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_grant_sources_timestamp_trigger ON grant_sources;
CREATE TRIGGER update_grant_sources_timestamp_trigger
  BEFORE UPDATE ON grant_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_grant_sources_timestamp();

-- Grants trigger
CREATE OR REPLACE FUNCTION update_grants_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_grants_timestamp_trigger ON grants;
CREATE TRIGGER update_grants_timestamp_trigger
  BEFORE UPDATE ON grants
  FOR EACH ROW
  EXECUTE FUNCTION update_grants_timestamp();

-- Applications trigger
CREATE OR REPLACE FUNCTION update_applications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_applications_timestamp_trigger ON grant_applications;
CREATE TRIGGER update_applications_timestamp_trigger
  BEFORE UPDATE ON grant_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_applications_timestamp();

-- =========================================
-- ROW LEVEL SECURITY
-- =========================================

-- Enable RLS
ALTER TABLE grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_sources ENABLE ROW LEVEL SECURITY;

-- Public read access for grants (anyone can view grants)
CREATE POLICY "Grants are viewable by everyone" ON grants
  FOR SELECT USING (true);

-- Categories are viewable by everyone
CREATE POLICY "Categories are viewable by everyone" ON grant_categories
  FOR SELECT USING (true);

-- Sources are viewable by everyone
CREATE POLICY "Sources are viewable by everyone" ON grant_sources
  FOR SELECT USING (true);

-- Applications - users can only see their own
CREATE POLICY "Users can view their own applications" ON grant_applications
  FOR SELECT USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can insert their own applications" ON grant_applications
  FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can update their own applications" ON grant_applications
  FOR UPDATE USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can delete their own applications" ON grant_applications
  FOR DELETE USING (user_id = auth.uid()::TEXT);

-- Analytics - read-only for authenticated users
CREATE POLICY "Analytics are viewable by authenticated users" ON grant_analytics
  FOR SELECT USING (auth.role() = 'authenticated');

-- =========================================
-- FUNCTIONS FOR GRANT MANAGEMENT
-- =========================================

-- Function to update grant view count
CREATE OR REPLACE FUNCTION increment_grant_views(grant_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE grants
  SET view_count = view_count + 1
  WHERE id = grant_uuid;

  -- Also update analytics
  INSERT INTO grant_analytics (grant_id, date, views)
  VALUES (grant_uuid, CURRENT_DATE, 1)
  ON CONFLICT (grant_id, date)
  DO UPDATE SET views = grant_analytics.views + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to search grants
CREATE OR REPLACE FUNCTION search_grants(
  search_term TEXT DEFAULT '',
  category_filter UUID DEFAULT NULL,
  max_amount_filter INTEGER DEFAULT NULL,
  deadline_filter DATE DEFAULT NULL,
  status_filter TEXT DEFAULT 'active'
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  agency TEXT,
  max_amount INTEGER,
  application_deadline TIMESTAMP WITH TIME ZONE,
  category_name TEXT,
  match_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.title,
    g.description,
    g.agency,
    g.max_amount,
    g.application_deadline,
    gc.name as category_name,
    CASE
      WHEN search_term = '' THEN 1.0
      ELSE ts_rank(
        to_tsvector('english', g.title || ' ' || COALESCE(g.description, '') || ' ' || g.agency),
        plainto_tsquery('english', search_term)
      )
    END as match_rank
  FROM grants g
  LEFT JOIN grant_categories gc ON g.category_id = gc.id
  WHERE
    g.status = status_filter
    AND (category_filter IS NULL OR g.category_id = category_filter)
    AND (max_amount_filter IS NULL OR g.max_amount <= max_amount_filter)
    AND (deadline_filter IS NULL OR g.application_deadline >= deadline_filter::timestamp)
    AND (
      search_term = '' OR
      to_tsvector('english', g.title || ' ' || COALESCE(g.description, '') || ' ' || g.agency) @@ plainto_tsquery('english', search_term)
    )
  ORDER BY
    match_rank DESC,
    g.application_deadline ASC NULLS LAST,
    g.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- SAMPLE DATA
-- =========================================

-- Get category IDs for sample data
DO $$
DECLARE
  federal_cat_id UUID;
  tech_cat_id UUID;
  small_biz_cat_id UUID;
  research_cat_id UUID;
  agriculture_cat_id UUID;
BEGIN
  SELECT id INTO federal_cat_id FROM grant_categories WHERE name = 'Federal';
  SELECT id INTO tech_cat_id FROM grant_categories WHERE name = 'Technology';
  SELECT id INTO small_biz_cat_id FROM grant_categories WHERE name = 'Small Business';
  SELECT id INTO research_cat_id FROM grant_categories WHERE name = 'Research';
  SELECT id INTO agriculture_cat_id FROM grant_categories WHERE name = 'Agriculture';

  -- Insert sample grants
  INSERT INTO grants (
    title, description, summary, grant_number, agency, min_amount, max_amount,
    application_deadline, category_id, eligible_applicants, industry_focus,
    business_stages, tags, competitiveness_level, success_rate, status,
    application_url
  ) VALUES
  (
    'SBIR Phase I Technology Development Grant',
    'The Small Business Innovation Research (SBIR) program supports small businesses in developing innovative technologies with strong commercial potential. Phase I focuses on establishing technical merit and feasibility of proposed research or R&D efforts.',
    'Support for small businesses developing innovative technologies',
    'SBIR-24-001',
    'Small Business Administration',
    50000,
    256000,
    '2024-03-15 23:59:59'::timestamp,
    tech_cat_id,
    ARRAY['Small Business', 'For-profit'],
    ARRAY['Technology', 'Biotechnology', 'Manufacturing', 'Healthcare'],
    ARRAY['Startup', 'Early-stage'],
    ARRAY['technology', 'innovation', 'research', 'development', 'sbir'],
    'high',
    15.5,
    'active',
    'https://www.sbir.gov/apply'
  ),
  (
    'Rural Business Development Grant',
    'USDA Rural Development provides grants to support business development in rural communities. Focus on projects that create jobs, stimulate economic growth, and improve quality of life in rural America.',
    'Support for businesses in rural communities',
    'RD-BDG-2024-02',
    'USDA Rural Development',
    10000,
    500000,
    '2024-04-01 17:00:00'::timestamp,
    agriculture_cat_id,
    ARRAY['Small Business', 'Non-profit', 'Government'],
    ARRAY['Agriculture', 'Manufacturing', 'Technology', 'Tourism'],
    ARRAY['Startup', 'Growth', 'Expansion'],
    ARRAY['rural', 'agriculture', 'community-development', 'jobs'],
    'medium',
    25.0,
    'active',
    'https://www.rd.usda.gov/programs-services/business-programs'
  ),
  (
    'Advanced Manufacturing Technology Initiative',
    'Department of Commerce grant supporting advanced manufacturing technologies, Industry 4.0 adoption, and supply chain resilience. Preference for projects involving AI, IoT, and automation.',
    'Advanced manufacturing and Industry 4.0 grants',
    'NIST-AMT-2024-03',
    'Department of Commerce - NIST',
    100000,
    2000000,
    '2024-05-30 23:59:59'::timestamp,
    tech_cat_id,
    ARRAY['Small Business', 'Medium Business', 'Large Business'],
    ARRAY['Manufacturing', 'Technology', 'Automation'],
    ARRAY['Growth', 'Expansion'],
    ARRAY['manufacturing', 'technology', 'automation', 'industry4.0'],
    'high',
    12.0,
    'active',
    'https://www.nist.gov/mep/grants'
  );
END $$;