import asyncio
import httpx
import json

async def check_state_search(q):
    print(f"\n--- Checking '{q}' ---")
    url = f"https://photon.komoot.io/api/?q={q}&limit=5&osm_tag=place:state&osm_tag=place:province&osm_tag=place:region&osm_tag=boundary:administrative"
    print(f"URL: {url}")
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        data = resp.json()
        features = data.get("features", [])
        print(f"Found {len(features)} features")
        
        for i, f in enumerate(features):
            props = f.get("properties", {})
            geom = f.get("geometry", {})
            print(f"[{i}] Name: {props.get('name')}, Type: {props.get('osm_type')}, ID: {props.get('osm_id')}, Key: {props.get('osm_key')}, Value: {props.get('osm_value')}")
            print(f"    Geometry Type: {geom.get('type')}")
            
            # Simulate the check in profiles.py
            is_point = geom.get("type") == "Point"
            osm_id = props.get("osm_id")
            osm_type = props.get("osm_type")
            place_type = 'state' 
            
            should_fetch = is_point and osm_id and osm_type == 'R' and (place_type == 'state' or props.get("osm_value") == 'state')
            print(f"    Should fetch polygon? {should_fetch}")
            
            if should_fetch:
                poly_url = f"http://polygons.openstreetmap.fr/get_geojson.py?id={osm_id}&params=0"
                print(f"    Polygon URL: {poly_url}")

async def main():
    await check_state_search("Tlaxcala")
    await check_state_search("Nuevo Leon")
    await check_state_search("Coahuila de Zaragoza")

if __name__ == "__main__":
    asyncio.run(main())
