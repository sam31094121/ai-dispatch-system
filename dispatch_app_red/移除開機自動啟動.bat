@echo off
chcp 65001 >nul
title 兆櫃系統 - 移除開機自動啟動

set "VBS_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\兆櫃AI派單系統.vbs"

if exist "%VBS_PATH%" (
    del "%VBS_PATH%"
    echo [成功] 開機自動啟動已移除。
) else (
    echo [提示] 找不到自動啟動設定，可能尚未安裝。
)
pause
