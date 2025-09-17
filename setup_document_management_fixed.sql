-- =========================================
-- DOCUMENT MANAGEMENT SYSTEM SETUP
-- Fixed version with better error handling
-- =========================================

-- =========================================
-- DOCUMENT FOLDERS TABLE
-- =========================================

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

-- =========================================
-- CHECK AND ADD COLUMNS TO DOCUMENTS TABLE
-- =========================================

-- Check if description column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'description'
    ) THEN
        ALTER TABLE documents ADD COLUMN description TEXT;
    END IF;
END $$;

-- Add other new columns safely
DO $$
BEGIN
    -- folder_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'folder_id'
    ) THEN
        ALTER TABLE documents ADD COLUMN folder_id UUID REFERENCES document_folders(id);
    END IF;

    -- parent_document_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'parent_document_id'
    ) THEN
        ALTER TABLE documents ADD COLUMN parent_document_id UUID REFERENCES documents(id);
    END IF;

    -- version_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'version_number'
    ) THEN
        ALTER TABLE documents ADD COLUMN version_number INTEGER DEFAULT 1;
    END IF;

    -- is_template
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'is_template'
    ) THEN
        ALTER TABLE documents ADD COLUMN is_template BOOLEAN DEFAULT FALSE;
    END IF;

    -- template_category
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'template_category'
    ) THEN
        ALTER TABLE documents ADD COLUMN template_category TEXT;
    END IF;

    -- content_preview
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'content_preview'
    ) THEN
        ALTER TABLE documents ADD COLUMN content_preview TEXT;
    END IF;

    -- thumbnail_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'thumbnail_url'
    ) THEN
        ALTER TABLE documents ADD COLUMN thumbnail_url TEXT;
    END IF;

    -- download_count
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'download_count'
    ) THEN
        ALTER TABLE documents ADD COLUMN download_count INTEGER DEFAULT 0;
    END IF;

    -- last_accessed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'last_accessed'
    ) THEN
        ALTER TABLE documents ADD COLUMN last_accessed TIMESTAMP WITH TIME ZONE;
    END IF;

    -- shared_token
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'shared_token'
    ) THEN
        ALTER TABLE documents ADD COLUMN shared_token TEXT UNIQUE;
    END IF;

    -- shared_expires_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'shared_expires_at'
    ) THEN
        ALTER TABLE documents ADD COLUMN shared_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- metadata
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE documents ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

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
  permissions TEXT[] DEFAULT ARRAY['view'],
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
  file_size BIGINT NOT NULL,
  content_hash TEXT,
  changes_description TEXT,
  created_by_user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, version_number)
);

-- =========================================
-- STORAGE QUOTAS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS storage_quotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  total_quota BIGINT DEFAULT 1073741824, -- 1GB default
  used_storage BIGINT DEFAULT 0,
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
  activity_type TEXT NOT NULL, -- 'upload', 'download', 'share', 'edit', 'delete'
  activity_description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- DOCUMENT TAGS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS document_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, tag_name)
);

-- =========================================
-- CREATE INDEXES (SAFELY)
-- =========================================

-- Drop existing indexes if they exist to avoid conflicts
DROP INDEX IF EXISTS idx_documents_user_id;
DROP INDEX IF EXISTS idx_documents_folder_id;
DROP INDEX IF EXISTS idx_documents_created_at;
DROP INDEX IF EXISTS idx_documents_file_size;
DROP INDEX IF EXISTS idx_documents_download_count;
DROP INDEX IF EXISTS idx_documents_content_search;

-- Documents table indexes
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_folder_id ON documents(folder_id);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_file_size ON documents(file_size DESC);
CREATE INDEX idx_documents_download_count ON documents(download_count DESC);

-- Content search index (only if all columns exist)
CREATE INDEX idx_documents_content_search ON documents USING GIN(to_tsvector('english',
  COALESCE(original_filename, '') || ' ' ||
  COALESCE(description, '') || ' ' ||
  COALESCE(content_preview, '')
));

-- Document shares indexes
CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_token ON document_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_by ON document_shares(shared_by_user_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_expires_at ON document_shares(expires_at);

-- Document versions indexes
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON document_versions(created_at DESC);

-- Storage quotas indexes
CREATE INDEX IF NOT EXISTS idx_storage_quotas_user_id ON storage_quotas(user_id);

-- Document activities indexes
CREATE INDEX IF NOT EXISTS idx_document_activities_document_id ON document_activities(document_id);
CREATE INDEX IF NOT EXISTS idx_document_activities_user_id ON document_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_document_activities_created_at ON document_activities(created_at DESC);

-- Document tags indexes
CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_name ON document_tags(tag_name);

-- =========================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================

-- Enable RLS on all tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;

-- Document folders policies (readable by all authenticated users)
CREATE POLICY "Document folders are viewable by authenticated users" ON document_folders
    FOR SELECT USING (auth.role() = 'authenticated');

-- Documents policies
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own documents" ON documents
    FOR DELETE USING (auth.uid()::text = user_id);

-- Document shares policies
CREATE POLICY "Users can view shares they created" ON document_shares
    FOR SELECT USING (auth.uid()::text = shared_by_user_id);

CREATE POLICY "Users can create shares for their documents" ON document_shares
    FOR INSERT WITH CHECK (
        auth.uid()::text = shared_by_user_id AND
        EXISTS (SELECT 1 FROM documents WHERE id = document_id AND user_id = auth.uid()::text)
    );

CREATE POLICY "Users can update their shares" ON document_shares
    FOR UPDATE USING (auth.uid()::text = shared_by_user_id);

CREATE POLICY "Users can delete their shares" ON document_shares
    FOR DELETE USING (auth.uid()::text = shared_by_user_id);

-- Document versions policies
CREATE POLICY "Users can view versions of their documents" ON document_versions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM documents WHERE id = document_id AND user_id = auth.uid()::text)
    );

CREATE POLICY "Users can create versions for their documents" ON document_versions
    FOR INSERT WITH CHECK (
        auth.uid()::text = created_by_user_id AND
        EXISTS (SELECT 1 FROM documents WHERE id = document_id AND user_id = auth.uid()::text)
    );

-- Storage quotas policies
CREATE POLICY "Users can view own storage quota" ON storage_quotas
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own storage quota" ON storage_quotas
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Document activities policies
CREATE POLICY "Users can view activities for their documents" ON document_activities
    FOR SELECT USING (
        auth.uid()::text = user_id OR
        EXISTS (SELECT 1 FROM documents WHERE id = document_id AND user_id = auth.uid()::text)
    );

CREATE POLICY "System can insert document activities" ON document_activities
    FOR INSERT WITH CHECK (true);

-- Document tags policies
CREATE POLICY "Users can view tags for their documents" ON document_tags
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM documents WHERE id = document_id AND user_id = auth.uid()::text)
    );

CREATE POLICY "Users can create tags for their documents" ON document_tags
    FOR INSERT WITH CHECK (
        auth.uid()::text = created_by_user_id AND
        EXISTS (SELECT 1 FROM documents WHERE id = document_id AND user_id = auth.uid()::text)
    );

CREATE POLICY "Users can delete tags from their documents" ON document_tags
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM documents WHERE id = document_id AND user_id = auth.uid()::text)
    );

-- =========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =========================================

-- Function to update storage quotas
CREATE OR REPLACE FUNCTION update_storage_quota()
RETURNS TRIGGER AS $$
BEGIN
    -- Update storage quota when documents are added/removed/updated
    IF TG_OP = 'INSERT' THEN
        INSERT INTO storage_quotas (user_id, used_storage, document_count)
        VALUES (NEW.user_id, NEW.file_size, 1)
        ON CONFLICT (user_id) DO UPDATE SET
            used_storage = storage_quotas.used_storage + NEW.file_size,
            document_count = storage_quotas.document_count + 1,
            last_calculated = NOW(),
            updated_at = NOW();
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE storage_quotas SET
            used_storage = GREATEST(0, used_storage - OLD.file_size),
            document_count = GREATEST(0, document_count - 1),
            last_calculated = NOW(),
            updated_at = NOW()
        WHERE user_id = OLD.user_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE storage_quotas SET
            used_storage = used_storage - OLD.file_size + NEW.file_size,
            last_calculated = NOW(),
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_storage_quota ON documents;
CREATE TRIGGER trigger_update_storage_quota
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_storage_quota();

-- Function to log document activities
CREATE OR REPLACE FUNCTION log_document_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO document_activities (document_id, user_id, activity_type, activity_description)
        VALUES (NEW.id, NEW.user_id, 'upload', 'Document uploaded: ' || NEW.original_filename);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO document_activities (document_id, user_id, activity_type, activity_description)
        VALUES (OLD.id, OLD.user_id, 'delete', 'Document deleted: ' || OLD.original_filename);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create activity logging trigger
DROP TRIGGER IF EXISTS trigger_log_document_activity ON documents;
CREATE TRIGGER trigger_log_document_activity
    AFTER INSERT OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION log_document_activity();

-- Success message
SELECT 'Document management system setup completed successfully!' as result;