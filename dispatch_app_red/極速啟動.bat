@echo off
chcp 65001 >nul
title 兆櫃 AI 派單系統｜全端首頁極速啟動
cd /d "%~dp0"

echo.
echo   [95m┌──────────────────────────────────────────────────┐ [0m
echo   [95m│        ZHAOGUI AI - 兆櫃系統極速發動器        │ [0m
echo   [95m└──────────────────────────────────────────────────┘ [0m
echo.
echo   [94m[系統] 正在優化環境並啟動全端首頁... [0m
echo.

:: 執行極速啟動腳本，預設開啟 index.html 並帶入優化參數
node scripts/quickLaunch.js index.html --optimize

if errorlevel 1 (
    echo.
    echo   [91m[錯誤] 啟動失敗。請檢查是否已安裝 Node.js 或伺服器衝突。 [0m
    pause
    exit /b 1
)

echo.
echo   [92m[完成] 系統已進入自動巡航模式。本視窗將自動關閉。 [0m
timeout /t 3 >nul
exit
