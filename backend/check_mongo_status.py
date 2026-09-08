"""
Script para verificar estado completo de MongoDB y colecciones de RedThread.
"""
import sys
import os

# Agregar el path del backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from pymongo import MongoClient
    
    client = MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=3000)
    
    # Verificar conexion
    client.admin.command('ping')
    print("✅ MongoDB conectado correctamente")
    
    # Listar bases de datos
    dbs = client.list_database_names()
    print(f"\n📦 Bases de datos disponibles: {dbs}")
    
    # Verificar base de datos redthread
    db = client['redthread']
    colls = db.list_collection_names()
    print(f"\n🗂️  Colecciones en 'redthread' ({len(colls)} total):")
    
    for col in sorted(colls):
        count = db[col].count_documents({})
        print(f"   - {col}: {count} documentos")
    
    if not colls:
        print("   (sin colecciones - base de datos vacía)")
    
    print("\n✅ Estado verificado exitosamente")
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
