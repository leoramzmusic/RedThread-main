import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from src.core.database import init_db
from src.models.legal_document import LegalDocument

async def debug_legal_docs():
    print("Connecting to database...")
    await init_db()
    
    print("\n--- Listing All Legal Documents ---")
    docs = await LegalDocument.find_all().to_list()
    if not docs:
        print("No documents found.")
    
    for doc in docs:
        print(f"ID: {doc.id}")
        print(f"Type: {doc.doc_type}")
        print(f"Lang: {doc.language}")
        print(f"Version: {doc.version}")
        print(f"Is Current: {doc.is_current}")
        print("-" * 20)

if __name__ == "__main__":
    asyncio.run(debug_legal_docs())
