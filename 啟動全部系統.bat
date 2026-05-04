@echo off
chcp 65001 >nul
title Zhaogui AI Dispatch System - Launcher

set "PROJECT_ROOT=%~dp0"

echo =======================================================
echo Starting Zhaogui AI Dispatch System and opening browser...
echo =======================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command "$root=$env:PROJECT_ROOT; $script=Get-ChildItem -LiteralPath $root -Filter '*.ps1' | Select-Object -First 1; if (-not $script) { throw 'Cannot find launcher ps1.' }; & $script.FullName"

exit /b %ERRORLEVEL%
