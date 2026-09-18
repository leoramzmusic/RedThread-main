# Guía de Versionamiento - Red Thread

## Sistema de Versionamiento

Red Thread utiliza **Versionamiento Semántico (SemVer)** con el formato: `MAJOR.MINOR.PATCH`

### Formato: `X.Y.Z`
- **X (MAJOR)**: Cambios incompatibles o rediseños completos
- **Y (MINOR)**: Nuevas funcionalidades significativas (compatibles con versiones anteriores)
- **Z (PATCH)**: Correcciones de bugs y cambios menores

---

## Portales Separados

Mantenemos versiones independientes para:
- **Portal de Usuarios** (`user`)
- **Portal de Administración** (`admin`)

---

## Cuándo Actualizar la Versión

### ✅ Cambios que REQUIEREN actualización de versión:

#### PATCH (0.0.X) - Cambios menores
- Corrección de bugs
- Mejoras de rendimiento
- Ajustes de UI menores
- Correcciones de texto/traducciones
- Optimizaciones de código

#### MINOR (0.X.0) - Funcionalidades nuevas
- Nuevas páginas o secciones
- Nuevos módulos o características
- Mejoras significativas de UI/UX
- Nuevas integraciones
- Cambios en la estructura de navegación

#### MAJOR (X.0.0) - Cambios mayores
- Rediseño completo de la aplicación
- Cambios incompatibles con versiones anteriores
- Migración de tecnologías principales
- Reestructuración completa de la arquitectura

### ❌ Cambios que NO requieren actualización:
- Cambios en comentarios del código
- Refactorizaciones internas sin cambios visibles
- Actualizaciones de documentación
- Cambios en archivos de configuración de desarrollo

---

## Proceso de Actualización

### 1. Editar el archivo de versión
Ubicación: `frontend/src/config/version.ts`

```typescript
export const APP_VERSION = {
  user: '1.0.1',    // Actualizar aquí
  admin: '1.0.0',
};
```

### 2. Documentar el cambio
Agregar entrada al historial de versiones:

```typescript
export const VERSION_HISTORY = {
  user: [
    { version: '1.0.1', date: '2025-11-30', changes: 'Descripción del cambio' },
    { version: '1.0.0', date: '2025-11-30', changes: 'Initial release' },
  ],
  admin: [
    { version: '1.0.0', date: '2025-11-30', changes: 'Admin portal release' },
  ],
};
```

### 3. Commit con mensaje descriptivo
```bash
git commit -m "chore: bump version to 1.0.1 - [descripción breve]"
```

---

## Ejemplos de Versionamiento

### Escenario 1: Corrección de bug en el chat
- **Antes**: `1.0.0`
- **Después**: `1.0.1`
- **Tipo**: PATCH
- **Razón**: Corrección de funcionalidad existente

### Escenario 2: Agregar módulo de denuncias al admin
- **Antes**: `1.0.0`
- **Después**: `1.1.0`
- **Tipo**: MINOR
- **Razón**: Nueva funcionalidad significativa

### Escenario 3: Rediseño completo de la UI
- **Antes**: `1.5.3`
- **Después**: `2.0.0`
- **Tipo**: MAJOR
- **Razón**: Cambio incompatible con versión anterior

---

## Versiones Actuales

### Portal de Usuarios
- **Versión actual**: `1.0.0`
- **Última actualización**: 2025-11-30
- **Cambios**: Initial release with core features

### Portal de Administración
- **Versión actual**: `1.0.0`
- **Última actualización**: 2025-11-30
- **Cambios**: Admin portal with 9 modules and 40+ submodules

---

## Ubicación de la Versión en la UI

La versión se muestra en:
- **Sidebar del portal de usuarios** (esquina inferior izquierda)
- **Sidebar del portal de administración** (esquina inferior izquierda)

Visible solo cuando el sidebar está expandido.
