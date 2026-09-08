from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from src.core.config import settings
from src.db.utils.connection import init_db, close_db
from src.services.redis_service import redis_service
from src.services.discovery.routes import router as discovery_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print(f"🚀 Starting Discovery Service v{settings.APP_VERSION}")
    
    # Initialize database
    await init_db()
    
    # Initialize Redis
    await redis_service.connect()
    
    yield
    
    # Shutdown
    print("🛑 Shutting down Discovery Service...")
    await close_db()
    await redis_service.close()


app = FastAPI(
    title="Red Thread Discovery Service",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(discovery_router, prefix="/discovery", tags=["Discovery"])


@app.get("/health")
async def health_check():
    """Health check"""
    return {"status": "healthy", "service": "discovery"}

