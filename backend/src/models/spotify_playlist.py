from beanie import Document, Indexed
from pydantic import Field, HttpUrl
from typing import List, Optional
from datetime import datetime


class SpotifyPlaylist(Document):
    """Spotify playlist integration for music affinity matching"""
    
    # User Reference
    user_id: Indexed(str)
    
    # Playlist Info
    spotify_playlist_id: str
    name: str
    description: Optional[str] = None
    playlist_url: HttpUrl
    cover_image_url: Optional[HttpUrl] = None
    
    # Tracks
    tracks: List[dict] = []  # [{"name": "Song", "artist": "Artist", "spotify_id": "...", "preview_url": "..."}]
    total_tracks: int = 0
    
    # Metadata
    is_favorite: bool = False  # User marked as favorite
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_synced_at: Optional[datetime] = None
    
    class Settings:
        name = "spotify_playlists"
        indexes = [
            "user_id",
            "spotify_playlist_id",
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "spotify_playlist_id": "37i9dQZF1DXcBWIGoYBM5M",
                "name": "Today's Top Hits",
                "playlist_url": "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
                "total_tracks": 50,
                "is_favorite": True
            }
        }

