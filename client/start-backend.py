#!/usr/bin/env node

/**
 * Garden Guardian Backend Startup Script
 * Starts the Node.js Express backend server
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkNodeVersion() {
    const version = process.version;
    const majorVersion = parseInt(version.split('.')[0].substring(1));
    
    if (majorVersion < 16) {
        console.log("❌ Node.js 16+ is required");
        process.exit(1);
    }
    console.log(`✅ Using Node.js ${version}`);
}

function installDependencies() {
    console.log("📦 Installing Node.js dependencies...");
    
    return new Promise((resolve, reject) => {
        const npm = spawn('npm', ['install'], {
            cwd: path.join(__dirname, 'server'),
            stdio: 'inherit',
            shell: true
        });
        
        npm.on('close', (code) => {
            if (code === 0) {
                console.log("✅ Dependencies installed successfully");
                resolve();
            } else {
                console.log("❌ Failed to install dependencies");
                reject(new Error(`npm install failed with code ${code}`));
            }
        });
    });
}

async function startServer() {
    console.log("🚀 Starting Garden Guardian API server...");
    console.log("📍 Server will be available at: http://localhost:8000");
    console.log("📖 API documentation at: http://localhost:8000/api/docs");
    console.log("🛑 Press Ctrl+C to stop the server\n");
    
    const server = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, 'server'),
        stdio: 'inherit',
        shell: true
    });
    
    process.on('SIGINT', () => {
        console.log("\n👋 Server stopped");
        server.kill('SIGINT');
        process.exit(0);
    });
    
    server.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
    });
}

async function main() {
    console.log("🌱 Garden Guardian Backend Setup");
    console.log("=" .repeat(40));
    
    try {
        checkNodeVersion();
        await installDependencies();
        await startServer();
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}