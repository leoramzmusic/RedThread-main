# ADR-004: Frontend con Next.js 16 (Turbopack), Redux Toolkit y MUI

- **Estado**: Aceptado
- **Fecha**: 2026-02-21
- **Decisores**: Frontend Core
- **Código Relacionado**:
  - [[frontend/src/pages/_app.tsx]]
  - [[frontend/src/store/index.ts]]
  - [[frontend/src/services/api.ts]]
  - [[frontend/src/pages/discover/index.tsx]]
  - [[frontend/src/pages/chat/index.tsx]]

---

## 🎯 Contexto y Problema
La interfaz web requiere carga ultra rápida (HMR de milisegundos para iteración en desarrollo), sincronización en tiempo real de mensajes vía WebSocket, y persistencia fluida del estado de sesión y chat entre transiciones de rutas.

## ⚖️ Decisión
1. **Next.js 16 + Turbopack**: Compilación y hot reloading instantáneos, soporte de i18n nativo y renderizado híbrido.
2. **Redux Toolkit**: Gestión centralizada de estado para autenticación (`authSlice`), mensajería activa (`chatSlice`), y portal administrativo (`adminAuthSlice`).
3. **Material UI (MUI v6) + React-Bootstrap**: Sistema visual responsivo con paleta temática del Hilo Rojo.

## 📊 Consecuencias
- Excelente Developer Experience (DX) con Turbopack.
- Redux desacopla completamente las vistas React de la lógica de llamadas HTTP/WS.
