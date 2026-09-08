import asyncio
import motor.motor_asyncio
from bson import ObjectId
import datetime

async def run():
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['redthread']
    
    CONTLA = [-98.1736, 19.3294]
    sample_photos = ["https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400"]

    # --- 1. OPPOSITE CANDIDATES (Low score, different vibes) ---
    opts = [
        ('opp1', 'Metalhead', ['heavy_metal', 'gaming', 'tattoo'], ['short_term_fun'], ['extrovert', 'intense']),
        ('opp2', 'Corporate', ['finance', 'networking', 'golf'], ['undecided'], ['analytical', 'conservative'])
    ]
    
    for suffix, name, interests, goals, traits in opts:
        email = f"user_{suffix}@test.com"
        await db.users.update_one({'email': email}, {'$set': {
            'username': f"user_{suffix}", 'first_name': name, 'last_name': 'Opposite',
            'is_active': True, 'is_verified': True, 'role': 'user', 'created_at': datetime.datetime.utcnow()
        }}, upsert=True)
        user = await db.users.find_one({'email': email})
        u_id = user['_id']
        
        await db.profiles.update_one({'user_id': str(u_id)}, {'$set': {
            'display_name': name,
            'birth_date': datetime.datetime(1995, 3, 15),
            'age': 31,
            'gender': 'woman', # Admin likes women
            'attraction_preferences': ['man'],
            'location': {'type': 'Point', 'coordinates': CONTLA, 'city': 'Contla', 'state': 'Tlaxcala', 'country': 'México'},
            'interests': interests,
            'relationship_goals': goals,
            'personality_traits': traits,
            'profile_visible': True,
            'show_me_in_discovery': True,
            'photos': sample_photos,
            'bio': f"Yo soy {name}, buscando algo totalmente diferente a ti."
        }}, upsert=True)
        print(f"Opposite {email} created.")

    # --- 2. BLIND MODE CANDIDATES (High compatibility + Prompts) ---
    blind_email = "user_blind_test@test.com"
    await db.users.update_one({'email': blind_email}, {'$set': {
        'username': 'blind_tester', 'first_name': 'Aura', 'last_name': 'Mistery',
        'is_active': True, 'is_verified': True, 'role': 'user'
    }}, upsert=True)
    user = await db.users.find_one({'email': blind_email})
    u_id = user['_id']
    
    await db.profiles.update_one({'user_id': str(u_id)}, {'$set': {
        'display_name': 'Aura (Blind)',
        'age': 27,
        'gender': 'woman',
        'attraction_preferences': ['man'],
        'location': {'type': 'Point', 'coordinates': CONTLA, 'city': 'Contla', 'state': 'Tlaxcala', 'country': 'México'},
        'interests': ['jazz', 'cooking', 'travel', 'hiking', 'photography'], # Matching admin
        'relationship_goals': ['serious_relationship'],
        'personality_traits': ['introvert', 'analytical', 'calm'],
        'prompts': [
            {'question': 'Lo que más me apasiona...', 'answer': 'Perder la noción del tiempo editando fotos de paisajes.'},
            {'question': 'Mi domingo ideal es...', 'answer': 'Cocinando algo lento mientras suena Miles Davis de fondo.'}
        ],
        'profile_visible': True,
        'show_me_in_discovery': True,
        'photos': sample_photos,
        'bio': "No me veas, siénteme a través de mi hilo."
    }}, upsert=True)
    print(f"Blind Mode candidate {blind_email} created.")

    # --- 3. CURIOUS CANDIDATES (Diverse criteria for "Feeling Curious") ---
    curious_email = "user_curious_test@test.com"
    await db.users.update_one({'email': curious_email}, {'$set': {
        'username': 'curious_tester', 'first_name': 'Sky', 'last_name': 'Diversity',
        'is_active': True, 'is_verified': True, 'role': 'user'
    }}, upsert=True)
    user = await db.users.find_one({'email': curious_email})
    u_id = user['_id']
    
    await db.profiles.update_one({'user_id': str(u_id)}, {'$set': {
        'display_name': 'Sky (Curious)',
        'age': 35, # Slightly outside admin's standard range maybe?
        'gender': 'non_binary', # Test identity diversity
        'gender_category': 'non-binary',
        'attraction_preferences': ['man', 'woman', 'non_binary'],
        'location': {'type': 'Point', 'coordinates': [-99.1332, 19.4326], 'city': 'CDMX', 'state': 'CDMX', 'country': 'México'}, # 100km away
        'interests': ['meditation', 'burningman', 'tech', 'ai'],
        'relationship_goals': ['open_relationship'],
        'profile_visible': True,
        'show_me_in_discovery': True,
        'photos': sample_photos,
        'bio': "Soy la excepción a todas tus reglas."
    }}, upsert=True)
    print(f"Curious candidate {curious_email} created.")

if __name__ == '__main__':
    asyncio.run(run())
