@echo off
chcp 65001 >nul
title 兆櫃 AI 派單系統｜全線串連控制台
cd /d "%~dp0"

echo ======================================================
echo          兆櫃 AI 派單系統｜終極串連優化版
echo ======================================================
echo.
echo  正在初始化系統環境並串連資料庫...
echo.

node scripts/control.js

if errorlevel 1 (
    echo.
    echo [錯誤] 系統串連失敗，請檢查 logs 或聯絡工程師。
    pause
    exit /b 1
)

echo.
echo [完成] 系統已成功串連並於背景執行。
echo.
timeout /t 5
exit

