-- Create comprehensive document storage system
-- This migration creates the documents table and related functionality

-- First, check if documents table already exists and drop it if needed for clean setup
DROP TABLE IF EXISTS documents CASCADE;

-- Create documents table with comprehensive metadata
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_business_idea_id UUID REFERENCES business_ideas(id) ON DELETE SET NULL,
  document_type VARCHAR NOT NULL CHECK (document_type IN ('business_idea', 'business_plan', 'grant_proposal', 'general')),
  filename VARCHAR NOT NULL,
  original_filename VARCHAR NOT NULL,
  file_url VARCHAR NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type VARCHAR,
  r2_key VARCHAR NOT NULL, -- The key used in R2 storage

  -- Document metadata
  title VARCHAR,
  description TEXT,
  tags TEXT[],

  -- Version control
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,

  -- Status tracking
  upload_status VARCHAR DEFAULT 'uploading' CHECK (upload_status IN ('uploading', 'completed', 'failed', 'processing')),
  processing_status VARCHAR DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),

  -- AI generation metadata (if document was AI-generated)
  ai_generated BOOLEAN DEFAULT FALSE,
  generation_metadata JSONB,
  generation_prompt TEXT,

  -- Access control
  is_public BOOLEAN DEFAULT FALSE,
  access_level VARCHAR DEFAULT 'private' CHECK (access_level IN ('private', 'shared', 'public')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create document_shares table for sharing documents with specific users
CREATE TABLE document_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  shared_by_user_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shared_with_user_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_level VARCHAR DEFAULT 'view' CHECK (permission_level IN ('view', 'edit', 'admin')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, shared_with_user_id)
);

-- Create document_folders table for organization
CREATE TABLE document_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  parent_folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
  color VARCHAR DEFAULT '#3B82F6', -- Hex color for folder
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, parent_folder_id, name) -- Prevent duplicate folder names in same location
);

-- Add folder_id to documents table
ALTER TABLE documents ADD COLUMN folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL;

-- Create document_activity_logs table for audit trail
CREATE TABLE document_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR NOT NULL CHECK (action IN ('created', 'viewed', 'downloaded', 'updated', 'deleted', 'shared', 'unshared')),
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX idx_documents_business_idea_id ON documents(original_business_idea_id);
CREATE INDEX idx_documents_upload_status ON documents(upload_status);
CREATE INDEX idx_documents_ai_generated ON documents(ai_generated);
CREATE INDEX idx_documents_folder_id ON documents(folder_id);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_filename_search ON documents USING GIN(to_tsvector('english', filename));
CREATE INDEX idx_documents_title_search ON documents USING GIN(to_tsvector('english', title));

CREATE INDEX idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX idx_document_shares_shared_with ON document_shares(shared_with_user_id);

CREATE INDEX idx_document_folders_user_id ON document_folders(user_id);
CREATE INDEX idx_document_folders_parent ON document_folders(parent_folder_id);

CREATE INDEX idx_document_activity_user_id ON document_activity_logs(user_id);
CREATE INDEX idx_document_activity_document_id ON document_activity_logs(document_id);
CREATE INDEX idx_document_activity_created_at ON document_activity_logs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents table
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (
    user_id = auth.jwt() ->> 'sub' OR
    id IN (
      SELECT document_id FROM document_shares
      WHERE shared_with_user_id = auth.jwt() ->> 'sub'
    ) OR
    is_public = TRUE
  );

CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- RLS Policies for document_shares
CREATE POLICY "Users can view shares for their documents or shares with them" ON document_shares
  FOR SELECT USING (
    shared_by_user_id = auth.jwt() ->> 'sub' OR
    shared_with_user_id = auth.jwt() ->> 'sub'
  );

CREATE POLICY "Users can create shares for their documents" ON document_shares
  FOR INSERT WITH CHECK (
    shared_by_user_id = auth.jwt() ->> 'sub' AND
    EXISTS (SELECT 1 FROM documents WHERE id = document_id AND user_id = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Users can update shares they created" ON document_shares
  FOR UPDATE USING (shared_by_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete shares they created" ON document_shares
  FOR DELETE USING (shared_by_user_id = auth.jwt() ->> 'sub');

-- RLS Policies for document_folders
CREATE POLICY "Users can manage their own folders" ON document_folders
  FOR ALL USING (user_id = auth.jwt() ->> 'sub');

-- RLS Policies for document_activity_logs
CREATE POLICY "Users can view activity logs for their documents" ON document_activity_logs
  FOR SELECT USING (
    user_id = auth.jwt() ->> 'sub' OR
    EXISTS (SELECT 1 FROM documents WHERE id = document_id AND user_id = auth.jwt() ->> 'sub')
  );

CREATE POLICY "System can insert activity logs" ON document_activity_logs
  FOR INSERT WITH CHECK (TRUE);

-- Service role policies for admin operations
CREATE POLICY "Service role can manage all documents" ON documents
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all shares" ON document_shares
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all folders" ON document_folders
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all activity logs" ON document_activity_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamp updates
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_timestamps();

CREATE TRIGGER document_folders_updated_at
  BEFORE UPDATE ON document_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_document_timestamps();

-- Function to log document activity
CREATE OR REPLACE FUNCTION log_document_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the activity
  INSERT INTO document_activity_logs (
    document_id,
    user_id,
    action,
    metadata
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.user_id, OLD.user_id),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'changed_fields', CASE
        WHEN TG_OP = 'UPDATE' THEN (
          SELECT jsonb_object_agg(key, value)
          FROM jsonb_each(to_jsonb(NEW))
          WHERE to_jsonb(NEW) ->> key IS DISTINCT FROM to_jsonb(OLD) ->> key
        )
        ELSE NULL
      END
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for activity logging
CREATE TRIGGER log_document_activity_trigger
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION log_document_activity();

-- Function to get user's document storage stats
CREATE OR REPLACE FUNCTION get_user_storage_stats(p_user_id VARCHAR)
RETURNS TABLE (
  total_documents BIGINT,
  total_size_bytes BIGINT,
  total_size_mb NUMERIC,
  documents_by_type JSONB,
  recent_uploads JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_documents,
    COALESCE(SUM(file_size), 0)::BIGINT as total_size_bytes,
    ROUND(COALESCE(SUM(file_size), 0)::NUMERIC / 1048576, 2) as total_size_mb,
    COALESCE(
      jsonb_object_agg(
        document_type,
        type_count
      ) FILTER (WHERE document_type IS NOT NULL),
      '{}'::jsonb
    ) as documents_by_type,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'filename', filename,
          'document_type', document_type,
          'file_size', file_size,
          'created_at', created_at
        ) ORDER BY created_at DESC
      ) FILTER (WHERE id IS NOT NULL),
      '[]'::jsonb
    ) as recent_uploads
  FROM (
    SELECT
      d.*,
      COUNT(*) OVER (PARTITION BY document_type) as type_count
    FROM documents d
    WHERE d.user_id = p_user_id
      AND d.upload_status = 'completed'
    ORDER BY d.created_at DESC
    LIMIT 20
  ) stats;
END;
$$;

-- Function to clean up orphaned files (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_orphaned_documents()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Delete documents that have been in 'uploading' status for more than 24 hours
  DELETE FROM documents
  WHERE upload_status = 'uploading'
    AND created_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS cleanup_count = ROW_COUNT;

  RETURN cleanup_count;
END;
$$;

-- Function to search documents with full-text search
CREATE OR REPLACE FUNCTION search_user_documents(
  p_user_id VARCHAR,
  p_search_term VARCHAR DEFAULT '',
  p_document_type VARCHAR DEFAULT NULL,
  p_folder_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  filename VARCHAR,
  original_filename VARCHAR,
  title VARCHAR,
  description TEXT,
  document_type VARCHAR,
  file_size INTEGER,
  mime_type VARCHAR,
  tags TEXT[],
  folder_id UUID,
  ai_generated BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  relevance_score REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.filename,
    d.original_filename,
    d.title,
    d.description,
    d.document_type,
    d.file_size,
    d.mime_type,
    d.tags,
    d.folder_id,
    d.ai_generated,
    d.created_at,
    d.updated_at,
    CASE
      WHEN p_search_term = '' THEN 1.0::REAL
      ELSE ts_rank(
        to_tsvector('english', COALESCE(d.title, '') || ' ' || COALESCE(d.filename, '') || ' ' || COALESCE(d.description, '')),
        plainto_tsquery('english', p_search_term)
      )
    END as relevance_score
  FROM documents d
  WHERE d.user_id = p_user_id
    AND d.upload_status = 'completed'
    AND (p_search_term = '' OR (
      to_tsvector('english', COALESCE(d.title, '') || ' ' || COALESCE(d.filename, '') || ' ' || COALESCE(d.description, ''))
      @@ plainto_tsquery('english', p_search_term)
    ))
    AND (p_document_type IS NULL OR d.document_type = p_document_type)
    AND (p_folder_id IS NULL OR d.folder_id = p_folder_id)
  ORDER BY
    CASE WHEN p_search_term = '' THEN d.created_at END DESC,
    CASE WHEN p_search_term != '' THEN relevance_score END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Add comments for documentation
COMMENT ON TABLE documents IS 'Comprehensive document storage with R2 integration and metadata tracking';
COMMENT ON TABLE document_shares IS 'Document sharing system with permission levels';
COMMENT ON TABLE document_folders IS 'Hierarchical folder organization for documents';
COMMENT ON TABLE document_activity_logs IS 'Audit trail for all document operations';

COMMENT ON FUNCTION get_user_storage_stats IS 'Get comprehensive storage statistics for a user';
COMMENT ON FUNCTION cleanup_orphaned_documents IS 'Maintenance function to clean up failed uploads';
COMMENT ON FUNCTION search_user_documents IS 'Full-text search for user documents with filtering';