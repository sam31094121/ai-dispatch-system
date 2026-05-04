@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 兆櫃 AI 派單系統

set "PORT=3001"
set "APP_URL=http://localhost:%PORT%/mobile.html"
set "HEALTH_URL=http://localhost:%PORT%/api/health"

echo =======================================================
echo 兆櫃 AI 派單系統｜正在初始化啟動程序...
echo =======================================================

echo [Step 1] 正在檢查 %PORT% 埠號佔用情況...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING 2^>nul') do (
    echo [System] 發現舊有程序 PID %%a，正在關閉...
    taskkill /PID %%a /F >nul 2>&1
)

echo [Step 2] 正在啟動 Node.js 伺服器...
start "Zhaogui Server Engine" /min cmd /c "set AUTO_OPEN_BROWSER=0&& set PORT=%PORT%&& npm start"

echo [Step 3] 正在等待健康檢查通過...
for /l %%i in (1,1,45) do (
    powershell -NoProfile -Command "try { Invoke-WebRequest -Uri '%HEALTH_URL%' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
    if not errorlevel 1 goto READY
    timeout /t 1 >nul
)

echo [Warning] 健康檢查尚未回應，仍嘗試開啟網頁。
goto OPEN_PAGE

:READY
echo [Step 4] 服務已就緒，正在開啟網頁...

:OPEN_PAGE
start "" "%APP_URL%"

echo =======================================================
echo 啟動完成！網址：%APP_URL%
echo =======================================================
timeout /t 3 >nul
exit
