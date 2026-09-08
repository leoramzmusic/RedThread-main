
import sys
import os

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from main import app
from fastapi.routing import APIRoute

print(f"{'Method':<10} {'Path':<50} {'Name':<30}")
print("-" * 90)

for route in app.routes:
    if isinstance(route, APIRoute):
        methods = ", ".join(route.methods)
        print(f"{methods:<10} {route.path:<50} {route.name:<30}")
