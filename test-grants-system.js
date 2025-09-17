// Test script to verify grant system is working
import { supabase } from './src/lib/supabase.js';

async function testGrantSystem() {
  console.log('🔍 Testing Grant Database System...\n');

  try {
    // Test 1: Check grant sources
    console.log('1. Testing grant sources...');
    const { data: sources, error: sourcesError } = await supabase
      .from('grant_sources')
      .select('*');

    if (sourcesError) throw sourcesError;
    console.log(`✅ Found ${sources.length} grant sources`);

    // Test 2: Check categories
    console.log('\n2. Testing grant categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('grant_categories')
      .select('*');

    if (categoriesError) throw categoriesError;
    console.log(`✅ Found ${categories.length} grant categories`);

    // Test 3: Check grants
    console.log('\n3. Testing grants...');
    const { data: grants, error: grantsError } = await supabase
      .from('grants')
      .select(`
        *,
        grant_categories(name),
        grant_sources(name)
      `);

    if (grantsError) throw grantsError;
    console.log(`✅ Found ${grants.length} grants`);

    // Display sample grant
    if (grants.length > 0) {
      const grant = grants[0];
      console.log(`\n📋 Sample Grant:`);
      console.log(`   Title: ${grant.title}`);
      console.log(`   Agency: ${grant.agency}`);
      console.log(`   Amount: $${grant.max_amount?.toLocaleString() || 'N/A'}`);
      console.log(`   Category: ${grant.grant_categories?.name || 'N/A'}`);
    }

    // Test 4: Test search function
    console.log('\n4. Testing search function...');
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_grants', {
        search_term: 'technology',
        status_filter: 'active'
      });

    if (searchError) throw searchError;
    console.log(`✅ Search found ${searchResults.length} technology grants`);

    console.log('\n🎉 Grant system test completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${sources.length} data sources configured`);
    console.log(`   • ${categories.length} grant categories available`);
    console.log(`   • ${grants.length} grants in database`);
    console.log(`   • Search functionality working`);

  } catch (error) {
    console.error('❌ Grant system test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testGrantSystem();