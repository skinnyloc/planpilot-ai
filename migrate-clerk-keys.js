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
function validateClerkPublishableKey(key) {
  if (!key) return false;
  if (!key.startsWith('pk_test_') && !key.startsWith('pk_live_')) return false;
  if (key.length < 50) return false;
  return true;
}

function validateClerkSecretKey(key) {
  if (!key) return false;
  if (!key.startsWith('sk_test_') && !key.startsWith('sk_live_')) return false;
  if (key.length < 50) return false;
  return true;
}

// Function to prompt for input
function promptForKey(question, validator) {
  return new Promise((resolve) => {
    console.log(colorize('⚠️  Note: Your input will be visible. Make sure no one is watching your screen.', 'yellow'));
    rl.question(question, (answer) => {
      const trimmedAnswer = answer.trim();
      if (validator(trimmedAnswer)) {
        resolve(trimmedAnswer);
      } else {
        console.log(colorize('❌ Invalid key format. Please try again.', 'red'));
        console.log();
        promptForKey(question, validator).then(resolve);
      }
    });
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
      // Remove the placeholder line if it exists
      const placeholderRegex = new RegExp(`^${key}=YOUR_.*$`, 'm');
      if (placeholderRegex.test(envContent)) {
        envContent = envContent.replace(placeholderRegex, newLine);
        console.log(colorize(`✅ Updated ${key} (replaced placeholder)`, 'green'));
      } else {
        envContent += envContent.endsWith('\n') ? '' : '\n';
        envContent += `${newLine}\n`;
        console.log(colorize(`✅ Added ${key}`, 'green'));
      }
    }
  });

  // Write the updated content back to the file
  fs.writeFileSync(envPath, envContent);
  console.log(colorize('💾 Environment file updated successfully!', 'green'));
}

// Main function
async function main() {
  console.log(colorize('🔄 Clerk Keys Migration Script', 'bold'));
  console.log(colorize('This script will migrate your existing Clerk keys to Vite-compatible format.\n', 'cyan'));

  const envVars = {};

  // Clerk Publishable Key Migration
  console.log(colorize('1. Clerk Publishable Key Migration', 'bold'));
  console.log(colorize('   📍 From: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'yellow'));
  console.log(colorize('   📍 To: VITE_CLERK_PUBLISHABLE_KEY', 'yellow'));
  console.log(colorize('   ⚠️  This key starts with "pk_test_" or "pk_live_"', 'yellow'));
  console.log(colorize('   🔑 Used for client-side authentication in Vite/React', 'yellow'));
  console.log();

  const publishableKey = await promptForKey(
    colorize('Paste your NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY value: ', 'cyan'),
    validateClerkPublishableKey
  );
  envVars.VITE_CLERK_PUBLISHABLE_KEY = publishableKey;

  console.log(colorize('✅ Publishable Key validated and ready for migration', 'green'));
  console.log();

  // Clerk Secret Key
  console.log(colorize('2. Clerk Secret Key', 'bold'));
  console.log(colorize('   📍 This will remain as: CLERK_SECRET_KEY', 'yellow'));
  console.log(colorize('   ⚠️  This key starts with "sk_test_" or "sk_live_"', 'yellow'));
  console.log(colorize('   🔒 Used for server-side operations (keep secret!)', 'yellow'));
  console.log();

  const secretKey = await promptForKey(
    colorize('Paste your CLERK_SECRET_KEY value: ', 'cyan'),
    validateClerkSecretKey
  );
  envVars.CLERK_SECRET_KEY = secretKey;

  console.log(colorize('✅ Secret Key validated and ready', 'green'));
  console.log();

  // Update the environment file
  updateEnvFile(envVars);

  console.log();
  console.log(colorize('🎉 Migration Complete!', 'bold'));
  console.log(colorize('Your Clerk keys have been successfully migrated to Vite format:', 'green'));
  console.log(colorize(`   ✅ VITE_CLERK_PUBLISHABLE_KEY: ${publishableKey.substring(0, 20)}...`, 'green'));
  console.log(colorize(`   ✅ CLERK_SECRET_KEY: ${secretKey.substring(0, 15)}...`, 'green'));
  console.log();
  console.log(colorize('📋 Next steps:', 'bold'));
  console.log(colorize('   • Your development server will automatically restart', 'cyan'));
  console.log(colorize('   • Visit http://localhost:5174/ to test authentication', 'cyan'));
  console.log(colorize('   • You should now see the Clerk sign-in flow working!', 'cyan'));

  rl.close();
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n' + colorize('👋 Migration cancelled by user', 'yellow'));
  process.exit(0);
});

// Run the script
main().catch((error) => {
  console.error(colorize('❌ Error during migration:', 'red'), error.message);
  process.exit(1);
});