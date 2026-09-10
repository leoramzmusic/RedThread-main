from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings with environment-based configuration"""
    
    # Application
    APP_NAME: str = "Red Thread"
    APP_VERSION: str = "1.1.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "local"  # local, dev, qa, prod
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "redthread"
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    
    # Access Token Expiration (minutes)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Web default
    ACCESS_TOKEN_EXPIRE_MINUTES_MOBILE: int = 60  # Mobile apps
    
    # Refresh Token Expiration (days)
    REFRESH_TOKEN_EXPIRE_DAYS_WEB: int = 1  # Web without "Remember Me"
    REFRESH_TOKEN_EXPIRE_DAYS_WEB_REMEMBER: int = 30  # Web with "Remember Me"
    REFRESH_TOKEN_EXPIRE_DAYS_MOBILE: int = 90  # Mobile apps
    
    # Session Management
    MAX_ACTIVE_SESSIONS_PER_USER: int = 5  # Maximum concurrent sessions
    SUSPICIOUS_LOCATION_CHANGE_KM: float = 500.0  # Distance threshold for alerts
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:3001"]
    
    # OAuth - Google
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"
    
    # OAuth - Facebook
    FACEBOOK_CLIENT_ID: Optional[str] = None
    FACEBOOK_CLIENT_SECRET: Optional[str] = None
    FACEBOOK_REDIRECT_URI: str = "http://localhost:8000/auth/facebook/callback"
    
    # OAuth - Apple
    APPLE_CLIENT_ID: Optional[str] = None
    APPLE_TEAM_ID: Optional[str] = None
    APPLE_KEY_ID: Optional[str] = None
    APPLE_PRIVATE_KEY: Optional[str] = None
    
    # Spotify API
    SPOTIFY_CLIENT_ID: Optional[str] = None
    SPOTIFY_CLIENT_SECRET: Optional[str] = None
    SPOTIFY_REDIRECT_URI: str = "http://127.0.0.1:8000/callback"
    
    # Instagram API
    INSTAGRAM_CLIENT_ID: Optional[str] = None
    INSTAGRAM_CLIENT_SECRET: Optional[str] = None
    
    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # Premium Pricing
    PREMIUM_MONTHLY_PRICE: float = 9.99
    PREMIUM_3_MONTH_PRICE: float = 24.99
    PREMIUM_6_MONTH_PRICE: float = 44.99
    PREMIUM_YEARLY_PRICE: float = 79.99
    
    VIP_MONTHLY_PRICE: float = 19.99
    VIP_3_MONTH_PRICE: float = 49.99
    VIP_6_MONTH_PRICE: float = 89.99
    VIP_YEARLY_PRICE: float = 149.99
    
    # Boost Pricing
    BOOST_5_PACK_PRICE: float = 7.99
    BOOST_10_PACK_PRICE: float = 14.99
    BOOST_20_PACK_PRICE: float = 24.99
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_TYPES: list = ["image/jpeg", "image/png", "image/webp"]
    
    # Radar Settings
    BASIC_RADAR_RANGE_KM: float = 5.0
    PREMIUM_RADAR_RANGE_KM: float = 50.0
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Email Settings (SMTP)
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_STARTTLS: bool = False
    SMTP_SSL_TLS: bool = False
    MAIL_CONSOLE_LOG: bool = True
    EMAILS_FROM_EMAIL: str = "noreply@redthread.com"
    EMAILS_FROM_NAME: str = "RedThread"
    
    # Password Reset
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 24
    FRONTEND_URL: str = "http://localhost:3000"

    # Kafka - Event Bus
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_ENABLED: bool = True
    KAFKA_GROUP_ID: str = "redthread-backend"
    KAFKA_AUTO_OFFSET_RESET: str = "earliest"
    KAFKA_MAX_BATCH_SIZE: int = 16384
    KAFKA_LINGER_MS: int = 5

    class Config:
        env_file = "config/local.env"
        case_sensitive = True


# Global settings instance
settings = Settings()

