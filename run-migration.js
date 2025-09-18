import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('Running documents table migration...');

    // Read the migration SQL
    const migrationSQL = readFileSync('./supabase/migrations/004_simplify_documents_table.sql', 'utf8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('Migration failed:', error);
      // Try individual commands if the stored procedure doesn't exist
      console.log('Trying individual commands...');

      // Add columns manually
      const commands = [
        "ALTER TABLE documents ADD COLUMN IF NOT EXISTS title TEXT;",
        "ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_key TEXT;",
        "CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title);",
        "CREATE INDEX IF NOT EXISTS idx_documents_storage_key ON documents(storage_key);"
      ];

      for (const command of commands) {
        try {
          console.log('Executing:', command);
          const { error: cmdError } = await supabase.rpc('exec_sql', { sql: command });
          if (cmdError) {
            console.log('Command failed (this may be expected):', cmdError.message);
          } else {
            console.log('✅ Command executed successfully');
          }
        } catch (e) {
          console.log('Command error (this may be expected):', e.message);
        }
      }
    } else {
      console.log('✅ Migration completed successfully');
    }

  } catch (error) {
    console.error('Migration error:', error);
  }
}

runMigration();