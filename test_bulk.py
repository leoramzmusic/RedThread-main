import httpx
import asyncio

async def test_bulk():
    countries = ["Argentina", "Brasil", "México", "España", "Francia"]
    params = [("q", c) for c in countries]
    params.append(("place_type", "country"))
    params.append(("include_geojson", "true"))
    
    url = "http://localhost:8000/profiles/places/bulk-search"
    
    print(f"Testing bulk search for {countries}...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params, timeout=30.0)
            print(f"Status: {resp.status_code}")
            data = resp.json()
            print(f"Results count: {len(data)}")
            for i, item in enumerate(data):
                label = item.get('label') if item else 'None'
                has_geojson = 'Yes' if item and item.get('geojson') else 'No'
                print(f"  {i+1}. Query: {countries[i]} -> Result Label: {label}, Has GeoJSON: {has_geojson}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_bulk())
