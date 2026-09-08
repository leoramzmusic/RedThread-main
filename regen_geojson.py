import httpx
import json
import os
import unicodedata

def normalize_str(s):
    if not s: return ""
    return "".join(c for c in unicodedata.normalize('NFD', str(s)) if unicodedata.category(c) != 'Mn').lower().strip()

async def regen():
    url = "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"
    target_path = "c:/Users/leora/Documents/RedThread/backend/src/api/countries_geojson.json"
    
    print(f"Downloading from {url}...")
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, timeout=60.0)
        resp.raise_for_status()
        data = resp.json()
    
    # We will ONLY keep the essential parts to keep it small and valid
    simplified = {}
    for feat in data.get("features", []):
        props = feat.get("properties", {})
        name = props.get("ADMIN") or props.get("name")
        if not name: continue
        
        # Normalize and store
        norm = normalize_str(name)
        simplified[norm] = {
            "label": name,
            "geojson": feat.get("geometry")
        }
    
    print(f"Writing {len(simplified)} items to {target_path}...")
    with open(target_path, "w", encoding="utf-8") as f:
        # Use indent=None to save space, but ensure valid JSON
        json.dump(simplified, f, ensure_ascii=False)
    
    print("Verification...")
    with open(target_path, "r", encoding="utf-8") as f:
        d = json.load(f)
        print(f"Verified! Loaded {len(d)} items.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(regen())
