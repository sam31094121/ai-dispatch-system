@echo off
chcp 65001 >nul
title 兆櫃 AI 派單系統｜終極串連優化控制台 v2.5
cd /d "%~dp0"

echo.
echo   [96m====================================================== [0m
echo   [96m          兆櫃 AI 派單系統｜全線串連優化升級 [0m
echo   [96m====================================================== [0m
echo.
echo   [94m[系統] 正在執行「立此類推」自動校準與環境優化... [0m
echo.

node scripts/control.js

if errorlevel 1 (
    echo.
    echo   [91m[錯誤] 串連優化失敗，請檢查 logs 或聯絡工程師。 [0m
    pause
    exit /b 1
)

echo.
echo   [92m[完成] 全系統已成功串連並於背景執行。 [0m
echo.
timeout /t 5
exit


