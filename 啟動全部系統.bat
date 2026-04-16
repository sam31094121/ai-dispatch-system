@echo off
chcp 65001 >nul
title 兆櫃 AI 派單系統 - 總啟動器
set "PROJECT_ROOT=%~dp0"

echo =======================================================
echo 正在啟動 兆櫃 AI 派單總系統...
echo =======================================================

cd /d "%PROJECT_ROOT%dispatch_app_red"
start "" "啟動系統.bat"

echo.
echo 總啟動程序已發送。
exit
