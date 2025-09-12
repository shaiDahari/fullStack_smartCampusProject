#!/usr/bin/env node

/**
 * Backend Test Script
 * Quick test to verify the backend server starts and responds
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

function testConnection(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: JSON.parse(data) });
      });
    });
    
    request.on('error', reject);
    request.setTimeout(timeout, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function startAndTestBackend() {
  console.log('🌱 Garden Guardian Backend Test');
  console.log('================================');
  
  // First, install dependencies
  console.log('📦 Installing backend dependencies...');
  const install = spawn('npm', ['install'], {
    cwd: path.join(__dirname, 'server'),
    stdio: 'inherit',
    shell: true
  });
  
  await new Promise((resolve, reject) => {
    install.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Dependencies installed');
        resolve();
      } else {
        reject(new Error(`Install failed with code ${code}`));
      }
    });
  });
  
  // Start the server
  console.log('🚀 Starting backend server...');
  const server = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'server'),
    stdio: 'pipe',
    shell: true
  });
  
  let serverOutput = '';
  server.stdout.on('data', (data) => {
    serverOutput += data.toString();
    process.stdout.write(data);
  });
  
  server.stderr.on('data', (data) => {
    console.error('Server error:', data.toString());
  });
  
  // Wait for server to start
  console.log('⏳ Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test endpoints
  const endpoints = [
    'http://localhost:8001/',
    'http://localhost:8001/api/docs',
    'http://localhost:8001/sensors',
    'http://localhost:8001/plants'
  ];
  
  console.log('🧪 Testing API endpoints...');
  for (const endpoint of endpoints) {
    try {
      const result = await testConnection(endpoint);
      console.log(`✅ ${endpoint} - Status: ${result.status}`);
      if (endpoint.includes('sensors') || endpoint.includes('plants')) {
        console.log(`   Data count: ${result.data.length} items`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }
  
  // Clean up
  console.log('\n🛑 Stopping server...');
  server.kill('SIGTERM');
  
  setTimeout(() => {
    server.kill('SIGKILL');
    process.exit(0);
  }, 2000);
}

if (require.main === module) {
  startAndTestBackend().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}