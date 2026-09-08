"""
Lifestyle and interests categories for Red Thread
13 categories with 30-50 items each
"""

LIFESTYLE_CATEGORIES = {
    "outdoor_adventure": {
        "name_es": "Aire libre y aventura",
        "name_en": "Outdoor & Adventure",
        "items": [
            "remo", "buceo", "esqui", "canotaje", "snowboard", "surf", "senderismo",
            "escalada", "camping", "ciclismo_montana", "parapente", "rafting",
            "kayak", "vela", "windsurf", "kitesurf", "montanismo", "trekking",
            "pesca", "caza", "observacion_aves", "fotografia_naturaleza",
            "geocaching", "orientacion", "slackline", "parkour", "bmx",
            "skateboarding", "patinaje", "equitacion", "safari", "espeleologia",
            "barranquismo", "tirolesa", "vuelo_parapente", "ala_delta",
            "motocross", "quad", "jet_ski", "buceo_apnea", "snorkel"
        ]
    },
    "wellness_lifestyle": {
        "name_es": "Bienestar y estilo de vida",
        "name_en": "Wellness & Lifestyle",
        "items": [
            "amor_propio", "probar_cosas_nuevas", "tarot", "spa", "yoga",
            "meditacion", "mindfulness", "pilates", "tai_chi", "reiki",
            "aromaterapia", "acupuntura", "masajes", "sauna", "ayurveda",
            "nutricion", "veganismo", "vegetarianismo", "detox", "fitness",
            "running", "crossfit", "calistenia", "stretching", "respiracion",
            "terapia", "coaching", "desarrollo_personal", "lectura_autoayuda",
            "journaling", "gratitud", "afirmaciones", "visualizacion",
            "feng_shui", "cristales", "astrologia", "numerologia",
            "espiritualidad", "budismo", "minimalismo"
        ]
    },
    "food_drink": {
        "name_es": "Comer y Beber",
        "name_en": "Food & Drink",
        "items": [
            "gastronomia", "dulces", "cafe", "vino", "te", "cerveza_artesanal",
            "cocteleria", "whisky", "tequila", "mezcal", "sake", "cocina_gourmet",
            "reposteria", "panaderia", "chocolateria", "cocina_italiana",
            "cocina_japonesa", "cocina_mexicana", "cocina_francesa", "cocina_thai",
            "cocina_india", "cocina_china", "sushi", "ramen", "pizza",
            "hamburguesas", "tacos", "bbq", "asados", "comida_vegana",
            "comida_vegetariana", "comida_organica", "street_food",
            "food_trucks", "degustacion_vinos", "cata_cerveza", "barista",
            "sommelier", "chef_casero", "meal_prep"
        ]
    },
    "fan_communities": {
        "name_es": "Comunidades de fans",
        "name_en": "Fan Communities",
        "items": [
            "convenciones", "comics", "harry_potter", "star_wars", "marvel",
            "dc_comics", "anime", "manga", "cosplay", "comic_con",
            "star_trek", "doctor_who", "game_of_thrones", "lord_of_the_rings",
            "disney", "pixar", "studio_ghibli", "pokemon", "dragon_ball",
            "naruto", "one_piece", "attack_on_titan", "my_hero_academia",
            "supernatural", "stranger_things", "the_witcher", "breaking_bad",
            "friends", "the_office", "rick_and_morty", "adventure_time",
            "avatar", "kpop", "jpop", "fanfiction", "roleplay",
            "coleccionismo", "figuras_accion", "funko_pop", "merchandising"
        ]
    },
    "creativity": {
        "name_es": "Creatividad",
        "name_en": "Creativity",
        "items": [
            "fotografia", "canto", "poesia", "pintura", "dibujo", "escultura",
            "ceramica", "ilustracion", "diseno_grafico", "diseno_web",
            "animacion", "video_edicion", "produccion_musical", "dj",
            "composicion", "escritura", "novelas", "cuentos", "guiones",
            "teatro", "actuacion", "improvisacion", "stand_up", "magia",
            "origami", "scrapbooking", "lettering", "caligrafia", "graffiti",
            "street_art", "tatuajes", "moda", "diseno_ropa", "costura",
            "tejido", "crochet", "bordado", "joyeria", "carpinteria",
            "bricolaje", "restauracion", "upcycling"
        ]
    },
    "sports_fitness": {
        "name_es": "Deportes y fitness",
        "name_en": "Sports & Fitness",
        "items": [
            "gym", "caminar", "futbol", "basketball", "tennis", "volleyball",
            "baseball", "rugby", "hockey", "natacion", "atletismo", "boxeo",
            "mma", "karate", "taekwondo", "judo", "jiu_jitsu", "muay_thai",
            "kickboxing", "esgrima", "tiro_arco", "golf", "bowling",
            "ping_pong", "badminton", "squash", "padel", "ciclismo",
            "spinning", "running", "maraton", "triatlon", "crossfit",
            "calistenia", "powerlifting", "halterofilia", "zumba", "aerobics",
            "step", "pole_dance", "parkour", "escalada_deportiva"
        ]
    },
    "music": {
        "name_es": "Música",
        "name_en": "Music",
        "items": [
            "edm", "pop", "rock", "metal", "jazz", "blues", "reggae",
            "hip_hop", "rap", "trap", "reggaeton", "salsa", "bachata",
            "merengue", "cumbia", "ranchera", "mariachi", "banda", "corridos",
            "country", "folk", "indie", "alternative", "punk", "hardcore",
            "emo", "grunge", "classic_rock", "hard_rock", "heavy_metal",
            "death_metal", "black_metal", "progressive", "techno", "house",
            "trance", "dubstep", "drum_and_bass", "ambient", "classical",
            "opera", "flamenco", "bossa_nova", "samba", "tango", "kpop",
            "jpop", "afrobeat", "soul", "funk", "disco", "r_and_b"
        ]
    },
    "staying_in": {
        "name_es": "Quedarme en casa",
        "name_en": "Staying In",
        "items": [
            "leer", "reposteria", "juegos_mesa", "puzzles", "jardineria",
            "plantas", "acuarios", "terrarios", "cocina", "hornear",
            "manualidades", "pintura", "dibujo", "escritura", "podcasts",
            "audiolibros", "series", "peliculas", "documentales", "anime",
            "videojuegos", "streaming", "youtube", "meditacion", "yoga_casa",
            "ejercicio_casa", "decoracion", "organizacion", "limpieza",
            "coleccionismo", "modelismo", "lego", "origami", "scrapbooking",
            "tejido", "crochet", "bordado", "costura", "carpinteria_casa",
            "reparaciones", "bricolaje", "mascotas", "cuidado_mascotas"
        ]
    },
    "social_media_content": {
        "name_es": "Redes sociales y creación de contenido",
        "name_en": "Social Media & Content Creation",
        "items": [
            "instagram", "tiktok", "twitch", "podcast", "netflix", "youtube",
            "twitter", "facebook", "snapchat", "reddit", "discord", "telegram",
            "whatsapp", "linkedin", "pinterest", "tumblr", "vlogging",
            "blogging", "streaming", "gaming_streams", "irl_streams",
            "cooking_streams", "art_streams", "music_streams", "podcast_hosting",
            "video_editing", "photo_editing", "content_creation",
            "influencer", "social_media_marketing", "community_management",
            "memes", "viral_content", "storytelling", "live_streaming",
            "youtube_shorts", "reels", "stories", "threads", "clubhouse"
        ]
    },
    "going_out": {
        "name_es": "Salir",
        "name_en": "Going Out",
        "items": [
            "bares", "museos", "festivales", "fiestas", "clubes", "discotecas",
            "conciertos", "teatro", "opera", "ballet", "cine", "exposiciones",
            "galerias_arte", "ferias", "mercados", "food_festivals",
            "wine_tasting", "beer_tasting", "pub_crawl", "karaoke",
            "comedy_shows", "stand_up", "open_mic", "jam_sessions",
            "salsa_dancing", "bachata_dancing", "tango", "swing_dancing",
            "clubbing", "raves", "afterparties", "rooftop_bars", "speakeasies",
            "wine_bars", "craft_beer_bars", "sports_bars", "lounges",
            "cafes", "restaurantes", "brunch", "cenas", "picnics",
            "parques", "playas", "paseos", "turismo"
        ]
    },
    "tv_movies": {
        "name_es": "Series y películas",
        "name_en": "TV & Movies",
        "items": [
            "accion", "terror", "romanticas", "comedia", "drama", "thriller",
            "suspense", "ciencia_ficcion", "fantasia", "aventura", "western",
            "noir", "documental", "biografico", "historico", "guerra",
            "crimen", "misterio", "policiaco", "musical", "animacion",
            "anime", "shonen", "seinen", "shojo", "josei", "isekai",
            "mecha", "slice_of_life", "sports_anime", "romance_anime",
            "marvel", "dc", "star_wars", "disney", "pixar", "studio_ghibli",
            "netflix_originals", "hbo", "amazon_prime", "apple_tv",
            "cine_clasico", "cine_independiente", "cine_extranjero",
            "cine_arte", "cortometrajes", "series_coreanas", "telenovelas"
        ]
    },
    "values_causes": {
        "name_es": "Valores y causas",
        "name_en": "Values & Causes",
        "items": [
            "derecho_votar", "inclusividad", "voluntariado", "ecologismo",
            "feminismo", "igualdad_genero", "lgbtq_rights", "derechos_humanos",
            "justicia_social", "antirracismo", "diversidad", "equidad",
            "sostenibilidad", "cambio_climatico", "energia_renovable",
            "reciclaje", "zero_waste", "veganismo_etico", "derechos_animales",
            "proteccion_animal", "conservacion", "reforestacion",
            "limpieza_oceanos", "educacion", "alfabetizacion", "salud_mental",
            "salud_publica", "donacion_sangre", "donacion_organos",
            "caridad", "ayuda_humanitaria", "refugiados", "pobreza",
            "hambre", "agua_potable", "vivienda", "empleo_justo",
            "comercio_justo", "etica_empresarial", "transparencia",
            "anticorrupcion", "democracia", "libertad_expresion", "paz"
        ]
    },
    "videogames": {
        "name_es": "Videojuegos",
        "name_en": "Videogames",
        "items": [
            "fortnite", "call_of_duty", "battlefield", "legend_of_zelda",
            "league_of_legends", "dota_2", "valorant", "counter_strike",
            "overwatch", "apex_legends", "pubg", "minecraft", "roblox",
            "gta", "red_dead_redemption", "assassins_creed", "fifa", "nba_2k",
            "madden", "rocket_league", "fall_guys", "among_us", "pokemon",
            "mario", "sonic", "final_fantasy", "kingdom_hearts", "persona",
            "dark_souls", "elden_ring", "bloodborne", "sekiro", "witcher",
            "skyrim", "fallout", "bioshock", "half_life", "portal",
            "resident_evil", "silent_hill", "metal_gear", "halo",
            "gears_of_war", "uncharted", "last_of_us", "god_of_war",
            "horizon", "spider_man", "batman_arkham", "mortal_kombat",
            "street_fighter", "tekken", "smash_bros", "animal_crossing",
            "stardew_valley", "terraria", "hollow_knight", "celeste",
            "undertale", "deltarune", "indie_games", "retro_games",
            "arcade", "rpg", "mmorpg", "fps", "moba", "battle_royale",
            "survival", "horror", "platformer", "puzzle", "strategy",
            "simulation", "racing", "sports", "fighting", "rhythm"
        ]
    }
}

def get_category_items(category_key: str, language: str = "es") -> list:
    """Get items for a specific category"""
    if category_key not in LIFESTYLE_CATEGORIES:
        return []
    return LIFESTYLE_CATEGORIES[category_key]["items"]

def get_all_categories(language: str = "es") -> dict:
    """Get all categories with their names in the specified language"""
    name_key = f"name_{language}"
    return {
        key: {
            "name": value.get(name_key, value["name_es"]),
            "items": value["items"]
        }
        for key, value in LIFESTYLE_CATEGORIES.items()
    }

