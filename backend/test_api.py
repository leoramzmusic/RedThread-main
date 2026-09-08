
import requests

def test_endpoint():
    url = "http://localhost:8000/portal-redthread/experiencia/algoritmos/care/factores"
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Data:")
            print(response.json())
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_endpoint()
