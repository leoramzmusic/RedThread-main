# Script para instalar el paquete de idioma español en Tesseract
# EJECUTAR COMO ADMINISTRADOR (Click derecho -> Ejecutar como administrador)

Write-Host "=== Instalador de idioma español para Tesseract ===" -ForegroundColor Cyan
Write-Host ""

# Verificar si se está ejecutando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Este script necesita ejecutarse como Administrador" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor:" -ForegroundColor Yellow
    Write-Host "1. Abre PowerShell como Administrador (click derecho -> Ejecutar como administrador)" -ForegroundColor White
    Write-Host "2. Navega a: cd '$PSScriptRoot'" -ForegroundColor White
    Write-Host "3. Ejecuta: .\install-spanish-lang.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Presiona cualquier tecla para salir..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

$tempFile = "$env:TEMP\spa.traineddata"
$destPath = "C:\Program Files\Tesseract-OCR\tessdata\spa.traineddata"

# Verificar si ya existe
if (Test-Path $destPath) {
    Write-Host "✓ El idioma español ya está instalado" -ForegroundColor Green
    Write-Host ""
    & tesseract --list-langs
    Write-Host ""
    Write-Host "Presiona cualquier tecla para continuar..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 0
}

# Verificar si el archivo temporal existe
if (Test-Path $tempFile) {
    Write-Host "✓ Archivo temporal encontrado" -ForegroundColor Green
} else {
    Write-Host "Descargando paquete de idioma español..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri "https://github.com/tesseract-ocr/tessdata/raw/main/spa.traineddata" -OutFile $tempFile -UseBasicParsing
        Write-Host "✓ Descarga completada" -ForegroundColor Green
    } catch {
        Write-Host "✗ Error al descargar: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Presiona cualquier tecla para salir..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
}

Write-Host ""
Write-Host "Copiando archivo a Tesseract..." -ForegroundColor Yellow

try {
    Copy-Item $tempFile -Destination $destPath -Force
    Write-Host "✓ Idioma español instalado correctamente" -ForegroundColor Green
} catch {
    Write-Host "✗ Error al copiar archivo: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Presiona cualquier tecla para salir..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""
Write-Host "Idiomas disponibles en Tesseract:" -ForegroundColor Cyan
& tesseract --list-langs

Write-Host ""
Write-Host "=== Instalación Completada ===" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
