import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  try {
    console.log('Checking documents table schema...');

    // Try to get the table structure by selecting from the table
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .limit(0);

    if (error) {
      console.error('Error querying documents table:', error);
      return;
    }

    console.log('✅ Documents table exists and is accessible');

    // Try to insert a test record to see what columns are available
    const testData = {
      user_id: 'demo-user',
      filename: 'test.pdf',
      file_path: 'test/test.pdf',
      document_type: 'business_plan',
      file_size: 1024,
      mime_type: 'application/pdf'
    };

    console.log('Testing insert with basic columns...');
    const { data: insertData, error: insertError } = await supabase
      .from('documents')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
    } else {
      console.log('✅ Successfully inserted test document:', insertData);

      // Clean up the test record
      await supabase
        .from('documents')
        .delete()
        .eq('id', insertData.id);
      console.log('✅ Cleaned up test record');
    }

  } catch (error) {
    console.error('Schema check error:', error);
  }
}

checkSchema();