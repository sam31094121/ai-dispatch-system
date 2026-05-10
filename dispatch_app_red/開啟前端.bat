@echo off
chcp 65001 >nul
title 兆櫃 AI 派單系統｜快速開啟工具 v2.1
setlocal enabledelayedexpansion

cd /d "%~dp0"

:: 設定
set "PORT=3001"
set "HOST=http://localhost:%PORT%"

:menu
cls
echo.
echo   [96m====================================================== [0m
echo   [96m          兆櫃 AI 派單系統｜前端啟動控制台 v2.1 [0m
echo   [96m====================================================== [0m
echo.
echo   [93m[A] [0m  [1;92m自動全部開啟 [0m (Mobile + Desktop + Broadcast)
echo   [96m------------------------------------------------------ [0m
echo   [93m[1] [0m 開啟  [1m行動版儀表板 [0m (Mobile)
echo   [93m[2] [0m 開啟  [1m電腦版戰情室 [0m (Desktop)
echo   [93m[3] [0m 開啟  [1m廣播看板模式 [0m (Broadcast)
echo   [93m[4] [0m 僅重啟後端服務 (Restart Server)
echo   [93m[Q] [0m 退出系統
echo.
echo   [96m------------------------------------------------------ [0m
set /p choice=" [97m請選擇欲執行的項目 [A, 1-4, Q]:  [0m"

if /i "%choice%"=="A" goto launch_all
if /i "%choice%"=="1" set "PAGE=mobile.html" & goto launch
if /i "%choice%"=="2" set "PAGE=index.html" & goto launch
if /i "%choice%"=="3" set "PAGE=broadcast.html" & goto launch
if /i "%choice%"=="4" set "PAGE=NONE" & goto launch
if /i "%choice%"=="q" exit
if /i "%choice%"=="" goto launch_all
goto menu

:launch_all
set "IS_ALL=1"
:: 預設第一個開啟的是行動版，其餘的在後面補上
set "PAGE=mobile.html"
goto launch_process

:launch
set "IS_ALL=0"
goto launch_process

:launch_process
echo.
echo  [94m[系統] 正在準備啟動環境... [0m

:: 1. 檢查伺服器是否在運行
netstat -ano | findstr :%PORT% | findstr LISTENING >nul
if %errorlevel% neq 0 (
    echo  [33m[資訊] 偵測到服務未啟動，正在背景初始化伺服器... [0m
    start "兆櫃系統引擎" /min cmd /c "set AUTO_OPEN_BROWSER=0 && node server.js"
    timeout /t 4 >nul
) else (
    echo  [92m[就緒] 伺服器已在運行中。 [0m
)

if "%PAGE%"=="NONE" (
    echo  [92m[完成] 伺服器已重啟/確認運行中。 [0m
    pause
    goto menu
)

:: 2. 執行開啟
echo  [94m[執行] 正在以專業模式開啟網頁... [0m

if "%IS_ALL%"=="1" (
    call :open_browser "mobile.html"
    timeout /t 1 >nul
    call :open_browser "index.html"
    timeout /t 1 >nul
    call :open_browser "broadcast.html"
) else (
    call :open_browser "%PAGE%"
)

echo.
echo  [96m====================================================== [0m
echo  [92m  啟動成功！請切換至瀏覽器視窗查看。 [0m
echo  [96m====================================================== [0m
timeout /t 3 >nul
exit

:: --- 瀏覽器開啟子程式 ---
:open_browser
set "TARGET_PAGE=%~1"
where msedge >nul 2>nul
if %errorlevel% equ 0 (
    start msedge --app=%HOST%/launcher.html?page=%TARGET_PAGE%
    exit /b
)
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=%HOST%/launcher.html?page=%TARGET_PAGE%
    exit /b
)
start %HOST%/launcher.html?page=%TARGET_PAGE%
exit /b
