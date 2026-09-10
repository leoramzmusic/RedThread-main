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
SPOTIFY_REDIRECT_URI = settings.SPOTIFY_REDIRECT_URI 

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

async def handle_spotify_callback(code: str, state: str):
    """Handle Spotify OAuth callback (shared by /callback routes)."""
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

            # Detect account product (free/premium) from Spotify /v1/me.
            # Survives failures gracefully: product stays as-is if Spotify blocks the call.
            try:
                me_response = await client.get(
                    "https://api.spotify.com/v1/me",
                    headers={"Authorization": f"Bearer {user.spotify_access_token}"},
                    timeout=10.0
                )
                if me_response.status_code == 200:
                    me_data = me_response.json()
                    user.spotify_product = me_data.get("product")
            except Exception as e:
                print(f"Could not detect Spotify product: {e}")

            await user.save()

            # Redirect back to the page user came from, flagging the connection
            separator = "&" if "?" in redirect_to else "?"
            return RedirectResponse(f"http://localhost:3000{redirect_to}{separator}spotify_connected=true")

        except httpx.HTTPStatusError as e:
            print(f"Spotify Token Exchange Failed: {e}")
            if e.response is not None:
                print(f"Spotify response: {e.response.text}")
            raise HTTPException(status_code=400, detail=f"Spotify Token Exchange Failed: {e}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving token: {str(e)}")


@router.get("/callback")
async def callback(code: str, state: str):
    """Handle Spotify OAuth callback (registered path: /api/auth/spotify/callback)"""
    return await handle_spotify_callback(code, state)

@router.get("/token")
async def get_token(current_user: User = Depends(get_current_user)):
    """Get current user's Spotify access token"""
    # Check if token exists and is not expired
    if not current_user.spotify_access_token:
        return JSONResponse({"authenticated": False, "token": None, "product": None})
    
    # Check expiration
    if current_user.spotify_token_expires_at and current_user.spotify_token_expires_at < datetime.utcnow():
        # Token expired - should refresh here in production
        return JSONResponse({"authenticated": False, "token": None, "expired": True, "product": None})
    
    return JSONResponse({
        "authenticated": True,
        "token": current_user.spotify_access_token,
        "product": current_user.spotify_product
    })

@router.delete("/disconnect")
async def disconnect(current_user: User = Depends(get_current_user)):
    """Disconnect Spotify from user account"""
    current_user.spotify_access_token = None
    current_user.spotify_refresh_token = None
    current_user.spotify_token_expires_at = None
    current_user.spotify_product = None
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

    async def _do_search(token: str):
        async with httpx.AsyncClient() as client:
            return await client.get(
                "https://api.spotify.com/v1/search",
                params={"q": q, "type": type, "limit": 10},
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0
            )

    # 1. Try User's Personal Token
    token = None
    if current_user.spotify_access_token:
        if current_user.spotify_token_expires_at and current_user.spotify_token_expires_at > datetime.utcnow():
            token = current_user.spotify_access_token

    response = None
    if token:
        response = await _do_search(token)
        if response.status_code in (401, 403):
            print(f"[SPOTIFY] User token rejected ({response.status_code}), falling back to Client Credentials")
            token = None

    # 2. Fallback to Client Credentials Token
    if token is None:
        token = await _get_client_token()
        if not token:
            return JSONResponse({"error": "No available Spotify token"}, status_code=503)
        response = await _do_search(token)

    try:
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        text = response.text[:300] if response is not None else str(e)
        print(f"Spotify Search Failed ({response.status_code if response is not None else '?'}): {text}")
        if response is not None and "premium subscription required" in response.text.lower():
            error_msg = "La cuenta de Spotify propietaria de la app requiere una suscripcion Premium activa. Spotify tardara unas horas tras activarla."
        else:
            error_msg = f"Spotify API rejected request: {text}"
        status = response.status_code if response is not None and response.status_code in (401, 403, 429) else 502
        return JSONResponse({"error": error_msg}, status_code=status)
    except Exception as e:
        print(f"Spotify Search Failed: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

