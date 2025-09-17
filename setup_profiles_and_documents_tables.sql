-- SQL script to create profiles and documents tables in Supabase
-- Run this in your Supabase SQL Editor

-- =========================================
-- PROFILES TABLE
-- =========================================

-- Create the profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY, -- This will match Clerk user ID
  email TEXT,
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,

  -- Plan information
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  next_billing_date TIMESTAMP WITH TIME ZONE,

  -- Profile metadata
  avatar_url TEXT,
  bio TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);

-- Create trigger for profiles timestamp updates
CREATE OR REPLACE FUNCTION update_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_timestamp_trigger ON profiles;
CREATE TRIGGER update_profiles_timestamp_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_timestamp();

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (id = auth.uid()::TEXT);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid()::TEXT);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid()::TEXT);

-- =========================================
-- DOCUMENTS TABLE
-- =========================================

-- Create the documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,

  -- File information
  original_filename TEXT NOT NULL,
  filename TEXT NOT NULL, -- Stored filename
  file_path TEXT NOT NULL, -- Storage path
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,

  -- Document metadata
  document_type TEXT DEFAULT 'other',
  description TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Storage information
  storage_bucket TEXT DEFAULT 'documents',
  storage_path TEXT,

  -- Access control
  is_public BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_filename ON documents(original_filename);
CREATE INDEX IF NOT EXISTS idx_documents_file_size ON documents(file_size);

-- Create GIN index for tags array
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

-- Create trigger for documents timestamp updates
CREATE OR REPLACE FUNCTION update_documents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_documents_timestamp_trigger ON documents;
CREATE TRIGGER update_documents_timestamp_trigger
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_timestamp();

-- Enable RLS for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for documents
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (user_id = auth.uid()::TEXT);

-- =========================================
-- DEMO DATA (Optional)
-- =========================================

-- Insert demo profile data
INSERT INTO profiles (
  id,
  email,
  username,
  first_name,
  last_name,
  plan,
  status
) VALUES (
  'demo-user-123',
  'demo@example.com',
  'demo-user',
  'Demo',
  'User',
  'free',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  updated_at = NOW();

-- Insert demo documents data (optional)
INSERT INTO documents (
  user_id,
  original_filename,
  filename,
  file_path,
  file_size,
  mime_type,
  document_type,
  description,
  tags
) VALUES (
  'demo-user-123',
  'Sample Business Plan.pdf',
  'sample_business_plan_123.pdf',
  'documents/demo-user-123/sample_business_plan_123.pdf',
  1024000,
  'application/pdf',
  'business_plan',
  'A sample business plan document',
  ARRAY['sample', 'business-plan', 'demo']
), (
  'demo-user-123',
  'Financial Projections.xlsx',
  'financial_projections_456.xlsx',
  'documents/demo-user-123/financial_projections_456.xlsx',
  512000,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'financial_document',
  'Financial projections spreadsheet',
  ARRAY['finance', 'projections', 'demo']
) ON CONFLICT DO NOTHING;