// Módulo (key `section-*`, contrato con backend registry) → campos de score.
// Mantener en sync con backend/src/models/profile_module.py (MODULE_SCORE_FIELDS).
// Las secciones desactivadas en el portal no cuentan ni en puntaje ni en máximo.
// INVARIANTE: ocultar jamás borra datos del usuario — esto solo filtra el
// cálculo; el guardado reenvía los valores intactos (sin unregister) y el
// backend actualiza únicamente campos enviados (exclude_unset).
export const MODULE_SCORE_FIELDS: Record<string, string[]> = {
  "section-photos": ["photos"],
  "section-basic": ["nickname", "age", "gender"],
  "section-location": ["city"],
  "section-aboutme": ["bio"],
  "section-goals": ["relationship_goals"],
  "section-interests": ["interests"],
  "section-pronouns": ["pronouns"],
  "section-additional": ["height_cm", "zodiac", "relationship_type"],
  "section-professional": [
    "education_center",
    "education_level",
    "occupation",
    "work_company",
  ],
  // Contenedor (sin campos propios; ocultar arrastra a los hijos)
  "section-music": [],
  "section-music-spotify": ["mi_himno"],
  "section-music-genres": ["music_genres"],
  "section-identity": ["sexual_orientation"],
  "section-personality": [
    "social_style",
    "processing_style",
    "risk_tolerance",
    "decision_making",
  ],
  "section-cognitive": ["neurodiversity", "learning_preferences"],
  "section-wellness": ["disabilities", "health_conditions", "energy_level"],
  "section-status": ["relationship_status"],
  "section-languages": ["languages"],
};

// Sugerencias (sectionId de ancla en el form) → módulo que las gobierna.
export const SUGGESTION_SECTION_TO_MODULE: Record<string, string> = {
  "section-music": "section-music-spotify",
  "section-music-genres": "section-music-genres",
  "section-relationship-type": "section-additional",
  "section-height": "section-additional",
  "section-zodiac": "section-additional",
  "section-education": "section-professional",
  "section-professional": "section-professional",
};

// Puntos que aporta un módulo al total (para mostrar impacto en el admin).
export const getModulePoints = (moduleKey: string): number => {
  const fields = MODULE_SCORE_FIELDS[moduleKey] ?? [];
  return fields.reduce(
    (sum, f) => sum + (PROFILE_WEIGHTS[f as keyof typeof PROFILE_WEIGHTS] ?? 0),
    0,
  );
};

const normalizeHidden = (
  hidden?: Set<string> | string[] | null,
): Set<string> => {
  const base: Set<string> =
    !hidden
      ? new Set()
      : hidden instanceof Set
        ? new Set(hidden)
        : new Set(hidden);
  // Expande padres a hijos (ocultar section-music oculta spotify+genres)
  for (const modKey of [...base]) {
    const prefix = modKey + "-";
    for (const candidate of Object.keys(MODULE_SCORE_FIELDS)) {
      if (candidate.startsWith(prefix)) base.add(candidate);
    }
  }
  return base;
};

const hiddenFieldsOf = (hidden: Set<string>): Set<string> => {
  const fields = new Set<string>();
  hidden.forEach((mod) => {
    (MODULE_SCORE_FIELDS[mod] ?? []).forEach((f) => fields.add(f));
  });
  return fields;
};

// Weight definitions for profile fields
export const PROFILE_WEIGHTS = {
  // Information Basic
  nickname: 2,
  age: 2,
  gender: 2,

  // Location
  city: 2,

  // About Me
  bio: 3,

  // Goals
  relationship_goals: 5,
  // intentions: 5, // Removed as it's not currently editable in the UI

  // Interests
  interests: 3,

  // Pronouns
  pronouns: 1,

  // Additional Data
  height_cm: 2,
  zodiac: 2,
  relationship_type: 2,

  // Professional
  education_center: 2,
  education_level: 2,
  occupation: 2,
  work_company: 2,

  // Music
  mi_himno: 1,
  music_genres: 2,

  // Identity
  sexual_orientation: 3,

  // Status
  relationship_status: 2,

  // Languages
  languages: 1,

  // Photos
  photos: 2,

  // Personality & Characteristics (1 point each)
  social_style: 1,
  processing_style: 1,
  risk_tolerance: 1,
  decision_making: 1,
  neurodiversity: 1,
  learning_preferences: 1,
  energy_level: 1,
  disabilities: 1,
  health_conditions: 1,
};

// Spotify Free accounts can't provide full music data via the API.
// When the backend reports product type, treat music as complete so
// Free users are never stuck below 100% because of it.
export const isSpotifyFree = (profile: any): boolean => {
  return (
    profile?.mi_himno?.spotify_product === "free" ||
    profile?.spotify_account_type === "free"
  );
};
// Calculate total possible score dynamically (solo secciones activas)
export const MAX_PROFILE_SCORE = Object.values(PROFILE_WEIGHTS).reduce(
  (sum, weight) => sum + weight,
  0,
);

export const getMaxScore = (hiddenSections?: Set<string> | string[] | null): number => {
  const hidden = hiddenFieldsOf(normalizeHidden(hiddenSections));
  return Object.entries(PROFILE_WEIGHTS)
    .filter(([field]) => !hidden.has(field))
    .reduce((sum, [, weight]) => sum + weight, 0);
};

// Helper to check if field has meaningful value
const hasValue = (value: any): boolean => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object" && value !== null)
    return Object.keys(value).length > 0;
  return value !== null && value !== undefined && value !== "";
};

export const calculateProfileScore = (
  profile: any,
  hiddenSections?: Set<string> | string[] | null,
  musicFallback: boolean = false,
): number => {
  if (!profile) return 0;

  const hiddenFields = hiddenFieldsOf(normalizeHidden(hiddenSections));
  let score = 0;
  const missingFields: string[] = [];

  const check = (field: string, condition: boolean, weight: number) => {
    if (hiddenFields.has(field)) return;
    if (condition) {
      score += weight;
    } else {
      missingFields.push(field);
    }
  };

  // Basic
  check(
    "nickname",
    hasValue(profile.nickname) || hasValue(profile.display_name),
    PROFILE_WEIGHTS.nickname,
  );
  check("age", hasValue(profile.age), PROFILE_WEIGHTS.age);
  check("gender", hasValue(profile.gender), PROFILE_WEIGHTS.gender);

  // Location
  check(
    "city",
    hasValue(profile.city) || (profile.location && profile.location.city),
    PROFILE_WEIGHTS.city,
  );

  // About
  check("bio", hasValue(profile.bio), PROFILE_WEIGHTS.bio);

  // Goals
  check(
    "relationship_goals",
    hasValue(profile.relationship_goals),
    PROFILE_WEIGHTS.relationship_goals,
  );

  // Interests
  check(
    "interests",
    hasValue(profile.interests) || hasValue(profile.lifestyle_interests),
    PROFILE_WEIGHTS.interests,
  );

  // Pronouns
  check("pronouns", hasValue(profile.pronouns), PROFILE_WEIGHTS.pronouns);

  // Additional
  check("height_cm", hasValue(profile.height_cm), PROFILE_WEIGHTS.height_cm);
  check(
    "zodiac",
    hasValue(profile.zodiac) || profile.zodiac_relevant === false,
    PROFILE_WEIGHTS.zodiac,
  );
  check(
    "relationship_type",
    hasValue(profile.relationship_type),
    PROFILE_WEIGHTS.relationship_type,
  );

  // Professional
  check(
    "education_center",
    hasValue(profile.education_center),
    PROFILE_WEIGHTS.education_center,
  );
  check(
    "education_level",
    hasValue(profile.education_level),
    PROFILE_WEIGHTS.education_level,
  );
  check("occupation", hasValue(profile.occupation), PROFILE_WEIGHTS.occupation);
  check(
    "work_company",
    hasValue(profile.work_company),
    PROFILE_WEIGHTS.work_company,
  );

  // Music (Spotify Free o fallback de integración cuentan como completo:
  // la integración rota nunca bloquea el 100%)
  if (!hiddenFields.has("mi_himno") && musicFallback) {
    score += PROFILE_WEIGHTS.mi_himno;
  } else {
    check(
      "mi_himno",
      isSpotifyFree(profile) ||
        (hasValue(profile.mi_himno) &&
          (profile.mi_himno.connected ||
            profile.mi_himno.favorite_artists?.length > 0)),
      PROFILE_WEIGHTS.mi_himno,
    );
  }
  check(
    "music_genres",
    hasValue(profile.music_genres),
    PROFILE_WEIGHTS.music_genres,
  );

  // Identity
  check(
    "sexual_orientation",
    hasValue(profile.sexual_orientation),
    PROFILE_WEIGHTS.sexual_orientation,
  );

  // Status
  check(
    "relationship_status",
    hasValue(profile.relationship_status),
    PROFILE_WEIGHTS.relationship_status,
  );

  // Languages
  check("languages", hasValue(profile.languages), PROFILE_WEIGHTS.languages);

  // Photos
  check("photos", hasValue(profile.photos), PROFILE_WEIGHTS.photos);

  // Personality & Characteristics
  check(
    "social_style",
    hasValue(profile.social_style),
    PROFILE_WEIGHTS.social_style,
  );
  check(
    "processing_style",
    hasValue(profile.processing_style),
    PROFILE_WEIGHTS.processing_style,
  );
  check(
    "risk_tolerance",
    hasValue(profile.risk_tolerance),
    PROFILE_WEIGHTS.risk_tolerance,
  );
  check(
    "decision_making",
    hasValue(profile.decision_making),
    PROFILE_WEIGHTS.decision_making,
  );
  check(
    "neurodiversity",
    hasValue(profile.neurodiversity),
    PROFILE_WEIGHTS.neurodiversity,
  );
  check(
    "learning_preferences",
    hasValue(profile.learning_preferences),
    PROFILE_WEIGHTS.learning_preferences,
  );
  check(
    "energy_level",
    hasValue(profile.energy_level),
    PROFILE_WEIGHTS.energy_level,
  );
  check(
    "disabilities",
    hasValue(profile.disabilities),
    PROFILE_WEIGHTS.disabilities,
  );
  check(
    "health_conditions",
    hasValue(profile.health_conditions) || hasValue(profile.health_status),
    PROFILE_WEIGHTS.health_conditions,
  );

  console.log("Profile Score:", score, "/", MAX_PROFILE_SCORE);
  console.log("Missing Fields:", missingFields);

  return score;
};

export const calculateCompletionPercentage = (
  score: number,
  max: number = MAX_PROFILE_SCORE,
): number => {
  if (max <= 0) return 100;
  return Math.min(Math.round((score / max) * 100), 100);
};

export interface Suggestion {
  messageKey: string;
  message: string;
  sectionId: string;
  weight: number;
}

export const getProfileSuggestions = (
  profile: any,
  hiddenSections?: Set<string> | string[] | null,
  musicFallback: boolean = false,
): Suggestion[] => {
  if (!profile) return [];

  const hidden = normalizeHidden(hiddenSections);
  const suggestions: Suggestion[] = [];

  const add = (
    condition: boolean,
    weight: number,
    messageKey: string,
    message: string,
    sectionId: string,
  ) => {
    if (!condition) {
      suggestions.push({ weight, messageKey, message, sectionId });
    }
  };

  // Check fields (Prioritized by weight/importance)
  add(
    profile.sexual_orientation,
    15,
    "sexualOrientation",
    "Define tu orientación sexual",
    "section-identity",
  );
  add(
    hasValue(profile.relationship_goals),
    12,
    "relationshipGoals",
    "Define qué tipo de relación buscas",
    "section-goals",
  );
  add(
    profile.nickname || profile.display_name,
    10,
    "nickname",
    "Agrega un nickname",
    "section-basic",
  );
  add(profile.age, 10, "age", "Ingresa tu edad", "section-basic");
  add(
    hasValue(profile.gender),
    10,
    "gender",
    "Selecciona tu género",
    "section-basic",
  );
  add(
    profile.bio,
    8,
    "bio",
    "Escribe algo interesante en 'Sobre mí'",
    "section-aboutme",
  );
  add(
    profile.photos && profile.photos.length > 0,
    7,
    "photos",
    "Sube al menos una foto para que te conozcan",
    "section-photos",
  );
  add(
    hasValue(profile.interests) || hasValue(profile.lifestyle_interests),
    6,
    "interests",
    "Selecciona al menos un interés o estilo de vida",
    "section-interests",
  );

  // Identity & Details
  add(
    profile.relationship_status,
    2,
    "relationshipStatus",
    "¿Cuál es tu estado civil?",
    "section-status",
  );
  add(
    profile.relationship_type,
    2,
    "relationshipType",
    "¿Qué tipo de relación prefieres?",
    "section-relationship-type",
  );
  add(profile.height_cm, 2, "height", "¿Cuánto mides?", "section-height");
  add(
    hasValue(profile.zodiac) || profile.zodiac_relevant === false,
    2,
    "zodiac",
    "Agrega tu signo zodiacal",
    "section-zodiac",
  );
  add(
    profile.education_level,
    2,
    "educationLevel",
    "Completa tu nivel educativo",
    "section-education",
  );
  add(
    profile.occupation,
    2,
    "occupation",
    "Añade tu profesión",
    "section-professional",
  );
  add(profile.city, 2, "city", "Indica dónde vives", "section-location");
  add(
    profile.education_center,
    2,
    "educationCenter",
    "¿Dónde estudiaste?",
    "section-education",
  );
  add(
    profile.work_company,
    2,
    "workCompany",
    "Indica dónde trabajas",
    "section-professional",
  );
  add(
    hasValue(profile.languages),
    1,
    "languages",
    "¿Qué idiomas hablas?",
    "section-languages",
  );
  add(
    profile.pronouns,
    1,
    "pronouns",
    "Agrega tus pronombres",
    "section-pronouns",
  );

  // Music (skipped for Spotify Free — profile counts as complete)
  if (!isSpotifyFree(profile)) {
    add(
      hasValue(profile.mi_himno) &&
        (profile.mi_himno.connected ||
          profile.mi_himno.favorite_artists?.length > 0),
      2,
      "musicConnect",
      "Conecta tu música o agrega artistas favoritos",
      "section-music",
    );
  }
  add(
    hasValue(profile.music_genres) && profile.music_genres.length > 0,
    1,
    "musicGenres",
    "¿Qué géneros musicales te gustan?",
    "section-music-genres",
  );

  // Personality & Characteristics (Low priority)
  add(
    hasValue(profile.social_style),
    1,
    "socialStyle",
    "¿Cómo te defines socialmente?",
    "section-personality",
  );
  add(
    hasValue(profile.neurodiversity),
    1,
    "neurodiversity",
    "Agrega información sobre neurodiversidad",
    "section-cognitive",
  );
  add(
    hasValue(profile.processing_style),
    1,
    "processingStyle",
    "¿Cuál es tu estilo de procesamiento?",
    "section-personality",
  );
  add(
    hasValue(profile.risk_tolerance),
    1,
    "riskTolerance",
    "¿Cuál es tu tolerancia al riesgo?",
    "section-personality",
  );
  add(
    hasValue(profile.decision_making),
    1,
    "decisionMaking",
    "¿Cómo tomas decisiones?",
    "section-personality",
  );
  add(
    hasValue(profile.disabilities),
    1,
    "disabilities",
    "Agrega información sobre discapacidad",
    "section-wellness",
  );
  add(
    hasValue(profile.health_conditions) || hasValue(profile.health_status),
    1,
    "health",
    "Agrega información de salud",
    "section-wellness",
  );
  add(
    hasValue(profile.energy_level),
    1,
    "energyLevel",
    "¿Eres matutino o nocturno?",
    "section-wellness",
  );
  add(
    hasValue(profile.learning_preferences),
    1,
    "learningPreferences",
    "¿Cómo prefieres aprender?",
    "section-cognitive",
  );

  // Excluye sugerencias de módulos desactivados en el portal.
  // Con fallback de integración tampoco se sugiere conectar música.
  const visibleSuggestions = suggestions.filter((s) => {
    const mod = SUGGESTION_SECTION_TO_MODULE[s.sectionId] ?? s.sectionId;
    if (hidden.has(mod)) return false;
    if (musicFallback && s.messageKey === "musicConnect") return false;
    return true;
  });

  // Sort by weight (descending)
  const sortedSuggestions = visibleSuggestions.sort((a, b) => b.weight - a.weight);

  // Filter to keep only one suggestion per sectionId
  const seenSections = new Set<string>();
  const finalSuggestions: Suggestion[] = [];

  for (const suggestion of sortedSuggestions) {
    if (!seenSections.has(suggestion.sectionId)) {
      finalSuggestions.push(suggestion);
      seenSections.add(suggestion.sectionId);
      if (finalSuggestions.length >= 5) break;
    }
  }

  return finalSuggestions;
};

// Placeholder for future compatibility logic
export const calculateCompatibility = (userA: any, userB: any): number => {
  const score = 0;
  const maxScore = 20;

  // Simple matches
  if (userA.relationship_goals && userB.relationship_goals) {
    // Logic would go here
  }

  return Math.round((score / maxScore) * 100);
};
