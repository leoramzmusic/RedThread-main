import { Chip, Paper, Stack, Typography } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import {
  CARE_DIMENSIONS,
  type CareDimensionKey,
} from "../../constants/careDimensions";
import type { FormulaBlocks } from "../../services/careFormulaService";
import { percentOf } from "../../utils/careCriteriaModel";

export interface CareEquationHeaderProps {
  /** Active weights, stored as fractions (0–1). */
  blocks: FormulaBlocks;
  /** Dimension row to emphasize (from the criteria draft handoff). */
  focus?: CareDimensionKey | null;
}

/**
 * The stylized CARE equation with α–η chips synced to the active weights,
 * plus the read-only safety pre-filters that run BEFORE the equation.
 */
export default function CareEquationHeader({
  blocks,
  focus = null,
}: CareEquationHeaderProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        Ecuación canónica
      </Typography>
      <Typography
        data-testid="equation-formula"
        sx={{
          fontFamily: "monospace",
          fontSize: "1.5rem",
          fontWeight: 800,
          mt: 0.5,
          mb: 2,
        }}
      >
        CARE_score = Σ wᵢ·fᵢ + χ(t)
      </Typography>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}>
        {CARE_DIMENSIONS.map((dim) => (
          <Chip
            key={dim.key}
            data-testid={`header-chip-${dim.key}`}
            data-focus={focus === dim.key ? "true" : "false"}
            label={`${dim.chip} ${percentOf(blocks[dim.key])}%`}
            size="small"
            sx={{
              bgcolor: dim.color,
              color: "#fff",
              fontWeight: 700,
              ...(focus === dim.key
                ? { outline: "2px solid", outlineColor: "text.primary" }
                : {}),
            }}
          />
        ))}
      </Stack>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}
      >
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Pre-filtros (read-only):
        </Typography>
        <Chip
          data-testid="prefilter-attraction"
          icon={<LockIcon />}
          label="Atracción mutua"
          size="small"
          variant="outlined"
        />
        <Chip
          data-testid="prefilter-identity"
          icon={<LockIcon />}
          label="Identidad"
          size="small"
          variant="outlined"
        />
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          → ANTES de la ecuación
        </Typography>
      </Stack>
    </Paper>
  );
}
