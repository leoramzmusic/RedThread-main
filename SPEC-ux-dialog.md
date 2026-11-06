# Spec: Reestructuración UX — Diálogo Crear/Editar Plantilla

## Assumptions I'm making

1. Todo el formulario vive dentro de `<DialogContent>` en `TemplatesManager.tsx`.
2. Las secciones actuales son: GENERAL, VARIABLES DISPONIBLES, VISUAL, COMPORTAMIENTO, LOCALIZACIÓN, TRADUCCIONES, DESTINATARIOS, OPCIONES, METADATOS, AUDITORÍA.
3. El DialogContent tiene `maxHeight: "85vh"` y `overflowY: "auto"`.
4. No hay tests unitarios para este componente; verificación es manual + typecheck.
5. Los datos de prueba para la preview usan `PREVIEW_DATA` existente.

## Objective

Reorganizar el diálogo de crear/editar plantilla en 4 bloques lógicos para que el usuario sepa qué rellenar primero, qué es obligatorio, qué es opcional y qué es avanzado. Mejorar la jerarquía visual, los tamaños de controles, los labels y la agrupación de información.

## Tech Stack

- React + TypeScript + MUI (Material UI)
- Componente: `TemplatesManager.tsx`

## Commands

- Build: `npm run build`
- Typecheck: `npx tsc --noEmit --skipLibCheck`
- Dev: `npm run dev`

## Project Structure

```
frontend/src/components/notifications/TemplatesManager.tsx  → único archivo modificado
SPEC-ux-dialog.md                                         → este documento
tasks/plan.md                                             → plan de implementación
tasks/todo.md                                             → lista de tareas
```

## Code Style

- MUI `sx` prop para estilos.
- Componentes funcionales con hooks.
- Secciones envueltas en `<Box>` con borde, radius 1, header de sección y cuerpo con padding.
- No comentarios en el código.

## Testing Strategy

- Typecheck: `npx tsc --noEmit --skipLibCheck` debe pasar tras cada bloque.
- Verificación manual: abrir diálogo, revisar que las 4 secciones están en orden, que el scroll funciona, que los controles tienen los tamaños correctos.

## Boundaries

- **Always:** Typecheck pasa tras cada cambio; no se eliminan campos del modelo de datos.
- **Ask first:** Cambios en el contrato API (payload de guarda); agregar dependencias nuevas.
- **Never:** Eliminar campos ya implementados (baseLocale, translations, slug, internalName, templateType).

## Success Criteria

- [ ] 4 bloques visibles: CONTENIDO, APARIENCIA, ENTREGA, CONFIGURACIÓN AVANZADA
- [ ] GENERAL: Título 1 línea, Cuerpo 4-5 líneas, Idioma actual arriba
- [ ] VARIABLES: Agrupadas por categoría (USUARIO, INTERACCIONES, CARE), más grandes, "Disponible en", buscador
- [ ] VISUAL: Iconos 32px, ocultar selector si Avatar usuario
- [ ] COMPORTAMIENTO: Renombrado a nombres claros (QUÉ OCURRE AL HACER CLIC, AUTOMATIZACIÓN, ÁREA)
- [ ] VISTA PREVIA: 350-400px, datos de prueba visibles
- [ ] LOCALIZACIÓN: Idioma base + fallback
- [ ] TRADUCCIONES: Resumen + modal "Ver traducciones"
- [ ] DESTINATARIOS: Checkboxes + Ámbito resultante
- [ ] OPCIONES: Con tooltips explicativos
- [ ] METADATOS: Con tooltips explicativos
- [ ] Typecheck pasa

## Open Questions

- ¿Cuáles son los 40+ nombres de variables que habrá en el futuro para dimensionar el buscador?
- ¿Qué textos exactos se quieren para cada tooltip de OPCIONES y METADATOS?
