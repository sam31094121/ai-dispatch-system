@echo off
chcp 65001 >nul
title 兆櫃 AI 派單系統
echo.
echo  ═══════════════════════════════════════
echo     兆櫃 AI 派單系統 — 啟動中...
echo  ═══════════════════════════════════════
echo.
cd /d "C:\Users\DRAGON\Desktop\兆櫃系統\ai-dispatch-system"
echo  ✅ 正在啟動後端 + 前端...
echo  📌 後端：http://localhost:3001
echo  📌 前端：http://localhost:5173
echo.
npm run start
pause
