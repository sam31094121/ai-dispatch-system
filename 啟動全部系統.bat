@echo off
chcp 65001 >nul
title 兆櫃 AI 派單系統 — 一鍵全開

echo ═══════════════════════════════════════════
echo   兆櫃 AI 派單系統 — 一鍵全部開啟 (優化版)
echo ═══════════════════════════════════════════
echo.

set "PROJECT_ROOT=C:\Users\DRAGON\Desktop\兆櫃系統"

echo 📌 [1/3] 正在啟動 `ai-dispatch-system` 後端 (Port 3001)...
cd /d "%PROJECT_ROOT%\ai-dispatch-system"
start "兆櫃-主系統後端" cmd /c "npx tsx server/index.ts"

echo 📌 [2/3] 正在啟動 `ai-dispatch-system` 前端 (Port 5173)...
start "兆櫃-主系統前端" cmd /c "npx vite"

echo 📌 [3/3] 正在啟動 `兆櫃AI派單_強化版` (Port 3000)...
cd /d "%PROJECT_ROOT%\兆櫃AI派單_強化版"
start "兆櫃-強化版後端" cmd /c "node server.js"

echo.
echo ═══════════════════════════════════════════
echo ✅ 全部系統啟動指令已發送！
echo 🔗 主系統前端：http://localhost:5173
echo 🔗 主系統後端：http://localhost:3001
echo 🔗 強化版系統：http://localhost:3000
echo ═══════════════════════════════════════════
echo.
echo 提示：請確認視窗是否正常運行。
timeout /t 5
