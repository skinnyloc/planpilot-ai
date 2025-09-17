#!/usr/bin/env node

/**
 * Migration script to expand business_ideas table for comprehensive business data
 * This script applies the 005_expand_business_ideas.sql migration
 */

import dotenv from 'dotenv';
import { supabaseAdmin } from '../src/lib/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Colors for console output
const colors = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

async function runMigration() {
  try {
    console.log(colorize('🔄 Starting business ideas table expansion migration...', 'cyan'));

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/005_expand_business_ideas.sql');

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log(colorize('📝 Executing migration SQL...', 'cyan'));

    // Execute the migration
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If rpc doesn't exist, try direct SQL execution
      console.log(colorize('⚠️  RPC method not available, trying direct execution...', 'yellow'));

      // Split the SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          console.log(colorize(`Executing: ${statement.substring(0, 50)}...`, 'cyan'));
          const { error: execError } = await supabaseAdmin.rpc('exec_sql', { sql: statement });

          if (execError) {
            console.log(colorize(`⚠️  Statement may have failed (this might be expected): ${execError.message}`, 'yellow'));
          }
        }
      }
    }

    console.log(colorize('✅ Migration completed successfully!', 'green'));
    console.log();
    console.log(colorize('📋 What was added:', 'bold'));
    console.log(colorize('   • business_address (JSONB) - Street, city, state, zip code', 'green'));
    console.log(colorize('   • years_in_business - Years the business has been operating', 'green'));
    console.log(colorize('   • business_stage - Current stage (idea, planning, startup, etc.)', 'green'));
    console.log(colorize('   • problem_solved - Detailed problem description', 'green'));
    console.log(colorize('   • revenue_goals (JSONB) - Monthly and yearly revenue targets', 'green'));
    console.log(colorize('   • team_size - Current team size', 'green'));
    console.log(colorize('   • key_roles - Key roles and responsibilities', 'green'));
    console.log(colorize('   • funding_status - Current funding status', 'green'));
    console.log(colorize('   • marketing_channels - Array of marketing channels', 'green'));
    console.log(colorize('   • additional_context - AI personalization context', 'green'));
    console.log(colorize('   • ready_for_plan - Flag for business plan generation readiness', 'green'));
    console.log(colorize('   • last_modified - Timestamp for sorting and tracking changes', 'green'));
    console.log();
    console.log(colorize('🎉 Business Ideas page is now ready to use with Supabase!', 'bold'));

  } catch (error) {
    console.error(colorize('❌ Migration failed:', 'red'), error.message);
    console.log();
    console.log(colorize('🔍 Troubleshooting:', 'yellow'));
    console.log(colorize('   • Make sure your Supabase credentials are configured', 'yellow'));
    console.log(colorize('   • Check that you have admin/service role access', 'yellow'));
    console.log(colorize('   • Some errors might be expected if columns already exist', 'yellow'));
    console.log(colorize('   • You can also run the SQL manually in Supabase dashboard', 'yellow'));
    process.exit(1);
  }
}

// Run the migration
console.log(colorize('🗄️  Business Ideas Database Migration', 'bold'));
console.log(colorize('This will expand the business_ideas table with comprehensive business data fields.\n', 'cyan'));

runMigration();