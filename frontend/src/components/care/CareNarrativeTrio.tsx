import { Box, Chip, Paper, Typography } from "@mui/material";
import type {
  EvaluationResult,
  NarrativeResult,
} from "../../services/careFormulaService";
import { formatDelta } from "../../utils/careEquationModel";

export interface CareNarrativeTrioProps {
  /** The `proposed` evaluation from `/formula/preview`. */
  evaluation: EvaluationResult;
  /** Backend band label (`proposed.breakdown.compatibility_label`). */
  compatibilityLabel: string;
  /** Backend narrative `{tone, text, label}`. */
  narrative: NarrativeResult;
}

/**
 * The narrative trio (χ, base, final ± saturated) plus the band label and the
 * backend-authored narrative. Purely presentational.
 */
export default function CareNarrativeTrio({
  evaluation,
  compatibilityLabel,
  narrative,
}: CareNarrativeTrioProps) {
  const saturated = evaluation.breakdown.saturated === true;
  return (
    <Paper variant="outlined" sx={{ p: 3, bgcolor: "grey.50" }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Trío narrativo
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 2 }}>
        <Box>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            χ (caos)
          </Typography>
          <Typography
            variant="h6"
            data-testid="trio-chi"
            sx={{ fontWeight: 800 }}
          >
            {formatDelta(evaluation.chi)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Base
          </Typography>
          <Typography
            variant="h6"
            data-testid="trio-base"
            sx={{ fontWeight: 800 }}
          >
            {evaluation.base.toFixed(3)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Final
          </Typography>
          <Typography
            variant="h6"
            data-testid="trio-final"
            sx={{ fontWeight: 800 }}
          >
            {evaluation.score.toFixed(3)}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            data-testid="trio-label"
            label={compatibilityLabel}
            color="primary"
            variant="outlined"
          />
          {saturated && (
            <Chip
              data-testid="trio-saturated"
              label="Saturado"
              color="warning"
              variant="outlined"
            />
          )}
        </Box>
      </Box>
      <Typography
        variant="caption"
        data-testid="narrative-tone"
        sx={{ color: "text.secondary", display: "block" }}
      >
        Tono: {narrative.tone}
      </Typography>
      <Chip
        data-testid="narrative-label"
        label={narrative.label}
        size="small"
        sx={{ my: 1 }}
      />
      <Typography
        variant="body2"
        data-testid="narrative-text"
        sx={{ fontStyle: "italic" }}
      >
        {narrative.text}
      </Typography>
    </Paper>
  );
}
