#!/usr/bin/env node

/**
 * Simple Backend Startup Script
 * Just starts the server without complex dependency management
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function startServer() {
  console.log('🌱 Garden Guardian Backend - Simple Start');
  console.log('=========================================');
  
  const serverPath = path.join(__dirname, 'server');
  
  // Check if server directory exists
  if (!fs.existsSync(serverPath)) {
    console.error('❌ Server directory not found:', serverPath);
    process.exit(1);
  }
  
  // Check if package.json exists
  const packagePath = path.join(serverPath, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.error('❌ Server package.json not found:', packagePath);
    process.exit(1);
  }
  
  console.log('📁 Server directory found:', serverPath);
  console.log('🚀 Starting server directly...');
  console.log('📍 Server will be available at: http://localhost:8080');
  console.log('🛑 Press Ctrl+C to stop the server\n');
  
  // Start the server directly with node
  const server = spawn('node', ['server.js'], {
    cwd: serverPath,
    stdio: 'inherit',
    shell: true
  });
  
  server.on('error', (error) => {
    console.error('❌ Failed to start server:', error.message);
  });
  
  server.on('close', (code) => {
    console.log(`\n👋 Server stopped with code ${code}`);
  });
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping server...');
    server.kill('SIGINT');
    process.exit(0);
  });
}

startServer();