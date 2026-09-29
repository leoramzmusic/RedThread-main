import asyncio
import httpx

# Mock of the backend logic to verify the fix works as intended against real Photon API
async def test_search_logic(q, place_type='state'):
    print(f"\n--- Testing '{q}' (Type: {place_type}) ---")
    
    # 1. Alias Logic
    STATE_ALIASES = {
        "cdmx": "ciudad de mexico",
        "df": "ciudad de mexico",
        "edomex": "mexico",
        "estado de mexico": "mexico"
    }
    
    norm_q = q.lower().strip() # Simplified normalization
    if place_type == 'state' and norm_q in STATE_ALIASES:
        q = STATE_ALIASES[norm_q]
        print(f"-> Alias applied: searching for '{q}'")

    # 2. Photon URL Construction
    url = f"https://photon.komoot.io/api/?q={q}&limit=5"
    if place_type == 'state':
        url += "&osm_tag=place:state&osm_tag=place:province&osm_tag=place:region&osm_tag=boundary:administrative"
    
    print(f"-> URL: {url}")
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=10.0)
            print(f"-> Status Code: {resp.status_code}")
            try:
                data = resp.json()
            except Exception as e:
                print(f"-> JSON Error: {e}")
                print(f"-> Raw Text: {resp.text[:200]}")
                return

            features = data.get("features", [])
            print(f"-> Found {len(features)} raw results")
            
            seen = set()
            results = []
            
            for feature in features:
                props = feature.get("properties", {})
                
                city = props.get("city") or props.get("name")
                state = props.get("state")
                country = props.get("country")
                
                formatted = ""
                # 3. Result Processing Logic
                if place_type == 'state':
                     if not state and props.get("osm_value") in ['state', 'province', 'region', 'administrative']:
                         state = props.get("name")
                         
                     if state and country: formatted = f"{state}, {country}"
                     elif state: formatted = state
                
                if formatted and formatted not in seen:
                    print(f"  [MATCH] {formatted}")
                    results.append(formatted)
                    seen.add(formatted)
                else:
                    print(f"  [SKIP] Raw Name: {props.get('name')} | State: {props.get('state')} | Value: {props.get('osm_value')}")

    except Exception as e:
        print(f"Error: {e}")

async def main():
    await test_search_logic("CDMX")
    await test_search_logic("Tlaxcala")
    await test_search_logic("Nuevo Leon")

if __name__ == "__main__":
    asyncio.run(main())
