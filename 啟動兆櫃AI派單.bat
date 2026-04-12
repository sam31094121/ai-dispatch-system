@echo off
chcp 65001 >nul
title 兆櫃 AI 派單系統
echo.
echo 啟動單一正式版本：dispatch_app_red
echo 服務網址：http://localhost:3000
echo.
cd /d "%~dp0dispatch_app_red"
npm start
pause
