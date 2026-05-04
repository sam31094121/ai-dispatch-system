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
      Write-Host "Found old server PID $processId. Stopping it..." -ForegroundColor Yellow
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
  }
}

Write-Host "Starting Zhaogui AI Dispatch System..." -ForegroundColor Cyan
Write-Host "App root: $AppRoot" -ForegroundColor DarkGray
Write-Host "App URL: $Url" -ForegroundColor Green

if (-not (Test-Path (Join-Path $AppRoot 'package.json'))) {
  throw "Cannot find dispatch_app_red/package.json. Please check the project folder."
}

Stop-PortOwner -LocalPort $Port

$command = @"
`$env:AUTO_OPEN_BROWSER='0'
Set-Location '$AppRoot'
npm start
"@

Start-Process powershell -WindowStyle Minimized -ArgumentList '-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $command

Write-Host "Waiting for server health check..." -ForegroundColor Cyan
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
  Write-Host "Health check did not respond yet. Opening page anyway: $Url" -ForegroundColor Yellow
} else {
  Write-Host "Server is ready. Opening page..." -ForegroundColor Green
}

Start-Process $Url
