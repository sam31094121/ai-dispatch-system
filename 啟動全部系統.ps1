# 兆櫃 AI 派單系統 — 一鍵全部開啟 (PowerShell 優化版)
Clear-Host
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  兆櫃 AI 派單系統 — 一鍵全部開啟" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$PROJECT_ROOT = "C:\Users\DRAGON\Desktop\兆櫃系統"

Write-Host "📌 [1/3] 正在啟動 ai-dispatch-system 後端 (Port 3001)..." -ForegroundColor Yellow
Start-Process npx -ArgumentList "tsx server/index.ts" -WorkingDirectory "$PROJECT_ROOT\ai-dispatch-system"

Write-Host "📌 [2/3] 正在啟動 ai-dispatch-system 前端 (Port 5173)..." -ForegroundColor Yellow
Start-Process npx -ArgumentList "vite" -WorkingDirectory "$PROJECT_ROOT\ai-dispatch-system"

Write-Host "📌 [3/3] 正在啟動 兆櫃AI派單_強化版 (Port 3000)..." -ForegroundColor Yellow
Start-Process node -ArgumentList "server.js" -WorkingDirectory "$PROJECT_ROOT\兆櫃AI派單_強化版"

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ 全部系統已在獨立視窗開啟！" -ForegroundColor Green
Write-Host "🔗 主系統前端：http://localhost:5173" -ForegroundColor Green
Write-Host "🔗 強化版系統：http://localhost:3000" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "提示：稍等數秒待伺服器初始化完成後即可存取。"
Start-Sleep -Seconds 3
