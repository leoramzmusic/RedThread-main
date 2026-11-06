# Tasks — Plantillas de Notificación

## Phase 1: P0 — Destinatarios múltiples + Idioma base

- [ ] Task 1: Cambiar destinatarios de radio a checkboxes (Usuarios, Empleados, Marcas) en el diálogo crear/editar
  - Acceptance: Se pueden seleccionar múltiples destinatarios; el estado se guarda en `destinatarios` array
  - Verify: Typecheck pasa; abrir diálogo y marcar 2+ checkboxes
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`
- [ ] Task 2: Mostrar "Ámbito" en la tabla (Usuarios / Empleados / Marcas / Global)
  - Acceptance: La columna Ámbito muestra "Global" cuando están los 3 seleccionados, o los nombres individuales
  - Verify: Typecheck pasa; tabla refleja combinación correcta
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`
- [ ] Task 3: Agregar selector de "Idioma base" en el diálogo (Español, English, Français, etc.)
  - Acceptance: Select de idioma base visible y funcional; cambia el valor de `baseLocale`
  - Verify: Typecheck pasa; select renderiza y selecciona
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`

### Checkpoint: Phase 1
- [ ] Typecheck pasa
- [ ] Destinatarios múltiples funcionan en diálogo y tabla
- [ ] Selector de idioma base presente

## Phase 2: P0 — Traducciones + P1 — Nombre interno / Slug

- [ ] Task 4: Agregar sección "Traducciones" con estado por idioma (✅ / ⚠ pendiente)
  - Acceptance: Se muestra lista de idiomas con estado de traducción; se puede editar título/cuerpo por idioma
  - Verify: Typecheck pasa; editar título en inglés y ver reflejado
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`
- [ ] Task 5: Agregar campos "Nombre interno" y "Clave única (slug)"
  - Acceptance: Dos campos nuevos en el diálogo; slug se genera/edita libremente
  - Verify: Typecheck pasa; campos guardan y leen correctamente
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`

### Checkpoint: Phase 2
- [ ] Typecheck pasa
- [ ] Traducciones por idioma editables
- [ ] Nombre interno y slug presentes

## Phase 3: P2 — Tipo de plantilla + Reglas de variables

- [ ] Task 6: Agregar campo "Tipo de plantilla" (Sistema / Evento automático / Campaña manual)
  - Acceptance: Select de tipo de plantilla en el diálogo; se guarda en `templateType`
  - Verify: Typecheck pasa; select renderiza con 3 opciones
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`
- [ ] Task 7: Mostrar reglas de variables (qué variables aplican a Título vs Cuerpo)
  - Acceptance: Lista de variables con indicadores ✅/❌ para Título y Cuerpo
  - Verify: Typecheck pasa; indicadores visibles
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`

### Checkpoint: Phase 3
- [ ] Typecheck pasa
- [ ] Tipo de plantilla seleccionable
- [ ] Reglas de variables visibles

## Phase 4: P3 — Auditoría

- [ ] Task 8: Mostrar auditoría solo en modo edición (creado por, fechas)
  - Acceptance: En modo edición, sección de auditoría visible; en modo creación, oculto
  - Verify: Typecheck pasa; auditoría no aparece al crear, sí al editar
  - Files: `frontend/src/components/notifications/TemplatesManager.tsx`

### Checkpoint: Complete
- [ ] Todas las acceptance criteria cumplidas
- [ ] Typecheck pasa
- [ ] Listo para review
