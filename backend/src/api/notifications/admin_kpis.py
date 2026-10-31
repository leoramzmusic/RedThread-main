"""KPIs cruzados del Gestor de Notificaciones.

Endpoint único parametrizado por recipient_type (users | employees | brands)
para evitar duplicar pantallas de métricas por audiencia.
"""

from fastapi import APIRouter, Query

router = APIRouter(tags=["Notifications - Admin KPIs"])

# Placeholder: los KPIs reales se implementan en Fase 4 usando recipient_type.
# Ejemplo futuro: GET /admin_kpis?audience=users
