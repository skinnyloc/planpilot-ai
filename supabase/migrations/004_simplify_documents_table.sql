-- Update documents table to match requirements
-- Add title and storage_key fields if they don't exist

-- Add new columns if they don't exist
DO $$
BEGIN
    -- Add title column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'title') THEN
        ALTER TABLE documents ADD COLUMN title TEXT;
    END IF;

    -- Add storage_key column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'storage_key') THEN
        ALTER TABLE documents ADD COLUMN storage_key TEXT;
    END IF;

    -- Update document_type enum to include needed types
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'document_type') THEN
        ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
        ALTER TABLE documents ADD CONSTRAINT documents_document_type_check
        CHECK (document_type IN (
            'business_plan',
            'letter',
            'proposal',
            'grant_proposal',
            'financial_document',
            'research_document',
            'pitch_deck',
            'contract',
            'legal_document',
            'other'
        ));
    END IF;
END $$;

-- Create index on title for searching
CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title);
CREATE INDEX IF NOT EXISTS idx_documents_storage_key ON documents(storage_key);

-- Update existing documents to have titles based on filename if title is null
UPDATE documents
SET title = COALESCE(original_filename, filename)
WHERE title IS NULL OR title = '';

-- Update existing documents to have storage_key based on file_path if storage_key is null
UPDATE documents
SET storage_key = file_path
WHERE storage_key IS NULL OR storage_key = '';

-- Add NOT NULL constraints for required fields
ALTER TABLE documents ALTER COLUMN title SET NOT NULL;