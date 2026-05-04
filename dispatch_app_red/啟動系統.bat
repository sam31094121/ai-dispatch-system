@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Zhaogui AI Dispatch System

set "PORT=3001"
set "APP_URL=http://localhost:%PORT%/mobile.html"
set "HEALTH_URL=http://localhost:%PORT%/api/health"

echo =======================================================
echo Zhaogui AI Dispatch System - starting...
echo =======================================================

echo [Step 1] Checking port %PORT%...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING 2^>nul') do (
    echo [System] Found old server PID %%a. Stopping it...
    taskkill /PID %%a /F >nul 2>&1
)

echo [Step 2] Starting Node.js server...
start "Zhaogui Server Engine" /min cmd /c "set AUTO_OPEN_BROWSER=0&& set PORT=%PORT%&& npm start"

echo [Step 3] Waiting for health check...
for /l %%i in (1,1,45) do (
    powershell -NoProfile -Command "try { Invoke-WebRequest -Uri '%HEALTH_URL%' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
    if not errorlevel 1 goto READY
    timeout /t 1 >nul
)

echo [Warning] Health check did not respond yet. Opening page anyway.
goto OPEN_PAGE

:READY
echo [Step 4] Server is ready. Opening browser...

:OPEN_PAGE
start "" "%APP_URL%"

echo =======================================================
echo Done. URL: %APP_URL%
echo =======================================================
timeout /t 3 >nul
exit
