import requests
import json

BASE_URL = "http://localhost:8000"

def test_state_polygon_fetching():
    print("\n--- Testing State Polygon Fetching (Tlaxcala) ---")
    
    # Search for Tlaxcala as a state
    url = f"{BASE_URL}/profiles/places/search"
    params = {
        "q": "Tlaxcala",
        "place_type": "state",
        "detailed": "true",
        "include_geojson": "true"
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        results = response.json()
        
        print(f"Found {len(results)} results")
        
        found_polygon = False
        for i, res in enumerate(results):
            label = res.get("label", "Unknown")
            geojson = res.get("geojson")
            geo_type = geojson.get("type") if geojson else "None"
            
            print(f"Result {i+1}: {label} | Geometry: {geo_type}")
            
            if geojson and geo_type in ["Polygon", "MultiPolygon"]:
                print("  [SUCCESS] Found Polygon geometry!")
                found_polygon = True
                # Optional: Check if coordinates look complex enough
                coords = geojson.get("coordinates")
                print(f"  Coordinates length: {len(coords) if coords else 0}")
                break
                
        if not found_polygon:
            print("  [FAILURE] Did not find any Polygon/MultiPolygon geometry for Tlaxcala.")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_state_polygon_fetching()
