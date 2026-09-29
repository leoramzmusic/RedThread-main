import asyncio
import sys
import os

# Mock FastAPI for simple testing
sys.path.append('c:/Users/leora/Documents/RedThread/backend')

async def test_logic():
    from src.api.profiles import search_places, COUNTRIES_GEOJSON, COUNTRY_NAME_MAPPING, normalize_str
    
    print(f"DB Size: {len(COUNTRIES_GEOJSON)}")
    
    q = "Mexico"
    detailed = True
    place_type = "country"
    
    norm_q = normalize_str(q)
    lookup_name = COUNTRY_NAME_MAPPING.get(norm_q, norm_q)
    print(f"Query: {q} -> Normalized: {norm_q} -> Lookup: {lookup_name}")
    print(f"In DB: {lookup_name in COUNTRIES_GEOJSON}")
    
    res = await search_places(q=q, place_type=place_type, detailed=detailed, include_geojson=True)
    print(f"Result count: {len(res)}")
    if res:
        print(f"Result label: {res[0].get('label')}")

if __name__ == "__main__":
    asyncio.run(test_logic())
