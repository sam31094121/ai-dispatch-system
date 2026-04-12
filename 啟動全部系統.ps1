Clear-Host
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppRoot = Join-Path $ProjectRoot 'dispatch_app_red'

Write-Host "啟動單一正式版本：dispatch_app_red" -ForegroundColor Cyan
Write-Host "服務網址：http://localhost:3000" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$AppRoot'; npm start"
