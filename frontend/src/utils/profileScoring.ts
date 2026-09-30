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
// Calculate total possible score dynamically
export const MAX_PROFILE_SCORE = Object.values(PROFILE_WEIGHTS).reduce(
  (sum, weight) => sum + weight,
  0,
);

// Helper to check if field has meaningful value
const hasValue = (value: any): boolean => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object" && value !== null)
    return Object.keys(value).length > 0;
  return value !== null && value !== undefined && value !== "";
};

export const calculateProfileScore = (profile: any): number => {
  if (!profile) return 0;

  let score = 0;
  const missingFields: string[] = [];

  const check = (field: string, condition: boolean, weight: number) => {
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

  // Music (Spotify Free counts as complete — no full data available)
  check(
    "mi_himno",
    isSpotifyFree(profile) ||
      (hasValue(profile.mi_himno) &&
        (profile.mi_himno.connected ||
          profile.mi_himno.favorite_artists?.length > 0)),
    PROFILE_WEIGHTS.mi_himno,
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

export const calculateCompletionPercentage = (score: number): number => {
  return Math.min(Math.round((score / MAX_PROFILE_SCORE) * 100), 100);
};

export interface Suggestion {
  messageKey: string;
  message: string;
  sectionId: string;
  weight: number;
}

export const getProfileSuggestions = (profile: any): Suggestion[] => {
  if (!profile) return [];

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

  // Sort by weight (descending)
  const sortedSuggestions = suggestions.sort((a, b) => b.weight - a.weight);

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
