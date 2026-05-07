@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Zhaogui AI Dispatch System

rem ---- 參數說明 ----
rem %1 : 模式 (quick) - 跳過健康檢查直接開啟頁面
rem %2 : 自訂 port (預設 3001)
rem %3 : 自訂目標頁面 (預設 /mobile.html)

set "DEFAULT_PORT=3001"
set "DEFAULT_PATH=/mobile.html"

set "PORT=%DEFAULT_PORT%"
if not "%2"=="" set "PORT=%2%"
set "APP_URL=http://localhost:%PORT%%DEFAULT_PATH%"
if not "%3"=="" set "APP_URL=http://localhost:%PORT%%3%"
set "HEALTH_URL=http://localhost:%PORT%/api/health"

echo =======================================================
echo Zhaogui AI Dispatch System - starting...
echo =======================================================

rem ---- Quick mode ----
if "%1"=="quick" (
  echo [Quick Mode] Starting server and opening browser without health check.
  start "Zhaogui Server Engine" /min cmd /c "set AUTO_OPEN_BROWSER=0 && set PORT=%PORT% && node server.js"
  timeout /t 2 >nul
  start "" "%APP_URL%"
  goto END
)

rem ---- 檢查既有執行的 port ----
echo [Step 1] Checking port %PORT%...
for /f "tokens=5" %%a in ('netstat -ano | findstr :%PORT% | findstr LISTENING 2^>nul') do (
    echo [System] Found old server PID %%a. Stopping it...
    taskkill /PID %%a /F >nul 2>&1
)

rem ---- 啟動 Node 伺服器 ----
echo [Step 2] Starting Node.js server...
start "Zhaogui Server Engine" /min cmd /c "set AUTO_OPEN_BROWSER=0 && set PORT=%PORT% && node server.js"

rem ---- 健康檢查 (最長 30 秒) ----
echo [Step 3] Waiting for health check (max 30s)...
for /l %%i in (1,1,30) do (
    powershell -NoProfile -Command "try { Invoke-WebRequest -Uri '%HEALTH_URL%' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
    if not errorlevel 1 goto READY
    timeout /t 1 >nul
)

echo [Warning] Health check did not respond yet. Opening page anyway.

goto OPEN_PAGE

:READY
 echo [Step 4] Server is ready. Opening browser...

goto OPEN_PAGE

:OPEN_PAGE
 start "" "%APP_URL%"

:END
 echo =======================================================
echo Done. URL: %APP_URL%
 echo =======================================================
timeout /t 3 >nul
exit
