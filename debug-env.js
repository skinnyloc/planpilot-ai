// Debug environment variables
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local file
const result = dotenv.config({ path: path.join(__dirname, '.env.local') });

console.log('🔍 Environment Debug:');
console.log('ENV file loaded:', result.error ? 'ERROR: ' + result.error.message : 'SUCCESS');
console.log('');

console.log('📋 Current Supabase Config:');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET');
console.log('ANON KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...' || 'NOT SET');
console.log('SERVICE ROLE:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...' || 'NOT SET');
console.log('API KEY:', process.env.SUPABASE_API_KEY?.substring(0, 20) + '...' || 'NOT SET');
console.log('');

// Check if keys are placeholder values
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('YOUR_NEW_')) {
  console.log('❌ ANON KEY is still placeholder - needs to be updated!');
}
if (process.env.SUPABASE_SERVICE_ROLE_KEY?.includes('YOUR_NEW_')) {
  console.log('❌ SERVICE ROLE KEY is still placeholder - needs to be updated!');
}
if (process.env.SUPABASE_API_KEY?.includes('YOUR_NEW_')) {
  console.log('❌ API KEY is still placeholder - needs to be updated!');
}