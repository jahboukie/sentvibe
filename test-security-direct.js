// Direct test of security features
import { SecurityManager } from './dist/index.js';

async function testSecurity() {
  console.log('🔒 Testing Security Features Directly...\n');

  try {
    const securityManager = new SecurityManager('./test-sentvibe-project');
    await securityManager.initialize();

    console.log('✅ Security Manager initialized');

    // Test 1: Security Status
    const status = securityManager.getSecurityStatus();
    console.log('\n📊 Security Status:');
    console.log(`  Encryption: ${status.encryptionEnabled ? '✅' : '❌'}`);
    console.log(`  Content Sanitization: ${status.contentSanitizationEnabled ? '✅' : '❌'}`);
    console.log(`  File Access Control: ${status.fileAccessControlEnabled ? '✅' : '❌'}`);

    // Test 2: Self Test
    console.log('\n🧪 Running Security Self-Test...');
    const selfTest = await securityManager.runSecuritySelfTest();
    
    if (selfTest.passed) {
      console.log('✅ All security tests passed!');
    } else {
      console.log('❌ Security tests failed:');
      selfTest.tests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        console.log(`  ${status} ${test.name}${test.error ? ` - ${test.error}` : ''}`);
      });
    }

    // Test 3: File Processing
    console.log('\n📁 Testing File Processing...');
    const testFilePath = './test-sentvibe-project/test-sensitive.js';
    const fileResult = await securityManager.processFile(testFilePath);
    
    if (fileResult.success) {
      console.log('✅ File processed successfully');
      console.log(`  Encrypted: ${fileResult.isEncrypted ? '✅' : '❌'}`);
      console.log(`  Sanitized: ${fileResult.sanitizationResult?.redactionCount > 0 ? '✅' : '❌'}`);
      console.log(`  Sensitive Data Found: ${fileResult.sanitizationResult?.sensitiveDataFound ? '✅' : '❌'}`);
      console.log(`  Malicious Patterns: ${fileResult.sanitizationResult?.maliciousPatterns ? '✅' : '❌'}`);
    } else {
      console.log(`❌ File processing failed: ${fileResult.reason}`);
    }

    await securityManager.cleanup();
    console.log('\n✅ Security test completed successfully!');

  } catch (error) {
    console.error('❌ Security test failed:', error.message);
  }
}

testSecurity();
