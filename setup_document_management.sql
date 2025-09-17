-- Enhanced Document Management System Schema
-- Run this in your Supabase SQL Editor (after the grant schema)

-- =========================================
-- DOCUMENT FOLDERS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS document_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL, -- URL-friendly name
  description TEXT,
  icon TEXT DEFAULT 'folder',
  color_code TEXT DEFAULT '#3B82F6',
  parent_folder_id UUID REFERENCES document_folders(id),
  user_id TEXT, -- NULL for system folders, user ID for personal folders
  is_system_folder BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(slug, user_id)
);

-- Insert system folders
INSERT INTO document_folders (name, slug, description, icon, color_code, is_system_folder, sort_order) VALUES
('Business Ideas', 'business-ideas', 'Saved business idea profiles and concepts', 'lightbulb', '#F59E0B', TRUE, 1),
('Business Plans', 'business-plans', 'Generated and uploaded business plans', 'file-text', '#10B981', TRUE, 2),
('Grant Proposals', 'grant-proposals', 'Generated grant proposals and applications', 'award', '#8B5CF6', TRUE, 3),
('Uploads', 'uploads', 'User uploaded documents and files', 'upload', '#6B7280', TRUE, 4);

-- =========================================
-- ENHANCED DOCUMENTS TABLE
-- =========================================

-- Add new columns to existing documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES document_folders(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS parent_document_id UUID REFERENCES documents(id); -- For versions/related docs
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS template_category TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT; -- Document description
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_preview TEXT; -- First 500 chars for search
ALTER TABLE documents ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP WITH TIME ZONE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS shared_token TEXT UNIQUE; -- For secure sharing
ALTER TABLE documents ADD COLUMN IF NOT EXISTS shared_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'; -- Flexible metadata storage

-- =========================================
-- DOCUMENT SHARES TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS document_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  shared_by_user_id TEXT NOT NULL,
  shared_with_email TEXT,
  shared_with_user_id TEXT,
  share_token TEXT UNIQUE NOT NULL,
  permissions TEXT[] DEFAULT ARRAY['view'], -- 'view', 'download', 'comment'
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- DOCUMENT VERSIONS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS document_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  changes_summary TEXT,
  created_by_user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(document_id, version_number)
);

-- =========================================
-- STORAGE QUOTAS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS storage_quotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  total_quota_bytes BIGINT DEFAULT 1073741824, -- 1GB default
  used_bytes BIGINT DEFAULT 0,
  document_count INTEGER DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- DOCUMENT ACTIVITIES TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS document_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'created', 'updated', 'downloaded', 'shared', 'deleted'
  activity_data JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- DOCUMENT TAGS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS document_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color_code TEXT DEFAULT '#6B7280',
  user_id TEXT, -- NULL for system tags
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(name, user_id)
);

-- Insert common system tags
INSERT INTO document_tags (name, color_code, usage_count) VALUES
('Business Plan', '#10B981', 0),
('Grant Proposal', '#8B5CF6', 0),
('Financial', '#F59E0B', 0),
('Marketing', '#EF4444', 0),
('Legal', '#6B7280', 0),
('Template', '#3B82F6', 0),
('Draft', '#F97316', 0),
('Final', '#059669', 0);

-- =========================================
-- DOCUMENT TAG RELATIONSHIPS
-- =========================================

CREATE TABLE IF NOT EXISTS document_tag_relationships (
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES document_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  PRIMARY KEY (document_id, tag_id)
);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- Document folders indexes
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON document_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON document_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_system ON document_folders(is_system_folder);

-- Enhanced documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_shared_token ON documents(shared_token) WHERE shared_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_last_accessed ON documents(last_accessed DESC);
CREATE INDEX IF NOT EXISTS idx_documents_download_count ON documents(download_count DESC);

-- Content search index
CREATE INDEX IF NOT EXISTS idx_documents_content_search ON documents USING GIN(to_tsvector('english',
  COALESCE(original_filename, '') || ' ' ||
  COALESCE(description, '') || ' ' ||
  COALESCE(content_preview, '')
));

-- Document shares indexes
CREATE INDEX IF NOT EXISTS idx_shares_document ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_shares_token ON document_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_shares_user ON document_shares(shared_by_user_id);
CREATE INDEX IF NOT EXISTS idx_shares_active ON document_shares(is_active, expires_at);

-- Storage quotas indexes
CREATE INDEX IF NOT EXISTS idx_quotas_user ON storage_quotas(user_id);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_document ON document_activities(document_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON document_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON document_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_date ON document_activities(created_at DESC);

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_user ON document_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_usage ON document_tags(usage_count DESC);

-- =========================================
-- TRIGGERS AND FUNCTIONS
-- =========================================

-- Function to update storage quota
CREATE OR REPLACE FUNCTION update_storage_quota()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Add to quota
    INSERT INTO storage_quotas (user_id, used_bytes, document_count)
    VALUES (NEW.user_id, NEW.file_size, 1)
    ON CONFLICT (user_id)
    DO UPDATE SET
      used_bytes = storage_quotas.used_bytes + NEW.file_size,
      document_count = storage_quotas.document_count + 1,
      updated_at = NOW();

  ELSIF TG_OP = 'DELETE' THEN
    -- Remove from quota
    UPDATE storage_quotas
    SET
      used_bytes = GREATEST(0, used_bytes - OLD.file_size),
      document_count = GREATEST(0, document_count - 1),
      updated_at = NOW()
    WHERE user_id = OLD.user_id;

  ELSIF TG_OP = 'UPDATE' AND OLD.file_size != NEW.file_size THEN
    -- Update quota for file size change
    UPDATE storage_quotas
    SET
      used_bytes = used_bytes - OLD.file_size + NEW.file_size,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for storage quota updates
DROP TRIGGER IF EXISTS storage_quota_trigger ON documents;
CREATE TRIGGER storage_quota_trigger
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_quota();

-- Function to log document activities
CREATE OR REPLACE FUNCTION log_document_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO document_activities (document_id, user_id, activity_type, activity_data)
    VALUES (NEW.id, NEW.user_id, 'created', jsonb_build_object('filename', NEW.original_filename));

  ELSIF TG_OP = 'UPDATE' THEN
    -- Log significant updates
    IF OLD.original_filename != NEW.original_filename OR OLD.description != NEW.description THEN
      INSERT INTO document_activities (document_id, user_id, activity_type, activity_data)
      VALUES (NEW.id, NEW.user_id, 'updated', jsonb_build_object('changes', 'metadata'));
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO document_activities (document_id, user_id, activity_type, activity_data)
    VALUES (OLD.id, OLD.user_id, 'deleted', jsonb_build_object('filename', OLD.original_filename));
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for activity logging
DROP TRIGGER IF EXISTS document_activity_trigger ON documents;
CREATE TRIGGER document_activity_trigger
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION log_document_activity();

-- Function to update folder timestamps
CREATE OR REPLACE FUNCTION update_document_folders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_document_folders_timestamp_trigger ON document_folders;
CREATE TRIGGER update_document_folders_timestamp_trigger
  BEFORE UPDATE ON document_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_document_folders_timestamp();

-- =========================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================

-- Enable RLS on new tables
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tag_relationships ENABLE ROW LEVEL SECURITY;

-- Folder policies
CREATE POLICY "System folders viewable by everyone" ON document_folders
  FOR SELECT USING (is_system_folder = TRUE);

CREATE POLICY "Users can view their own folders" ON document_folders
  FOR SELECT USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can manage their own folders" ON document_folders
  FOR ALL USING (user_id = auth.uid()::TEXT);

-- Document shares policies
CREATE POLICY "Users can view shares they created" ON document_shares
  FOR SELECT USING (shared_by_user_id = auth.uid()::TEXT);

CREATE POLICY "Users can create shares for their documents" ON document_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE id = document_id AND user_id = auth.uid()::TEXT
    )
  );

-- Storage quotas policies
CREATE POLICY "Users can view their own quota" ON storage_quotas
  FOR SELECT USING (user_id = auth.uid()::TEXT);

-- Activities policies
CREATE POLICY "Users can view their document activities" ON document_activities
  FOR SELECT USING (user_id = auth.uid()::TEXT);

-- Tags policies
CREATE POLICY "System tags viewable by everyone" ON document_tags
  FOR SELECT USING (user_id IS NULL);

CREATE POLICY "Users can view their own tags" ON document_tags
  FOR SELECT USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can manage their own tags" ON document_tags
  FOR ALL USING (user_id = auth.uid()::TEXT);

-- Tag relationships policies
CREATE POLICY "Users can manage tags for their documents" ON document_tag_relationships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE id = document_id AND user_id = auth.uid()::TEXT
    )
  );

-- =========================================
-- UTILITY FUNCTIONS
-- =========================================

-- Function to get user storage usage
CREATE OR REPLACE FUNCTION get_user_storage_usage(target_user_id TEXT)
RETURNS TABLE (
  total_quota_bytes BIGINT,
  used_bytes BIGINT,
  document_count INTEGER,
  percentage_used DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sq.total_quota_bytes,
    sq.used_bytes,
    sq.document_count,
    ROUND((sq.used_bytes::DECIMAL / sq.total_quota_bytes::DECIMAL) * 100, 2) as percentage_used
  FROM storage_quotas sq
  WHERE sq.user_id = target_user_id;

  -- Create quota record if it doesn't exist
  IF NOT FOUND THEN
    INSERT INTO storage_quotas (user_id) VALUES (target_user_id);
    RETURN QUERY
    SELECT
      sq.total_quota_bytes,
      sq.used_bytes,
      sq.document_count,
      0.00::DECIMAL(5,2) as percentage_used
    FROM storage_quotas sq
    WHERE sq.user_id = target_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search documents with content
CREATE OR REPLACE FUNCTION search_user_documents(
  target_user_id TEXT,
  search_term TEXT DEFAULT '',
  folder_filter UUID DEFAULT NULL,
  tag_filter TEXT DEFAULT NULL,
  sort_by TEXT DEFAULT 'created_at',
  sort_order TEXT DEFAULT 'desc',
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  original_filename TEXT,
  description TEXT,
  file_size INTEGER,
  folder_name TEXT,
  tag_names TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  match_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  EXECUTE format('
    SELECT
      d.id,
      d.original_filename,
      d.description,
      d.file_size,
      df.name as folder_name,
      ARRAY_AGG(dt.name) FILTER (WHERE dt.name IS NOT NULL) as tag_names,
      d.created_at,
      d.updated_at,
      CASE
        WHEN $2 = '''' THEN 1.0
        ELSE ts_rank(
          to_tsvector(''english'',
            COALESCE(d.original_filename, '''') || '' '' ||
            COALESCE(d.description, '''') || '' '' ||
            COALESCE(d.content_preview, '''')
          ),
          plainto_tsquery(''english'', $2)
        )
      END as match_rank
    FROM documents d
    LEFT JOIN document_folders df ON d.folder_id = df.id
    LEFT JOIN document_tag_relationships dtr ON d.id = dtr.document_id
    LEFT JOIN document_tags dt ON dtr.tag_id = dt.id
    WHERE
      d.user_id = $1
      AND ($3 IS NULL OR d.folder_id = $3)
      AND ($4 IS NULL OR dt.name = $4)
      AND (
        $2 = '''' OR
        to_tsvector(''english'',
          COALESCE(d.original_filename, '''') || '' '' ||
          COALESCE(d.description, '''') || '' '' ||
          COALESCE(d.content_preview, '''')
        ) @@ plainto_tsquery(''english'', $2)
      )
    GROUP BY d.id, df.name
    ORDER BY %I %s
    LIMIT $7 OFFSET $8
  ', sort_by, sort_order)
  USING target_user_id, search_term, folder_filter, tag_filter, sort_by, sort_order, limit_count, offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;