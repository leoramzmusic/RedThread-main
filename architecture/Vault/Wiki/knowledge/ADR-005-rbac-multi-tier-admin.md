# ADR-005: Control de Acceso Basado en Roles (RBAC) y Portal de Empleados

- **Estado**: Aceptado
- **Fecha**: 2026-02-22
- **Decisores**: Seguridad y Operaciones
- **Código Relacionado**:
  - [[backend/src/api/admin_portal.py]]
  - [[backend/src/api/admin_usuarios.py]]
  - [[backend/src/models/admin_rbac.py]]
  - [[backend/src/models/employee.py]]
  - [[backend/src/services/employee_service.py]]
  - [[frontend/src/pages/portal-redthread/index.tsx]]

---

## 🎯 Contexto y Problema
Las operaciones internas (soporte al cliente, moderación de perfiles, gestión de campañas, configuración de tiers de pago, auditoría de denuncias) requieren un portal administrativo estricto con separación de privilegios para evitar que cualquier empleado tenga acceso no autorizado a datos sensibles.

## ⚖️ Decisión
1. **Entidades Diferenciadas**:
   - `User`: Usuario final de la aplicación móvil/web.
   - `Employee`: Personal corporativo con departamento (`Operations`, `Customer Support`, `Trust & Safety`, `Engineering`).
   - `AdminUser`: Relación RBAC que asocia un ID a un rol (`SUPER_ADMIN`, `ADMIN`, `MODERATOR`, `SUPPORT`).
2. **Registro de Auditoría**: Toda acción de moderación, borrado o cambio de rol genera un registro inmutable en `admin_actions` y `employee_audit`.

## 📊 Consecuencias
- Cumplimiento de políticas de gobernanza de datos y privacidad (GDPR/CCPA compliant).
- Control granular por endpoints con dependencias FastAPI (`require_role`, `require_permission`).
