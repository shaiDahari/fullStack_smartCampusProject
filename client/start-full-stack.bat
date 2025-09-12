@echo off
echo 🌱 Garden Guardian Full Stack Setup
echo =====================================

echo 📦 Installing frontend dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

echo 📦 Installing backend dependencies...
call npm run server:install

if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies  
    pause
    exit /b 1
)

echo ✅ All dependencies installed successfully
echo.
echo 🚀 Starting both frontend and backend servers...
echo 📍 Frontend: http://localhost:5173
echo 📍 Backend: http://localhost:8080
echo 📖 API docs: http://localhost:8080/api/docs
echo 🛑 Press Ctrl+C to stop both servers
echo.

start /B npm run server
timeout /t 3 /nobreak > nul
call npm run dev