import json
import os

BASE_DIR = r"c:\Users\leora\Documents\RedThread\backend\src\api"
GEOJSON_FILE = os.path.join(BASE_DIR, "countries_geojson.json")

def check_keys():
    if not os.path.exists(GEOJSON_FILE):
        print("File not found!")
        return

    with open(GEOJSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    keys = list(data.keys())
    print(f"Total keys: {len(keys)}")
    
    targets = ["united states", "united states of america", "usa", "us", "france", "spain", "mexico", "germany"]
    
    print("\nChecking keys starting with 'u':")
    for k in keys:
        if k.lower().startswith("u"):
            print(f"  MATCH: {repr(k)}")
            
    # Print first 20 keys to see format
    print("\nFirst 20 keys:")
    print(keys[:20])

if __name__ == "__main__":
    check_keys()
