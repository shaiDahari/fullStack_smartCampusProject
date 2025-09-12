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
echo 🚀 Choose how to start the application:
echo [1] Start both frontend and backend together
echo [2] Start frontend only (port 5173)
echo [3] Start backend only (port 8000)
echo.

set /p choice=Enter your choice (1/2/3): 

if "%choice%"=="1" (
    echo 🚀 Starting both frontend and backend servers...
    echo 📍 Frontend: http://localhost:5173
    echo 📍 Backend: http://localhost:8000
    echo 🛑 Press Ctrl+C to stop both servers
    start /B npm run server
    timeout /t 3 /nobreak > nul
    call npm run dev
) else if "%choice%"=="2" (
    echo 🚀 Starting frontend only...
    echo 📍 Frontend will be available at: http://localhost:5173
    echo ⚠️  Backend server needs to be started separately
    call npm run dev
) else if "%choice%"=="3" (
    echo 🚀 Starting backend only...
    echo 📍 Backend will be available at: http://localhost:8000
    call npm run server
) else (
    echo Invalid choice. Starting frontend only...
    call npm run dev
)