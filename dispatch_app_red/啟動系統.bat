@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 兆櫃 AI 派單系統

echo =======================================================
echo 兆櫃 AI 派單系統｜正在初始化啟動程序...
echo =======================================================

:: 1. 清理舊有程序
echo [Step 1] 正在檢查 3001 埠號佔用情況...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING 2^>nul') do (
    echo [System] 發現舊有程序 (PID: %%a)，正在強制關閉...
    taskkill /PID %%a /F >nul 2>&1
)

:: 2. 啟動伺服器（載入 .env 環境變數）
echo [Step 2] 正在啟動 Node.js 伺服器...
start "Zhaogui Server Engine" /min cmd /c "node --env-file=.env server.js"

:: 3. 智慧等待伺服器就緒
echo [Step 3] 正在等待伺服器就緒...
:WAIT_LOOP
timeout /t 1 >nul
netstat -ano | findstr :3001 | findstr LISTENING >nul 2>&1
if errorlevel 1 goto WAIT_LOOP

:: 4. 開啟網頁（server.js 也會自動開啟，此為備援）
echo [Step 4] 服務就緒！開啟網頁中...
start "" "http://localhost:3001"

echo =======================================================
echo 啟動完成！您可以最小化此視窗，但請勿關閉。
echo =======================================================
timeout /t 3 >nul
exit
