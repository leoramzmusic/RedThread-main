"""
Security Middleware
Adds security headers and response validation to protect against common vulnerabilities.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from typing import Callable


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all responses.
    Helps prevent XSS, clickjacking, and other common web vulnerabilities.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and add security headers to response.
        
        Args:
            request: Incoming HTTP request
            call_next: Next middleware or route handler
            
        Returns:
            Response with security headers added
        """
        # Process the request
        response = await call_next(request)
        
        # Add Content Security Policy (CSP)
        # Allows scripts from same origin and inline scripts (needed for some frameworks)
        # In production, tighten this policy based on your needs
        from src.core.config import settings
        
        # Connect-src needs to allow localhost in development
        connect_src = "connect-src 'self' https:"
        if settings.ENVIRONMENT == "local":
            connect_src += " http://localhost:* ws://localhost:*"
        
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            f"{connect_src}; "
            "media-src 'self' https:;"
        )
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevent clickjacking attacks
        response.headers["X-Frame-Options"] = "DENY"
        
        # Enable XSS protection in older browsers
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Force HTTPS in production (only if not in local development)
        # Uncomment in production with HTTPS enabled
        # response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Referrer policy - don't leak referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions policy - restrict access to browser features
        response.headers["Permissions-Policy"] = (
            "geolocation=(self), "
            "microphone=(), "
            "camera=()"
        )
        
        return response
