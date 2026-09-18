# Guía de Integración - Identity Verification Container

## Archivos Creados

✅ **3 Archivos Modulares:**

1. `frontend/src/hooks/useIdentityVerification.ts` - Hook personalizado con lógica
2. `frontend/src/components/profile/RealNameField.tsx` - Campo del nombre real
3. `frontend/src/components/profile/IdentityVerificationContainer.tsx` - Contenedor completo

## Cómo Integrar en ProfileEdit.tsx

### Paso 1: Importar el componente

En la parte superior de `ProfileEdit.tsx`, agrega:

```tsx
import IdentityVerificationContainer from './IdentityVerificationContainer';
```

### Paso 2: Encontrar el campo "Nombre Real"

Busca en el archivo (línea ~398-449) el `Controller` con `name="real_name"` que actualmente tiene todo el código del campo.

### Paso 3: Reemplazar SOLO ese bloque

Reemplaza todo el bloque desde:
```tsx
<Grid item xs={12}>
  <Controller
    name="real_name"
    ...
  />
</Grid>
```

Con:
```tsx
<Grid item xs={12}>
  <IdentityVerificationContainer
    control={control}
    setValue={setValue}
    verified={verified}
    setVerified={setVerified}
  />
</Grid>
```

## Ejemplo Completo

**ANTES:**
```tsx
<Grid item xs={12}>
  <Controller
    name="real_name"
    control={control}
    render={({ field }) => (
      <TextField 
        {...field} 
        fullWidth 
        label="Nombre Real" 
        ... // 50+ líneas de código
      />
    )}
  />
</Grid>
```

**DESPUÉS:**
```tsx
<Grid item xs={12}>
  <IdentityVerificationContainer
    control={control}
    setValue={setValue}
    verified={verified}
    setVerified={setVerified}
  />
</Grid>
```

## Beneficios

✅ **Modular** - Cada parte tiene su responsabilidad
✅ **Reusable** - Puedes usar el componente en otros lugares
✅ **Mantenible** - Cambios en verificación de identidad no afectan ProfileEdit
✅ **Testeable** - Puedes probar cada componente por separado
✅ **No Corrupciones** - ProfileEdit permanece limpio

## Funcionalidades Incluidas

1. ✅ Ícono de upload en lado derecho (gris)
2. ✅ Campo read-only cuando está verificado
3. ✅ VerifiedUserIcon en lado izquierdo cuando verificado
4. ✅ Confirmación para re-upload
5. ✅ Extracción inmediata de nombre y fecha
6. ✅ Snackbar con mensaje de éxito/error
7. ✅ Indicador de loading durante upload

## Testing

Para probar que funciona:

1. Sube un documento claro
2. Verifica que el nombre aparece inmediatamente en el campo
3. El campo debe estar en modo lectura con el ícono de verificado
4. El ícono de upload debe permanecer disponible para re-upload

## Debugging

Si el nombre no aparece:
- Verifica que el backend esté corriendo
- Revisa la consola del navegador para errores
- Verifica que Tesseract esté instalado
- Revisa los logs del backend para ver el texto OCR extraído
