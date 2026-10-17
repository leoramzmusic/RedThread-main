import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import {
  CARE_DIMENSIONS,
  type CareDimensionKey,
} from "../../constants/careDimensions";
import type { FormulaBlocks } from "../../services/careFormulaService";
import { percentOf } from "../../utils/careCriteriaModel";
import { useAppTheme } from "../../context/ThemeContext";

export interface CareEquationHeaderProps {
  /** Active weights, stored as fractions (0–1). */
  blocks: FormulaBlocks;
  /** Dimension row to emphasize (from the criteria draft handoff). */
  focus?: CareDimensionKey | null;
  /** Transient dimension to tint the wᵢ·fᵢ term (slider change); wins over focus. */
  glow?: CareDimensionKey | null;
}

/**
 * The stylized CARE equation with α–η chips synced to the active weights,
 * plus the read-only safety pre-filters that run BEFORE the equation.
 */
export default function CareEquationHeader({
  blocks,
  focus = null,
  glow = null,
}: CareEquationHeaderProps) {
  const { mode } = useAppTheme();
  const isDark = mode === "dark";
  const highlightKey = glow ?? focus;
  const highlightDim =
    CARE_DIMENSIONS.find((dim) => dim.key === highlightKey) ?? null;
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        mb: 3,
        textAlign: "center",
        bgcolor: isDark ? "rgba(30,30,30,0.65)" : "background.paper",
        boxShadow: isDark
          ? "0 4px 16px rgba(0,0,0,0.4)"
          : "0 4px 16px rgba(26,27,30,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
        transition: "box-shadow 0.2s ease",
      }}
    >
      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        Ecuación canónica
      </Typography>
      <Typography
        data-testid="equation-formula"
        sx={{
          fontFamily: "monospace",
          fontSize: { xs: "1.8rem", md: "2.5rem" },
          fontWeight: 800,
          mt: 1,
          mb: 2,
          color: isDark ? "#FFFFFF" : "#222222",
          letterSpacing: "-0.02em",
        }}
      >
        {"CARE_score = Σ "}
        <Box
          component="span"
          data-testid="formula-weights"
          data-highlight={highlightKey ?? ""}
          sx={{
            color: highlightDim ? highlightDim.color : "inherit",
            textShadow: highlightDim
              ? `0 0 14px ${highlightDim.color}`
              : "none",
            transition: "color 200ms ease, text-shadow 200ms ease",
          }}
        >
          wᵢ·fᵢ
        </Box>
        {" + χ(t)"}
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
