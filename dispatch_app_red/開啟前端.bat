@echo off
chcp 65001 >nul
title 兆櫃 AI 派單系統｜快速開啟工具 v2.0
setlocal enabledelayedexpansion

cd /d "%~dp0"

:: 設定
set "PORT=3001"
set "HOST=http://localhost:%PORT%"

:menu
cls
echo.
echo   [96m====================================================== [0m
echo   [96m          兆櫃 AI 派單系統｜前端啟動控制台 v2.0 [0m
echo   [96m====================================================== [0m
echo.
echo   [93m[1] [0m 開啟  [1m行動版儀表板 [0m (Mobile) -  [92m推薦 [0m
echo   [93m[2] [0m 開啟  [1m電腦版戰情室 [0m (Desktop)
echo   [93m[3] [0m 開啟  [1m廣播看板模式 [0m (Broadcast)
echo   [93m[4] [0m 僅重啟後端服務 (Restart Server)
echo   [93m[Q] [0m 退出系統
echo.
echo   [96m------------------------------------------------------ [0m
set /p choice=" [97m請選擇欲執行的項目 [1-4, Q]:  [0m"

if /i "%choice%"=="1" set "PAGE=mobile.html" & goto launch
if /i "%choice%"=="2" set "PAGE=index.html" & goto launch
if /i "%choice%"=="3" set "PAGE=broadcast.html" & goto launch
if /i "%choice%"=="4" set "PAGE=NONE" & goto launch
if /i "%choice%"=="q" exit
if /i "%choice%"=="" set "PAGE=mobile.html" & goto launch
goto menu

:launch
echo.
echo  [94m[系統] 正在準備啟動環境... [0m

:: 1. 檢查伺服器是否在運行
netstat -ano | findstr :%PORT% | findstr LISTENING >nul
if %errorlevel% neq 0 (
    echo  [33m[資訊] 偵測到服務未啟動，正在背景初始化伺服器... [0m
    start "兆櫃系統引擎" /min cmd /c "set AUTO_OPEN_BROWSER=0 && node server.js"
    :: 等待伺服器啟動
    timeout /t 3 >nul
) else (
    echo  [92m[就緒] 伺服器已在運行中。 [0m
)

if "%PAGE%"=="NONE" (
    echo  [92m[完成] 伺服器已重啟/確認運行中。 [0m
    pause
    goto menu
)

:: 2. 決定開啟模式 (優先使用 Edge/Chrome 的 App 模式)
set "BROWSER_CMD="

:: 嘗試 Edge
where msedge >nul 2>nul
if %errorlevel% equ 0 (
    set "BROWSER_CMD=start msedge --app=%HOST%/launcher.html?page=%PAGE%"
) else (
    :: 嘗試 Chrome
    if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
        set "BROWSER_CMD=start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=%HOST%/launcher.html?page=%PAGE%"
    ) else (
        :: 預設瀏覽器
        set "BROWSER_CMD=start %HOST%/launcher.html?page=%PAGE%"
    )
)

echo  [94m[執行] 正在以專業模式開啟網頁... [0m
%BROWSER_CMD%

echo.
echo  [96m====================================================== [0m
echo  [92m  啟動成功！請切換至瀏覽器視窗查看。 [0m
echo  [96m====================================================== [0m
timeout /t 3 >nul
exit
