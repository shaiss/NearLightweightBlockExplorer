#!/usr/bin/env node

/**
 * Simple RPC Proxy Server to bypass CORS restrictions
 * 
 * This standalone proxy server forwards RPC requests to various providers,
 * adding proper CORS headers to allow browser access.
 * 
 * Port Priority (first match wins):
 *   1. PROXY_PORT environment variable
 *   2. Command line argument: node proxy-server.js 3001
 *   3. Default: 3001
 * 
 * Usage:
 *   node proxy-server.js
 *   PROXY_PORT=9001 node proxy-server.js
 *   node proxy-server.js 3001
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

// Port precedence: env var > CLI arg > default
const PORT = process.env.PROXY_PORT || process.argv[2] || 3001;
const TIMEOUT_MS = 30000; // 30 second timeout

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Target-URL',
  'Access-Control-Max-Age': '86400', // 24 hours
};

function logRequest(method, targetUrl, statusCode, duration) {
  const timestamp = new Date().toISOString();
  const color = statusCode >= 200 && statusCode < 300 ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';
  console.log(`${timestamp} ${color}${statusCode}${reset} ${method} ${targetUrl} (${duration}ms)`);
}

function handleRequest(req, res) {
  console.log(`\n📥 Incoming: ${req.method} ${req.url}`);
  console.log(`   Headers:`, JSON.stringify(req.headers, null, 2));
  
  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    console.log(`   ✅ CORS preflight OK`);
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log(`   ❌ Method not allowed: ${req.method}`);
    res.writeHead(405, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
    return;
  }

  // Get target URL from header
  const targetUrl = req.headers['x-target-url'];
  
  if (!targetUrl) {
    console.log(`   ❌ Missing X-Target-URL header`);
    res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing X-Target-URL header' }));
    return;
  }
  
  console.log(`   🎯 Target: ${targetUrl}`);

  // Validate URL
  let url;
  try {
    url = new URL(targetUrl);
    if (!url.protocol.startsWith('http')) {
      throw new Error('Invalid protocol');
    }
  } catch (error) {
    res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid target URL' }));
    return;
  }

  const startTime = Date.now();

  // Read request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    // Choose http or https module
    const client = url.protocol === 'https:' ? https : http;

    // Forward request
    const proxyReq = client.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent': 'NEAR-Explorer-Proxy/1.0',
        },
        timeout: TIMEOUT_MS,
      },
      (proxyRes) => {
        const duration = Date.now() - startTime;
        logRequest('POST', targetUrl, proxyRes.statusCode, duration);

        // Forward response
        res.writeHead(proxyRes.statusCode, {
          ...CORS_HEADERS,
          'Content-Type': proxyRes.headers['content-type'] || 'application/json',
        });

        proxyRes.pipe(res);
      }
    );

    // Handle errors
    proxyReq.on('error', (error) => {
      const duration = Date.now() - startTime;
      logRequest('POST', targetUrl, 500, duration);
      
      console.error('Proxy error:', error.message);
      
      if (!res.headersSent) {
        res.writeHead(500, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ 
        error: 'Proxy error',
        message: error.message,
        code: error.code,
      }));
    });

    proxyReq.on('timeout', () => {
      const duration = Date.now() - startTime;
      logRequest('POST', targetUrl, 504, duration);
      
      proxyReq.destroy();
      if (!res.headersSent) {
        res.writeHead(504, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ error: 'Gateway timeout' }));
    });

    // Send request body
    proxyReq.write(body);
    proxyReq.end();
  });

  req.on('error', (error) => {
    console.error('Request error:', error.message);
    if (!res.headersSent) {
      res.writeHead(500, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ error: 'Request error', message: error.message }));
  });
}

// Create server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log('\x1b[36m%s\x1b[0m', '╔════════════════════════════════════════════╗');
  console.log('\x1b[36m%s\x1b[0m', '║     NEAR RPC Proxy Server Running         ║');
  console.log('\x1b[36m%s\x1b[0m', '╚════════════════════════════════════════════╝');
  console.log('');
  console.log('\x1b[32m%s\x1b[0m', `✓ Listening on: http://localhost:${PORT}`);
  console.log('\x1b[33m%s\x1b[0m', '⚡ Ready to proxy RPC requests');
  console.log('');
  console.log('Usage:');
  console.log('  POST http://localhost:' + PORT);
  console.log('  Header: X-Target-URL: <rpc-endpoint>');
  console.log('  Body: JSON-RPC request');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

