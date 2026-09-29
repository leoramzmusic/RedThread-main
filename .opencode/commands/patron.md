# Patrones de exclusión globales

Este archivo define las carpetas y archivos que nunca deben procesarse ni versionarse
en ningún proyecto, para mantener el entorno ligero y acelerar el flujo de OpenCode.

## 🚫 Directorios ignorados
- **/node_modules/**  
  Dependencias externas instaladas vía npm/yarn/pnpm. Siempre se regeneran.

- **/dist/**  
  Archivos compilados temporales.

- **/build/**  
  Artefactos de producción.

- **/coverage/**  
  Reportes de pruebas automatizadas.

- **/logs/**  
  Archivos de log generados por el sistema.

- **/tmp/**  
  Archivos temporales.

## 🚫 Archivos ignorados
- **/.env**  
  Variables sensibles. Usar `.env.example` para compartir estructura.

- **/.DS_Store**  
  Archivos ocultos de macOS.

- **Thumbs.db**  
  Archivos ocultos de Windows.

## 📌 Notas
- Estos patrones aplican a todos los proyectos.  
- Cada proyecto puede añadir reglas específicas en su propio `patron.md`.  
- Configuraciones importantes (ej. `vite.config.js`, `webpack.config.js`) sí deben versionarse.
