@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 兆櫃 AI 派單系統

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do (
  taskkill /PID %%a /F >nul 2>&1
)

echo.
echo 啟動單一正式版本：dispatch_app_red
echo 服務網址：http://localhost:3000
echo.
npm start
pause
