# 🔐 Mejoras de Seguridad y Funcionalidad - Verificación de Identidad

## Recomendaciones Implementadas y Pendientes

### ✅ YA IMPLEMENTADO

1. **Almacenamiento Seguro**
   - Documentos guardados en carpeta no pública: `static/identity_documents/`
   - Nombres de archivo con UUID únicos
   - Solo accesibles mediante autenticación backend

2. **Extracción OCR Básica**
   - Lectura de texto de documentos
   - Extracción de nombre y fecha de nacimiento
   - Patrones específicos por tipo de documento

3. **Validación**
   - Tipos de archivo permitidos (JPG, PNG, WEBP, PDF)
   - Tamaño máximo 10MB
   - Verificación de formato de fecha

---

## 🔄 MEJORAS RECOMENDADAS (Prioridad Alta)

### 1. **Ambos Lados del Documento** ⚠️ CRÍTICO

**Problema Actual:**
Solo se solicita una imagen (frente)

**Solución Propuesta:**
```typescript
// Frontend: IdentityVerificationDialog.tsx
interface DocumentUpload {
  front: File;
  back?: File;  // Opcional para pasaportes
}

const needsBackSide = documentType !== 'passport';
```

**Beneficios:**
- ✅ Mayor seguridad (verificar códigos QR del reverso)
- ✅ Más datos para validación (códigos de barras, MRZ)
- ✅ Detectar documentos falsos más fácilmente

**Implementación:**
1. Modificar `IdentityVerificationDialog` para 2 uploads
2. Backend procesar ambas imágenes
3. Validar consistencia entre frente y reverso

---

### 2. **Lectura de Códigos (QR, MRZ, Barcodes)** ⚠️ CRÍTICO

**Tecnologías Requeridas:**

#### A. Códigos QR (INE México)
```python
# Backend: pip install pyzbar opencv-python-headless
from pyzbar.pyzbar import decode
import cv2

def read_qr_code(image_path):
    """
    INE contiene QR en reverso con datos estructurados:
    - Nombre completo
    - CURP
    - Fecha de nacimiento
    - Número de documento
    """
    img = cv2.imread(image_path)
    qr_codes = decode(img)
    
    for qr in qr_codes:
        data = qr.data.decode('utf-8')
        # Parsear datos del QR de INE
        # Formato típico: NOMBRE|CURP|FECHA|...
        return parse_ine_qr(data)
```

#### B. MRZ (Machine Readable Zone - Pasaportes)
```python
# pip install passporteye
from passporteye import read_mrz

def extract_mrz_data(image_path):
    """
    Pasaportes tienen MRZ (2-3 líneas al final):
    - Nombre
    - Fecha de nacimiento  
    - Número de pasaporte
    - País emisor
    - Fecha de expiración
    """
    mrz = read_mrz(image_path)
    if mrz:
        return {
            'name': mrz.names + ' ' + mrz.surname,
            'birth_date': mrz.date_of_birth,
            'document_number': mrz.number,
            'expiry_date': mrz.expiration_date
        }
```

#### C. Códigos de Barras
```python
# Usamos pyzbar también para códigos de barras
from pyzbar.pyzbar import decode

def read_barcode(image_path):
    """
    Muchos documentos tienen códigos de barras con datos
    """
    img = cv2.imread(image_path)
    barcodes = decode(img)
    
    for barcode in barcodes:
        data = barcode.data.decode('utf-8')
        return parse_barcode_data(data, barcode.type)
```

**Orden de Prioridad de Extracción:**
1. ✅ Códigos QR/Barras (100% precisión)
2. ✅ MRZ (95% precisión)
3. ⚠️ OCR texto plano (60-80% precisión)

---

### 3. **Cifrado de Datos** 🔒

**Problema Actual:**
Documentos almacenados sin cifrar

**Solución:**
```python
# Backend: pip install cryptography
from cryptography.fernet import Fernet
import base64

# Generar clave (guardar en variable de entorno)
ENCRYPTION_KEY = os.getenv('DOCUMENT_ENCRYPTION_KEY')
cipher = Fernet(ENCRYPTION_KEY.encode())

def encrypt_document(file_path):
    """Cifrar documento antes de guardar"""
    with open(file_path, 'rb') as f:
        data = f.read()
    
    encrypted_data = cipher.encrypt(data)
    
    # Guardar con extensión .enc
    encrypted_path = file_path + '.enc'
    with open(encrypted_path, 'wb') as f:
        f.write(encrypted_data)
    
    # Eliminar archivo original
    os.remove(file_path)
    return encrypted_path

def decrypt_document(encrypted_path):
    """Descifrar solo cuando admin necesite revisar"""
    with open(encrypted_path, 'rb') as f:
        encrypted_data = f.read()
    
    decrypted_data = cipher.decrypt(encrypted_data)
    return decrypted_data
```

---

### 4. **Eliminación Automática Post-Verificación**

```python
# Backend
from datetime import datetime, timedelta
import asyncio

async def auto_delete_verified_documents():
    """
    Ejecutar cada 24 horas
    Eliminar documentos de usuarios ya verificados después de 30 días
    """
    cutoff_date = datetime.utcnow() - timedelta(days=30)
    
    users = await User.find(
        User.identity_verification_status == "approved",
        User.identity_submitted_at < cutoff_date
    ).to_list()
    
    for user in users:
        if user.identity_document_url:
            # Eliminar archivo
            try:
                os.remove(user.identity_document_url)
                user.identity_document_url = None
                await user.save()
                print(f"Deleted document for user {user.id}")
            except Exception as e:
                print(f"Error deleting document: {e}")

# Programar en main.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()
scheduler.add_job(auto_delete_verified_documents, 'cron', hour=3)  # 3 AM diario
scheduler.start()
```

---

### 5. **Watermark en Documentos Procesados**

```python
from PIL import Image, ImageDraw, ImageFont

def add_watermark(image_path):
    """
    Agregar marca de agua "SOLO VERIFICACIÓN - NO VÁLIDO"
    Para prevenir uso indebido de copias
    """
    img = Image.open(image_path)
    draw = ImageDraw.Draw(img)
    
    # Watermark diagonal
    watermark = "SOLO VERIFICACIÓN - NO VÁLIDO"
    font = ImageFont.truetype("arial.ttf", 60)
    
    # Posición diagonal
    width, height = img.size
    draw.text(
        (width//4, height//2), 
        watermark, 
        fill=(255, 0, 0, 128),  # Rojo semi-transparente
        font=font
    )
    
    watermarked_path = image_path.replace('.', '_watermarked.')
    img.save(watermarked_path)
    return watermarked_path
```

---

### 6. **Validación Cruzada de Datos**

```python
def validate_document_data(ocr_data, qr_data, mrz_data):
    """
    Comparar datos extraídos por diferentes métodos
    para detectar inconsistencias (posibles fraudes)
    """
    validations = []
    
    # Validar nombre coincide
    if ocr_data.get('name') and qr_data.get('name'):
        name_match = compare_names(ocr_data['name'], qr_data['name'])
        validations.append({
            'field': 'name',
            'match': name_match,
            'ocr': ocr_data['name'],
            'qr': qr_data['name']
        })
    
    # Validar fecha de nacimiento coincide
    if ocr_data.get('birth_date') and qr_data.get('birth_date'):
        date_match = ocr_data['birth_date'] == qr_data['birth_date']
        validations.append({
            'field': 'birth_date',
            'match': date_match,
            'ocr': ocr_data['birth_date'],
            'qr': qr_data['birth_date']
        })
    
    # Si hay inconsistencias, marcar para revisión manual
    if not all(v['match'] for v in validations):
        return {
            'status': 'requires_manual_review',
            'validations': validations
        }
    
    return {'status': 'auto_approved', 'validations': validations}
```

---

## 📦 Dependencias Adicionales

```bash
# Backend
pip install pyzbar opencv-python-headless  # QR y códigos de barras
pip install passporteye                    # MRZ (pasaportes)
pip install cryptography                   # Cifrado
pip install apscheduler                    # Tareas programadas
```

---

## 🎯 Plan de Implementación Sugerido

### Fase 1 (Crítico - 1 semana)
- [ ] Implementar upload de ambos lados
- [ ] Agregar lectura de códigos QR (INE)
- [ ] Cifrado de documentos

### Fase 2 (Alta prioridad - 2 semanas)
- [ ] Lectura de MRZ (pasaportes)
- [ ] Lectura de códigos de barras
- [ ] Validación cruzada de datos

### Fase 3 (Seguridad - 1 semana)
- [ ] Watermark en documentos
- [ ] Eliminación automática post-verificación
- [ ] Auditoría de accesos

### Fase 4 (Mejora - 2 semanas)
- [ ] Panel de admin para revisión manual
- [ ] Detección de documentos falsos (ML)
- [ ] Integración con servicios de verificación externos

---

## 🔐 Mejores Prácticas de Seguridad

1. **Nunca mostrar documentos originales en UI**
   - Solo mostrar preview borroso al admin
   - Usar versiones con watermark

2. **Logs de acceso**
   ```python
   # Registrar quién accedió a qué documento
   async def log_document_access(user_id, document_id, accessed_by):
       await AccessLog.insert({
           'user_id': user_id,
           'document_id': document_id,
           'accessed_by': accessed_by,
           'timestamp': datetime.utcnow(),
           'ip_address': request.client.host
       })
   ```

3. **GDPR Compliance**
   - Usuario puede solicitar eliminación de documentos
   - Exportar datos personales
   - Historial de verificaciones

4. **Rate Limiting**
   ```python
   # Limitar uploads de documentos
   @router.post("/upload-identity")
   @limiter.limit("3/hour")  # Solo 3 uploads por hora
   async def upload_identity(...):
       ...
   ```

---

## 📊 Métricas de Éxito

- **Precisión de extracción**: > 95% con códigos QR/MRZ
- **Tiempo de verificación**: < 30 segundos automático
- **Tasa de fraude detectado**: < 0.1%
- **Cumplimiento GDPR**: 100%

---

**Estado Actual vs. Objetivo:**

| Característica | Actual | Objetivo |
|---------------|---------|----------|
| Upload ambos lados | ❌ | ✅ |
| Lectura QR/Barcode | ❌ | ✅ |
| Lectura MRZ | ❌ | ✅ |
| Cifrado | ❌ | ✅ |
| Auto-eliminación | ❌ | ✅ |
| Watermark | ❌ | ✅ |
| Validación cruzada | ❌ | ✅ |
| Precisión | 60-70% | 95%+ |
