import { Box, Paper, Slider, Stack, Typography } from "@mui/material";
import {
  CARE_DIMENSIONS,
  type CareDimensionKey,
} from "../../constants/careDimensions";
import type { FormulaBlocks } from "../../services/careFormulaService";
import { percentOf } from "../../utils/careCriteriaModel";
import { EXAMPLE_FEATURES } from "../../utils/careEquationModel";

export interface CareEquationBlocksProps {
  /** Editable weights, stored as fractions (0–1). */
  blocks: FormulaBlocks;
  /** Row to emphasize (from the criteria draft handoff). */
  focus?: CareDimensionKey | null;
  onSliderChange: (key: CareDimensionKey, percent: number) => void;
}

/**
 * The 7 canonical blocks (matrix M) with a chip, a raw 0–100% slider and an
 * illustrative feature value fᵢ. Emits intent only — no state, no network.
 */
export default function CareEquationBlocks({
  blocks,
  focus = null,
  onSliderChange,
}: CareEquationBlocksProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Bloques (Matriz M)
      </Typography>
      <Stack spacing={2.5}>
        {CARE_DIMENSIONS.map((dim) => {
          const percent = percentOf(blocks[dim.key]);
          return (
            <Box
              key={dim.key}
              data-testid={`eq-block-${dim.key}`}
              data-focus={focus === dim.key ? "true" : "false"}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <Box
                    data-testid={`eq-chip-${dim.key}`}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      color: "#fff",
                      bgcolor: dim.color,
                    }}
                  >
                    {dim.chip}
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {dim.label}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <Typography
                    variant="caption"
                    data-testid={`eq-example-${dim.key}`}
                    sx={{ color: "text.secondary" }}
                  >
                    fᵢ = {EXAMPLE_FEATURES[dim.key].toFixed(2)}
                  </Typography>
                  <Typography
                    variant="body2"
                    data-testid={`eq-percent-${dim.key}`}
                    sx={{ minWidth: 40, fontWeight: 800 }}
                  >
                    {percent}%
                  </Typography>
                </Stack>
              </Box>
              <Slider
                data-testid={`eq-slider-${dim.key}`}
                value={percent}
                min={0}
                max={100}
                step={1}
                size="small"
                onChange={(_, value) =>
                  onSliderChange(
                    dim.key,
                    Array.isArray(value) ? value[0] : value,
                  )
                }
              />
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}
