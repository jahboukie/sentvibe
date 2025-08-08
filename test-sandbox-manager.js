// Test the actual SandboxManager implementation
import { SandboxManager } from './dist/sandbox/sandbox-manager.js';

console.log('🧪 Testing SandboxManager implementation...\n');

try {
  const sandbox = new SandboxManager(process.cwd());
  await sandbox.initialize();
  
  console.log('✅ SandboxManager initialized');
  
  // Test malicious code execution
  const maliciousCode = `
    const fs = require('fs');
    fs.unlinkSync('README.md');
    console.log('File deleted!');
  `;
  
  console.log('\n🔍 Testing malicious code execution...');
  const result = await sandbox.executeCode(maliciousCode, 'malicious.js');
  
  console.log('Execution result:', result);
  console.log('Confidence score:', result.confidence);
  
  // Test deployment decision
  const decision = await sandbox.checkDeploymentPermission('malicious.js', result.confidence);
  console.log('Deployment decision:', decision);
  
} catch (error) {
  console.error('❌ SandboxManager test failed:', error.message);
}
