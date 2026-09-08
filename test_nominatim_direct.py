import httpx
import asyncio
import json

async def test_nominatim_direct():
    headers = {"User-Agent": "RedThreadApp/1.0"}
    params = {
        "q": "Mexico",
        "format": "json",
        "addressdetails": 1,
        "limit": 1,
        "featuretype": "country"
    }
    url = "https://nominatim.openstreetmap.org/search"
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, headers=headers)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(json.dumps(data, indent=2))

if __name__ == "__main__":
    asyncio.run(test_nominatim_direct())
