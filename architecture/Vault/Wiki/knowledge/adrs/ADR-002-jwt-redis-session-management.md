# ADR-002: Autenticación Stateless JWT con Control de Sesiones y Blacklist en Redis

- **Estado**: Aceptado
- **Fecha**: 2026-02-18
- **Decisores**: Seguridad y Backend
- **Código Relacionado**:
  - [[backend/src/api/auth.py]]
  - [[backend/src/core/utils/security.py]]
  - [[backend/src/services/redis_service.py]]
  - [[backend/src/models/session.py]]

---

## 🎯 Contexto y Problema
Una arquitectura puramente basada en sesiones en BD genera cuellos de botella en MongoDB ante cada request HTTP o frame de WebSocket. Por otro lado, un JWT totalmente stateless impide revocar tokens inmediatamente ante logout, cambio de contraseña o detección de anomalías geográficas.

## ⚖️ Decisión
Implementar tokens **JWT duales** (Access Token de corta duración + Refresh Token) combinados con **Redis**:
1. **Access Token**: Duración de 30 minutos (web) / 60 minutos (móvil). Validados localmente sin consultar BD.
2. **Blacklist / Revocación**: Redis almacena JTI o tokens revocados con TTL igual a la expiración restante.
3. **Control de Presencia**: Redis almacena el último timestamp de actividad de sesión y geolocalización para alertar de saltos de distancia sospechosos (`SUSPICIOUS_LOCATION_CHANGE_KM`).

## 📊 Consecuencias
- Velocidad máxima de validación en milisegundos con posibilidad de logout instantáneo global.
- Persistencia secundaria de auditoría en la colección `sessions` de MongoDB.
