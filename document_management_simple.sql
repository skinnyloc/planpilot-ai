-- Document Management System Setup - Simple Version
-- Run this in Supabase SQL Editor

-- Create document folders table
CREATE TABLE IF NOT EXISTS document_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#6B7280',
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default folders
INSERT INTO document_folders (name, slug, description, icon, color, is_default, sort_order)
VALUES
('Business Ideas', 'business-ideas', 'Initial business concepts and ideas', 'lightbulb', '#F59E0B', TRUE, 1),
('Business Plans', 'business-plans', 'Completed business plans and strategies', 'file-text', '#10B981', TRUE, 2),
('Grant Proposals', 'grant-proposals', 'Generated grant proposals and applications', 'award', '#8B5CF6', TRUE, 3),
('Uploads', 'uploads', 'User uploaded documents and files', 'upload', '#6B7280', TRUE, 4)
ON CONFLICT (slug) DO NOTHING;

-- Add columns to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS parent_document_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS template_category TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_preview TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP WITH TIME ZONE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS shared_token TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS shared_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add foreign key constraints
ALTER TABLE documents ADD CONSTRAINT fk_documents_folder FOREIGN KEY (folder_id) REFERENCES document_folders(id);
ALTER TABLE documents ADD CONSTRAINT fk_documents_parent FOREIGN KEY (parent_document_id) REFERENCES documents(id);

-- Create document shares table
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  shared_by_user_id TEXT NOT NULL,
  shared_with_email TEXT,
  shared_with_user_id TEXT,
  share_token TEXT UNIQUE NOT NULL,
  permissions TEXT[] DEFAULT ARRAY['view'],
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage quotas table
CREATE TABLE IF NOT EXISTS storage_quotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  total_quota BIGINT DEFAULT 1073741824,
  used_storage BIGINT DEFAULT 0,
  document_count INTEGER DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document tags table
CREATE TABLE IF NOT EXISTS document_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, tag_name)
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Document folders viewable by authenticated users" ON document_folders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own documents" ON documents FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own documents" ON documents FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (auth.uid()::text = user_id);

SELECT 'Document management setup completed!' as result;