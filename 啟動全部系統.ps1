$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppRoot = Join-Path $ProjectRoot 'dispatch_app_red'
$Port = if ($env:PORT) { [int]$env:PORT } else { 3001 }
$Url = "http://localhost:$Port/mobile.html"
$HealthUrl = "http://localhost:$Port/api/health"

function Stop-PortOwner {
  param([int]$LocalPort)

  $connections = Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction SilentlyContinue
  foreach ($connection in $connections) {
    $processId = $connection.OwningProcess
    if ($processId -and $processId -ne $PID) {
      Write-Host "發現舊服務 PID $processId，正在關閉..." -ForegroundColor Yellow
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
  }
}

Write-Host "兆櫃 AI 派單系統啟動中..." -ForegroundColor Cyan
Write-Host "專案位置：$AppRoot" -ForegroundColor DarkGray
Write-Host "服務網址：$Url" -ForegroundColor Green

if (-not (Test-Path (Join-Path $AppRoot 'package.json'))) {
  throw "找不到 dispatch_app_red/package.json，請確認專案資料夾完整。"
}

Stop-PortOwner -LocalPort $Port

$command = @"
`$env:AUTO_OPEN_BROWSER='0'
Set-Location '$AppRoot'
npm start
"@

Start-Process powershell -WindowStyle Minimized -ArgumentList '-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $command

Write-Host "正在等待服務就緒..." -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 45; $i++) {
  try {
    Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 2 | Out-Null
    $ready = $true
    break
  } catch {
    Start-Sleep -Seconds 1
  }
}

if (-not $ready) {
  Write-Host "服務尚未回應健康檢查，仍會嘗試開啟網頁：$Url" -ForegroundColor Yellow
} else {
  Write-Host "服務已就緒，正在開啟網頁..." -ForegroundColor Green
}

Start-Process $Url
