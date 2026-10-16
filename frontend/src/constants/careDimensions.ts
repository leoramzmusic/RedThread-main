/**
 * Canonical CARE dimensions (the compatibility matrix M).
 * Single source of truth for the 7 keys, their Spanish labels, Dirac chips
 * (α–η) and colors. Must mirror backend/src/care/formula/service.py
 * CANONICAL_BLOCKS.
 */

export interface CareDimension {
  /** Canonical backend key (block key in the formula payload / breakdown). */
  key: string;
  /** Spanish display label (admin is hardcoded Spanish; see spec decision 11). */
  label: string;
  /** Dirac chip, α through η. */
  chip: string;
  /** Hex color used for chips, bars and canvas orbits. */
  color: string;
}

export const CARE_DIMENSIONS: CareDimension[] = [
  { key: "values", label: "Valores", chip: "α", color: "#ff4d4f" },
  {
    key: "relationship_goals",
    label: "Metas de relación",
    chip: "β",
    color: "#1890ff",
  },
  {
    key: "neurodiversity",
    label: "Neurodiversidad",
    chip: "γ",
    color: "#52c41a",
  },
  {
    key: "responsiveness",
    label: "Responsiveness",
    chip: "δ",
    color: "#faad14",
  },
  { key: "music", label: "Música", chip: "ε", color: "#722ed1" },
  {
    key: "love_language",
    label: "Lenguaje del amor",
    chip: "ζ",
    color: "#eb2f96",
  },
  {
    key: "communication_style",
    label: "Comunicación",
    chip: "η",
    color: "#13c2c2",
  },
];

export const CARE_DIMENSION_KEYS: string[] = CARE_DIMENSIONS.map((d) => d.key);

export const CARE_DIMENSION_BY_KEY: Record<string, CareDimension> =
  CARE_DIMENSIONS.reduce<Record<string, CareDimension>>((acc, d) => {
    acc[d.key] = d;
    return acc;
  }, {});

/** Canonical seed-v1 weights (must match the backend defaults). */
export const CANONICAL_BLOCK_WEIGHTS: Record<string, number> = {
  values: 0.36,
  relationship_goals: 0.18,
  neurodiversity: 0.15,
  responsiveness: 0.1,
  music: 0.11,
  love_language: 0.06,
  communication_style: 0.04,
};

export const CANONICAL_BLOCK_SUM = 1.0;
