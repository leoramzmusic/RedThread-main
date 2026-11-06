# Spec: Plantillas de Notificación — Modelo de Datos y UI

## Capability Map (Phase 0)

| Module id | Responsibility | Depends on |
|---|---|---|
| template-model | Modelo de datos de plantilla (idioma, traducciones, slug, tipo, destinatarios múltiples, nombre interno) | — |
| template-api | Endpoints API para CRUD de plantillas con nuevo modelo | template-model |
| template-ui | Componentes UI (TemplatesManager, dialog crear/editar) con nuevas secciones | template-api |

Build order: template-model → template-api → template-ui

## Assumptions I'm making

1. El modelo `Template` actual vive en `frontend/src/components/notifications/TemplatesManager.tsx` y se usa tanto para crear como para editar.
2. Las plantillas se persisten vía `adminApiClient` (GET/POST/PUT/DELETE contra `/notifications/users/templates`).
3. La tabla de plantillas ya muestra `destinatarios` como chips; ahora debe mostrar "Ámbito" (Usuarios / Empleados / Marcas / Global).
4. No hay un backend schema aún definido para el nuevo modelo; el spec asume que el frontend puede enviar/recibir los nuevos campos y el backend los ignorará o los almacenará.
5. El idioma base se almacena en el campo `template.locale` o similar; las traducciones se almacenan como un objeto keyed por idioma.
6. El campo `destinatarios` pasará de ser "uno solo" (radio) a "múltiples" (checkboxes), y se derivará un campo computado `scope` (usuarios | empleados | marcas | global).

Correct me now if any assumption is wrong.

## Objective

Transformar el modelo de plantilla de "1 plantilla = 1 idioma, 1 destinatario" a un modelo multi-idioma y multi-destinatario, con metadatos internos (slug, nombre interno, tipo de plantilla) que permitan escalar a 20+ idiomas y cientos de plantillas sin duplicar registros.

## Tech Stack

- React + Next.js (App Router o Pages, según exista en el proyecto)
- MUI (Material UI) para componentes de formulario
- TypeScript
- `adminApiClient` para llamadas al backend

## Commands

- Build: `npm run build`
- Typecheck: `npx tsc --noEmit --skipLibCheck`
- Dev: `npm run dev`
- Lint: `npm run lint --fix` (si existe)

## Project Structure

```
frontend/src/components/notifications/
  TemplatesManager.tsx          → Componente principal (lista + dialog crear/editar)
  builder/
    PushPreview.tsx             → Vista previa push
    PanelPreview.tsx            → Vista previa panel
frontend/src/services/adminApi.ts → Cliente API (endpoints de plantillas)
SPEC-template-manager.md        → Este documento (raíz del repo)
tasks/plan.md                   → Plan de implementación
tasks/todo.md                   → Lista de tareas con aceptación
```

## Code Style

- TypeScript estricto, `interface` para modelos de datos.
- Componentes funcionales con hooks.
- MUI `sx` prop para estilos, valores numéricos sin unidades para spacing.
- Nombres de campos en español para UI, en inglés/snake_case para claves internas (slug).
- No comentarios en el código (regla del proyecto).

Ejemplo de campo nuevo:

```tsx
<TextField
  select
  size="small"
  label="Idioma base"
  value={template.baseLocale ?? ""}
  onChange={(e) => setTemplate({ ...template, baseLocale: e.target.value })}
  slotProps={{ select: {} }}
>
  <MenuItem value="es">Español</MenuItem>
  <MenuItem value="en">English</MenuItem>
  <MenuItem value="fr">Français</MenuItem>
</TextField>
```

## Testing Strategy

- Typecheck: `npx tsc --noEmit --skipLibCheck` debe pasar tras cada cambio.
- No hay tests existentes para TemplatesManager; no se agregan en esta fase salvo que el usuario lo pida.
- Verificación manual: abrir el diálogo, cambiar idioma, verificar que título/cuerpo se editan por idioma.

## Boundaries

- **Always:** Typecheck pasa tras cada cambio; no se commitan secretos; se sigue el modelo de prioridades P0→P3.
- **Ask first:** Cambios en el schema de la base de datos; agregar dependencias nuevas; cambiar la firma de `adminApiClient`.
- **Never:** Duplicar plantillas por idioma (crear "Nuevo Match (ES)", "Nuevo Match (EN)"; se usa una plantilla con traducciones).

## Success Criteria

- [ ] P0: Los checkboxes de destinatarios permiten seleccionar múltiples (Usuarios, Empleados, Marcas).
- [ ] P0: La tabla muestra "Ámbito" calculado (Usuarios / Empleados / Marcas / Global).
- [ ] P0: El diálogo tiene selector de "Idioma base" y sección de "Traducciones" con estado por idioma.
- [ ] P1: Campos "Nombre interno" y "Clave única (slug)" presentes en el diálogo.
- [ ] P2: Campo "Tipo de plantilla" (Sistema / Evento automático / Campaña manual).
- [ ] P2: Las variables muestran si aplican a Título y/o Cuerpo.
- [ ] P3: Auditoría visible solo en modo edición (creado por, fechas).
- [ ] Typecheck pasa tras cada implementación.

## Open Questions

- ¿El backend ya acepta los nuevos campos (`baseLocale`, `translations`, `slug`, `internalName`, `templateType`, `scope`) o hay que definir el contrato API primero?
- ¿Se necesita migración de datos para plantillas existentes (campo `destinatarios` de un valor a múltiples)?
- ¿Qué idiomas soporta RETH exactamente (lista completa para el select de idioma)?
- ¿El campo `uso_principal` actual se reemplaza por `templateType` o conviven?
