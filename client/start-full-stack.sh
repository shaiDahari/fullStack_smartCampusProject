#!/bin/bash

echo "🌱 Garden Guardian Full Stack Setup"
echo "====================================="

echo "📦 Installing frontend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "📦 Installing backend dependencies..."
npm run server:install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo "✅ All dependencies installed successfully"
echo ""
echo "🚀 Starting both frontend and backend servers..."
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend: http://localhost:8080"
echo "📖 API docs: http://localhost:8080/api/docs"
echo "🛑 Press Ctrl+C to stop both servers"
echo ""

# Start backend server in background
npm run server &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
npm run dev

# Clean up background process when frontend exits
kill $BACKEND_PID 2>/dev/null