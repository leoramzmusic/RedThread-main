from fastapi import APIRouter, Request, HTTPException, Response, Depends
from fastapi.responses import RedirectResponse, JSONResponse
import httpx
import urllib.parse
from datetime import datetime, timedelta
from src.core.config import settings
from src.api.auth import get_current_user
from src.models.user import User

router = APIRouter()

# --- Spotify Configuration ---
SPOTIFY_CLIENT_ID = settings.SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET = settings.SPOTIFY_CLIENT_SECRET
SPOTIFY_REDIRECT_URI = "http://127.0.0.1:8000/api/auth/spotify/callback" 

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"

# --- Temporary session store for OAuth state ---
# Maps state tokens to user IDs during OAuth flow
oauth_states = {}

@router.get("/auth-url")
async def get_auth_url(current_user: User = Depends(get_current_user)):
    """Get Spotify OAuth URL - requires authentication"""
    if not SPOTIFY_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Missing server configuration: SPOTIFY_CLIENT_ID")

    # Generate state token for CSRF protection
    import secrets
    state = secrets.token_urlsafe(32)
    # Store both user_id and redirect_to in oauth_states
    oauth_states[state] = {
        "user_id": str(current_user.id),
        "redirect_to": "/"  # Default to home, frontend will send actual URL
    }

    scope = "user-read-private user-read-email"
    params = {
        "client_id": SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": SPOTIFY_REDIRECT_URI,
        "scope": scope,
        "state": state,
        "show_dialog": "true"
    }
    url = f"{SPOTIFY_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return JSONResponse({"url": url})

@router.post("/auth-url")
async def get_auth_url_with_redirect(request: dict, current_user: User = Depends(get_current_user)):
    """Get Spotify OAuth URL with custom redirect - requires authentication"""
    if not SPOTIFY_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Missing server configuration: SPOTIFY_CLIENT_ID")

    # Generate state token for CSRF protection
    import secrets
    state = secrets.token_urlsafe(32)
    # Store both user_id and redirect_to
    redirect_to = request.get("redirect_to", "/")
    oauth_states[state] = {
        "user_id": str(current_user.id),
        "redirect_to": redirect_to
    }

    scope = "user-read-private user-read-email"
    params = {
        "client_id": SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": SPOTIFY_REDIRECT_URI,
        "scope": scope,
        "state": state,
        "show_dialog": "true"
    }
    url = f"{SPOTIFY_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return JSONResponse({"url": url})

@router.get("/callback")
async def callback(code: str, state: str):
    """Handle Spotify OAuth callback"""
    if not code:
        raise HTTPException(status_code=400, detail="Missing code parameter")
    
    # Verify state token and get user data
    user_data = oauth_states.pop(state, None)
    if not user_data:
        raise HTTPException(status_code=400, detail="Invalid or expired state token")
    
    user_id = user_data.get("user_id") if isinstance(user_data, dict) else user_data
    redirect_to = user_data.get("redirect_to", "/") if isinstance(user_data, dict) else "/"
    
    async with httpx.AsyncClient() as client:
        try:
            # Exchange code for tokens
            response = await client.post(
                SPOTIFY_TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": SPOTIFY_REDIRECT_URI,
                    "client_id": SPOTIFY_CLIENT_ID,
                    "client_secret": SPOTIFY_CLIENT_SECRET,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            response.raise_for_status()
            token_data = response.json()
            
            # Save tokens to user document
            user = await User.get(user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            user.spotify_access_token = token_data.get("access_token")
            user.spotify_refresh_token = token_data.get("refresh_token")
            
            # Calculate expiration (usually 3600 seconds = 1 hour)
            expires_in = token_data.get("expires_in", 3600)
            user.spotify_token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            
            await user.save()
            
            # Redirect back to the page user came from
            return RedirectResponse(f"http://localhost:3000{redirect_to}")
            
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=400, detail=f"Spotify Token Exchange Failed: {e}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving token: {str(e)}")

@router.get("/token")
async def get_token(current_user: User = Depends(get_current_user)):
    """Get current user's Spotify access token"""
    # Check if token exists and is not expired
    if not current_user.spotify_access_token:
        return JSONResponse({"authenticated": False, "token": None})
    
    # Check expiration
    if current_user.spotify_token_expires_at and current_user.spotify_token_expires_at < datetime.utcnow():
        # Token expired - should refresh here in production
        return JSONResponse({"authenticated": False, "token": None, "expired": True})
    
    return JSONResponse({"authenticated": True, "token": current_user.spotify_access_token})

@router.delete("/disconnect")
async def disconnect(current_user: User = Depends(get_current_user)):
    """Disconnect Spotify from user account"""
    current_user.spotify_access_token = None
    current_user.spotify_refresh_token = None
    current_user.spotify_token_expires_at = None
    await current_user.save()
    
    return JSONResponse({"message": "Disconnected successfully"})


# --- Client Credentials Flow (Search without user login) ---
_client_token_cache = {
    "token": None,
    "expires_at": None
}

async def _get_client_token():
    """Get or refresh Spotify Client Credentials Token"""
    now = datetime.utcnow()
    
    # Return cached token if valid
    if (_client_token_cache["token"] and 
        _client_token_cache["expires_at"] and 
        _client_token_cache["expires_at"] > now):
        return _client_token_cache["token"]
        
    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        print("Missing Spotify Client ID or Secret")
        return None

    # Get new token
    async with httpx.AsyncClient() as client:
        try:
            auth_str = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
            import base64
            b64_auth = base64.b64encode(auth_str.encode()).decode()
            
            response = await client.post(
                "https://accounts.spotify.com/api/token",
                data={"grant_type": "client_credentials"},
                headers={
                    "Authorization": f"Basic {b64_auth}",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            
            token = data["access_token"]
            expires_in = data.get("expires_in", 3600)
            
            _client_token_cache["token"] = token
            _client_token_cache["expires_at"] = now + timedelta(seconds=expires_in - 60) # Buffer
            
            return token
        except Exception as e:
            print(f"Error getting client token: {e}")
            return None

@router.get("/search")
async def search_spotify(q: str, type: str = "track,artist", current_user: User = Depends(get_current_user)):
    """
    Search Spotify. Uses User Token if connected, otherwise falls back to Client Credentials.
    """
    if not q:
        return JSONResponse({"items": []})

    token = None
    
    # 1. Try User's Personal Token
    if current_user.spotify_access_token:
        # Check expiry (simple check, ideally refresh it)
        if current_user.spotify_token_expires_at and current_user.spotify_token_expires_at > datetime.utcnow():
            token = current_user.spotify_access_token
    
    # 2. Fallback to Client Credentials Token
    if not token:
        # print("User not connected to Spotify, using App Credentials...")
        token = await _get_client_token()
        
    if not token:
        return JSONResponse({"error": "No available Spotify token"}, status_code=503)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://api.spotify.com/v1/search",
                params={"q": q, "type": type, "limit": 10},
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0
            )
            
            if response.status_code == 401:
                # Token might be expired (if user token), fallback to new client token?
                # For simplicity, if user token failed, maybe we should try client token?
                # But let's just error for now or keep it simple.
                return JSONResponse({"error": "Spotify token expired"}, status_code=401)
                
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            print(f"Spotify Search Failed: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

