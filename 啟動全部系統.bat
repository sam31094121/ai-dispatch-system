@echo off
chcp 65001 >nul
title 兆櫃 AI 派單系統
set "PROJECT_ROOT=%~dp0"

echo 啟動單一正式版本：dispatch_app_red
start "兆櫃AI派單" cmd /k "cd /d ""%PROJECT_ROOT%dispatch_app_red"" && npm start"

echo.
echo 服務網址：http://localhost:3000
echo.
timeout /t 3 >nul
