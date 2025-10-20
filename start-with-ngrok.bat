@echo off
echo Starting Smart Campus with ngrok sharing...
echo.

REM Check if ngrok is installed
ngrok version >nul 2>&1
if errorlevel 1 (
    echo ERROR: ngrok is not installed or not in PATH
    echo Please install ngrok from https://ngrok.com/download
    echo.
    pause
    exit /b 1
)

echo 1. Starting backend server...
cd server
start "Backend Server" cmd /k "npm run dev"
cd ..

echo 2. Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo 3. Starting ngrok tunnel for backend...
start "ngrok Backend" cmd /k "ngrok http 8080 --region=us"

echo 4. Waiting for ngrok tunnel...
timeout /t 5 /nobreak >nul

echo 5. Starting frontend...
cd client
start "Frontend Dev" cmd /k "npm run dev"
cd ..

echo.
echo ===== SETUP COMPLETE =====
echo.
echo NEXT STEPS:
echo 1. Check the ngrok terminal for your HTTPS URL (e.g., https://abc123.ngrok-free.app)
echo 2. Create client\.env.local with:
echo    VITE_API_BASE_URL=https://YOUR_NGROK_URL/api
echo 3. Restart the frontend (Ctrl+C in frontend terminal, then npm run dev)
echo 4. Share the frontend URL with your team
echo.
echo All terminals will remain open. Close this window when done.
pause