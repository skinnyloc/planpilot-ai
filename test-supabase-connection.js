// Quick test script to verify Supabase connection
import { supabase } from './src/lib/supabase.js';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');

  try {
    // Test profiles table
    console.log('\n📋 Testing profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError.message);
    } else {
      console.log('✅ Profiles table working! Found', profiles?.length || 0, 'records');
    }

    // Test documents table
    console.log('\n📄 Testing documents table...');
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .limit(1);

    if (documentsError) {
      console.error('❌ Documents table error:', documentsError.message);
    } else {
      console.log('✅ Documents table working! Found', documents?.length || 0, 'records');
    }

    // Test business_ideas table
    console.log('\n💡 Testing business_ideas table...');
    const { data: ideas, error: ideasError } = await supabase
      .from('business_ideas')
      .select('*')
      .limit(1);

    if (ideasError) {
      console.error('❌ Business ideas table error:', ideasError.message);
    } else {
      console.log('✅ Business ideas table working! Found', ideas?.length || 0, 'records');
    }

    // Test storage bucket
    console.log('\n🗂️ Testing storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Storage buckets error:', bucketsError.message);
    } else {
      console.log('✅ Storage buckets available:', buckets?.map(b => b.name).join(', ') || 'none');
    }

    console.log('\n🎉 Supabase connection test complete!');

  } catch (error) {
    console.error('💥 Supabase connection failed:', error.message);
  }
}

// Run the test
testSupabaseConnection();