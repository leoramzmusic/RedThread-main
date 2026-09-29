import httpx
import asyncio

async def test_search():
    q = "Mexico"
    url = f"https://nominatim.openstreetmap.org/search?q={q}&format=json&addressdetails=1&limit=5"
    headers = {"User-Agent": "RedThreadApp/1.0"}
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
        data = resp.json()
        print(f"Total results for {q}: {len(data)}")
        for i, item in enumerate(data):
            address = item.get("address", {})
            country = address.get("country")
            print(f"Result {i}: country='{country}', display_name='{item.get('display_name')}'")

if __name__ == "__main__":
    asyncio.run(test_search())
