-- Create documents metadata table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  filename VARCHAR NOT NULL,
  original_filename VARCHAR NOT NULL,
  file_path VARCHAR NOT NULL UNIQUE,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR NOT NULL,
  document_type VARCHAR NOT NULL CHECK (document_type IN (
    'business_plan',
    'grant_proposal',
    'financial_document',
    'research_document',
    'pitch_deck',
    'contract',
    'legal_document',
    'other'
  )),
  tags TEXT[], -- Array of tags for categorization
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_filename ON documents(filename);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

-- Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own documents
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Service role policy for admin operations
CREATE POLICY "Service role can manage all documents" ON documents
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create Storage Bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Users can view own documents in storage" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    (auth.jwt() ->> 'sub') = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can insert own documents in storage" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    (auth.jwt() ->> 'sub') = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own documents in storage" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND
    (auth.jwt() ->> 'sub') = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own documents in storage" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    (auth.jwt() ->> 'sub') = (storage.foldername(name))[1]
  );

-- Service role can manage all storage objects
CREATE POLICY "Service role can manage all storage objects" ON storage.objects
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- Function to clean up storage when document metadata is deleted
CREATE OR REPLACE FUNCTION cleanup_document_storage()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the file from storage when metadata is deleted
  DELETE FROM storage.objects
  WHERE bucket_id = 'documents' AND name = OLD.file_path;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up storage on document deletion
CREATE TRIGGER cleanup_document_storage_trigger
  AFTER DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_document_storage();

-- Function to get user document stats
CREATE OR REPLACE FUNCTION get_user_document_stats(p_user_id VARCHAR)
RETURNS TABLE (
  total_documents BIGINT,
  total_size BIGINT,
  document_types JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_documents,
    COALESCE(SUM(file_size), 0)::BIGINT as total_size,
    COALESCE(
      jsonb_object_agg(
        document_type,
        type_count
      ),
      '{}'::jsonb
    ) as document_types
  FROM (
    SELECT
      document_type,
      COUNT(*)::int as type_count,
      file_size
    FROM documents
    WHERE user_id = p_user_id
    GROUP BY document_type, file_size
  ) stats;
END;
$$;

COMMENT ON TABLE documents IS 'Document metadata and file information';
COMMENT ON FUNCTION cleanup_document_storage IS 'Automatically removes storage objects when document metadata is deleted';
COMMENT ON FUNCTION get_user_document_stats IS 'Get comprehensive document statistics for a user';