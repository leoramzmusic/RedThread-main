import httpx
import json
import os
import unicodedata

def normalize_str(s):
    if not s: return ""
    return "".join(c for c in unicodedata.normalize('NFD', str(s)) if unicodedata.category(c) != 'Mn').lower().strip()

async def download_and_simplify():
    url = "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"
    target_path = "c:/Users/leora/Documents/RedThread/backend/src/api/countries_geojson.json"
    
    print(f"Downloading countries GeoJSON from {url}...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=60.0)
            resp.raise_for_status()
            data = resp.json()
            
        simplified = {}
        for feature in data.get('features', []):
            name = feature.get('properties', {}).get('ADMIN')
            if not name:
                name = feature.get('properties', {}).get('name')
            
            if name:
                norm_name = normalize_str(name)
                # Keep only what we need to minimize file size
                simplified[norm_name] = {
                    "label": name,
                    "geojson": feature.get('geometry')
                }
        
        # Add some manual mappings for common variations if needed
        # e.g., "United States of America" -> "Estados Unidos"
        
        # We'll save it as a dictionary keyed by normalized name
        with open(target_path, 'w', encoding='utf-8') as f:
            json.dump(simplified, f, ensure_ascii=False)
            
        print(f"Success! Simplified {len(simplified)} countries to {target_path}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(download_and_simplify())
