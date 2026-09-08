import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  TextField,
  InputAdornment,
  keyframes,
  useTheme,
  alpha
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  Landscape as OutdoorIcon,
  SelfImprovement as WellnessIcon,
  Restaurant as FoodIcon,
  Groups as CommunityIcon,
  Brush as CreativityIcon,
  SportsSoccer as SportsIcon,
  MusicNote as MusicIcon,
  Home as HomeIcon,
  Share as SocialIcon,
  Nightlife as GoingOutIcon,
  Movie as MovieIcon,
  VolunteerActivism as CausesIcon,
  SportsEsports as GamesIcon
} from '@mui/icons-material';

interface LifestyleInterestsProps {
  selectedInterests: string[];
  onInterestsChange: (interests: string[]) => void;
  editable?: boolean;
}

// Lifestyle categories data with improved visual metadata
const CATEGORIES: Record<string, { name: string; items: string[]; color: string; icon: React.ReactElement }> = {
  outdoor_adventure: {
    name: "Aire libre y aventura",
    color: '#66BB6A', // Green
    icon: <OutdoorIcon />,
    items: [
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
  wellness_lifestyle: {
    name: "Bienestar y estilo de vida",
    color: '#29B6F6', // Light Blue
    icon: <WellnessIcon />,
    items: [
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
  food_drink: {
    name: "Comer y Beber",
    color: '#FFA726', // Orange
    icon: <FoodIcon />,
    items: [
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
  fan_communities: {
    name: "Comunidades de fans",
    color: '#AB47BC', // Purple
    icon: <CommunityIcon />,
    items: [
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
  creativity: {
    name: "Creatividad",
    color: '#EF5350', // Red
    icon: <CreativityIcon />,
    items: [
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
  sports_fitness: {
    name: "Deportes y fitness",
    color: '#1565C0', // Blue
    icon: <SportsIcon />,
    items: [
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
  music: {
    name: "Música",
    color: '#3F51B5', // Indigo
    icon: <MusicIcon />,
    items: [
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
  staying_in: {
    name: "Quedarme en casa",
    color: '#8D6E63', // Brown
    icon: <HomeIcon />,
    items: [
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
  social_media_content: {
    name: "Redes sociales",
    color: '#26C6DA', // Cyan
    icon: <SocialIcon />,
    items: [
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
  going_out: {
    name: "Salir",
    color: '#FBC02D', // Yellow Dark
    icon: <GoingOutIcon />,
    items: [
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
  tv_movies: {
    name: "Series y películas",
    color: '#78909C', // Blue Grey
    icon: <MovieIcon />,
    items: [
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
  values_causes: {
    name: "Valores y causas",
    color: '#9CCC65', // Light Green
    icon: <CausesIcon />,
    items: [
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
  videogames: {
    name: "Videojuegos",
    color: '#673AB7', // Deep Purple
    icon: <GamesIcon />,
    items: [
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
      "undertale", "deltarune", "indie_games", "retro_games"
    ]
  }
};

const formatInterestLabel = (interest: string): string => {
  return interest
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const popIn = keyframes`
  0% { transform: scale(0.95); opacity: 0; }
  60% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

export default function LifestyleInterests({
  selectedInterests,
  onInterestsChange,
  editable = false
}: LifestyleInterestsProps) {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | false>(false);

  // Auto-expand categories when searching
  useEffect(() => {
    if (searchTerm) {
      setExpandedCategory(false);
    }
  }, [searchTerm]);

  const handleToggleInterest = (interest: string) => {
    if (!editable) return;

    if (selectedInterests.includes(interest)) {
      onInterestsChange(selectedInterests.filter(i => i !== interest));
    } else {
      onInterestsChange([...selectedInterests, interest]);
    }
  };

  const handleCategoryChange = (category: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedCategory(isExpanded ? category : false);
  };

  // Filter categories and items based on search
  const filteredCategories = Object.entries(CATEGORIES).map(([key, category]) => {
    const filteredItems = category.items.filter(item =>
      formatInterestLabel(item).toLowerCase().includes(searchTerm.toLowerCase())
    );
    return { key, category, filteredItems };
  }).filter(({ filteredItems }) => filteredItems.length > 0 || searchTerm === '');

  const isSearching = searchTerm.length > 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Intereses ({selectedInterests.length} seleccionados)
        </Typography>
      </Box>

      {editable && (
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar intereses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
      )}

      <Box sx={{ maxHeight: editable ? 500 : 'auto', overflowY: 'auto', pr: 0.5 }}>
        {filteredCategories.map(({ key, category, filteredItems }) => {
          const selectedCount = selectedInterests.filter(i => category.items.includes(i)).length;
          const isExpanded = isSearching ? true : expandedCategory === key;

          return (
            <Accordion
              key={key}
              expanded={isExpanded}
              onChange={!isSearching ? handleCategoryChange(key) : undefined}
              disableGutters
              elevation={0}
              sx={{
                mb: 1.5,
                border: '1px solid',
                borderColor: isExpanded ? alpha(category.color, 0.5) : 'divider',
                borderRadius: 2,
                '&:before': { display: 'none' }, // Remove default line
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: isExpanded ? `0 4px 12px ${alpha(category.color, 0.15)}` : 'none',
              }}
            >
              <AccordionSummary
                expandIcon={!isSearching && <ExpandMoreIcon />}
                sx={{
                  bgcolor: isExpanded ? alpha(category.color, 0.08) : 'background.paper',
                  minHeight: 56,
                  '&.Mui-expanded': { minHeight: 56 },
                  '&:hover': {
                    bgcolor: isExpanded ? alpha(category.color, 0.12) : 'action.hover'
                  }
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5} width="100%">
                  <Box
                    sx={{
                      color: isExpanded ? category.color : 'text.secondary',
                      display: 'flex',
                      transition: 'color 0.3s'
                    }}
                  >
                    {category.icon}
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: isExpanded ? category.color : 'text.primary',
                      flexGrow: 1
                    }}
                  >
                    {category.name}
                  </Typography>

                  {selectedCount > 0 && (
                    <Chip
                      label={selectedCount}
                      size="small"
                      sx={{
                        height: 24,
                        minWidth: 24,
                        bgcolor: category.color,
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        mr: 1,
                        animation: `${popIn} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)`
                      }}
                    />
                  )}
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ bgcolor: 'background.default', p: 2 }}>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {filteredItems.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <Chip
                        key={interest}
                        label={formatInterestLabel(interest)}
                        icon={isSelected ? <CheckIcon style={{ fontSize: 16 }} /> : undefined}
                        onClick={() => handleToggleInterest(interest)}
                        component="div"
                        role="button"
                        aria-pressed={isSelected}

                        variant={isSelected ? "filled" : "outlined"}
                        sx={{
                          cursor: editable ? 'pointer' : 'default',

                          fontWeight: isSelected ? 600 : 400,

                          // Dynamic colors based on category
                          color: isSelected ? 'white' : 'text.primary',
                          bgcolor: isSelected ? category.color : 'transparent',
                          borderColor: isSelected ? 'transparent' : alpha(theme.palette.divider, 0.5),

                          // Accessibility overrides for light backgrounds
                          ...(isSelected && ['wellness_lifestyle', 'food_drink', 'values_causes', 'birds', 'going_out'].includes(key) && {
                            color: 'rgba(0,0,0,0.85)',
                            '& .MuiChip-icon': { color: 'rgba(0,0,0,0.7)' }
                          }),

                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          animation: isSelected ? `${popIn} 0.3s ease-out` : 'none',

                          '&:hover': {
                            bgcolor: isSelected
                              ? category.color
                              : alpha(category.color, 0.15),
                            borderColor: isSelected ? 'transparent' : category.color,
                            transform: editable ? 'translateY(-2px)' : 'none',
                            boxShadow: editable ? `0 4px 8px ${alpha(category.color, 0.2)}` : 'none'
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
        {filteredCategories.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            No se encontraron intereses.
          </Typography>
        )}
      </Box>

      {!editable && selectedInterests.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
          No hay intereses seleccionados
        </Typography>
      )}
    </Box>
  );
}
