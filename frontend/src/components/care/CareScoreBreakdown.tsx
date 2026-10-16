import { Box, Paper, Typography } from "@mui/material";
import type { ContributionRow } from "../../utils/careInterpreterModel";

export interface CareScoreBreakdownProps {
  /** One row per canonical dimension (fᵢ, wᵢ, wᵢ·fᵢ). */
  rows: ContributionRow[];
}

const format = (value: number): string =>
  Number.isFinite(value) ? value.toFixed(3) : "0.000";

/**
 * The real Score Breakdown: each row shows the feature score fᵢ, the active
 * weight wᵢ and the contribution wᵢ·fᵢ, with a bar scaled to the largest
 * contribution. `CareBreakdownBars` renders single-value bars only, so the
 * three-value row is a dedicated component.
 */
export default function CareScoreBreakdown({ rows }: CareScoreBreakdownProps) {
  const maxContribution = Math.max(
    ...rows.map((row) => row.contribution),
    0.0001,
  );
  return (
    <Paper variant="outlined" sx={{ p: 3 }} data-testid="score-breakdown">
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Score Breakdown
      </Typography>
      {rows.map((row) => {
        const width = Math.max(
          0,
          Math.min(100, Math.round((row.contribution / maxContribution) * 100)),
        );
        return (
          <Box
            key={row.key}
            data-testid={`breakdown-row-${row.key}`}
            sx={{ mb: 2 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 0.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
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
                    bgcolor: row.color,
                  }}
                >
                  {row.chip}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {row.label}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                data-testid={`breakdown-contribution-${row.key}`}
                sx={{ fontWeight: 800, color: row.color }}
              >
                wᵢ·fᵢ {format(row.contribution)}
              </Typography>
            </Box>
            <Box
              data-testid={`breakdown-bar-${row.key}`}
              data-value={width}
              sx={{
                width: "100%",
                height: 6,
                bgcolor: "rgba(0,0,0,0.08)",
                borderRadius: "3px",
                mb: 0.5,
              }}
            >
              <Box
                sx={{
                  width: `${width}%`,
                  height: "100%",
                  bgcolor: row.color,
                  borderRadius: "3px",
                }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Typography
                variant="caption"
                data-testid={`breakdown-fi-${row.key}`}
                sx={{ color: "text.secondary" }}
              >
                fᵢ {format(row.f)}
              </Typography>
              <Typography
                variant="caption"
                data-testid={`breakdown-wi-${row.key}`}
                sx={{ color: "text.secondary" }}
              >
                wᵢ {format(row.w)}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Paper>
  );
}
