/**
 * Canonical CARE dimensions (the compatibility matrix M).
 * Single source of truth for the 7 keys, their Spanish labels, Dirac chips
 * (α–η) and colors. Must mirror backend/src/care/formula/service.py
 * CANONICAL_BLOCKS.
 */

/** Literal union of the 7 canonical CARE block keys. */
export type CareDimensionKey =
  | "values"
  | "relationship_goals"
  | "neurodiversity"
  | "responsiveness"
  | "music"
  | "love_language"
  | "communication_style";

export interface CareDimension {
  /** Canonical backend key (block key in the formula payload / breakdown). */
  key: CareDimensionKey;
  /** Spanish display label (admin is hardcoded Spanish; see spec decision 11). */
  label: string;
  /** Dirac chip, α through η. */
  chip: string;
  /** Hex color used for chips, bars and canvas orbits. */
  color: string;
  /** Plain-language question shown by the progressive survey wizard. */
  question: string;
  /** Concrete example shown under the survey question. */
  example: string;
  /** Friendlier survey-only title; falls back to `label` when unset. */
  surveyLabel?: string;
}

export const CARE_DIMENSIONS: CareDimension[] = [
  {
    key: "values",
    label: "Valores",
    chip: "α",
    color: "#ff4d4f",
    question:
      "¿Qué tanto te importa que alguien comparta tus principios o creencias?",
    example: "Que valore la honestidad, la familia o la justicia.",
  },
  {
    key: "relationship_goals",
    label: "Metas de relación",
    chip: "β",
    color: "#1890ff",
    question: "¿Qué tanto te importa que busque lo mismo que tú?",
    example: "Amistad, algo casual o una relación seria.",
  },
  {
    key: "neurodiversity",
    label: "Neurodiversidad",
    chip: "γ",
    color: "#52c41a",
    question:
      "¿Qué tanto valoras que entienda tu forma única de pensar o aprender?",
    example: "Que tenga paciencia con tus ritmos o tu sensibilidad.",
  },
  {
    key: "responsiveness",
    label: "Responsiveness",
    chip: "δ",
    color: "#faad14",
    surveyLabel: "Interés y respuesta",
    question: "¿Qué tanto te importa que responda rápido y con interés?",
    example: "Que conteste tus mensajes y te preste atención.",
  },
  {
    key: "music",
    label: "Música",
    chip: "ε",
    color: "#722ed1",
    question: "¿Qué tanto te importa compartir gustos musicales?",
    example: "Que compartan tu gusto por el rock o la música clásica.",
  },
  {
    key: "love_language",
    label: "Lenguaje del amor",
    chip: "ζ",
    color: "#eb2f96",
    question: "¿Qué tanto te importa cómo expresa su cariño?",
    example: "Con palabras, tiempo de calidad o pequeños detalles.",
  },
  {
    key: "communication_style",
    label: "Comunicación",
    chip: "η",
    color: "#13c2c2",
    question: "¿Qué tanto te importa su estilo al conversar?",
    example: "Que sea directo o prefiera mensajes más emocionales.",
  },
];

export const CARE_DIMENSION_KEYS: readonly CareDimensionKey[] =
  CARE_DIMENSIONS.map((d) => d.key);

export const CARE_DIMENSION_BY_KEY: Record<string, CareDimension> =
  CARE_DIMENSIONS.reduce<Record<string, CareDimension>>((acc, d) => {
    acc[d.key] = d;
    return acc;
  }, {});

/** Canonical seed-v1 weights (must match the backend defaults). */
export const CANONICAL_BLOCK_WEIGHTS: Record<CareDimensionKey, number> = {
  values: 0.36,
  relationship_goals: 0.18,
  neurodiversity: 0.15,
  responsiveness: 0.1,
  music: 0.11,
  love_language: 0.06,
  communication_style: 0.04,
};

export const CANONICAL_BLOCK_SUM = 1.0;
