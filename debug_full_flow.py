import asyncio
import httpx
import json

# Local backend URL
BASE_URL = "http://127.0.0.1:8000/profiles"

async def test_search_and_bulk():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("\n=== 1. SEARCH 'Tlaxcala' (place_type=state) ===")
        try:
            resp = await client.get(f"{BASE_URL}/places/search", params={"q": "Tlaxcala", "place_type": "state"})
            if resp.status_code != 200:
                print(f"Search failed: {resp.status_code} {resp.text}")
                return
            
            results = resp.json()
            print(f"Results: {results}")
            
            if not results:
                print("No results found!")
                return

            target = results[0]
            print(f"-> Selected Target: '{target}'")
            
            print(f"\n=== 2. BULK SEARCH '{target}' (place_type=state) ===")
            # Note: bulk-search takes multiple 'q' parameters
            params = [("q", target), ("place_type", "state"), ("include_geojson", "true")]
            bulk_resp = await client.get(f"{BASE_URL}/places/bulk-search", params=params)
            
            if bulk_resp.status_code != 200:
                print(f"Bulk search failed: {bulk_resp.status_code} {bulk_resp.text}")
                return
                
            bulk_data = bulk_resp.json()
            print(f"Bulk Response Items: {len(bulk_data)}")
            
            for item in bulk_data:
                label = item.get("label")
                q_val = item.get("query")
                geojson = item.get("geojson")
                print(f"  Item Label: '{label}'")
                print(f"  Item Query: '{q_val}'")
                print(f"  GeoJSON Type: {geojson.get('type') if geojson else 'None'}")
                if geojson and geojson.get('type') == 'MultiPolygon':
                    print("  -> POLYGON FOUND! Partial coords: ", str(geojson.get('coordinates'))[:50])
                elif geojson and geojson.get('type') == 'Point':
                    print("  -> POINT FOUND (Bad for map painting!)")
                else:
                    print("  -> NO GEOJSON or invalid type")

        except Exception as e:
            print(f"Error: {e}")

async def main():
    print("Checking if backend is running the new code...")
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Test CDMX alias (only exists in new code)
        try:
            resp = await client.get(f"{BASE_URL}/places/search", params={"q": "CDMX", "place_type": "state"})
            data = resp.json()
            print(f"Search 'CDMX' result: {data}")
            if data and "Ciudad de México" in str(data):
                print("-> SUCCESS: Backend is running NEW code (Alias worked).")
            else:
                print("-> FAILURE: Backend seems to be running OLD code (CDMX not found).")
        except Exception as e:
            print(f"Error checking CDMX: {e}")

    await test_search_and_bulk()

if __name__ == "__main__":
    asyncio.run(main())
