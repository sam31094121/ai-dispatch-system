@echo off
chcp 65001 >nul
title Zhaogui AI Dispatch System - Launcher

set "PROJECT_ROOT=%~dp0"
set "START_SCRIPT=%PROJECT_ROOT%啟動全部系統.ps1"

echo =======================================================
echo Starting Zhaogui AI Dispatch System and opening browser...
echo =======================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%START_SCRIPT%"

echo.
echo Launcher finished.
pause
