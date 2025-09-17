#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupPayPal() {
  console.log('\n🚀 PayPal Integration Setup');
  console.log('================================\n');

  console.log('This script will help you configure PayPal for your application.');
  console.log('You will need a PayPal Developer account and a sandbox app.\n');

  console.log('📝 Steps to get your PayPal credentials:');
  console.log('1. Visit https://developer.paypal.com/');
  console.log('2. Sign in or create a developer account');
  console.log('3. Go to "My Apps & Credentials"');
  console.log('4. Create a new sandbox app or use an existing one');
  console.log('5. Copy the Client ID and Client Secret\n');

  const proceed = await askQuestion('Do you have your PayPal sandbox credentials? (y/n): ');

  if (proceed.toLowerCase() !== 'y') {
    console.log('\n❌ Please get your PayPal credentials first and run this script again.');
    process.exit(0);
  }

  // Get PayPal credentials
  console.log('\n📋 Enter your PayPal sandbox credentials:\n');

  const clientId = await askQuestion('PayPal Client ID: ');
  if (!clientId.trim()) {
    console.log('❌ Client ID is required');
    process.exit(1);
  }

  const clientSecret = await askQuestion('PayPal Client Secret: ');
  if (!clientSecret.trim()) {
    console.log('❌ Client Secret is required');
    process.exit(1);
  }

  // Optional webhook ID
  console.log('\n🔔 Webhook Configuration (optional for testing):');
  console.log('To test payments fully, you\'ll need to set up a webhook endpoint.');
  console.log('You can skip this for now and add it later.\n');

  const webhookId = await askQuestion('PayPal Webhook ID (press Enter to skip): ');

  // Read current .env.local file
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = '';

  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.log('⚠️  .env.local file not found. Creating new one...');
  }

  // Update PayPal environment variables
  const paypalVars = {
    'NEXT_PUBLIC_PAYPAL_CLIENT_ID': clientId,
    'PAYPAL_CLIENT_ID': clientId,
    'PAYPAL_SECRET': clientSecret,
    'PAYPAL_WEBHOOK_ID': webhookId || ''
  };

  // Parse existing env file and update PayPal variables
  let updatedContent = envContent;

  for (const [key, value] of Object.entries(paypalVars)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const replacement = `${key}=${value}`;

    if (envContent.includes(key)) {
      updatedContent = updatedContent.replace(regex, replacement);
    } else {
      updatedContent += `\n${replacement}`;
    }
  }

  // Write updated .env.local file
  fs.writeFileSync(envPath, updatedContent);

  console.log('\n✅ PayPal configuration updated successfully!');
  console.log('\n📝 Configuration summary:');
  console.log(`   Client ID: ${clientId.substring(0, 20)}...`);
  console.log(`   Secret: ${'*'.repeat(20)}...`);

  if (webhookId) {
    console.log(`   Webhook ID: ${webhookId.substring(0, 20)}...`);
  } else {
    console.log('   Webhook ID: Not configured (optional)');
  }

  console.log('\n🔄 Next steps:');
  console.log('1. Restart your development server');
  console.log('2. Visit /pricing to test PayPal integration');
  console.log('3. Use PayPal sandbox accounts for testing');
  console.log('4. Check the console for payment processing logs');

  if (!webhookId) {
    console.log('\n💡 To set up webhooks later:');
    console.log('1. Go to your PayPal Developer dashboard');
    console.log('2. Create a webhook endpoint: http://localhost:5173/api/webhooks/paypal');
    console.log('3. Select "Payment capture completed" event');
    console.log('4. Run this script again to add the webhook ID');
  }

  console.log('\n🎉 PayPal integration is ready to test!');

  rl.close();
}

// Run the setup
setupPayPal().catch((error) => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});