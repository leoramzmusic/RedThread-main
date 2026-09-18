# Guía de Implementación de OCR para Verificación de Identidad

## Estado Actual
El sistema de verificación de identidad está implementado con un **placeholder de OCR**. Actualmente:
- ✅ Los documentos se suben y almacenan correctamente
- ✅ El flujo de verificación funciona
- ⚠️ La extracción de datos (nombre y fecha de nacimiento) **NO está implementada** (retorna `null`)

## Opciones de Implementación de OCR

### Opción 1: Google Cloud Vision API (Recomendado)
**Ventajas:**
- Alta precisión
- Soporte para múltiples idiomas
- Detección automática de tipos de documento
- API simple de usar

**Instalación:**
```bash
pip install google-cloud-vision
```

**Implementación:**
```python
from google.cloud import vision
import os

# Configurar credenciales
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'path/to/credentials.json'

async def extract_identity_data(file_path: str, document_type: str) -> dict:
    client = vision.ImageAnnotatorClient()
    
    with open(file_path, 'rb') as image_file:
        content = image_file.read()
    
    image = vision.Image(content=content)
    response = client.text_detection(image=image)
    texts = response.text_annotations
    
    if texts:
        full_text = texts[0].description
        
        # Extraer nombre (ajustar regex según formato del documento)
        name_match = re.search(r'NOMBRE[:\s]+([A-ZÁÉÍÓÚÑ\s]+)', full_text, re.IGNORECASE)
        name = name_match.group(1).strip() if name_match else None
        
        # Extraer fecha de nacimiento
        date_match = re.search(r'(\d{2})/(\d{2})/(\d{4})', full_text)
        birth_date = None
        if date_match:
            day, month, year = date_match.groups()
            birth_date = datetime(int(year), int(month), int(day))
        
        return {"name": name, "birth_date": birth_date}
    
    return {"name": None, "birth_date": None}
```

### Opción 2: AWS Textract
**Ventajas:**
- Específicamente diseñado para documentos de identidad
- Extrae campos estructurados automáticamente
- Integración con AWS

**Instalación:**
```bash
pip install boto3
```

**Implementación:**
```python
import boto3

async def extract_identity_data(file_path: str, document_type: str) -> dict:
    textract = boto3.client('textract', region_name='us-east-1')
    
    with open(file_path, 'rb') as document:
        response = textract.analyze_id(
            DocumentPages=[{'Bytes': document.read()}]
        )
    
    # Procesar respuesta de Textract
    # AWS Textract devuelve campos estructurados como "FIRST_NAME", "DATE_OF_BIRTH", etc.
    
    return {"name": extracted_name, "birth_date": extracted_date}
```

### Opción 3: Tesseract OCR (Gratuito, Local)
**Ventajas:**
- Completamente gratuito
- No requiere API externa
- Funciona offline

**Desventajas:**
- Menor precisión que servicios en la nube
- Requiere más procesamiento manual

**Instalación:**
```bash
# Windows
# Descargar e instalar desde: https://github.com/UB-Mannheim/tesseract/wiki

# Linux
sudo apt-get install tesseract-ocr tesseract-ocr-spa

# Python
pip install pytesseract pillow
```

**Implementación:**
```python
import pytesseract
from PIL import Image
import re

async def extract_identity_data(file_path: str, document_type: str) -> dict:
    try:
        # Configurar ruta de Tesseract (Windows)
        # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image, lang='spa+eng')
        
        # Extraer nombre
        name_patterns = [
            r'NOMBRE[:\s]+([A-ZÁÉÍÓÚÑ\s]+)',
            r'NAME[:\s]+([A-Z\s]+)',
            r'APELLIDOS[:\s]+([A-ZÁÉÍÓÚÑ\s]+)',
        ]
        
        name = None
        for pattern in name_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                break
        
        # Extraer fecha de nacimiento
        date_patterns = [
            r'NACIMIENTO[:\s]+(\d{2})/(\d{2})/(\d{4})',
            r'BIRTH[:\s]+(\d{2})/(\d{2})/(\d{4})',
            r'(\d{2})-(\d{2})-(\d{4})',
        ]
        
        birth_date = None
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                day, month, year = match.groups()
                birth_date = datetime(int(year), int(month), int(day))
                break
        
        return {"name": name, "birth_date": birth_date}
        
    except Exception as e:
        print(f"Error en OCR: {e}")
        return {"name": None, "birth_date": None}
```

## Patrones de Extracción por Tipo de Documento

### INE (México)
```python
# Campos típicos en INE:
# - NOMBRE(S)
# - APELLIDO PATERNO
# - APELLIDO MATERNO
# - FECHA DE NACIMIENTO: DD/MM/YYYY
# - CURP

patterns_ine = {
    'nombre': r'NOMBRE\(?S\)?[:\s]+([A-ZÁÉÍÓÚÑ\s]+)',
    'apellido_paterno': r'APELLIDO\s+PATERNO[:\s]+([A-ZÁÉÍÓÚÑ]+)',
    'apellido_materno': r'APELLIDO\s+MATERNO[:\s]+([A-ZÁÉÍÓÚÑ]+)',
    'fecha_nacimiento': r'FECHA\s+DE\s+NACIMIENTO[:\s]+(\d{2})/(\d{2})/(\d{4})',
}
```

### DNI (España)
```python
patterns_dni = {
    'nombre': r'NOMBRE[:\s]+([A-ZÁÉÍÓÚÑ\s]+)',
    'apellidos': r'APELLIDOS[:\s]+([A-ZÁÉÍÓÚÑ\s]+)',
    'fecha_nacimiento': r'NACIMIENTO[:\s]+(\d{2})[./](\d{2})[./](\d{4})',
}
```

### Pasaporte
```python
patterns_passport = {
    'nombre': r'SURNAME[:\s]+([A-Z\s]+)',
    'given_names': r'GIVEN\s+NAMES[:\s]+([A-Z\s]+)',
    'fecha_nacimiento': r'DATE\s+OF\s+BIRTH[:\s]+(\d{2})\s+([A-Z]{3})\s+(\d{4})',
}
```

## Próximos Pasos

1. **Elegir servicio de OCR** (recomiendo Google Cloud Vision para empezar)
2. **Configurar credenciales** del servicio elegido
3. **Reemplazar la función `extract_identity_data`** en `backend/src/api/profiles.py`
4. **Probar con documentos reales** y ajustar los patrones regex
5. **Implementar validación** de datos extraídos
6. **Agregar logs** para debugging

## Consideraciones de Seguridad

- ✅ Los documentos se almacenan en `static/identity_documents/` (no público)
- ⚠️ Considera encriptar los archivos en reposo
- ⚠️ Implementar eliminación automática después de verificación
- ⚠️ Agregar watermark a documentos procesados
- ⚠️ Implementar rate limiting para prevenir abuso

## Testing

Para probar sin OCR real, puedes modificar temporalmente la función para retornar datos de prueba:

```python
async def extract_identity_data(file_path: str, document_type: str) -> dict:
    # SOLO PARA TESTING - REMOVER EN PRODUCCIÓN
    return {
        "name": "JUAN PÉREZ GARCÍA",
        "birth_date": datetime(1990, 5, 15)
    }
```
