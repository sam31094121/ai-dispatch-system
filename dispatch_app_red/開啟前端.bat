@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem ---- 參數說明 ----
rem %1 : port (預設 3001)
rem %2 : 目標頁面 (預設 /mobile.html)

set "PORT=3001"
set "PAGE=/mobile.html"
if not "%1"=="" set "PORT=%1"
if not "%2"=="" set "PAGE=%2"

rem ---- 檢查是否已有服務在此 port ----
set "SERVER_RUNNING=no"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING 2^>nul') do (
    set "SERVER_RUNNING=yes"
)

if "%SERVER_RUNNING%"=="no" (
    echo [Info] 未偵測到執行中的伺服器，啟動 Node.js 伺服器...
    start "Zhaogui Server Engine" /min cmd /c "set AUTO_OPEN_BROWSER=0 && set PORT=%PORT% && node server.js"
    rem 等待伺服器啟動（最長 15 秒）
    set "WAIT=0"
    :waitLoop
    timeout /t 1 >nul
    set /a WAIT+=1
    powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://localhost:%PORT%/api/health' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
    if not errorlevel 1 goto openPage
    if %WAIT% geq 15 goto openPage
    goto waitLoop
) else (
    echo [Info] 已偵測到執行中的伺服器，直接開啟前端。
)

:openPage
start "" "http://localhost:%PORT%%PAGE%"
exit
