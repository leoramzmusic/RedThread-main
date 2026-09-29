# Módulos Perfiles — Design Spec

- **Fecha:** 2026-09-29
- **Estado:** Aprobado por usuario (con mejora: registry documentado)
- **Alcance decidido:** wiring completo · endpoint + render dinámico · 3 permisos

## 1. Contexto

El portal de administración necesita una sección "Módulos Perfiles" para gestionar
las secciones del perfil de usuario (Fotos, Identidad, Ubicación, Sobre mí,
Objetivos, Intereses, Spotify/Mi Himno, etc.): activar/desactivar, renombrar,
reordenar (drag & drop), crear nuevas (futuras integraciones: YouTube Music,
Deezer) y eliminar obsoletas. Lo que el admin configure debe reflejarse en el
perfil real del usuario.

Precedentes en el repo: `portal-redthread/experiencia/menus.tsx` (editor de
módulos con MenuCard), `configuracion/integraciones.tsx`, sidebar en
`frontend/src/components/layout/AdminSidebar.tsx`, RBAC en
`backend/src/models/admin_rbac.py` (enum `Permission` + roles dinámicos por
`slug` + `AdminUser.has_permission()` + auditoría `AdminAction`).

## 2. Decisiones tomadas

1. **Alcance:** wiring completo (el admin cambia lo que el usuario ve).
2. **Consumo:** `GET /api/profile-modules` público + render dinámico por registry.
3. **Permisos:** tres nuevos (`view_profile_modules`,
   `manage_visibility_modules`, `manage_profile_modules`) asignables a los
   slugs de rol existentes. Sin roles nuevos. Sin "confirmación con contraseña"
   (el sistema no tiene ese patrón; la auditoría es el control equivalente).

## 3. Enfoque elegido

**A. Colección `profile_modules` + registry en ProfileEdit.**
Descartados: (B) documento embebido en `configuracion` — no escala a CRUD ni
auditoría por módulo; (C) solo frontend — sin RBAC real.

## 4. Diseño

### 4.1 Modelo — `backend/src/models/profile_module.py` (Beanie)

Campos: `key` único (`fotos`, `identidad`, `ubicacion`, `sobre_mi`,
`objetivos`, `intereses`, `spotify`, ...), `nombre`, `descripcion`,
`icono`, `orden: int`, `visible: bool`, `origen: core|integracion`,
`requiere_premium: bool`. Seed inicial con las secciones actuales de
`ProfileEdit`. Índice único en `key`.

### 4.2 API

- `GET /api/admin/profile-modules` — catálogo completo (requiere
  `view_profile_modules`).
- `POST` — crear (requiere `manage_profile_modules`).
- `PATCH /{key}` — editar nombre/descripción/icono (requiere
  `manage_profile_modules`).
- `PATCH /{key}/visibilidad` — toggle visible (requiere
  `manage_visibility_modules`).
- `PUT /reorden` — lista ordenada de keys (requiere
  `manage_visibility_modules`).
- `DELETE /{key}` — solo `origen=integracion` (requiere
  `manage_profile_modules`).
- `GET /api/profile-modules` — público, solo `visible=true` ordenados.
- Regla de integridad: no se puede ocultar ni eliminar el último módulo
  `core` obligatorio (fotos/identidad). Cada mutación registra `AdminAction`.

### 4.3 Admin UI — `portal-redthread/perfiles/modulos.tsx`

Entrada en `AdminSidebar` bajo Usuarios (icono usuario+engrane). Tabla con
toggle de visibilidad, dialog crear/editar, drag & drop con `@dnd-kit`
(ya en dependencias) para el orden. Sin permiso de gestión → modo solo
lectura. Patrón visual de `experiencia/menus.tsx`. Textos vía `next-i18next`.

### 4.4 Wiring perfil — registry documentado

`ProfileEdit` pasa de secciones hardcodeadas a render por registry.

- Nuevo `frontend/src/components/profile/sections/registry.ts`:

```ts
// key del backend -> componente de sección.
// Para añadir una sección: 1) crear el componente, 2) registrarlo aquí,
// 3) crear el módulo en el admin con el mismo key.
export const PROFILE_SECTION_REGISTRY = {
  fotos: FotosSection,
  identidad: IdentidadSection,
  // ...
} as const;
export type ProfileSectionKey = keyof typeof PROFILE_SECTION_REGISTRY;
```

- El perfil pide `GET /api/profile-modules` y renderiza en orden; ante
  error del endpoint, fallback al render actual (el perfil nunca se rompe).
- El `key` es el contrato entre backend y frontend: documentado en el
  registry y validado por el seed.

### 4.5 RBAC

Permisos nuevos en `Permission` + matriz `ROLE_PERMISSIONS`:
`super_admin` todo; `moderator` vista + visibilidad; `support`/`analyst`
solo vista. Los slugs dinámicos (`Role.permissions[]`) los asigna el
superadmin desde Empleados/Roles. `has_permission()` no cambia.

### 4.6 Testing

- Backend (pytest): CRUD, regla de integridad core, gateo 403 por permiso,
  endpoint público solo visibles y ordenados.
- Frontend (Jest): registry mapea cada key del seed, fallback ante error,
  gateo de UI por permiso.

## 5. Fuera de alcance (v2)

Confirmación con contraseña, scheduling de visibilidad, versionado de la
configuración, migraciones automáticas de datos al eliminar un módulo.
