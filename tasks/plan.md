# Implementation Plan: Reestructuración UX — Diálogo Crear/Editar Plantilla

## Overview

Reorganizar el diálogo de crear/editar plantilla en 4 bloques lógicos (CONTENIDO, APARIENCIA, ENTREGA, CONFIGURACIÓN AVANZADA) para mejorar la jerarquía visual, la claridad de los campos y la experiencia de usuario.

## Architecture Decisions

- 4 bloques principales en lugar de 9 secciones planas.
- Cada bloque es un `<Box>` con borde, header y cuerpo.
- VARIABLES DISPONIBLES se mueve dentro de CONTENIDO (está relacionado con título/cuerpo).
- VISTA PREVIA se mueve dentro de APARIENCIA.
- LOCALIZACIÓN, TRADUCCIONES y DESTINATARIOS van en ENTREGA.
- COMPORTAMIENTO, OPCIONES y METADATOS van en CONFIGURACIÓN AVANZADA.
- Se agrega estado `openTranslationModal` para el modal de traducciones.
- Se agrega estado `variableSearchQuery` para el buscador de variables.

## Task List

### Phase 1: Estructura de 4 bloques

- [ ] Task 1: Reorganizar DialogContent en 4 bloques (CONTENIDO, APARIENCIA, ENTREGA, CONFIGURACIÓN AVANZADA)
  - Acceptance: Las 4 secciones aparecen en ese orden; todas las subsecciones están dentro del bloque correcto
  - Verify: Typecheck pasa; abrir diálogo y verificar orden visual
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`

### Checkpoint: Phase 1
- [ ] Typecheck pasa
- [ ] 4 bloques en el orden correcto

### Phase 2: CONTENIDO (GENERAL + VARIABLES)

- [ ] Task 2: Mejorar GENERAL — Título 1 línea, Cuerpo 4-5 líneas, Idioma actual arriba
  - Acceptance: Título es TextField de 1 línea; Cuerpo es multiline con 4-5 filas; select de idioma arriba de ambos
  - Verify: Typecheck pasa; campos tienen tamaños correctos
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`
- [ ] Task 3: Mejorar VARIABLES DISPONIBLES — Agrupar por categoría, más grandes, "Disponible en", buscador
  - Acceptance: Variables agrupadas (USUARIO, INTERACCIONES, CARE); font-size/padding/height aumentados ~20%; labels "Disponible en Título/Cuerpo"; buscador de variables
  - Verify: Typecheck pasa; buscador filtra variables; grupos visibles
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`

### Checkpoint: Phase 2
- [ ] Typecheck pasa
- [ ] GENERAL y VARIABLES funcionan en CONTENIDO

### Phase 3: APARIENCIA (VISUAL + VISTA PREVIA)

- [ ] Task 4: Mejorar VISUAL — Iconos 32px clicables, ocultar selector si Avatar usuario
  - Acceptance: Iconos de 32px; al seleccionar "Avatar usuario", selector de iconos desaparece
  - Verify: Typecheck pasa; selector se oculta/muestra correctamente
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`
- [ ] Task 5: Mejorar VISTA PREVIA — 350-400px, datos de prueba
  - Acceptance: Preview más grande; muestra datos de prueba (first_name=Carlos, etc.)
  - Verify: Typecheck pasa; preview renderiza con datos de prueba
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`

### Checkpoint: Phase 3
- [ ] Typecheck pasa
- [ ] APARIENCIA completa

### Phase 4: ENTREGA (LOCALIZACIÓN, TRADUCCIONES, DESTINATARIOS)

- [ ] Task 6: Mejorar LOCALIZACIÓN — Idioma base + idioma fallback
  - Acceptance: Select de idioma base + select de idioma fallback
  - Verify: Typecheck pasa; ambos selects funcionan
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`
- [ ] Task 7: Mejorar TRADUCCIONES — Resumen + modal "Ver traducciones"
  - Acceptance: Muestra "✅ X, ⚠ Y pendientes"; botón abre modal con lista completa
  - Verify: Typecheck pasa; modal se abre y cierra
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`
- [ ] Task 8: Mejorar DESTINATARIOS — Checkboxes + Ámbito resultante
  - Acceptance: Checkboxes Usuarios/Empleados/Marcas; texto "Ámbito resultante: Global" o individuales
  - Verify: Typecheck pasa; ámbito se calcula correctamente
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`

### Checkpoint: Phase 4
- [ ] Typecheck pasa
- [ ] ENTREGA completa

### Phase 5: CONFIGURACIÓN AVANZADA (COMPORTAMIENTO, OPCIONES, METADATOS)

- [ ] Task 9: Mejorar COMPORTAMIENTO — Nombres claros (QUÉ OCURRE AL HACER CLIC, AUTOMATIZACIÓN, ÁREA)
  - Acceptance: Secciones renombradas con nombres descriptivos
  - Verify: Typecheck pasa; labels claros
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`
- [ ] Task 10: Mejorar OPCIONES — Con tooltips explicativos
  - Acceptance: Cada opción (Persistente, Crítica, Programable, Silenciable) tiene tooltip con descripción
  - Verify: Typecheck pasa; tooltips visibles al hover
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`
- [ ] Task 11: Mejorar METADATOS — Con tooltips explicativos
  - Acceptance: Nombre interno y slug tienen tooltip explicativo
  - Verify: Typecheck pasa; tooltips visibles al hover
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`

### Checkpoint: Complete
- [ ] Todas las acceptance criteria cumplidas
- [ ] Typecheck pasa
- [ ] Listo para review

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Mover secciones rompe el flujo de guardado | High | El payload de `handleSave` no cambia; solo se reordenan visualmente los campos |
| Demasiados cambios de UI de una vez | High | Implementar por fases con typecheck entre cada una |
| El buscador de variables no filtra correctamente | Medium | Implementar filtro simple sobre VARIABLE_PRESETS |

## Open Questions

- ¿Textos exactos para cada tooltip de OPCIONES y METADATOS?
