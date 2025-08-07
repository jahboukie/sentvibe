#!/usr/bin/env node

/**
 * Simple local server to serve SentVibe website for testing
 * Usage: node scripts/serve-success.js
 * Serves: Landing page + Success page
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3000;

const server = createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  let filePath;
  let contentType = 'text/html';

  // Route handling
  if (req.url === '/' || req.url === '/index.html') {
    filePath = join(__dirname, '..', 'public', 'index.html');
  } else if (req.url === '/success.html' || req.url === '/success') {
    filePath = join(__dirname, '..', 'public', 'success.html');
  } else {
    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  // Serve the file
  try {
    const content = readFileSync(filePath, 'utf8');

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    res.end(content);
  } catch (error) {
    console.error('Error serving page:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 SentVibe website server running at:`);
  console.log(`   http://localhost:${PORT}/           - Landing page (with install modal)`);
  console.log(`   http://localhost:${PORT}/success    - Success page`);
  console.log('');
  console.log('💡 Use http://localhost:3000/success.html in Polar.sh checkout for testing');
  console.log('');
  console.log('Press Ctrl+C to stop');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down success page server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
