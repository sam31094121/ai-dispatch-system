@echo off
chcp 65001 >nul
title 兆櫃 AI 派單系統 - 總啟動器

set "PROJECT_ROOT=%~dp0"
set "START_SCRIPT=%PROJECT_ROOT%啟動全部系統.ps1"

echo =======================================================
echo 兆櫃 AI 派單系統｜正在啟動並開啟網頁...
echo =======================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%START_SCRIPT%"

echo.
echo 啟動程序已完成。
pause
