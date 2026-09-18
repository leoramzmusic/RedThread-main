# ADR-001: Adopción de FastAPI, Beanie ODM y MongoDB Asíncrono

- **Estado**: Aceptado
- **Fecha**: 2026-02-15
- **Decisores**: Equipo RedThread
- **Código Relacionado**: 
  - [[backend/src/main.py]]
  - [[backend/src/core/database.py]]
  - [[backend/src/models/user.py]]
  - [[backend/src/models/profile.py]]

---

## 🎯 Contexto y Problema
RedThread requiere alta concurrencia para emparejamiento en tiempo real, geolocalización dinámica y chat por WebSockets. El esquema de perfil es multidimensional (intereses, fotos, métricas de compatibilidad, preguntas de rompehielos, preferencias de género y filtros geográficos) lo que hace rígido un modelo puramente relacional estático.

## ⚖️ Decisión
Adoptar **FastAPI** como framework HTTP asíncrono, **MongoDB** como base de datos de documentos con soporte GeoJSON (índices `2dsphere`), y **Beanie** como ODM basado en Pydantic v2 y Motor (asyncio).

## 📊 Consecuencias
### Positivas
- Validación estricta en tiempo de ejecución con tipos Pydantic.
- Queries geoespaciales nativas `$near`, `$geoWithin` y polígonos sin requerir extensiones complejas.
- Rendimiento async nativo sin bloqueo de I/O en endpoints de alta frecuencia (Discovery y Radar).

### Negativas / Mitigaciones
- Necesidad de gestionar índices manualmente o vía `init_beanie`.
- Mitigación: `src.core.database.init_db()` inicializa todas las colecciones y modelos al arrancar la aplicación.
