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

// R2 credentials validation
function validateR2Credentials(credentials) {
  const { accountId, accessKeyId, secretAccessKey, bucketName } = credentials;

  if (!accountId || accountId.length < 10) {
    return { valid: false, message: 'Account ID must be at least 10 characters' };
  }

  if (!accessKeyId || !accessKeyId.match(/^[A-Z0-9]{32}$/)) {
    return { valid: false, message: 'Access Key ID should be 32 characters of uppercase letters and numbers' };
  }

  if (!secretAccessKey || secretAccessKey.length < 40) {
    return { valid: false, message: 'Secret Access Key must be at least 40 characters' };
  }

  if (!bucketName || !bucketName.match(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)) {
    return { valid: false, message: 'Bucket name must contain only lowercase letters, numbers, and hyphens' };
  }

  return { valid: true };
}

// Function to test R2 connection
async function testR2Connection(credentials) {
  try {
    console.log(colorize('🔄 Testing R2 connection...', 'cyan'));

    // For now, we'll just validate the format since we need AWS SDK for actual testing
    const validation = validateR2Credentials(credentials);
    if (!validation.valid) {
      console.log(colorize('❌ Credential validation failed', 'red'));
      console.log(colorize(`   Error: ${validation.message}`, 'red'));
      return false;
    }

    console.log(colorize('✅ R2 credentials format validated!', 'green'));
    console.log(colorize('⚠️  Note: Run a document upload to fully test the connection', 'yellow'));
    return true;

  } catch (error) {
    console.log(colorize('❌ Failed to validate R2 credentials', 'red'));
    console.log(colorize(`   Error: ${error.message}`, 'red'));
    return false;
  }
}

// Function to prompt for input
function promptForInput(question, validator) {
  return new Promise((resolve) => {
    console.log(colorize('⚠️  Note: Your input will be visible. Make sure no one is watching your screen.', 'yellow'));
    rl.question(question, (answer) => {
      const trimmedAnswer = answer.trim();
      if (validator && !validator(trimmedAnswer)) {
        console.log(colorize('❌ Invalid format. Please try again.', 'red'));
        console.log();
        promptForInput(question, validator).then(resolve);
      } else {
        resolve(trimmedAnswer);
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
      envContent += envContent.endsWith('\n') ? '' : '\n';
      envContent += `${newLine}\n`;
      console.log(colorize(`✅ Added ${key}`, 'green'));
    }
  });

  // Write the updated content back to the file
  fs.writeFileSync(envPath, envContent);
  console.log(colorize('💾 Environment file updated successfully!', 'green'));
}

// Function to show enabled features
function showEnabledFeatures() {
  console.log();
  console.log(colorize('🚀 Document Storage Features now enabled:', 'bold'));
  console.log(colorize('   📄 Secure document upload to Cloudflare R2', 'green'));
  console.log(colorize('   🔒 Private document storage with access controls', 'green'));
  console.log(colorize('   📁 Organized document management system', 'green'));
  console.log(colorize('   🔍 Search and filter documents', 'green'));
  console.log(colorize('   📊 Document metadata tracking', 'green'));
  console.log(colorize('   💾 Automatic backup and versioning', 'green'));
}

// Function to show usage instructions
function showUsageInstructions() {
  console.log();
  console.log(colorize('📋 Next steps:', 'bold'));
  console.log(colorize('   1. Restart your development server if it\'s running', 'cyan'));
  console.log(colorize('   2. Run "npm run migrate-documents" to set up database tables', 'cyan'));
  console.log(colorize('   3. Make sure .env.local is in your .gitignore file', 'cyan'));
  console.log(colorize('   4. Test document upload in the Documents section', 'cyan'));
  console.log();
  console.log(colorize('💡 Pro tip: R2 provides generous free tier limits for document storage', 'yellow'));
  console.log(colorize('📖 Cloudflare R2 docs: https://developers.cloudflare.com/r2/', 'yellow'));
}

// Main function
async function main() {
  console.log(colorize('☁️  Cloudflare R2 Storage Setup', 'bold'));
  console.log(colorize('This script will help you configure Cloudflare R2 for secure document storage.\n', 'cyan'));

  const envVars = {};

  // R2 Account ID
  console.log(colorize('Cloudflare R2 Account Configuration', 'bold'));
  console.log(colorize('   📍 Get your credentials: https://dash.cloudflare.com/profile/api-tokens', 'yellow'));
  console.log(colorize('   🔑 You\'ll need: Account ID, R2 Token (Access Key & Secret)', 'yellow'));
  console.log(colorize('   🪣 Create a bucket in R2 dashboard first', 'yellow'));
  console.log();

  const accountId = await promptForInput(
    colorize('Enter your Cloudflare Account ID: ', 'cyan'),
    (value) => value.length >= 10
  );

  const accessKeyId = await promptForInput(
    colorize('Enter your R2 Access Key ID: ', 'cyan'),
    (value) => value.match(/^[A-Z0-9]{32}$/)
  );

  const secretAccessKey = await promptForInput(
    colorize('Enter your R2 Secret Access Key: ', 'cyan'),
    (value) => value.length >= 40
  );

  const bucketName = await promptForInput(
    colorize('Enter your R2 Bucket Name: ', 'cyan'),
    (value) => value.match(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)
  );

  const credentials = { accountId, accessKeyId, secretAccessKey, bucketName };

  console.log();
  console.log(colorize('✅ R2 credentials collected', 'green'));

  // Test the R2 connection
  const connectionSuccess = await testR2Connection(credentials);

  if (!connectionSuccess) {
    console.log();
    console.log(colorize('⚠️  Credential validation failed. Do you want to continue anyway? (y/N): ', 'yellow'));

    const continueAnyway = await new Promise((resolve) => {
      rl.question('', (answer) => {
        resolve(answer.toLowerCase().startsWith('y'));
      });
    });

    if (!continueAnyway) {
      console.log(colorize('❌ Setup cancelled. Please check your credentials and try again.', 'red'));
      console.log();
      console.log(colorize('🔍 Common issues:', 'yellow'));
      console.log(colorize('   • Make sure you created the R2 bucket first', 'yellow'));
      console.log(colorize('   • Verify the Access Key has R2 permissions', 'yellow'));
      console.log(colorize('   • Check that credentials are copied correctly', 'yellow'));
      rl.close();
      return;
    }
  }

  // Add R2 environment variables
  envVars.R2_ACCOUNT_ID = accountId;
  envVars.R2_ACCESS_KEY_ID = accessKeyId;
  envVars.R2_SECRET_ACCESS_KEY = secretAccessKey;
  envVars.R2_BUCKET_NAME = bucketName;
  envVars.R2_ENDPOINT = `https://${accountId}.r2.cloudflarestorage.com`;

  console.log();
  // Update the environment file
  updateEnvFile(envVars);

  // Show enabled features
  showEnabledFeatures();

  console.log();
  console.log(colorize('🎉 R2 Storage setup complete!', 'bold'));
  console.log(colorize('Your Cloudflare R2 credentials have been added to .env.local', 'green'));

  // Show usage instructions
  showUsageInstructions();

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
  console.log();
  console.log(colorize('🔍 If you continue to have issues:', 'yellow'));
  console.log(colorize('   • Check your Cloudflare account access', 'yellow'));
  console.log(colorize('   • Verify your internet connection', 'yellow'));
  console.log(colorize('   • Try running the script again', 'yellow'));
  process.exit(1);
});