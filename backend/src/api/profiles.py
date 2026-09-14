from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form, Query
import json
from pydantic import BaseModel, HttpUrl, EmailStr, field_validator
from typing import List, Optional
from datetime import datetime
from src.models.user import User
from src.models.profile import Profile, Gender, IntentionType, ActivityPattern, MiHimno, Location
from src.api.auth import get_current_user
from src.utils.height_context import classify_height, map_country_to_region
from src.utils.continents import CONTINENT_COUNTRIES_MAP
from src.api.dtos.user_dtos import UserProfileResponseDTO
from src.services.redis_service import redis_service


router = APIRouter()

ALLOWED_RADIUS_KM = {5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100}

# Global persistent cache and semaphore for GeoJSON results to avoid hitting Nominatim too hard
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_FILE = os.path.join(BASE_DIR, "geojson_cache.json")

def load_geojson_cache():
    import json
    import os
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                print(f"Loaded {len(data)} items from GeoJSON cache.")
                return data
        except Exception as e:
            print(f"Error loading GeoJSON cache: {e}")
            return {}
    return {}

def save_geojson_cache(cache):
    import json
    import os
    try:
        # Simple atomic save
        temp_file = CACHE_FILE + ".tmp"
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False)
        os.replace(temp_file, CACHE_FILE)
    except Exception as e:
        print(f"Error saving GeoJSON cache: {e}")

GEOJSON_CACHE = load_geojson_cache()
SEARCH_SEMAPHORE = None # Will be initialized in search_places

# Local Country GeoJSON database for fast fallback
COUNTRIES_GEOJSON_FILE = os.path.join(BASE_DIR, "countries_geojson.json")
GEOJSON_LOAD_ERROR = None

def load_countries_geojson():
    global GEOJSON_LOAD_ERROR
    if os.path.exists(COUNTRIES_GEOJSON_FILE):
        try:
            with open(COUNTRIES_GEOJSON_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                print(f"Loaded {len(data)} countries from local GeoJSON database.")
                return data
        except Exception as e:
            GEOJSON_LOAD_ERROR = str(e)
            print(f"Error loading countries GeoJSON: {e}")
    else:
        GEOJSON_LOAD_ERROR = f"File not found: {COUNTRIES_GEOJSON_FILE}"
    return {}

COUNTRIES_GEOJSON = load_countries_geojson()

def normalize_str(s):
    import unicodedata
    if not s: return ""
    return "".join(c for c in unicodedata.normalize('NFD', str(s)) if unicodedata.category(c) != 'Mn').lower().strip()

# Manual mapping for Spanish to English (or whatever is in countries_geojson.json)
COUNTRY_NAME_MAPPING = {
    "mexico": "mexico",
    "estados unidos": "united states of america",
    "eeuu": "united states of america",
    "usa": "united states of america",
    "espana": "spain",
    "alemania": "germany",
    "francia": "france",
    "italia": "italy",
    "reino unido": "united kingdom",
    "uk": "united kingdom",
    "brasil": "brazil",
    "japon": "japan",
    "china": "china",
    "rusia": "russia",
    "canada": "canada",
    "australia": "australia",
    "nueva zelanda": "new zealand",
    "sudafrica": "south africa",
    "egipto": "egypt",
    "islas bahamas": "the bahamas",
    "paises bajos": "netherlands",
    "holanda": "netherlands",
    "belgica": "belgium",
    "suiza": "switzerland",
    "suecia": "sweden",
    "noruega": "norway",
    "finlandia": "finland",
    "dinamarca": "denmark",
    "republica dominicana": "dominican republic",
    "argentina": "argentina",
    "chile": "chile",
    "colombia": "colombia",
    "peru": "peru",
    "venezuela": "venezuela",
    "costa rica": "costa rica",
    "panama": "panama"
}


# Request/Response Models
class UpdateProfileRequest(BaseModel):
    # Basic User Info (user model)
    real_name: Optional[str] = None
    display_name: Optional[str] = None
    smart_photos_enabled: Optional[bool] = None
    
    # Basic Profile Info
    bio: Optional[str] = None
    birth_date: Optional[datetime] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    pronouns: Optional[str] = None
    nickname: Optional[str] = None
    
    # Identity
    sexual_orientation: Optional[str] = None
    gender_category: Optional[str] = None
    attraction_preferences: Optional[List[str]] = None
    orientation_preferences: Optional[List[str]] = None
    feeling_curious: Optional[bool] = None
    curiosity_genders: Optional[List[str]] = None
    
    # Goals & Intentions
    intentions: Optional[List[str]] = None
    relationship_goals: Optional[List[str]] = None
    relationship_status: Optional[str] = None
    relationship_type: Optional[str] = None
    
    # Interests & Lifestyle
    interests: Optional[List[str]] = None
    favorite_interests: Optional[List[str]] = None
    lifestyle_interests: Optional[List[str]] = None
    hobbies: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    auto_preferred_languages: Optional[bool] = None
    preferred_languages: Optional[List[str]] = None
    mood: Optional[str] = None
    
    # Lifestyle Details
    family_plans: Optional[str] = None
    family_plans_relevant: Optional[bool] = None
    child_acceptance: Optional[str] = None
    communication_style: Optional[str] = None
    love_language: Optional[str] = None
    social_media_usage: Optional[str] = None
    drinking: Optional[str] = None
    smoking: Optional[str] = None
    exercise: Optional[str] = None
    activity_pattern: Optional[str] = None
    zodiac: Optional[str] = None
    zodiac_relevant: Optional[bool] = None
    
    # Pets
    has_pets: Optional[bool] = None
    pet_types: Optional[List[str]] = None
    pets: Optional[List[str]] = None
    
    # Professional & Education
    occupation: Optional[str] = None
    work_company: Optional[str] = None
    education_level: Optional[str] = None
    education_center: Optional[str] = None
    school: Optional[str] = None
    
    # Physical
    height_cm: Optional[int] = None
    height_relevant: Optional[bool] = None
    height_preferences: Optional[List[str]] = None
    
    # Location
    location: Optional[Location] = None
    city: Optional[str] = None
    location_sharing_enabled: Optional[bool] = None
    
    # Media
    photos: Optional[List[str]] = None
    loops: Optional[List[str]] = None
    instagram_photos: Optional[List[str]] = None
    mi_himno: Optional[MiHimno] = None
    favorite_songs: Optional[List[dict]] = None
    spotify_playlists: Optional[List[str]] = None
    music_genres: Optional[List[str]] = None
    
    # Contact
    phone: Optional[str] = None
    country_code: Optional[str] = None
    email: Optional[EmailStr] = None
    
    # Search Preferences
    attraction_preferences: Optional[List[str]] = None
    age_range_min: Optional[int] = None
    age_range_max: Optional[int] = None
    distance_preference_km: Optional[int] = None
    search_radius_km: Optional[int] = None
    global_mode_enabled: Optional[bool] = None
    search_states: Optional[List[str]] = None
    search_countries: Optional[List[str]] = None
    excluded_states: Optional[List[str]] = None
    excluded_countries: Optional[List[str]] = None
    
    # Visibility Settings
    show_age: Optional[bool] = None
    show_location: Optional[bool] = None
    show_pronouns: Optional[bool] = None
    show_gender: Optional[bool] = None
    show_neurodiversity: Optional[bool] = None
    profile_visible: Optional[bool] = None
    show_me_in_discovery: Optional[bool] = None
    show_professional_only_matches: Optional[bool] = None
    
    # Prompts
    prompts: Optional[List[dict]] = None

    # Personality & Characteristics
    social_style: Optional[str] = None
    processing_style: Optional[str] = None
    risk_tolerance: Optional[str] = None
    decision_making: Optional[str] = None
    neurodiversity: Optional[List[str]] = None
    neurodiversity_diagnoses: Optional[List[str]] = None
    learning_preferences: Optional[List[str]] = None
    energy_level: Optional[str] = None
    mbti: Optional[str] = None
    
    disabilities: Optional[List[str]] = None
    disabilities_diagnoses: Optional[List[str]] = None
    health_conditions: Optional[List[str]] = None
    health_status: Optional[str] = None
    show_health: Optional[bool] = None
    show_disabilities: Optional[bool] = None
    self_care_preferences: Optional[List[str]] = None
    
    core_values: Optional[List[str]] = None
    lifestyle_mode: Optional[str] = None
    leisure_relation: Optional[List[str]] = None
    communication_style_v2: Optional[str] = None
    
    interaction_preference: Optional[str] = None
    openness_to_experience: Optional[str] = None
    collaboration_style: Optional[str] = None
    
    superpower: Optional[str] = None
    achilles_heel: Optional[str] = None
    personal_soundtrack: Optional[List[dict]] = None
    personal_soundtrack_text: Optional[str] = None

    @field_validator('distance_preference_km', 'search_radius_km')
    @classmethod
    def validate_search_radius(cls, v):
        if v is not None and v not in ALLOWED_RADIUS_KM:
            raise ValueError(f"Radio de exploración debe ser uno de {sorted(ALLOWED_RADIUS_KM)} km")
        return v


class UpdateLocationRequest(BaseModel):
    latitude: float
    longitude: float
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None


class UpdateDistanceRequest(BaseModel):
    distance_km: int
    search_states: Optional[List[str]] = None
    search_countries: Optional[List[str]] = None

    @field_validator('distance_km')
    @classmethod
    def validate_distance_km(cls, v):
        if v not in ALLOWED_RADIUS_KM:
            raise ValueError(f"Radio de exploración debe ser uno de {sorted(ALLOWED_RADIUS_KM)} km")
        return v


@router.get("/me")
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile (privacy-protected)"""
    
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not profile:
        # Auto-create profile if missing (self-healing)
        profile = Profile(
            user_id=str(current_user.id),
            age=18,
            gender="prefer_not_to_say",
            created_at=datetime.utcnow()
        )
        await profile.insert()
    
    # Create privacy-protected response using DTO
    # This automatically masks email/phone and excludes identity_document_url
    response_dto = UserProfileResponseDTO.from_user_and_profile(
        current_user,
        profile,
        mask_data=False
    )
    
    # Debug logging
    print(f"[PROFILE ME] User {current_user.id}:")
    print(f"  - verified: {current_user.verified}")
    print(f"  - identity_verification_status: {current_user.identity_verification_status}")
    
    return response_dto


@router.put("/me")
async def update_my_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile"""
    
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Get update data
    update_data = request.model_dump(exclude_unset=True)
    print(f"Updating profile with data keys: {list(update_data.keys())}")
    
    # Specific debug for new fields
    new_fields = ['family_plans', 'family_plans_relevant', 'child_acceptance', 'communication_style', 'love_language', 'social_media_usage']
    for f in new_fields:
        if f in update_data:
            print(f"-> Received {f}: {update_data[f]}")
        else:
            print(f"-> MISSING {f} in update_data")

    # Handle display_name separately (it's in User model, not Profile)
    display_name_updated = False
    
    # Check for sensitive data changes that require re-verification
    requires_reverification = False
    
    if "real_name" in update_data:
        new_rn = update_data["real_name"]
        if new_rn and current_user.real_name != new_rn:
            requires_reverification = True
            print(f"[VERIFY] Real Name changing: {current_user.real_name} -> {new_rn}")

    if "birth_date" in update_data:
        new_bd = update_data["birth_date"]
        if profile.birth_date != new_bd:
            requires_reverification = True
            print(f"[VERIFY] Birth Date changing: {profile.birth_date} -> {new_bd}")

    if requires_reverification and (current_user.verified or current_user.identity_verification_status in ['verified', 'pending', 'approved']):
        print(f"[VERIFY] Revoking verification and clearing document data for User {current_user.id}")
        current_user.verified = False
        current_user.identity_verification_status = 'none'
        current_user.identity_document_url = None
        current_user.identity_document_type = None
        current_user.identity_rejection_reason = None
        current_user.identity_submitted_at = None
        current_user.identity_verified_at = None
        current_user.updated_at = datetime.utcnow()
        await current_user.save()

    if "display_name" in update_data:
        display_name = update_data.pop("display_name")
        if display_name and len(display_name.strip()) >= 2:
            current_user.display_name = display_name.strip()
            current_user.updated_at = datetime.utcnow()
            await current_user.save()
            display_name_updated = True
            print(f"Updated display_name in User model: {current_user.display_name}")
    
    # Handle real_name separately (it's in User model, not Profile)
    real_name_updated = False
    if "real_name" in update_data:
        real_name = update_data.pop("real_name")
        if real_name and len(real_name.strip()) >= 2:
            # TODO: In the future, prevent editing if user is verified
            # if current_user.verified:
            #     raise HTTPException(
            #         status_code=status.HTTP_400_BAD_REQUEST,
            #         detail="Cannot edit real name after verification. Please contact support."
            #     )
            current_user.real_name = real_name.strip()
            current_user.updated_at = datetime.utcnow()
            await current_user.save()
            real_name_updated = True
            print(f"Updated real_name in User model: {current_user.real_name}")
    
    # Update profile fields (skip those handled separately)
    for field, value in update_data.items():
        if field in ["display_name", "real_name", "email"]:
            continue
            
        if hasattr(profile, field):
            # Special handling for Location model to ensure it stays as an object
            if field == 'location' and isinstance(value, dict):
                try:
                    setattr(profile, field, Location(**value))
                except Exception as e:
                    print(f"Error mapping location: {e}")
                    setattr(profile, field, value)
            elif field == 'mi_himno' and isinstance(value, dict):
                try:
                    from src.models.profile import MiHimno
                    setattr(profile, field, MiHimno(**value))
                except Exception as e:
                    print(f"Error mapping mi_himno: {e}")
                    setattr(profile, field, value)
            else:
                setattr(profile, field, value)
        else:
            print(f"Warning: Profile does not have field '{field}', skipping")
    
    # Sync email to User model
    if "email" in update_data:
        new_email = update_data["email"]
        print(f"Syncing email: current={current_user.email}, new={new_email}")
        if new_email and current_user.email != new_email:
            # Check for duplicates
            existing_user = await User.find_one(User.email == new_email)
            if existing_user and str(existing_user.id) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Este correo electrónico ya está registrado con otra cuenta"
                )
            
            current_user.email = new_email
            current_user.updated_at = datetime.utcnow()
            await current_user.save()
            print(f"Synced email to User model: {new_email}")

    # Sync phone and country_code to User model for identity and login
    if "phone" in update_data or "country_code" in update_data:
        import re
        local_phone = update_data.get("phone", profile.phone)
        country_code = update_data.get("country_code", profile.country_code)
        print(f"Syncing phone: local={local_phone}, country={country_code}")
        
        # Combine to standard searchable format (+[country][number])
        if local_phone and country_code:
            # Clean both parts to digits only
            clean_digits = re.sub(r'\D', '', local_phone)
            clean_country = re.sub(r'\D', '', country_code)
            
            # If the user typed the country code in the phone field, avoid doubling it
            if clean_digits.startswith(clean_country):
                # Only strip if it's the exact prefix
                full_phone = f"+{clean_digits}"
            else:
                full_phone = f"+{clean_country}{clean_digits}"
                
            print(f"Calculated full_phone: {full_phone}, current user phone: {current_user.phone}")
            
            # Only update if changed or not set in User
            if current_user.phone != full_phone:
                # Check for duplicates (phone must be unique in User collection)
                existing_user = await User.find_one(User.phone == full_phone)
                if existing_user and str(existing_user.id) != str(current_user.id):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Este número de teléfono ya está registrado con otra cuenta"
                    )
                
                current_user.phone = full_phone
                current_user.updated_at = datetime.utcnow()
                await current_user.save()
                print(f"Synced full phone to User model: {full_phone}")

    # Recalculate age if birth_date is updated
    if profile.birth_date:
        today = datetime.utcnow()
        born = profile.birth_date
        age = today.year - born.year - ((today.month, today.day) < (born.month, born.day))
        profile.age = age
    
    profile.updated_at = datetime.utcnow()
    
    # Calculate profile completion
    profile.profile_completion = calculate_profile_completion(profile, current_user)
    
    # Update hidden height classification (Height Flow)
    country = None
    if profile.location:
        if isinstance(profile.location, Location):
            country = profile.location.country
        elif isinstance(profile.location, dict):
            country = profile.location.get('country')

    region = map_country_to_region(country)
    profile.height_label = classify_height(profile.height_cm, profile.gender, region)
    print(f"[HEIGHT] Re-classified user {current_user.id} as '{profile.height_label}' (Region: {region})")
    
    await profile.save()
    
    # Invalidate dashboard cache (stats depend on profile_completion, suggestions on profile fields)
    await redis_service.invalidar_usuario(["stats", "suggest"], str(current_user.id))
    
    return UserProfileResponseDTO.from_user_and_profile(
        current_user, profile, mask_data=False
    )


@router.post("/location")
async def update_location(
    request: UpdateLocationRequest,
    current_user: User = Depends(get_current_user)
):
    """Update user location for proximity radar"""
    
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Update location
    profile.location = {
        "type": "Point",
        "coordinates": [request.longitude, request.latitude],
        "city": request.city,
        "state": request.state,
        "country": request.country
    }
    profile.updated_at = datetime.utcnow()
    
    await profile.save()
    
    return {"message": "Location updated successfully"}


@router.put("/distancia")
async def update_search_distance(
    request: UpdateDistanceRequest,
    current_user: User = Depends(get_current_user)
):
    """Update user search distance and premium filters"""
    
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    profile.search_radius_km = request.distance_km
    profile.distance_preference_km = request.distance_km # Also update legacy field if any
    
    if request.search_states is not None:
        profile.search_states = request.search_states
    if request.search_countries is not None:
        profile.search_countries = request.search_countries
        
    profile.updated_at = datetime.utcnow()
    await profile.save()
    
    return {"message": "Search preferences updated", "radius": request.distance_km}


class UpdateThemeRequest(BaseModel):
    theme_mode: Optional[str] = None  # 'light' or 'dark'
    visual_theme: Optional[str] = None  # 'redThread', 'premium', etc.


@router.patch("/theme")
async def update_user_theme(
    request: UpdateThemeRequest,
    current_user: User = Depends(get_current_user)
):
    """Update user theme preferences (mode and/or visual theme)"""
    
    if request.theme_mode and request.theme_mode not in ['light', 'dark']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="theme_mode must be 'light' or 'dark'"
        )
    
    if request.theme_mode:
        current_user.theme_mode = request.theme_mode
        # Sync with UserSettings for AuthInitializer consistency
        from src.models.user_settings import UserSettings
        user_settings = await UserSettings.find_one({"user_id": str(current_user.id)})
        if user_settings:
            user_settings.theme_mode = request.theme_mode
            user_settings.update_timestamp()
            await user_settings.save()
    
    if request.visual_theme:
        current_user.visual_theme = request.visual_theme
        # Sync with UserSettings
        from src.models.user_settings import UserSettings
        user_settings = await UserSettings.find_one({"user_id": str(current_user.id)})
        if user_settings:
            user_settings.visual_theme = request.visual_theme
            user_settings.update_timestamp()
            await user_settings.save()
    
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    
    return {
        "message": "Theme updated successfully",
        "theme_mode": current_user.theme_mode,
        "visual_theme": current_user.visual_theme
    }


@router.get("/geocode")
async def reverse_geocode(latitude: float, longitude: float):
    """Reverse geocode coordinates to get address using multiple providers"""
    import httpx

    # Photon and BigDataCloud reject or redirect requests without a browser-like
    # User-Agent (403/307), so send one to avoid bogus 503s.
    _headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
    }

    # Try Photon API first (Komoot's geocoding service, no rate limits)
    try:
        async with httpx.AsyncClient(timeout=10.0, headers=_headers, follow_redirects=True, trust_env=False) as client:
            response = await client.get(
                f"https://photon.komoot.io/reverse?lat={latitude}&lon={longitude}",
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("features") and len(data["features"]) > 0:
                props = data["features"][0].get("properties", {})
                city = props.get("city") or props.get("town") or props.get("village") or props.get("name")
                state = props.get("state")
                country = props.get("country")
                
                parts = []
                if city: parts.append(city)
                if state: parts.append(state)
                if country: parts.append(country)
                formatted = ", ".join(parts)
                
                return {
                    "city": city,
                    "state": state,
                    "country": country,
                    "formatted": formatted,
                    "raw": props
                }
    except Exception as e:
        print(f"Photon geocoding failed: {e}")
    
    # Fallback to BigDataCloud (free, no API key needed).
    # api.bigdatacloud.net now 307-redirects to api-bdc.io; use it directly
    # so httpx never has to chase a redirect inside raise_for_status().
    try:
        async with httpx.AsyncClient(timeout=10.0, headers=_headers, follow_redirects=True, trust_env=False) as client:
            response = await client.get(
                f"https://api-bdc.io/data/reverse-geocode-client?latitude={latitude}&longitude={longitude}&localityLanguage=es",
            )
            response.raise_for_status()
            data = response.json()
            
            city = data.get("city") or data.get("locality")
            state = data.get("principalSubdivision")
            country = data.get("countryName")
            
            parts = []
            if city: parts.append(city)
            if state: parts.append(state)
            if country: parts.append(country)
            formatted = ", ".join(parts)
            
            return {
                "city": city,
                "state": state,
                "country": country,
                "formatted": formatted,
                "raw": data
            }
    except Exception as e:
        print(f"BigDataCloud geocoding failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="All geocoding services are currently unavailable"
        )



@router.get("/universities/search")
async def search_universities(name: str):
    """
    Search for universities using Hipolabs API
    Proxied to avoid Mixed Content / CORS issues on frontend
    """
    import httpx
    
    if not name or len(name) < 2:
        return []
        
    try:
        async with httpx.AsyncClient() as client:
            # Use HTTP as the source might not support HTTPS or has cert issues, 
            # but since we are backend-to-backend it's fine. 
            # Note: Hipolabs supports http.
            url = f"http://universities.hipolabs.com/search?name={name}"
            
            response = await client.get(url, timeout=5.0)
            response.raise_for_status()
            return response.json()
            
    except Exception as e:
        print(f"University search error: {e}")
        # Return empty list on error
        return []


@router.get("/places/search")
async def search_places(q: str, place_type: Optional[str] = None, detailed: bool = False, include_geojson: bool = False):
    """
    Search for places/cities using external geocoding API with rate-limiting and caching.
    """
    import asyncio
    global SEARCH_SEMAPHORE
    if SEARCH_SEMAPHORE is None:
        # Increase to 5 to allow some parallel processing if one hangs
        SEARCH_SEMAPHORE = asyncio.Semaphore(5)

    cache_key = f"search:{q}:{place_type}:{detailed}:{include_geojson}"
    if cache_key in GEOJSON_CACHE:
        return GEOJSON_CACHE[cache_key]

    import httpx
    from src.utils.continents import CONTINENT_COUNTRIES_MAP
    
    if not q or len(q) < 2:
        return []
        
    results = []
    seen = set()
    
    # Normalize query for local lookup
    norm_q = normalize_str(q)
    
    try:
        # Manual State Alias Mapping
        STATE_ALIASES = {
            "cdmx": "ciudad de mexico",
            "df": "ciudad de mexico",
            "edomex": "mexico",
            "estado de mexico": "mexico"
        }
        
        # Apply alias if exists
        if place_type == 'state':
            norm_q_lower = normalize_str(q)
            if norm_q_lower in STATE_ALIASES:
                q = STATE_ALIASES[norm_q_lower]

        # 1. CONTINENT SEARCH (Virtual results)
        if place_type == 'country' and not detailed:
            for continent in CONTINENT_COUNTRIES_MAP.keys():
                cont_norm = normalize_str(continent)
                if norm_q == cont_norm or norm_q in cont_norm:
                    label = f"🌎 {continent} (Todo el continente)"
                    results.append(label)
                    seen.add(label)

        # 2. LOCAL COUNTRY LOOKUP (Fast & Robust Fallback)
        if place_type == 'country' or not place_type:
            lookup_name = COUNTRY_NAME_MAPPING.get(norm_q, norm_q)
            if lookup_name in COUNTRIES_GEOJSON:
                item = COUNTRIES_GEOJSON[lookup_name]
                if detailed:
                    return [{
                        "label": item.get("label", q),
                        "lat": 0,
                        "lon": 0,
                        "geojson": item.get("geojson")
                    }]
                else:
                    label = item.get("label", q)
                    if label not in seen:
                        results.append(label)
                        seen.add(label)
                        # If we found an exact local match, we can return early to save external API calls
                        if norm_q == normalize_str(label):
                            return results

        # 3. EXTERNAL SEARCH (Photon Priority)
        # Try Photon first (no rate limits, faster)
        photon_data = []
        try:
            async with httpx.AsyncClient() as client:
                photon_url = f"https://photon.komoot.io/api/?q={q}&limit=15"
                photon_url = f"https://photon.komoot.io/api/?q={q}&limit=15"
                if place_type == 'city': 
                    photon_url += "&osm_tag=place:city&osm_tag=place:town&osm_tag=place:village"
                elif place_type == 'state':
                    photon_url += "&osm_tag=place:state&osm_tag=place:province&osm_tag=place:region&osm_tag=boundary:administrative"
                elif place_type == 'country':
                    photon_url += "&osm_tag=place:country"

                
                resp = await client.get(photon_url, timeout=3.0)
                if resp.status_code == 200:
                    photon_data = resp.json().get("features", [])
        except Exception as e:
            print(f"Photon search error: {e}")

        # Process Photon results
        if place_type == 'state':
             # Prioritize Relations (states) over Nodes (cities)
             photon_data.sort(key=lambda x: 0 if x.get("properties", {}).get("osm_type") == 'R' else 1)

        for feature in photon_data:
            props = feature.get("properties", {})
            coords = feature.get("geometry", {}).get("coordinates", [0, 0])
            
            city = props.get("city") or props.get("name")
            state = props.get("state")
            country = props.get("country")
            
            formatted = ""
            if place_type == 'country':
                formatted = country
            elif place_type == 'state':
                 # FIX: If we are searching for a state, the result might BE the state
                 if not state and props.get("osm_value") in ['state', 'province', 'region', 'administrative']:
                     state = props.get("name")

                 if state and country: formatted = f"{state}, {country}"
                 elif state: formatted = state
            else:
                parts = []
                if city: parts.append(city)
                if state: parts.append(state)
                if country: parts.append(country)
                formatted = ", ".join(parts)
            
            if formatted and formatted not in seen:
                if detailed:
                    entry = {
                        "label": formatted,
                        "lat": coords[1],
                        "lon": coords[0],
                        "geojson": feature.get("geometry") 
                    }
                    
                    # ENHANCEMENT: If we have a Point but need a Polygon (for states), try to fetch from OSMFR
                    # This is critical because Photon search often returns Points for states/regions.
                    is_point = coords and feature.get("geometry", {}).get("type") == "Point"
                    osm_id = props.get("osm_id")
                    osm_type = props.get("osm_type")
                    
                    if detailed and is_point and osm_id and osm_type == 'R' and (place_type == 'state' or props.get("osm_value") == 'state'):
                        try:
                            # Fetch polygon from polygons.openstreetmap.fr
                            # This service is usually reliable for simplified polygons
                            poly_url = f"http://polygons.openstreetmap.fr/get_geojson.py?id={osm_id}&params=0"
                            async with httpx.AsyncClient() as poly_client:
                                poly_resp = await poly_client.get(poly_url, timeout=5.0)
                                if poly_resp.status_code == 200:
                                    poly_data = poly_resp.json()
                                    if poly_data and "coordinates" in poly_data:
                                        entry["geojson"] = poly_data
                                        # Also wrap in Feature to be consistent if needed, but raw geometry is usually fine for Leaflet
                                        # logic downstream expects 'geojson' to be the geometry or feature.
                        except Exception as poly_err:
                            print(f"Failed to fetch polygon for {formatted}: {poly_err}")
                            
                    results.append(entry)
                else:
                    results.append(formatted)
                seen.add(formatted)

        # If we have results from Photon, we can return early or mix. 
        # Given Nominatim issues, let's prefer Photon and return if we have reasonable data.
        if len(results) > 0:
             # Cache and return
            if cache_key not in GEOJSON_CACHE:
                GEOJSON_CACHE[cache_key] = results
                save_geojson_cache(GEOJSON_CACHE)
            return results

        # 4. NOMINATIM FALLBACK (Only if Photon failed or yielded nothing)
        headers = {"User-Agent": "RedThreadApp/1.0"}
        params = {
            "q": q,
            "format": "json",
            "addressdetails": 1,
            "limit": 50
        }
        
        if include_geojson:
            params["polygon_geojson"] = 1
        
        if place_type:
            if place_type == 'country': params["featuretype"] = "country"
            elif place_type == 'state': params["featuretype"] = "state"
            elif place_type == 'city': params["featuretype"] = "settlement" 

        data = []
        try:
            async with SEARCH_SEMAPHORE:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        "https://nominatim.openstreetmap.org/search",
                        params=params,
                        headers=headers,
                        timeout=3.0 
                    )
                    response.raise_for_status()
                    data = response.json()
        except Exception as api_err:
            print(f"Nominatim API error for '{q}': {api_err}")
            # Continue to process whatever data we have (e.g. from continents)
        
        for item in data:
            address = item.get("address", {})
            lat = item.get("lat")
            lon = item.get("lon")
            geojson = item.get("geojson")
            
            # Format based on type
            if place_type == 'country':
                formatted = address.get("country")
            elif place_type == 'state':
                state = address.get("state") or address.get("region")
                country = address.get("country")
                formatted = f"{state}, {country}" if state and country else state
            else:
                city = address.get("city") or address.get("town") or address.get("village") or address.get("municipality")
                state = address.get("state") or address.get("region")
                country = address.get("country")
                
                parts = []
                if city: parts.append(city)
                if state: parts.append(state)
                if country: parts.append(country)
                formatted = ", ".join(parts)
            
            if formatted and formatted not in seen:
                if detailed:
                    entry = {
                        "label": formatted,
                        "lat": float(lat) if lat else None,
                        "lon": float(lon) if lon else None
                    }
                    if include_geojson:
                        entry["geojson"] = geojson
                    results.append(entry)
                else:
                    results.append(formatted)
                seen.add(formatted)
        
        # Save cache if we found something new
        if results and cache_key not in GEOJSON_CACHE:
            GEOJSON_CACHE[cache_key] = results
            save_geojson_cache(GEOJSON_CACHE)
            
        return results
            
    except Exception as e:
        print(f"General place search error for '{q}': {e}")
        # Return whatever we gathered or empty list
        return results


@router.get("/continents/{continent}/geojson")
async def get_continent_geojson(continent: str):
    """
    Returns a FeatureCollection GeoJSON containing all countries in a continent.
    Uses local GeoJSON database for maximum speed and reliability.
    """
    from src.utils.continents import CONTINENT_COUNTRIES_MAP
    from fastapi import HTTPException
    
    countries = CONTINENT_COUNTRIES_MAP.get(continent)
    if not countries:
        # Try localized name
        norm_cont = normalize_str(continent)
        for c_name, c_list in CONTINENT_COUNTRIES_MAP.items():
            if normalize_str(c_name) == norm_cont:
                countries = c_list
                break
                
    if not countries:
        raise HTTPException(status_code=404, detail="Continent not found")
        
    features = []
    for country_name in countries:
        norm_name = normalize_str(country_name)
        lookup_name = COUNTRY_NAME_MAPPING.get(norm_name, norm_name)
        if lookup_name in COUNTRIES_GEOJSON:
            item = COUNTRIES_GEOJSON[lookup_name]
            geojson = item.get("geojson")
            if geojson:
                # If it's already a Feature, add it. If it's a Geometry (Polygon/MultiPolygon), wrap it.
                if geojson.get("type") in ["Polygon", "MultiPolygon"]:
                    features.append({
                        "type": "Feature",
                        "properties": {"name": country_name, "type": "country"},
                        "geometry": geojson
                    })
                elif geojson.get("type") == "Feature":
                    features.append(geojson)
                elif geojson.get("type") == "FeatureCollection":
                    features.extend(geojson.get("features", []))
                    
    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/continents/{continent_name}/countries")
async def get_continent_countries(continent_name: str):
    """Get list of countries for a given continent mapping"""
    from src.utils.continents import get_countries_by_continent, CONTINENT_COUNTRIES_MAP
    countries = get_countries_by_continent(continent_name)
    if not countries:
        # Try without accents or different cases
        import unicodedata
        def strip_accents(s):
            return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
        
        target = strip_accents(continent_name).lower()
        for c_name in CONTINENT_COUNTRIES_MAP.keys():
            if strip_accents(c_name).lower() == target:
                return CONTINENT_COUNTRIES_MAP[c_name]
                
    return countries


@router.get("/places/bulk-search")
async def bulk_search_places(
    q: List[str] = Query(...), 
    place_type: str = 'country', 
    include_geojson: bool = True
):
    """
    Fetch GeoJSON for multiple places in parallel (rate-limited by search_places).
    """
    import asyncio
    
    async def fetch_one(name):
        # We add a small delay here to spread out the requests even if they are queued by the semaphore
        await asyncio.sleep(0.1) # Reduced delay for local-mostly searches
        res = await search_places(q=name, place_type=place_type, detailed=True, include_geojson=include_geojson)
        if res and len(res) > 0:
            item = res[0]
            if isinstance(item, dict):
                # Ensure the original query is returned so frontend can map it accurately
                item["query"] = name
            return item
        return {"query": name, "label": name, "geojson": None}

    results = await asyncio.gather(*[fetch_one(name) for name in q])
    return [r for r in results if r]


@router.get("/debug/geojson-state")
async def get_geojson_state(all_keys: bool = False):
    return {
        "cache_size": len(GEOJSON_CACHE),
        "db_size": len(COUNTRIES_GEOJSON),
        "db_path": COUNTRIES_GEOJSON_FILE,
        "db_exists": os.path.exists(COUNTRIES_GEOJSON_FILE),
        "load_error": GEOJSON_LOAD_ERROR,
        "base_dir": BASE_DIR,
        "sample_keys": list(COUNTRIES_GEOJSON.keys())[:10],
        "all_keys": list(COUNTRIES_GEOJSON.keys()) if all_keys else None
    }


@router.get("/{user_id}")
async def get_profile(user_id: str, current_user: User = Depends(get_current_user)):
    """Get another user's profile (public data only)"""
    
    from src.api.dtos.user_dtos import PublicUserDTO, AdminUserDTO
    
    # Get the target user
    target_user = await User.get(user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    profile = await Profile.find_one(Profile.user_id == user_id)
    
    if not profile or not profile.profile_visible:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found or not visible"
        )
    
    # If admin, return full data; otherwise return public data only
    if current_user.is_admin:
        return AdminUserDTO.from_user_and_profile(target_user, profile)
    else:
        return PublicUserDTO.from_user_and_profile(target_user, profile)


@router.post("/photos/upload")
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload profile photo"""
    
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Generate unique filename
    import uuid
    import shutil
    import os
    
    file_extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"static/uploads/{filename}"
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # URL for frontend (assuming local dev)
    # In production, this should be the full domain or CDN URL
    photo_url = f"http://localhost:8000/static/uploads/{filename}"
    
    profile.photos.append(photo_url)
    
    # Update completion
    profile.profile_completion = calculate_profile_completion(profile, current_user)
    
    profile.updated_at = datetime.utcnow()
    await profile.save()
    
    return {"photo_url": photo_url, "message": "Photo uploaded successfully"}


@router.delete("/photos/{photo_index}")
async def delete_photo(
    photo_index: int,
    current_user: User = Depends(get_current_user)
):
    """Delete profile photo by index"""
    
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    if photo_index < 0 or photo_index >= len(profile.photos):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid photo index"
        )
    
    profile.photos.pop(photo_index)
    profile.updated_at = datetime.utcnow()
    await profile.save()
    
    return {"message": "Photo deleted successfully"}


@router.post("/upload-identity")
async def upload_identity(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload identity document for verification"""
    
    # Validate file type
    valid_types = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"]
    if file.content_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed"
        )
    
    # Validate file size (max 10MB)
    file_content = await file.read()
    if len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 10MB"
        )
    
    # Generate unique filename
    import uuid
    import os
    
    file_extension = file.filename.split(".")[-1]
    filename = f"identity_{current_user.id}_{uuid.uuid4()}.{file_extension}"
    
    # Create secure directory if it doesn't exist
    identity_dir = "static/identity_documents"
    os.makedirs(identity_dir, exist_ok=True)
    
    file_path = os.path.join(identity_dir, filename)
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Extract information from document using OCR (basic implementation)
    extracted_data = await extract_identity_data(file_path, document_type)
    
    # Convert file path to URL path (normalize to forward slashes for web)
    url_path = f"/static/identity_documents/{filename}".replace("\\", "/")
    
    # Update user record with extracted data
    current_user.identity_document_type = document_type
    current_user.identity_document_url = url_path
    current_user.identity_verification_status = "pending"
    current_user.identity_submitted_at = datetime.utcnow()
    current_user.updated_at = datetime.utcnow()
    
    # Update real name if extracted
    if extracted_data.get("name"):
        current_user.real_name = extracted_data["name"]
    
    await current_user.save()
    
    # Debug logging
    print(f"[IDENTITY UPLOAD] User {current_user.id} uploaded document:")
    print(f"  - Status: {current_user.identity_verification_status}")
    print(f"  - Document Type: {current_user.identity_document_type}")
    print(f"  - Document URL: {current_user.identity_document_url}")
    print(f"  - Submitted At: {current_user.identity_submitted_at}")
    
    # Update profile with birth date if extracted
    if extracted_data.get("birth_date"):
        profile = await Profile.find_one(Profile.user_id == str(current_user.id))
        if profile:
            profile.birth_date = extracted_data["birth_date"]
            # Calculate age
            today = datetime.utcnow()
            born = extracted_data["birth_date"]
            age = today.year - born.year - ((today.month, today.day) < (born.month, born.day))
            profile.age = age
            profile.updated_at = datetime.utcnow()
            await profile.save()
    
    return {
        "success": True,
        "message": "Identity document uploaded successfully",
        "verification_status": "pending",
        "extracted_data": {
            "name": extracted_data.get("name"),
            "birth_date": extracted_data.get("birth_date").isoformat() if extracted_data.get("birth_date") else None
        }
    }


@router.delete("/identity-document")
async def delete_identity_document(
    current_user: User = Depends(get_current_user)
):
    """
    Delete identity document and reset verification status.
    Only allowed if document is not verified.
    """
    
    print(f"[DELETE DOCUMENT] User {current_user.id} attempting to delete document")
    print(f"  - verified: {current_user.verified}")
    print(f"  - status: {current_user.identity_verification_status}")
    print(f"  - document_url: {current_user.identity_document_url}")
    print(f"  - document_type: {current_user.identity_document_type}")
    print(f"  - rejection_reason: {current_user.identity_rejection_reason}")
    
    # Prevent deletion of verified documents
    if current_user.verified:
        print(f"  - BLOCKED: Document is verified")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete verified document. Contact support if you need to update your information."
        )
    
    # If no document exists, just return success (idempotent operation)
    if not current_user.identity_document_url:
        print(f"  - No document to delete (already cleared)")
        return {
            "success": True,
            "message": "No document to delete"
        }
    
    print(f"  - Clearing document data...")
    
    # Clear document data
    current_user.identity_document_url = None
    current_user.identity_document_type = None
    current_user.identity_verification_status = "none"
    current_user.identity_submitted_at = None
    current_user.identity_rejection_reason = None
    current_user.updated_at = datetime.utcnow()
    
    await current_user.save()
    
    print(f"  - Document deleted successfully")
    print(f"  - New status: {current_user.identity_verification_status}")
    print(f"  - New document_url: {current_user.identity_document_url}")
    
    return {
        "success": True,
        "message": "Document deleted successfully"
    }


async def extract_identity_data(file_path: str, document_type: str) -> dict:
    """
    Extract name and birth date from identity document using OCR
    """
    import re
    
    try:
        # Try to import pytesseract
        try:
            import pytesseract
            from PIL import Image
        except ImportError:
            print("pytesseract or PIL not installed. Skipping OCR extraction.")
            return {"name": None, "birth_date": None}
        
        # Configure tesseract path for Windows
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        
        # Handle PDF files
        if file_path.lower().endswith('.pdf'):
            try:
                from pdf2image import convert_from_path
                # Convert first page of PDF to image
                images = convert_from_path(file_path, first_page=1, last_page=1)
                if images:
                    image = images[0]
                else:
                    return {"name": None, "birth_date": None}
            except Exception as e:
                print(f"Error converting PDF: {e}")
                return {"name": None, "birth_date": None}
        else:
            # Load image file
            image = Image.open(file_path)
        
        # Perform OCR with English only (Spanish not installed)
        # Use --psm 6 (Assume a single uniform block of text) for better line reading
        custom_config = r'--oem 3 --psm 6'
        text = pytesseract.image_to_string(image, lang='eng', config=custom_config)
        print(f"OCR Text extracted:\n{text}")  # Log full text for debugging
        
        # Improved preprocessing - normalize text but keep structure
        # Convert to uppercase for easier matching
        text_upper = text.upper()
        
        # Extract name based on document type
        name = None
        birth_date = None
        
        # Name extraction patterns for different document types
        if document_type in ['ine', 'dni_es', 'dni_ar', 'dni_pe']:
            # Try multiple patterns for name - INE specific
            name_patterns = [
                # Pattern 1: NOMBRE followed by name on same or next line
                r'N[O0]MBRE[S]?[:\s]*\n?\s*([A-Z][A-Z\s]{4,50})',
                # Pattern 2: Look for full name pattern (First Middle Last Last)
                r'([A-Z]{3,}\s+[A-Z]{3,}\s+[A-Z]{3,}(?:\s+[A-Z]{3,})?)',
                # Pattern 3: APELLIDOS (last names) - often more reliable
                r'APELLID[O0][S]?[:\s]*\n?\s*([A-Z][A-Z\s]{4,50})',
                # Pattern 4: Generic name after label
                r'N[O0]MBRE[:\s]+([A-Z\s]+)',
            ]
            
            for pattern in name_patterns:
                match = re.search(pattern, text_upper, re.MULTILINE)
                if match:
                    extracted = match.group(1).strip()
                    # Clean up: remove extra spaces
                    extracted = ' '.join(extracted.split())
                    # Filter out common false positives and validate
                    if (5 < len(extracted) < 60 and 
                        "DOMICILIO" not in extracted and 
                        "DIRECCION" not in extracted and
                        "CALLE" not in extracted and
                        "CURP" not in extracted and
                        "VIGENCIA" not in extracted and
                        "REGISTRO" not in extracted):
                        name = extracted.title()  # Convert to title case
                        print(f"Name extracted with pattern: {pattern[:30]}... -> {name}")
                        break
        
        elif document_type == 'passport':
            # Passport format: SURNAME / GIVEN NAMES
            surname_match = re.search(r'SURNAME[:\s]+([A-Z\s]+)', text_upper)
            given_match = re.search(r'GIVEN\s+NAMES?[:\s]+([A-Z\s]+)', text_upper)
            
            if surname_match and given_match:
                surname = surname_match.group(1).strip()
                given = given_match.group(1).strip()
                name = f"{given} {surname}".title()
        
        else:
            # Generic name extraction
            name_patterns = [
                r'N[O0]MBRE[:\s]+([A-Z][A-Z\s]+)',
                r'NAME[:\s]+([A-Z][A-Z\s]+)',
            ]
            
            for pattern in name_patterns:
                match = re.search(pattern, text_upper)
                if match:
                    name = match.group(1).strip().title()
                    name = ' '.join(name.split())
                    break
        
        # Birth date extraction patterns - more flexible
        date_patterns = [
            # Pattern 1: DD/MM/YYYY or DD-MM-YYYY with label
            r'(?:NACIM[I1L]ENT[O0]|BIRTH|FECHA)[:\s]*(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})',
            # Pattern 2: Standalone date DD/MM/YYYY anywhere in text
            r'(\d{2})[/\-](\d{2})[/\-](19\d{2}|20\d{2})',
            # Pattern 3: DD MMM YYYY (e.g., 02 DIC 2004)
            r'(\d{1,2})\s+(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|[O0]CT|N[O0]V|DIC|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(19\d{2}|20\d{2})',
            # Pattern 4: FECHA DE NACIMIENTO with flexible spacing
            r'FECHA\s*DE\s*NACIM[I1L]ENT[O0]\s*(\d{1,2})[/\s](\d{1,2})[/\s](\d{4})',
        ]
        
        month_map = {
            'ENE': 1, 'FEB': 2, 'MAR': 3, 'ABR': 4, 'MAY': 5, 'JUN': 6,
            'JUL': 7, 'AGO': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DIC': 12,
            'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAY': 5, 'JUN': 6,
            'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12,
        }
        
        for pattern in date_patterns:
            match = re.search(pattern, text_upper)
            if match:
                try:
                    groups = match.groups()
                    if len(groups) == 3:
                        # Check if middle group is month name
                        if groups[1].replace('0', 'O') in month_map:
                            # Month name format
                            day = int(groups[0])
                            month = month_map[groups[1].replace('0', 'O')]
                            year = int(groups[2])
                        else:
                            # Numeric format
                            day = int(groups[0])
                            month = int(groups[1])
                            year = int(groups[2])
                        
                        # Validate date
                        if 1 <= day <= 31 and 1 <= month <= 12 and 1900 <= year <= 2015:
                            birth_date = datetime(year, month, day)
                            print(f"Date extracted with pattern: {pattern[:30]}... -> {birth_date}")
                            break
                except (ValueError, IndexError) as e:
                    print(f"Error parsing date from {groups}: {e}")
                    continue
        
        print(f"Final Extracted - Name: {name}, Birth Date: {birth_date}")
        return {"name": name, "birth_date": birth_date}
        
    except Exception as e:
        print(f"Error extracting identity data: {e}")
        import traceback
        traceback.print_exc()
        return {"name": None, "birth_date": None}




def calculate_profile_completion(profile: Profile, user: Optional[User] = None) -> int:
    """
    Calculate profile completion percentage based on weights.
    Matches frontend logic in profileScoring.ts
    """
    weights = {
        'nickname': 2,
        'age': 2,
        'gender': 2,
        'city': 2,
        'bio': 3,
        'relationship_goals': 5,
        'interests': 3,
        'pronouns': 1,
        'height_cm': 2,
        'zodiac': 2,
        'relationship_type': 2,
        'education_center': 2,
        'education_level': 2,
        'occupation': 2,
        'work_company': 2,
        'mi_himno': 1,
        'sexual_orientation': 3,
        'relationship_status': 2,
        'languages': 1,
        'photos': 2,
        'social_style': 1,
        'processing_style': 1,
        'risk_tolerance': 1,
        'decision_making': 1,
        'neurodiversity': 1,
        'learning_preferences': 1,
        'energy_level': 1,
        'disabilities': 1,
        'health_conditions': 1,
    }
    
    max_score = sum(weights.values())
    score = 0
    
    def has_value(val):
        if val is None: return False
        if isinstance(val, (list, str, dict)) and len(val) == 0: return False
        if isinstance(val, str) and val.strip() == "": return False
        return True

    # Check fields
    if (user and user.display_name) or has_value(profile.nickname): score += weights['nickname']
    if has_value(profile.age): score += weights['age']
    if has_value(profile.gender): score += weights['gender']
    if has_value(profile.city) or (profile.location and profile.location.city): score += weights['city']
    if has_value(profile.bio): score += weights['bio']
    if has_value(profile.relationship_goals): score += weights['relationship_goals']
    if has_value(profile.interests) or has_value(profile.lifestyle_interests): score += weights['interests']
    if has_value(profile.pronouns): score += weights['pronouns']
    if has_value(profile.height_cm): score += weights['height_cm']
    if has_value(profile.zodiac) or profile.zodiac_relevant is False: score += weights['zodiac']
    if has_value(profile.relationship_type): score += weights['relationship_type']
    if has_value(profile.education_center): score += weights['education_center']
    if has_value(profile.education_level): score += weights['education_level']
    if has_value(profile.occupation): score += weights['occupation']
    if has_value(profile.work_company): score += weights['work_company']
    
    # Music
    if profile.mi_himno:
        has_music = False
        if isinstance(profile.mi_himno, dict):
            has_music = profile.mi_himno.get('connected') or len(profile.mi_himno.get('favorite_artists', [])) > 0
        else:
            has_music = profile.mi_himno.connected or len(profile.mi_himno.favorite_artists) > 0
            
        if has_music:
            score += weights['mi_himno']
        
    if has_value(profile.sexual_orientation): score += weights['sexual_orientation']
    if has_value(profile.relationship_status): score += weights['relationship_status']
    if has_value(profile.languages): score += weights['languages']
    if has_value(profile.photos): score += weights['photos']
    
    # Personality & Characteristics
    if has_value(profile.social_style): score += weights['social_style']
    if has_value(profile.processing_style): score += weights['processing_style']
    if has_value(profile.risk_tolerance): score += weights['risk_tolerance']
    if has_value(profile.decision_making): score += weights['decision_making']
    if has_value(profile.neurodiversity): score += weights['neurodiversity']
    if has_value(profile.learning_preferences): score += weights['learning_preferences']
    if has_value(profile.energy_level): score += weights['energy_level']
    if has_value(profile.disabilities): score += weights['disabilities']
    if has_value(profile.health_conditions) or has_value(profile.health_status): score += weights['health_conditions']
    
    return int((score / max_score) * 100)


