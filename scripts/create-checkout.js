#!/usr/bin/env node

/**
 * Create a Polar.sh checkout session for SentVibe Pro
 * This will generate a test subscription and license key
 */

import { Polar } from '@polar-sh/sdk';
import 'dotenv/config';

const polar = new Polar({
  server: 'sandbox',
  accessToken: process.env['POLAR_ACCESS_TOKEN'] ?? '',
});

// Your Pro tier product ID (not the price ID)
const PRO_PRODUCT_ID = 'd320713a-feaf-4f87-bd86-75a7f2d3a7ff';

async function createCheckout() {
  console.log('🛒 Creating SentVibe Pro Checkout Session\n');
  
  console.log('Environment:');
  console.log(`  Server: ${process.env.NODE_ENV === 'development' ? 'sandbox' : 'production'}`);
  console.log(`  Organization ID: ${process.env.POLAR_ORGANIZATION_ID}`);
  console.log(`  Pro Product ID: ${PRO_PRODUCT_ID}`);
  console.log('');

  try {
    // Create a checkout session for SentVibe Pro
    const checkout = await polar.checkouts.create({
      products: [PRO_PRODUCT_ID],
      successUrl: 'https://polar.sh/success', // Use Polar.sh success page for now
      customerEmail: 'jahboukie@gmail.com', // Real test email
      metadata: {
        source: 'sentvibe-cli-test',
        version: '2.0.0'
      }
    });

    console.log('✅ Checkout session created successfully!');
    console.log('');
    console.log('📋 Checkout Details:');
    console.log(`  Session ID: ${checkout.id}`);
    console.log(`  Status: ${checkout.status}`);
    console.log(`  Customer Email: ${checkout.customerEmail}`);
    console.log(`  Price: $${checkout.totalAmount ? checkout.totalAmount / 100 : 'N/A'}`);
    console.log('');
    
    if (checkout.url) {
      console.log('🔗 Checkout URL:');
      console.log(`  ${checkout.url}`);
      console.log('');
      console.log('🎯 Next Steps:');
      console.log('  1. Open the checkout URL above');
      console.log('  2. Complete the test payment (use Stripe test cards)');
      console.log('  3. Check your Polar.sh dashboard for the subscription');
      console.log('  4. Get the license key from the subscription');
      console.log('  5. Test with: sv license activate <license-key>');
      console.log('');
      console.log('💳 Stripe Test Cards:');
      console.log('  Success: 4242 4242 4242 4242');
      console.log('  Decline: 4000 0000 0000 0002');
      console.log('  Any future date, any CVC');
    }

    // Also try to get the checkout session details
    console.log('📊 Session Details:');
    console.log(JSON.stringify(checkout, null, 2));

  } catch (error) {
    console.error('❌ Failed to create checkout session:');
    console.error(error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('  1. Check your POLAR_ACCESS_TOKEN has checkout permissions');
    console.log('  2. Verify the price ID is correct');
    console.log('  3. Ensure your organization is set up for checkouts');
    console.log('  4. Check if you need to configure payment methods in Polar.sh');
  }
}

async function listProducts() {
  console.log('📦 Available Products and Prices:\n');
  
  try {
    const products = await polar.products.list({
      organizationId: process.env.POLAR_ORGANIZATION_ID
    });
    
    products.result?.items?.forEach(product => {
      console.log(`Product: ${product.name} (${product.id})`);
      product.prices?.forEach(price => {
        console.log(`  Price: $${price.priceAmount/100} - ${price.id}`);
      });
      if (product.id === PRO_PRODUCT_ID) {
        console.log(`    ✅ This is the Pro tier product we'll use`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('Failed to list products:', error.message);
  }
}

async function main() {
  await listProducts();
  await createCheckout();
}

main().catch(console.error);
