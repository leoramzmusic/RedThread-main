import { Box, Stack, Typography } from "@mui/material";
import { CARE_DIMENSIONS } from "../../constants/careDimensions";

export interface CareBreakdownBarsProps {
  /** Dimension scores. Keys not present render as 0. */
  breakdown?: Partial<Record<string, number>> | null;
  /** Input scale: "0-100" (default, discovery payload) or "0-1" (raw formula). */
  valueRange?: "0-100" | "0-1";
  /** Show the Dirac chip (α–η) before each label. */
  showChips?: boolean;
}

/**
 * Renders the 7 canonical CARE dimensions as labeled, colored progress bars.
 * Shared by ProfileOverlay and CompatibilityTechnicalPanel so the rendered
 * keys/colors/labels can never drift from the canonical taxonomy.
 */
export default function CareBreakdownBars({
  breakdown,
  valueRange = "0-100",
  showChips = true,
}: CareBreakdownBarsProps) {
  const toDisplay = (raw: number | undefined): number => {
    const value = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
    const scaled = valueRange === "0-1" ? value * 100 : value;
    return Math.max(0, Math.min(100, Math.round(scaled)));
  };

  return (
    <Stack spacing={2}>
      {CARE_DIMENSIONS.map((dim) => {
        const display = toDisplay(breakdown?.[dim.key]);
        return (
          <Box key={dim.key}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 0.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {showChips && (
                  <Box
                    data-testid={`care-chip-${dim.key}`}
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: "#fff",
                      bgcolor: dim.color,
                    }}
                  >
                    {dim.chip}
                  </Box>
                )}
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {dim.label}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                data-testid={`care-bar-${dim.key}`}
                data-value={display}
                sx={{ fontWeight: 700 }}
              >
                {display}%
              </Typography>
            </Box>
            <Box
              sx={{
                width: "100%",
                height: 6,
                bgcolor: "rgba(255,255,255,0.1)",
                borderRadius: "3px",
              }}
            >
              <Box
                sx={{
                  width: `${display}%`,
                  height: "100%",
                  bgcolor: dim.color,
                  borderRadius: "3px",
                  transition: "width 1s ease-out",
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}
