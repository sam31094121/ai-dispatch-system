@echo off
chcp 65001 >nul
title 兆櫃 AI 派單系統｜快速開啟工具
cd /d "%~dp0"

set "PORT=3001"

:menu
cls
echo ======================================================
echo          兆櫃 AI 派單系統｜前端開啟優化版
echo ======================================================
echo.
echo  [1] 開啟 行動版 (Mobile) - 預設
echo  [2] 開啟 電腦版戰情室 (Desktop)
echo  [3] 開啟 廣播看板 (Broadcast)
echo  [4] 僅啟動伺服器 (不開啟網頁)
echo  [Q] 退出
echo.
echo ======================================================
set /p choice="請選擇欲開啟的項目 [1-4, Q]: "

if /i "%choice%"=="1" set "PAGE=/mobile.html" & goto checkServer
if /i "%choice%"=="2" set "PAGE=/index.html" & goto checkServer
if /i "%choice%"=="3" set "PAGE=/broadcast.html" & goto checkServer
if /i choice=="" set "PAGE=/mobile.html" & goto checkServer
if /i "%choice%"=="4" set "PAGE=NONE" & goto checkServer
if /i "%choice%"=="q" exit
goto menu

:checkServer
rem ---- 檢查是否已有服務在此 port ----
set "SERVER_RUNNING=no"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING 2^>nul') do (
    set "SERVER_RUNNING=yes"
)

if "%SERVER_RUNNING%"=="no" (
    echo [Info] 偵測到伺服器未啟動，正在初始化環境...
    
    if "%PAGE%"=="NONE" (
        start "Zhaogui Server Engine" cmd /c "set AUTO_OPEN_BROWSER=0 && set PORT=%PORT% && node server.js"
        echo [OK] 伺服器已在背景啟動。
    ) else (
        echo [Info] 伺服器啟動後將自動導向至 %PAGE%
        start "Zhaogui Server Engine" cmd /c "set AUTO_OPEN_BROWSER=1 && set PORT=%PORT% && set OPEN_PAGE=%PAGE% && node server.js"
    )
    timeout /t 2 >nul
) else (
    echo [OK] 伺服器運行中，正在開啟網頁...
    if not "%PAGE%"=="NONE" (
        start "" "http://localhost:%PORT%%PAGE%"
    )
)

echo.
echo [完成] 系統已就緒。
timeout /t 3 >nul
exit

