# 🏛️ RedThread Knowledge Base (Obsidian + CodeGraph)

Bienvenido a la base de conocimiento unificada de **RedThread**, donde la documentación viva, notas personales y decisiones de diseño están sincronizadas y vinculadas al código fuente real.

---

## 🧭 Navegación Rápida

### 🎨 Visualización de Arquitectura
- [[architecture/redthread_architecture.canvas|🗺️ Abrir RedThread Architecture Canvas]]
  - *Tipado visual*: 
    - 🟣 / 🔵 **Líneas Moradas / Azules**: Importaciones, llamadas a funciones y endpoints entre archivos de código.
    - 🟡 / 🟢 **Líneas Amarillas / Verdes**: Vínculos desde el código hacia decisiones de arquitectura (`@adr`) y notas técnicas.
  - *Sub-canvas expandibles por macro-módulo*: `frontend_architecture`, `backend_api_architecture`, `services_architecture`, `data_models_architecture`, `infra_architecture`, `care_algorithm`.
- [[architecture/ARCHITECTURE_GRAPH.md|🕸️ Vista de Grafo de Obsidian (Ctrl + G)]]

### 📜 Decisiones de Arquitectura (@adr)
- [[knowledge/adrs/ADR-001-fastapi-beanie-mongodb|ADR-001: FastAPI, Beanie ODM y MongoDB]]
- [[knowledge/adrs/ADR-002-jwt-redis-session-management|ADR-002: Stateless JWT, Control de Sesiones y Redis]]
- [[knowledge/adrs/ADR-003-care-matching-geo-engine|ADR-003: Motor CARE y Matching Híbrido]]
- [[knowledge/adrs/ADR-004-nextjs-turbopack-redux|ADR-004: Next.js 16 (Turbopack) y Redux Toolkit]]
- [[knowledge/adrs/ADR-005-rbac-multi-tier-admin|ADR-005: Control de Acceso RBAC y Portal de Empleados]]

### 🔍 Auditoría y Contexto
- [[knowledge/audits/Architecture_Audit|🔍 Auditoría Visual y Salud de la Arquitectura]]
- [[knowledge/agents/AI_AGENT_CONTEXT|🤖 Contexto Masivo para Agentes de IA]]

---

## ⚡ Flujo de Trabajo con CodeGraph

Para consultar cualquier símbolo o flujo sin sobrecargar el contexto de tokens:
```bash
# Explorar símbolo y árbol de llamadas
codegraph explore "<simbolo>"

# Análisis de impacto preventivo
codegraph impact "<simbolo>"

# Actualizar el grafo tras editar código
codegraph sync
```
