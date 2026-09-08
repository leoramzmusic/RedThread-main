import httpx
import asyncio
import json

async def test_photon(q):
    print(f"\n--- Testing '{q}' ---")
    url = f"https://photon.komoot.io/api/?q={q}&limit=5&osm_tag=place:state&osm_tag=place:province&osm_tag=place:region"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        data = resp.json()
        for feature in data.get('features', []):
            props = feature.get('properties', {})
            print(f"Name: {props.get('name')}")
            print(f"OSM Key: {props.get('osm_key')}")
            print(f"OSM Value: {props.get('osm_value')}")
            print(f"City: {props.get('city')}")
            print(f"State: {props.get('state')}")
            print(f"Country: {props.get('country')}")
            print("-" * 20)

async def main():
    await test_photon("CDMX")
    await test_photon("Nuevo Leon")
    await test_photon("California")

if __name__ == "__main__":
    asyncio.run(main())
