import requests
import json

BASE_URL = "http://localhost:8000"

def test_local_fallback():
    print("Testing local country fallback...")
    # Search for a country that should be in our local database
    resp = requests.get(f"{BASE_URL}/profiles/places/search", params={"q": "Mexico", "place_type": "country"})
    if resp.status_code == 200:
        print(f"Success: Found result")
    else:
        print(f"Failed: {resp.status_code} - {resp.text}")

def test_continent_geojson():
    print("\nTesting continent GeoJSON...")
    resp = requests.get(f"{BASE_URL}/profiles/continents/Europa/geojson")
    if resp.status_code == 200:
        data = resp.json()
        print(f"Success: Found FeatureCollection with {len(data.get('features', []))} features")
    else:
        print(f"Failed: {resp.status_code} - {resp.text}")

def test_reverse_geocode():
    print("\nTesting reverse geocode (Photon/BigDataCloud)...")
    # Coordinates for Mexico City Zocalo
    resp = requests.get(f"{BASE_URL}/profiles/geocode", params={"latitude": 19.4326, "longitude": -99.1332})
    if resp.status_code == 200:
        data = resp.json()
        print(f"Success: {data.get('formatted')}")
    else:
        print(f"Failed: {resp.status_code} - {resp.text}")

def test_external_search():
    print("\nTesting external search (Photon)...")
    # Search for Berlin (likely not in local fallback to force external)
    resp = requests.get(f"{BASE_URL}/profiles/places/search", params={"q": "Berlin", "place_type": "city", "detailed": "true"})
    if resp.status_code == 200:
        data = resp.json()
        print(f"Success: Found {len(data)} results")
        if len(data) > 0:
            print(f"Sample: {data[0].get('label')}")
            print(f"GeoJSON: {'Present' if data[0].get('geojson') else 'Missing'}")
    else:
        print(f"Failed: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    try:
        test_local_fallback()
        test_continent_geojson()
        test_reverse_geocode()
        test_external_search()
    except Exception as e:
        print(f"Error connecting to backend: {e}")
