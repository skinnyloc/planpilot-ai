#!/usr/bin/env node

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// Key validation functions
function validateSupabaseSecretKey(key) {
  // Supabase secret keys typically start with 'eyJ' and are base64 encoded JWT tokens
  if (!key) return false;
  if (!key.startsWith('eyJ')) return false;
  if (key.length < 100) return false; // Secret keys are quite long
  return true;
}

function validateJWTSecret(key) {
  // JWT secrets can be various formats, but should be reasonably long for security
  if (!key) return false;
  if (key.length < 32) return false; // Minimum reasonable length for JWT secret
  return true;
}

// Function to safely prompt for input
function promptForKey(question, validator, isSecret = true) {
  return new Promise((resolve) => {
    if (isSecret) {
      // For secret keys, we'll use readline but remind user about security
      console.log(colorize('⚠️  Note: Your input will be visible. Make sure no one is watching your screen.', 'yellow'));
      rl.question(question, (answer) => {
        if (validator(answer.trim())) {
          resolve(answer.trim());
        } else {
          console.log(colorize('❌ Invalid key format. Please try again.', 'red'));
          console.log();
          promptForKey(question, validator, isSecret).then(resolve);
        }
      });
    } else {
      rl.question(question, (answer) => {
        if (validator(answer.trim())) {
          resolve(answer.trim());
        } else {
          console.log(colorize('❌ Invalid format. Please try again.', 'red'));
          promptForKey(question, validator, isSecret).then(resolve);
        }
      });
    }
  });
}

// Function to update or create .env.local file
function updateEnvFile(envVars) {
  const envPath = path.join(__dirname, '.env.local');
  let envContent = '';

  // Read existing .env.local if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log(colorize('📝 Found existing .env.local file', 'cyan'));
  } else {
    console.log(colorize('📝 Creating new .env.local file', 'cyan'));
  }

  // Update or add each environment variable
  Object.entries(envVars).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const newLine = `${key}=${value}`;

    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, newLine);
      console.log(colorize(`✅ Updated ${key}`, 'green'));
    } else {
      envContent += envContent.endsWith('\n') ? '' : '\n';
      envContent += `${newLine}\n`;
      console.log(colorize(`✅ Added ${key}`, 'green'));
    }
  });

  // Write the updated content back to the file
  fs.writeFileSync(envPath, envContent);
  console.log(colorize('💾 Environment file updated successfully!', 'green'));
}

// Main function
async function main() {
  console.log(colorize('🔐 Supabase Keys Setup', 'bold'));
  console.log(colorize('This script will help you add Supabase keys to your environment configuration.\n', 'cyan'));

  const envVars = {};

  // Supabase Secret Key
  console.log(colorize('1. Supabase Secret Key (Service Role)', 'bold'));
  console.log(colorize('   📍 Location: Supabase Dashboard → Project Settings → API → Project API keys → service_role (secret)', 'yellow'));
  console.log(colorize('   ⚠️  This key starts with "eyJ" and should be kept secret', 'yellow'));
  console.log(colorize('   🔒 Used for server-side operations and bypasses RLS', 'yellow'));
  console.log();

  const secretKey = await promptForKey(
    colorize('Enter your Supabase Secret Key: ', 'cyan'),
    validateSupabaseSecretKey,
    true
  );
  envVars.SUPABASE_SECRET_KEY = secretKey;

  console.log(colorize('✅ Supabase Secret Key validated and saved', 'green'));
  console.log();

  // Legacy JWT Secret
  console.log(colorize('2. Legacy JWT Secret', 'bold'));
  console.log(colorize('   📍 Location: Supabase Dashboard → Project Settings → API → JWT Settings → JWT Secret', 'yellow'));
  console.log(colorize('   🔑 Used for verifying JWT tokens from your Supabase project', 'yellow'));
  console.log(colorize('   ⚠️  This is different from the JWT secret in newer Supabase versions', 'yellow'));
  console.log();

  const jwtSecret = await promptForKey(
    colorize('Enter your Legacy JWT Secret: ', 'cyan'),
    validateJWTSecret,
    true
  );
  envVars.SUPABASE_JWT_SECRET = jwtSecret;

  console.log(colorize('✅ Legacy JWT Secret validated and saved', 'green'));
  console.log();

  // Update the environment file
  updateEnvFile(envVars);

  console.log();
  console.log(colorize('🎉 Setup complete!', 'bold'));
  console.log(colorize('Your Supabase keys have been added to .env.local', 'green'));
  console.log();
  console.log(colorize('📋 Next steps:', 'bold'));
  console.log(colorize('   • Restart your development server if it\'s running', 'cyan'));
  console.log(colorize('   • Make sure .env.local is in your .gitignore file', 'cyan'));
  console.log(colorize('   • Test your Supabase connection', 'cyan'));

  rl.close();
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n' + colorize('👋 Setup cancelled by user', 'yellow'));
  process.exit(0);
});

// Run the script
main().catch((error) => {
  console.error(colorize('❌ Error during setup:', 'red'), error.message);
  process.exit(1);
});