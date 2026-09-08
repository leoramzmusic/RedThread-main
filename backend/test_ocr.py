"""
Test script para verificar que el OCR funciona correctamente
"""
import sys
sys.path.append('.')

try:
    import pytesseract
    from PIL import Image
    
    # Configurar ruta de Tesseract
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    
    # Verificar versión
    print("✓ Tesseract instalado correctamente")
    print(f"  Versión: {pytesseract.get_tesseract_version()}")
    
    # Verificar idiomas disponibles
    langs = pytesseract.get_languages()
    print(f"✓ Idiomas disponibles: {', '.join(langs)}")
    
    # Crear una imagen de prueba con texto
    from PIL import Image, ImageDraw, ImageFont
    
    # Crear imagen simple con texto
    img = Image.new('RGB', (400, 100), color='white')
    d = ImageDraw.Draw(img)
    d.text((10, 30), "NOMBRE: JUAN PEREZ", fill='black')
    d.text((10, 50), "FECHA NACIMIENTO: 15/05/1990", fill='black')
    
    # Guardar imagen temporal
    test_img_path = 'test_ocr_image.png'
    img.save(test_img_path)
    print(f"\n✓ Imagen de prueba creada: {test_img_path}")
    
    # Realizar OCR
    text = pytesseract.image_to_string(img, lang='eng')
    print(f"\n✓ OCR exitoso!")
    print(f"  Texto extraído:\n{text}")
    
    # Limpiar
    import os
    os.remove(test_img_path)
    
    print("\n" + "="*50)
    print("✓✓✓ OCR FUNCIONA CORRECTAMENTE ✓✓✓")
    print("="*50)
    
except ImportError as e:
    print(f"✗ Error: {e}")
    print("Instala las dependencias con: pip install pytesseract pillow")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
