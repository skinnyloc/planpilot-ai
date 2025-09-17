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

// OpenAI API key validation
function validateOpenAIKey(key) {
  if (!key) return false;
  if (!key.startsWith('sk-')) return false;
  if (key.length < 50) return false; // OpenAI keys are typically longer
  return true;
}

// Function to test OpenAI API connection
async function testOpenAIConnection(apiKey) {
  try {
    console.log(colorize('🔄 Testing OpenAI API connection...', 'cyan'));

    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const gptModels = data.data.filter(model =>
        model.id.includes('gpt-3.5') || model.id.includes('gpt-4')
      );

      console.log(colorize('✅ OpenAI API connection successful!', 'green'));
      console.log(colorize(`📊 Available GPT models: ${gptModels.length}`, 'cyan'));

      if (gptModels.length > 0) {
        console.log(colorize(`   Sample models: ${gptModels.slice(0, 3).map(m => m.id).join(', ')}`, 'cyan'));
      }

      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(colorize('❌ OpenAI API connection failed', 'red'));
      console.log(colorize(`   Status: ${response.status} ${response.statusText}`, 'red'));
      if (errorData.error) {
        console.log(colorize(`   Error: ${errorData.error.message}`, 'red'));
      }
      return false;
    }
  } catch (error) {
    console.log(colorize('❌ Failed to test OpenAI API connection', 'red'));
    console.log(colorize(`   Error: ${error.message}`, 'red'));
    return false;
  }
}

// Function to prompt for input
function promptForKey(question, validator) {
  return new Promise((resolve) => {
    console.log(colorize('⚠️  Note: Your input will be visible. Make sure no one is watching your screen.', 'yellow'));
    rl.question(question, (answer) => {
      if (validator(answer.trim())) {
        resolve(answer.trim());
      } else {
        console.log(colorize('❌ Invalid key format. Please try again.', 'red'));
        console.log(colorize('   OpenAI API keys must start with "sk-" and be at least 50 characters long', 'red'));
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
  console.log(colorize('🚀 Features now enabled:', 'bold'));
  console.log(colorize('   🤖 AI-powered business plan generation', 'green'));
  console.log(colorize('   💰 Smart grant proposal creation', 'green'));
  console.log(colorize('   📊 Intelligent market analysis', 'green'));
  console.log(colorize('   ✍️  Content enhancement and refinement', 'green'));
  console.log(colorize('   🎯 Personalized business recommendations', 'green'));
  console.log(colorize('   📋 Document creation and export', 'green'));
}

// Function to show usage instructions
function showUsageInstructions() {
  console.log();
  console.log(colorize('📋 Next steps:', 'bold'));
  console.log(colorize('   1. Restart your development server if it\'s running', 'cyan'));
  console.log(colorize('   2. Make sure .env.local is in your .gitignore file', 'cyan'));
  console.log(colorize('   3. Use demo controls to simulate paid user', 'cyan'));
  console.log(colorize('   4. Try creating a business plan or grant proposal!', 'cyan'));
  console.log();
  console.log(colorize('💡 Pro tip: Use the debug test in Business Plans to verify OpenAI is working', 'yellow'));
}

// Main function
async function main() {
  console.log(colorize('🤖 OpenAI API Key Setup', 'bold'));
  console.log(colorize('This script will help you add your OpenAI API key to enable AI content generation features.\n', 'cyan'));

  const envVars = {};

  // OpenAI API Key
  console.log(colorize('OpenAI API Key Configuration', 'bold'));
  console.log(colorize('   📍 Get your key: https://platform.openai.com/api-keys', 'yellow'));
  console.log(colorize('   🔗 Click "Create new secret key" to generate a key', 'yellow'));
  console.log(colorize('   ⚠️  Your key starts with "sk-" and should be kept secret', 'yellow'));
  console.log(colorize('   🔑 This enables AI content generation throughout the app', 'yellow'));
  console.log();

  const apiKey = await promptForKey(
    colorize('Enter your OpenAI API Key: ', 'cyan'),
    validateOpenAIKey
  );

  console.log(colorize('✅ OpenAI API Key format validated', 'green'));
  console.log();

  // Test the API connection
  const connectionSuccess = await testOpenAIConnection(apiKey);

  if (!connectionSuccess) {
    console.log();
    console.log(colorize('⚠️  API connection test failed. Do you want to continue anyway? (y/N): ', 'yellow'));

    const continueAnyway = await new Promise((resolve) => {
      rl.question('', (answer) => {
        resolve(answer.toLowerCase().startsWith('y'));
      });
    });

    if (!continueAnyway) {
      console.log(colorize('❌ Setup cancelled. Please check your API key and try again.', 'red'));
      console.log();
      console.log(colorize('🔍 Common issues:', 'yellow'));
      console.log(colorize('   • Make sure you have credits/billing set up in OpenAI', 'yellow'));
      console.log(colorize('   • Verify the API key is copied correctly', 'yellow'));
      console.log(colorize('   • Check your internet connection', 'yellow'));
      rl.close();
      return;
    }
  }

  // Add both regular and Vite-prefixed environment variables
  envVars.OPENAI_API_KEY = apiKey;
  envVars.VITE_OPENAI_API_KEY = apiKey;

  console.log();
  // Update the environment file
  updateEnvFile(envVars);

  // Show enabled features
  showEnabledFeatures();

  console.log();
  console.log(colorize('🎉 Setup complete!', 'bold'));
  console.log(colorize('Your OpenAI API key has been added to .env.local', 'green'));

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
  console.log(colorize('   • Check that Node.js fetch is available (Node 18+)', 'yellow'));
  console.log(colorize('   • Verify your internet connection', 'yellow'));
  console.log(colorize('   • Try running the script again', 'yellow'));
  process.exit(1);
});