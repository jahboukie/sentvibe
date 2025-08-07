#!/usr/bin/env node

/**
 * Create a Polar.sh checkout session for SentVibe Free Tier
 * This allows users to sign up with email and get SENTVIBE-MEM-FREE-* license key
 * Usage: node scripts/create-free-checkout.js
 */

import { Polar } from '@polar-sh/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Your Free tier product ID (this is the actual product, not the price)
const FREE_PRODUCT_ID = '9c822594-748c-40b4-8d16-420e3917e363';

async function createFreeCheckout() {
  console.log('🆓 Creating SentVibe Free Tier Checkout Session...');
  console.log('');
  
  console.log('Environment:');
  console.log(`  Server: sandbox`);
  console.log(`  Organization ID: ${process.env.POLAR_ORGANIZATION_ID}`);
  console.log(`  Free Product ID: ${FREE_PRODUCT_ID}`);
  console.log('');

  try {
    // Initialize Polar SDK
    const polar = new Polar({
      server: 'sandbox',
      accessToken: process.env['POLAR_ACCESS_TOKEN'] ?? '',
    });

    // Create a checkout session for SentVibe Free
    const checkout = await polar.checkouts.create({
      products: [FREE_PRODUCT_ID],
      successUrl: 'https://polar.sh/success', // Use Polar.sh success page for now
      customerEmail: 'jahboukie@gmail.com', // Real test email
      metadata: {
        source: 'sentvibe-free-signup',
        version: '2.0.0',
        tier: 'free'
      }
    });

    console.log('✅ Free tier checkout session created successfully!');
    console.log('');
    console.log('📋 Checkout Details:');
    console.log(`  Session ID: ${checkout.id}`);
    console.log(`  Status: ${checkout.status}`);
    console.log(`  Customer Email: ${checkout.customerEmail}`);
    console.log(`  Success URL: ${checkout.successUrl}`);
    console.log('');
    console.log('🔗 Checkout URL:');
    console.log(`  ${checkout.url}`);
    console.log('');
    console.log('💡 This checkout will:');
    console.log('  1. Collect user email (no payment required)');
    console.log('  2. Generate SENTVIBE-MEM-FREE-* license key');
    console.log('  3. Send license key to user email');
    console.log('  4. Redirect to success page');
    console.log('');
    console.log('🎯 Test the complete flow:');
    console.log('  1. Open the checkout URL above');
    console.log('  2. Enter email (no payment required)');
    console.log('  3. Get license key from email or success page');
    console.log('  4. Activate: sv license activate <free-license-key>');
    console.log('');

  } catch (error) {
    console.error('❌ Failed to create checkout session:');
    console.error('');
    
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2));
    } else {
      console.error('Error message:', error.message);
    }
    
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('  1. Check your .env file has correct POLAR_ACCESS_TOKEN');
    console.error('  2. Verify POLAR_ORGANIZATION_ID is correct');
    console.error('  3. Ensure the Free Product ID exists in your Polar.sh dashboard');
    console.error('  4. Check if you\'re using sandbox vs production environment');
    
    process.exit(1);
  }
}

// Also test product discovery to verify our IDs
async function testProductDiscovery() {
  console.log('🔍 Testing: Product Discovery');
  
  try {
    const polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      server: process.env.NODE_ENV === 'development' ? 'sandbox' : 'production'
    });

    const products = await polar.products.list({
      organizationId: process.env.POLAR_ORGANIZATION_ID
    });

    console.log(`  Found ${products.result?.items?.length || 0} products:`);
    products.result?.items?.forEach(product => {
      console.log(`    - ${product.name} (${product.id})`);
      product.prices?.forEach(price => {
        console.log(`      Price: $${price.priceAmount/100} - ${price.id}`);
      });
      if (product.id === FREE_PRODUCT_ID) {
        console.log(`      ✅ This is the Free tier product we'll use`);
      }
    });
    console.log('');
  } catch (error) {
    console.log(`  Error discovering products: ${error.message}`);
    console.log('');
  }
}

// Run the tests
async function main() {
  await testProductDiscovery();
  await createFreeCheckout();
}

main().catch(console.error);
