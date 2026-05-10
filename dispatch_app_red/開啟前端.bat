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
echo  [94m[系統] 正在以 Turbo 模式優化啟動環境... [0m
echo.

if "%IS_ALL%"=="1" (
    node scripts/quickLaunch.js mobile.html
    node scripts/quickLaunch.js index.html
    node scripts/quickLaunch.js broadcast.html
) else (
    node scripts/quickLaunch.js %PAGE%
)

echo.
echo  [96m====================================================== [0m
echo  [92m  啟動優化成功！系統已進入極速運行狀態。 [0m
echo  [96m====================================================== [0m
timeout /t 2 >nul
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
