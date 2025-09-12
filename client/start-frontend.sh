#!/bin/bash

echo "🌱 Garden Guardian Frontend Setup"
echo "====================================="

echo "📦 Installing Node.js dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo "🚀 Starting development server..."
echo "📍 Frontend will be available at: http://localhost:5173"
echo "🛑 Press Ctrl+C to stop the server"

npm run dev