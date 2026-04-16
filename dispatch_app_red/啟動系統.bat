@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 兆櫃 AI 派單系統 - Core Engine

echo =======================================================
echo 兆櫃 AI 派單系統｜正在初始化自動啟動程序...
echo =======================================================

:: 1. 清理舊有程序
echo [Step 1] 正在檢查 3000 埠號佔用情況...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo [System] 發現舊有程序 (PID: %%a)，正在強制關閉...
    taskkill /PID %%a /F >nul 2>&1
)

:: 2. 啟動伺服器 (使用 start /b 讓它在背景執行或同視窗，這裡我們用 start cmd 另開視窗以便觀察 Log)
echo [Step 2] 正在啟動 Node.js 伺服器...
start "Zhaogui Server Engine" /min npm start

:: 3. 智慧等待伺服器就緒
echo [Step 3] 正在等待伺服器就緒 (http://localhost:3000)...
:WAIT_LOOP
timeout /t 1 >nul
netstat -ano | findstr :3000 | findstr LISTENING >nul
if errorlevel 1 (
    echo | set /p="."
    goto WAIT_LOOP
)

:: 4. 開啟網頁
echo.
echo [Step 4] 服務已就緒！瀏覽器將由系統自動開啟...
echo [Info] 若瀏覽器沒有跳出，請手動開啟 http://localhost:3000

echo =======================================================
echo 啟動完成！您可以最小化此視窗，但請勿關閉。
echo =======================================================
timeout /t 5 >nul
exit
