# 🔐 Gobernanza de Datos y Compliance - Verificación de Identidad

## Principios Fundamentales

### 1. Minimización de Datos 📊

**Qué Almacenar:**
- ✅ Nombre completo (extraído)
- ✅ Fecha de nacimiento (extraída)
- ✅ Estado de verificación (aprobado/rechazado/pendiente)
- ✅ Tipo de documento usado
- ✅ País de emisión
- ✅ Fecha de verificación

**Qué NO Almacenar a Largo Plazo:**
- ❌ Imagen completa del documento (borrar después de 30 días)
- ❌ Número de documento
- ❌ Dirección física
- ❌ CURP, DNI, o identificadores nacionales
- ❌ Códigos QR o de barras completos

**Implementación:**
```python
# Backend: Solo guardar datos esenciales
class VerificationRecord(Document):
    user_id: str
    verified_name: str
    birth_date: date
    document_type: str  # "ine", "passport", etc.
    country: str
    verification_status: str  # "pending", "approved", "rejected"
    verified_at: Optional[datetime]
    
    # NO incluir:
    # document_number: str  ❌
    # document_image_url: str  ❌ (borrar después de verificación)
    # full_address: str  ❌
```

---

### 2. Uso Limitado y Transparente 🎯

**Usos Permitidos:**
- ✅ Validar identidad del usuario
- ✅ Verificar edad (18+)
- ✅ Prevenir cuentas falsas/duplicadas
- ✅ Generar métricas agregadas
- ✅ Cumplimiento de regulaciones

**Usos PROHIBIDOS:**
- ❌ Marketing dirigido
- ❌ Segmentación por datos personales
- ❌ Venta a terceros
- ❌ Análisis de comportamiento
- ❌ Perfilado sin consentimiento explícito

**Política de Privacidad (Ejemplo):**
```markdown
### Verificación de Identidad

**¿Qué recopilamos?**
Solo tu nombre completo y fecha de nacimiento para verificar tu identidad.

**¿Por qué?**
- Confirmar que eres mayor de 18 años
- Prevenir cuentas falsas
- Crear un ambiente seguro

**¿Qué hacemos con las imágenes?**
Las eliminamos automáticamente después de 30 días de verificación exitosa.

**¿Quién tiene acceso?**
Nadie. Ni siquiera nuestros administradores pueden ver tus documentos.
```

---

### 3. Acceso Restringido 🔒

**Regla de Oro: Ni un solo documento completo debe ser visible para admins**

**Arquitectura de Seguridad:**

```python
# Backend: Separación de responsabilidades
class DocumentStorage:
    """
    Sistema de almacenamiento con acceso ultra-restringido
    Solo procesos automatizados pueden acceder
    """
    
    @staticmethod
    async def store_encrypted_document(file_data: bytes, user_id: str):
        """Solo escritura, sin lectura para humanos"""
        # Cifrar documento
        encrypted_data = encrypt_document(file_data)
        
        # Guardar en storage separado (no en DB principal)
        storage_key = f"verification/{user_id}/{uuid4()}.enc"
        await secure_storage.put(storage_key, encrypted_data)
        
        # NO retornar la clave de storage
        # Solo guardar flag de "documento recibido"
        return {"document_received": True}
    
    @staticmethod
    async def process_and_delete(user_id: str):
        """
        Proceso automatizado:
        1. Leer documento cifrado
        2. Extraer datos (nombre, fecha)
        3. ELIMINAR documento inmediatamente
        4. Guardar solo datos extraídos
        """
        # Este método SOLO es llamado por el sistema automatizado
        # NUNCA por un endpoint accesible a humanos
        pass

# ❌ NUNCA crear endpoints como estos:
# @router.get("/admin/documents/{user_id}")  # PROHIBIDO
# @router.get("/admin/download-document/{user_id}")  # PROHIBIDO
```

**Modelo de Base de Datos Segregada:**

```python
# Base de datos PRINCIPAL (accesible)
class User(Document):
    name: str
    email: str
    verified: bool  # ✅ Solo flag booleano
    verification_date: Optional[datetime]
    
    # ❌ NO incluir referencia a documentos

# Base de datos SEPARADA (ultra-restringida)
# Solo accesible por procesos automatizados de verificación
class SecureDocumentVault(Document):
    """
    Esta colección NO debe ser accesible desde la API principal
    Solo desde workers de procesamiento automático
    """
    user_id: str
    encrypted_document: bytes
    created_at: datetime
    auto_delete_at: datetime  # 30 días después
    
    class Settings:
        # Base de datos separada con credenciales diferentes
        name = "document_vault"
        # Solo accesible con credenciales especiales
```

---

### 4. Panel de Admin: Solo Métricas Agregadas 📊

**✅ Qué SÍ Mostrar:**

```python
# Backend: Endpoint para métricas del admin
@router.get("/admin/verification-metrics")
async def get_verification_metrics(
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Solo estadísticas agregadas, NUNCA datos individuales
    """
    
    total_users = await User.count()
    verified_users = await User.find(User.verified == True).count()
    
    # Distribución por tipo de documento
    doc_distribution = await VerificationRecord.aggregate([
        {"$group": {
            "_id": "$document_type",
            "count": {"$sum": 1}
        }}
    ]).to_list()
    
    # Distribución geográfica
    country_distribution = await VerificationRecord.aggregate([
        {"$group": {
            "_id": "$country",
            "count": {"$sum": 1}
        }}
    ]).to_list()
    
    # Tasa de aprobación
    approval_rate = await calculate_approval_rate()
    
    # Tiempo promedio de verificación
    avg_verification_time = await calculate_avg_verification_time()
    
    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "verification_rate": (verified_users / total_users * 100) if total_users > 0 else 0,
        "document_types": doc_distribution,
        "countries": country_distribution,
        "approval_rate": approval_rate,
        "avg_verification_time_hours": avg_verification_time,
        "last_updated": datetime.utcnow()
    }
```

**Frontend: Dashboard de Admin**

```typescript
// Admin Panel - Verification Metrics
interface VerificationMetrics {
  total_users: number;
  verified_users: number;
  verification_rate: number;
  document_types: { _id: string; count: number }[];
  countries: { _id: string; count: number }[];
  approval_rate: number;
  avg_verification_time_hours: number;
}

// Visualización con gráficas, NO con documentos individuales
function VerificationDashboard() {
  return (
    <Box>
      <Typography variant="h4">Métricas de Verificación</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography>Usuarios Verificados</Typography>
              <Typography variant="h3">{metrics.verification_rate}%</Typography>
              <Typography variant="caption">
                {metrics.verified_users} de {metrics.total_users}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography>Tasa de Aprobación</Typography>
              <Typography variant="h3">{metrics.approval_rate}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <PieChart 
            title="Distribución por Tipo de Documento"
            data={metrics.document_types}
          />
        </Grid>
        
        <Grid item xs={12}>
          <BarChart 
            title="Distribución Geográfica"
            data={metrics.countries}
          />
        </Grid>
      </Grid>
      
      {/* ❌ NUNCA mostrar: */}
      {/* <DocumentList /> */}
      {/* <DocumentViewer /> */}
      {/* <DownloadDocumentButton /> */}
    </Box>
  );
}
```

**❌ Qué NO Mostrar:**

```typescript
// ❌ PROHIBIDO - No crear componentes como estos:

// ❌ Lista de documentos individuales
function DocumentList() {  // NO CREAR
  // Lista de documentos de usuarios
}

// ❌ Visor de documentos
function DocumentViewer({ userId }) {  // NO CREAR
  // Mostrar imagen del documento
}

// ❌ Descarga de documentos
function DownloadDocument({ userId }) {  // NO CREAR
  // Descargar documento original
}

// ❌ Búsqueda de documentos por usuario
function SearchUserDocument() {  // NO CREAR
  // Buscar documento específico
}
```

---

### 5. Almacenamiento Seguro 🛡️

**Infraestructura Recomendada:**

```yaml
# docker-compose.yml - Servicios separados

services:
  # Base de datos principal
  mongodb:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: redthread_app
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongo_data:/data/db
  
  # Vault seguro para documentos (separado)
  document_vault:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: vault_service
      MONGO_INITDB_ROOT_PASSWORD: ${VAULT_PASSWORD}  # Contraseña diferente
    volumes:
      - vault_data:/data/db
    # NO exponer puerto externamente
    # Solo accesible desde worker interno
    networks:
      - vault_network
  
  # Worker de procesamiento (único con acceso al vault)
  verification_worker:
    build: ./workers/verification
    environment:
      VAULT_CONNECTION_STRING: ${VAULT_CONNECTION_STRING}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
    networks:
      - vault_network
    # NO exponer HTTP/API
```

**Cifrado:**

```python
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
import os

class DocumentCipher:
    def __init__(self):
        # Clave de cifrado desde variable de entorno
        # NUNCA hardcodear en el código
        key = os.getenv('DOCUMENT_ENCRYPTION_KEY')
        if not key:
            raise ValueError("DOCUMENT_ENCRYPTION_KEY not set")
        self.cipher = Fernet(key.encode())
    
    def encrypt(self, data: bytes) -> bytes:
        """Cifrar documento con AES-256"""
        return self.cipher.encrypt(data)
    
    def decrypt(self, encrypted_data: bytes) -> bytes:
        """Descifrar solo para procesamiento automático"""
        return self.cipher.decrypt(encrypted_data)

# Uso
cipher = DocumentCipher()
encrypted_doc = cipher.encrypt(document_bytes)

# Transmisión: Siempre HTTPS/TLS
# Nginx config:
# ssl_protocols TLSv1.2 TLSv1.3;
# ssl_ciphers HIGH:!aNULL:!MD5;
```

---

### 6. Cumplimiento Legal ⚖️

#### México: LFPDPPP

**Requisitos:**
1. ✅ **Aviso de Privacidad** (debe incluir)
   - Finalidad del tratamiento
   - Derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)
   - Transferencias a terceros (si aplica)

2. ✅ **Consentimiento Explícito**
```typescript
// Frontend: Checkbox obligatorio antes de subir documento
<FormControlLabel
  control={
    <Checkbox
      checked={consentGiven}
      onChange={(e) => setConsentGiven(e.target.checked)}
      required
    />
  }
  label={
    <Typography>
      He leído y acepto el{' '}
      <Link href="/privacy-policy" target="_blank">
        Aviso de Privacidad
      </Link>
      {' '}y autorizo el tratamiento de mis datos personales 
      únicamente para verificación de identidad.
    </Typography>
  }
/>
```

3. ✅ **Derechos ARCO**
```python
# Backend: Endpoints para derechos del usuario
@router.delete("/profile/delete-verification-data")
async def delete_verification_data(
    current_user: User = Depends(get_current_user)
):
    """
    Derecho de Cancelación: Eliminar todos los datos de verificación
    """
    # Eliminar documento cifrado
    await SecureDocumentVault.find_one(
        SecureDocumentVault.user_id == str(current_user.id)
    ).delete()
    
    # Mantener solo flag de "fue verificado" sin datos personales
    current_user.verified = False
    current_user.verification_date = None
    await current_user.save()
    
    return {"message": "Datos de verificación eliminados"}

@router.get("/profile/export-verification-data")
async def export_verification_data(
    current_user: User = Depends(get_current_user)
):
    """
    Derecho de Acceso: Usuario puede descargar sus datos
    """
    verification_record = await VerificationRecord.find_one(
        VerificationRecord.user_id == str(current_user.id)
    )
    
    if not verification_record:
        return {"message": "No hay datos de verificación"}
    
    return {
        "verified_name": verification_record.verified_name,
        "birth_date": verification_record.birth_date.isoformat(),
        "document_type": verification_record.document_type,
        "country": verification_record.country,
        "verification_status": verification_record.verification_status,
        "verified_at": verification_record.verified_at.isoformat() if verification_record.verified_at else None
    }
```

#### Europa: GDPR

**Requisitos Adicionales:**
- ✅ Derecho al olvido (eliminar todos los datos)
- ✅ Portabilidad de datos (exportar en formato legible)
- ✅ Notificación de brechas de seguridad (72 horas)
- ✅ DPO (Data Protection Officer) si procesas datos sensibles a gran escala

#### California: CCPA

**Requisitos:**
- ✅ Derecho a saber qué datos se recopilan
- ✅ Derecho a opt-out de venta de datos
- ✅ No discriminación por ejercer derechos

---

### 7. Auto-Eliminación Programada 🗑️

```python
# Backend: Tarea programada para eliminar documentos antiguos
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta

async def auto_delete_old_documents():
    """
    Ejecutar diariamente a las 3 AM
    Eliminar documentos de usuarios verificados hace más de 30 días
    """
    cutoff_date = datetime.utcnow() - timedelta(days=30)
    
    # Encontrar documentos antiguos
    old_docs = await SecureDocumentVault.find(
        SecureDocumentVault.created_at < cutoff_date
    ).to_list()
    
    deleted_count = 0
    for doc in old_docs:
        # Verificar que el usuario ya está verificado
        user = await User.get(doc.user_id)
        if user and user.verified:
            # Eliminar documento
            await doc.delete()
            deleted_count += 1
            
            print(f"Deleted document for verified user {doc.user_id}")
    
    # Log para auditoría (sin datos personales)
    await AuditLog.insert({
        "action": "auto_delete_documents",
        "deleted_count": deleted_count,
        "executed_at": datetime.utcnow()
    })
    
    return deleted_count

# Programar tarea
scheduler = AsyncIOScheduler()
scheduler.add_job(
    auto_delete_old_documents,
    'cron',
    hour=3,
    minute=0
)
scheduler.start()
```

---

### 8. Auditoría y Logs 📝

```python
# Sistema de auditoría sin datos sensibles
class AuditLog(Document):
    action: str  # "verification_attempt", "document_processed", "auto_deleted"
    user_id: Optional[str]  # Hash del ID real
    timestamp: datetime
    ip_address: Optional[str]  # Anonimizada
    result: str  # "success", "failure"
    
    # ❌ NO incluir datos personales en logs
    class Settings:
        name = "audit_logs"
        indexes = [
            IndexModel([("timestamp", -1)]),
            IndexModel([("action", 1)])
        ]

# Registrar acciones
async def log_verification_attempt(user_id: str, ip: str, success: bool):
    await AuditLog.insert({
        "action": "verification_attempt",
        "user_id": hash_user_id(user_id),  # Hash, no ID real
        "timestamp": datetime.utcnow(),
        "ip_address": anonymize_ip(ip),  # 192.168.1.xxx -> 192.168.1.0
        "result": "success" if success else "failure"
    })
```

---

## 🎯 Checklist de Compliance

### Antes de Lanzar:
- [ ] Aviso de Privacidad publicado y visible
- [ ] Consentimiento explícito implementado
- [ ] Cifrado AES-256 en reposo
- [ ] TLS 1.2+ en tránsito
- [ ] Base de datos de documentos separada
- [ ] Solo métricas agregadas en panel de admin
- [ ] Auto-eliminación configurada (30 días)
- [ ] Endpoints de derechos ARCO/GDPR funcionales
- [ ] Sistema de logs sin datos personales
- [ ] Rate limiting en endpoints de verificación
- [ ] Documentación interna de procesos de seguridad

### Mantenimiento Continuo:
- [ ] Auditoría mensual de accesos a vault
- [ ] Revisión trimestral de políticas de privacidad
- [ ] Backup cifrado de datos (sin documentos)
- [ ] Plan de respuesta a brechas de seguridad
- [ ] Capacitación de equipo en privacidad

---

## 📚 Recursos Adicionales

**Normativas:**
- [LFPDPPP (México)](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf)
- [GDPR (Europa)](https://gdpr.eu/)
- [CCPA (California)](https://oag.ca.gov/privacy/ccpa)

**Servicios KYC Especializados:**
- Stripe Identity
- Veriff
- Onfido
- Jumio

Estos servicios ya cumplen con todas las regulaciones y pueden ser más seguros que una implementación propia.

---

## 🏆 Resumen: Reglas de Oro

1. **Minimiza**: Solo nombre y fecha de nacimiento
2. **Transparenta**: Dile al usuario exactamente para qué usas sus datos
3. **Restringe**: Ni admins ven documentos completos
4. **Agrega**: Solo métricas estadísticas en dashboards
5. **Cifra**: AES-256 en reposo, TLS en tránsito
6. **Separa**: Base de datos de documentos completamente aislada
7. **Elimina**: Auto-borrado después de 30 días
8. **Cumple**: LFPDPPP, GDPR, CCPA según tu jurisdicción
9. **Audita**: Logs sin datos personales
10. **Protege**: Derechos del usuario siempre primero

**El mejor documento es el que no necesitas guardar.**
