import asyncio
import os
from src.api.profiles import extract_identity_data

async def test_ocr():
    # Directory where uploaded files are stored
    identity_dir = "static/identity_documents"
    
    if not os.path.exists(identity_dir):
        print(f"Directory {identity_dir} does not exist.")
        return

    # Get the most recent file
    files = [os.path.join(identity_dir, f) for f in os.listdir(identity_dir)]
    if not files:
        print("No files found in static/identity_documents")
        return
        
    latest_file = max(files, key=os.path.getctime)
    print(f"Testing OCR on latest file: {latest_file}")
    
    # Run extraction
    print("Running OCR... please wait.")
    # Import pytesseract to access raw text if needed, but extract_identity_data prints it too
    # We will rely on the print inside extract_identity_data which we modified to print 500 chars
    # Let's modify this script to print the return value fully
    
    try:
        result = await extract_identity_data(latest_file, "ine")
        
        print("\n" + "="*30)
        print("       RESULTADO DEL OCR       ")
        print("="*30)
        print(f"Nombre detectado: {result.get('name')}")
        print(f"Fecha nacimiento: {result.get('birth_date')}")
        print("="*30)
        
        if not result.get('name'):
            print("\n⚠️  NO SE DETECTÓ EL NOMBRE.")
            print("Por favor copia el texto que apareció arriba (OCR Text extracted) y compártelo en el chat.")
            print("Así podré ajustar la búsqueda para encontrar tu nombre.")
            
    except Exception as e:
        print(f"Error fatal: {e}")

if __name__ == "__main__":
    # Run async function
    loop = asyncio.get_event_loop()
    loop.run_until_complete(test_ocr())
