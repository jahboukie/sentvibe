#!/usr/bin/env node

/**
 * Test script for Polar.sh integration
 * 
 * This script helps test the real Polar.sh API integration
 * by making direct API calls to validate the setup.
 */

import { Polar } from '@polar-sh/sdk';
import 'dotenv/config';

const polar = new Polar({
  accessToken: process.env['POLAR_ACCESS_TOKEN'] ?? '',
  server: process.env.NODE_ENV === 'development' ? 'sandbox' : 'production'
});

async function testPolarIntegration() {
  console.log('🧪 Testing Polar.sh Integration\n');
  
  console.log('Environment:');
  console.log(`  Server: ${process.env.NODE_ENV === 'development' ? 'sandbox' : 'production'}`);
  console.log(`  Access Token: ${process.env.POLAR_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Organization ID: ${process.env.POLAR_ORGANIZATION_ID ? '✅ Set' : '❌ Missing'}`);
  console.log('');

  try {
    // Test 1: List products
    console.log('📦 Testing: List Products');
    const products = await polar.products.list({
      organizationId: process.env.POLAR_ORGANIZATION_ID
    });
    
    console.log(`  Found ${products.result?.items?.length || 0} products:`);
    products.result?.items?.forEach(product => {
      console.log(`    - ${product.name} (${product.id})`);
      product.prices?.forEach(price => {
        console.log(`      Price: $${price.priceAmount/100} (${price.id})`);
      });
    });
    console.log('');

    // Test 2: List license keys
    console.log('🔑 Testing: List License Keys');
    try {
      const licenseKeys = await polar.licenseKeys.list({
        organizationId: process.env.POLAR_ORGANIZATION_ID
      });
      console.log(`  Found ${licenseKeys.result?.items?.length || 0} license keys:`);
      licenseKeys.result?.items?.forEach(key => {
        console.log(`    - Key: ${key.key}`);
        console.log(`      Status: ${key.status}`);
        console.log(`      Subscription: ${key.subscriptionId}`);
        console.log(`      Customer: ${key.customerId}`);
        console.log('');
      });
    } catch (error) {
      console.log(`  Error listing license keys: ${error.message}`);
    }

    // Test 3: Test license key validation with the real Pro key
    console.log('🔑 Testing: Pro License Key Validation');
    try {
      const validation = await polar.customerPortal.licenseKeys.validate({
        key: 'SENTVIBE-MEM-BOX-43FE85AD-2643-40CF-9171-E268AF476A04',
        organizationId: process.env.POLAR_ORGANIZATION_ID
      });
      console.log('  Pro Key Validation result:');
      console.log(`    Status: ${validation.status}`);
      console.log(`    Benefit ID: ${validation.benefitId}`);
      console.log(`    Customer: ${validation.customer?.email}`);
      console.log(`    Expires: ${validation.expiresAt}`);
    } catch (error) {
      console.log(`  Pro validation error: ${error.message}`);
    }
    console.log('');

    console.log('✅ Polar.sh integration test completed successfully!');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('  1. Create a test subscription in your Polar.sh dashboard');
    console.log('  2. Generate a license key for testing');
    console.log('  3. Test with: sv license activate <your-test-license-key>');

  } catch (error) {
    console.error('❌ Polar.sh integration test failed:');
    console.error(error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('  1. Check your POLAR_ACCESS_TOKEN is correct');
    console.log('  2. Check your POLAR_ORGANIZATION_ID is correct');
    console.log('  3. Ensure you have the right permissions in Polar.sh');
    console.log('  4. Try switching between sandbox and production environments');
  }
}

testPolarIntegration();
