# Instalación de Tesseract OCR para Windows

## Opción 1: Instalación Manual (Recomendado)

1. **Descargar Tesseract:**
   - Ve a: https://github.com/UB-Mannheim/tesseract/wiki
   - Descarga el instalador para Windows (64-bit): `tesseract-ocr-w64-setup-5.x.x.exe`

2. **Instalar:**
   - Ejecuta el instalador
   - **IMPORTANTE**: Durante la instalación, selecciona "Additional language data"
   - Marca las casillas para **Spanish (spa)** y **English (eng)**
   - Ruta de instalación por defecto: `C:\Program Files\Tesseract-OCR`

3. **Agregar a PATH (Opcional pero recomendado):**
   - Click derecho en "Este equipo" → Propiedades
   - Configuración avanzada del sistema → Variables de entorno
   - En "Variables del sistema", busca `Path` y haz click en Editar
   - Agregar: `C:\Program Files\Tesseract-OCR`
   - Click OK en todas las ventanas

4. **Verificar instalación:**
   ```powershell
   tesseract --version
   ```

## Opción 2: Instalación con Chocolatey

Si tienes Chocolatey instalado:

```powershell
choco install tesseract
```

## Opción 3: Instalación con Scoop

Si tienes Scoop instalado:

```powershell
scoop install tesseract
```

## Configuración en el Código

Si Tesseract NO está en PATH, descomenta y ajusta esta línea en `backend/src/api/profiles.py`:

```python
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

## Verificar que funciona

Después de instalar, reinicia el backend:

```bash
cd backend
uvicorn src.main:app --reload
```

Luego prueba subiendo un documento de identidad en la aplicación.

## Troubleshooting

### Error: "tesseract is not installed or it's not in your PATH"

**Solución 1:** Agrega Tesseract a PATH (ver paso 3 arriba)

**Solución 2:** Configura la ruta manualmente en el código:
```python
# En backend/src/api/profiles.py, línea ~440
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

### Error: "Failed loading language 'spa'"

Reinstala Tesseract y asegúrate de seleccionar los paquetes de idioma Spanish y English durante la instalación.

### OCR no extrae datos correctamente

1. Verifica que la imagen sea clara y legible
2. Revisa los logs del backend para ver el texto extraído
3. Ajusta los patrones regex en `extract_identity_data()` según el formato de tus documentos

## Mejoras Futuras

Para mejor precisión, considera usar:
- **Google Cloud Vision API** (mejor precisión, costo por uso)
- **AWS Textract** (especializado en documentos de identidad)
- **Azure Computer Vision** (buena precisión, integración con Azure)

Ver `OCR_IMPLEMENTATION_GUIDE.md` para más detalles.
