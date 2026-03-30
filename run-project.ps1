$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"

function Start-ProjectTerminal {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Title,
        [Parameter(Mandatory = $true)]
        [string]$Command
    )

    Start-Process powershell.exe -ArgumentList @(
        "-NoExit",
        "-Command",
        "`$Host.UI.RawUI.WindowTitle = '$Title'; $Command"
    )
}

if (-not (Test-Path $backendDir)) {
    throw "Backend folder not found: $backendDir"
}

if (-not (Test-Path $frontendDir)) {
    throw "Frontend folder not found: $frontendDir"
}

$backendCommand = @"
Set-Location '$backendDir'
if (-not (Test-Path '.venv\Scripts\python.exe')) {
    Write-Host 'Creating backend virtual environment...' -ForegroundColor Yellow
    python -m venv .venv
}
& '.venv\Scripts\python.exe' -m pip install -r requirements.txt
Write-Host 'Starting FastAPI backend on http://localhost:8000' -ForegroundColor Green
& '.venv\Scripts\python.exe' -m uvicorn main:app --reload --port 8000
"@

$frontendCommand = @"
Set-Location '$frontendDir'
if (-not (Test-Path 'node_modules')) {
    Write-Host 'Installing frontend dependencies...' -ForegroundColor Yellow
    npm.cmd install
}
Write-Host 'Starting Vite frontend on http://localhost:5173' -ForegroundColor Green
npm.cmd run dev
"@

Start-ProjectTerminal -Title "Spam Detection Backend" -Command $backendCommand
Start-Sleep -Seconds 1
Start-ProjectTerminal -Title "Spam Detection Frontend" -Command $frontendCommand

Write-Host "Opened backend and frontend terminals." -ForegroundColor Green
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "If PowerShell blocks the script, run:" -ForegroundColor Yellow
Write-Host "powershell -ExecutionPolicy Bypass -File .\run-project.ps1"
