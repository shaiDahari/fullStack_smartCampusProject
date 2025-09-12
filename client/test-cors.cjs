#!/usr/bin/env node

/**
 * CORS Test Script
 * Tests if the server properly handles CORS for different origins
 */

const http = require('http');

function testCORS(origin, endpoint = '/plants') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({});
    
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: endpoint,
      method: 'OPTIONS', // Preflight request
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          origin: origin,
          corsAllowed: res.headers['access-control-allow-origin'] !== undefined
        });
      });
    });

    req.on('error', (err) => {
      reject({ origin, error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

async function testMultipleOrigins() {
  console.log('🧪 Testing CORS Configuration');
  console.log('================================');
  
  const origins = [
    'http://localhost:5173',
    'http://localhost:5174', // The problematic one
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://localhost:3000'
  ];
  
  console.log('🔍 Testing preflight requests for different origins...\n');
  
  for (const origin of origins) {
    try {
      const result = await testCORS(origin);
      console.log(`${result.corsAllowed ? '✅' : '❌'} ${origin}`);
      console.log(`   Status: ${result.status}`);
      if (result.headers['access-control-allow-origin']) {
        console.log(`   CORS Header: ${result.headers['access-control-allow-origin']}`);
      }
      console.log('');
    } catch (error) {
      console.log(`❌ ${error.origin} - Error: ${error.error}\n`);
    }
  }
  
  console.log('💡 If you see ❌ for your frontend port, the server needs to be restarted');
  console.log('   to pick up the new CORS configuration.');
}

if (require.main === module) {
  testMultipleOrigins().catch(console.error);
}