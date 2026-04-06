@echo off
cd /d "%~dp0"
title ⚡ 兆櫃 AI 派單中樞系統

:: 清除舊進程（避免 port 3000 佔用）
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do (
  taskkill /PID %%a /F >nul 2>&1
)

echo.
echo  啟動中... 請稍候
echo.
node server.mjs
pause
