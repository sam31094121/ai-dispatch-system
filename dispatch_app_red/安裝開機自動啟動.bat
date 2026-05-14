@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 兆櫃系統 - 開機自動啟動安裝

set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET_BAT=%~dp0極速啟動.bat"
set "VBS_PATH=%STARTUP_DIR%\兆櫃AI派單系統.vbs"

echo =======================================================
echo 安裝開機自動啟動
echo 目標: %VBS_PATH%
echo =======================================================

:: 建立 VBScript 包裝器（靜默啟動，不顯示黑色 CMD 視窗）
(
echo Set ws = CreateObject^("WScript.Shell"^)
echo ws.Run """" ^& "%TARGET_BAT%" ^& """", 1, False
) > "%VBS_PATH%"

if exist "%VBS_PATH%" (
    echo.
    echo [成功] 開機自動啟動已安裝！
    echo 下次開機將自動啟動 兆櫃 AI 派單系統。
    echo.
    echo 若要移除自動啟動，請執行: 移除開機自動啟動.bat
) else (
    echo [失敗] 安裝失敗，請以系統管理員身分重新執行此腳本。
)

echo =======================================================
pause
