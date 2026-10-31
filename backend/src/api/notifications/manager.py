"""Módulo padre del Gestor de Notificaciones.

Centraliza funcionalidad transversal a todas las audiencias (users, employees, brands):
- Dashboard global
- Métricas globales y KPIs cruzados
- Plantillas compartidas
- Historial global

Este módulo NO pertenece a ninguna audiencia específica; deriva hacia
users.py, employee.py y brand.py según recipient_type.
"""

from fastapi import APIRouter

router = APIRouter(tags=["Notifications - Manager"])

# Placeholder: rutas globales del Gestor de Notificaciones se añaden en Fase 4
# sin tocar la lógica de DND, rutinas, notificaciones programadas, papelera,
# read/resolved ni NotificationPanel funcional.
