import asyncio
from fastapi import FastAPI, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from src.core.config import settings
from src.core.database import init_db, close_db
from src.services.redis_service import redis_service
from src.services.kafka_service import kafka_service
from src.services.kafka_topics import KafkaTopic
from src.services.kafka_consumers import (
    handle_match_event,
    handle_chat_message,
    handle_analytics_event,
    handle_notification_event,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print(f"[START] {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"[ENV] {settings.ENVIRONMENT}")
    
    # Initialize database
    await init_db()

    # Auto-seed default roles/departments in ALL environments (idempotent)
    try:
        from src.core.seed_defaults import seed_default_roles_and_departments
        await seed_default_roles_and_departments()
    except Exception as e:
        print(f"⚠️ Seed defaults failed: {e}")

    # Initialize Redis
    await redis_service.connect()
    
    # Initialize Kafka
    await kafka_service.connect()
    if settings.KAFKA_ENABLED:
        asyncio.create_task(kafka_service.consume([KafkaTopic.MATCHES_NEW], handle_match_event))
        asyncio.create_task(kafka_service.consume([KafkaTopic.CHAT_MESSAGES], handle_chat_message))
        asyncio.create_task(kafka_service.consume([KafkaTopic.USER_EVENTS, KafkaTopic.SWIPES], handle_analytics_event))
        asyncio.create_task(kafka_service.consume([KafkaTopic.NOTIFICATIONS], handle_notification_event))
    
    yield
    
    # Shutdown
    print("🛑 Shutting down...")
    await kafka_service.close()
    await close_db()
    await redis_service.close()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Red Thread - Meaningful connections inspired by the red thread legend",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    redirect_slashes=False,  # Disable automatic trailing slash redirects to avoid CORS issues
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Middleware (CSP, XSS protection, etc.)
from src.core.middleware.security_middleware import SecurityMiddleware
app.add_middleware(SecurityMiddleware)

# Online Status Middleware
from src.core.online_status_middleware import update_last_seen_middleware
app.middleware("http")(update_last_seen_middleware)


# Root endpoint
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "redis": "connected" if redis_service.is_connected() else "disconnected",
        "kafka": kafka_service.status(),
    }


# Import and include routers
from src.api import (
    auth, 
    profiles,
    users,  # New: Username-based operations
    discovery, 
    home,
    chat, 
    events, 
    notifications,
    partners,
    roulette,
    radar,
    visits,
    premium,
    moderation,
    options,
    settings as settings_router,
    uploads,
    friends,
    emotions,  # New
    admin_portal,
    admin_eventos,
    admin_empleados,
    admin_metricas,
    admin_denuncias,
    admin_usuarios,
    admin_finanzas,
    admin_campanas,
    admin_soporte,
    admin_configuracion,
    admin_verificaciones,  # New
    admin_bootstrap,  # New: Bootstrap for initial setup
    legal,  # New
    help as help_router,  # New
    media,  # New
    spotify_auth, # New
    admin_roles, # New
    admin_departments, # New
    admin_algorithms, # New
    admin_appearance, # New: Appearance Module
    admin_yuki, # New: Yuki Mascot Config
    interests, # New: Interest management
    golth, # New: Premium module

    icebreaker, # New: Icebreaker
    games, # New: Creative Identity Games
)
from src.api.admin import auth as admin_auth, care_analytics  # CARE Analytics
from src.routers import boost  # Boost System

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(spotify_auth.router, prefix="/api/auth/spotify", tags=["Spotify Auth"]) # New
# Root callback route to match the registered Spotify Redirect URI
app.add_api_route("/callback", spotify_auth.handle_spotify_callback, methods=["GET"], tags=["Spotify Auth"])
app.include_router(admin_auth.router, tags=["Admin Auth"])  # Employee authentication
app.include_router(users.router, prefix="/users", tags=["Users"])  # New
app.include_router(home.router, prefix="/home", tags=["Home"])
app.include_router(profiles.router, prefix="/profiles", tags=["Profiles"])
app.include_router(interests.router, prefix="/api", tags=["Interests"])  # New: Interest management
app.include_router(discovery.router, prefix="/discovery", tags=["Discovery"])
app.include_router(partners.router, prefix="/partners", tags=["Partners"])
app.include_router(friends.router, prefix="/friends", tags=["Friends"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(roulette.router, prefix="/roulette", tags=["Roulette"])
app.include_router(events.router, prefix="/events", tags=["Events"])
app.include_router(radar.router, prefix="/radar", tags=["Radar"])
app.include_router(premium.router, prefix="/premium", tags=["Premium"])
app.include_router(golth.router, prefix="/golth", tags=["Golth"])
app.include_router(moderation.router, prefix="/moderation", tags=["Moderation"])
app.include_router(options.router, prefix="/options", tags=["System Options"])
app.include_router(settings_router.router, prefix="/settings", tags=["Settings"])
app.include_router(uploads.router, prefix="/uploads", tags=["Uploads"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(visits.router, prefix="/visits", tags=["Visits"])
app.include_router(emotions.router, prefix="/emotions", tags=["Emotions"])  # New
app.include_router(legal.router, prefix="/legal", tags=["Legal"])  # New
app.include_router(help_router.router, prefix="/help", tags=["Help"])  # New
app.include_router(media.router, prefix="/media", tags=["Media"])  # New
app.include_router(icebreaker.router, prefix="/api/icebreaker", tags=["Icebreaker"])
app.include_router(games.router, prefix="/api/games", tags=["Games"])
app.include_router(boost.router, prefix="/boost", tags=["Boost"])  # Boost System



# Admin Portal Routers
# Note: Authentication is handled by Employee RBAC middleware at endpoint level
# No need for router-level dependencies since Employee tokens are used

app.include_router(admin_portal.router, prefix="/portal-redthread", tags=["Admin Portal"])
# ⚠️ Bootstrap solo para entornos de desarrollo/inicialización (nunca en producción)
if settings.ENVIRONMENT in ("local", "dev", "qa"):
    app.include_router(admin_bootstrap.router, prefix="/portal-redthread/bootstrap", tags=["Admin - Bootstrap"])
app.include_router(admin_eventos.router, prefix="/portal-redthread/eventos", tags=["Admin - Eventos"])
app.include_router(admin_empleados.router, prefix="/portal-redthread/empleados", tags=["Admin - Empleados"])
app.include_router(admin_metricas.router, prefix="/portal-redthread/metricas", tags=["Admin - Métricas"])
app.include_router(admin_denuncias.router, prefix="/portal-redthread/denuncias", tags=["Admin - Denuncias"])
app.include_router(admin_usuarios.router, prefix="/portal-redthread/usuarios", tags=["Admin - Usuarios"])
app.include_router(admin_finanzas.router, prefix="/portal-redthread/finanzas", tags=["Admin - Finanzas"])
app.include_router(admin_campanas.router, prefix="/portal-redthread/campanas", tags=["Admin - Campañas"])
app.include_router(admin_soporte.router, prefix="/portal-redthread/soporte", tags=["Admin - Soporte"])
app.include_router(admin_configuracion.router, prefix="/portal-redthread/configuracion", tags=["Admin - Configuración"])
app.include_router(admin_verificaciones.router, prefix="/portal-redthread/verificaciones", tags=["Admin - Verificaciones"])
app.include_router(admin_roles.router, prefix="/portal-redthread/roles", tags=["Admin - Roles"]) # New
app.include_router(admin_departments.router, prefix="/portal-redthread/departments", tags=["Admin - Departamentos"]) # New
app.include_router(admin_algorithms.router, prefix="/portal-redthread/experiencia/algoritmos", tags=["Admin - Algoritmos"]) # New
app.include_router(admin_appearance.router, prefix="/portal-redthread/apariencia", tags=["Admin - Apariencia"]) # New
app.include_router(admin_yuki.router, prefix="/portal-redthread/experiencia/mascota", tags=["Admin - Mascota Yuki"]) # New
app.include_router(care_analytics.router, prefix="/admin/care-analytics", tags=["Admin - CARE Analytics"])  # CARE Engine


# Mount static files
from fastapi.staticfiles import StaticFiles
import os

# Ensure upload directory exists
os.makedirs("static/uploads", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )

