<#
.SYNOPSIS
    Script de PowerShell para ejecutar el seed según el ambiente.
.EXAMPLE
    .\scripts\deploy-seed.ps1 -Env local
    .\scripts\deploy-seed.ps1 -Env dev
    .\scripts\deploy-seed.ps1 -Env qa
    .\scripts\deploy-seed.ps1 -Env prod
    .\scripts\deploy-seed.ps1 -Env prod -Force
#>

param(
    [Parameter(Position=0)]
    [ValidateSet("local", "dev", "qa", "prod")]
    [string]$Env = "local",

    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Red Thread — Seed de Sistema por Ambiente" -ForegroundColor Cyan
Write-Host " Ambiente objetivo: $Env" -ForegroundColor Yellow
if ($Force) {
    Write-Host " Modo: FORZADO (-Force activado)" -ForegroundColor Magenta
}
Write-Host "==================================================" -ForegroundColor Cyan

$backendDir = Join-Path $PSScriptRoot "..\backend"
Set-Location $backendDir

# Buscar Python virtualenv o del sistema
$pythonExe = Join-Path $backendDir "venv\Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    $pythonExe = "python"
}

$argsList = @("-m", "src.core.seed", "--env", $Env)
if ($Force) {
    $argsList += "--force"
}

Write-Host "Ejecutando seed..." -ForegroundColor Gray
& $pythonExe @argsList

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Seed finalizado correctamente para $Env." -ForegroundColor Green
} else {
    Write-Host "❌ Error ejecutando seed." -ForegroundColor Red
    exit $LASTEXITCODE
}
