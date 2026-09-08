# Script de instalación de Tesseract OCR para Windows
# Este script descarga e instala Tesseract con los paquetes de idioma español e inglés

Write-Host "=== Instalador de Tesseract OCR ===" -ForegroundColor Cyan
Write-Host ""

# URL del instalador de Tesseract (versión 5.4.0.20240606)
$installerUrl = "https://digi.bib.uni-mannheim.de/tesseract/tesseract-ocr-w64-setup-5.4.0.20240606.exe"
$installerPath = "$env:TEMP\tesseract-installer.exe"

Write-Host "Descargando Tesseract OCR..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "✓ Descarga completada" -ForegroundColor Green
} catch {
    Write-Host "✗ Error al descargar: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Instalando Tesseract OCR..." -ForegroundColor Yellow
Write-Host "IMPORTANTE: Durante la instalación, asegúrate de seleccionar:" -ForegroundColor Cyan
Write-Host "  - Additional language data (Spanish + English)" -ForegroundColor Cyan
Write-Host ""

# Ejecutar instalador en modo silencioso con componentes de idioma
# /S = Silent mode
# /D = Installation directory
$installArgs = "/S /D=C:\Program Files\Tesseract-OCR"

try {
    Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait
    Write-Host "✓ Instalación completada" -ForegroundColor Green
} catch {
    Write-Host "✗ Error durante la instalación: $_" -ForegroundColor Red
    Write-Host "Ejecutando instalador manualmente..." -ForegroundColor Yellow
    Start-Process -FilePath $installerPath -Wait
}

# Limpiar archivo temporal
Remove-Item $installerPath -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Agregando Tesseract a PATH..." -ForegroundColor Yellow

# Agregar a PATH del usuario
$tesseractPath = "C:\Program Files\Tesseract-OCR"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

if ($currentPath -notlike "*$tesseractPath*") {
    [Environment]::SetEnvironmentVariable(
        "Path",
        "$currentPath;$tesseractPath",
        "User"
    )
    Write-Host "✓ Tesseract agregado a PATH" -ForegroundColor Green
} else {
    Write-Host "✓ Tesseract ya está en PATH" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Instalación Completada ===" -ForegroundColor Green
Write-Host ""
Write-Host "Para verificar la instalación, cierra y vuelve a abrir PowerShell, luego ejecuta:" -ForegroundColor Cyan
Write-Host "  tesseract --version" -ForegroundColor White
Write-Host ""
Write-Host "Si el comando no funciona, reinicia tu computadora." -ForegroundColor Yellow
Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
