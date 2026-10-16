import { Paper, Stack, TextField, Typography } from "@mui/material";

export interface CareThresholdsPanelProps {
  minCompatibility: number;
  matchCritical: number;
  onMinChange: (value: number) => void;
  onMatchChange: (value: number) => void;
}

/** Configurable thresholds: the ranking gate and the UI critical-match badge. */
export default function CareThresholdsPanel({
  minCompatibility,
  matchCritical,
  onMinChange,
  onMatchChange,
}: CareThresholdsPanelProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Umbrales
      </Typography>
      <Stack spacing={3}>
        <TextField
          data-testid="threshold-min"
          label="min_compatibility"
          type="number"
          size="small"
          fullWidth
          value={minCompatibility}
          onChange={(event) => onMinChange(Number(event.target.value))}
          helperText="Gate mínimo para rankear candidatos (0 = sin efecto)."
        />
        <TextField
          data-testid="threshold-match"
          label="match_critical"
          type="number"
          size="small"
          fullWidth
          value={matchCritical}
          onChange={(event) => onMatchChange(Number(event.target.value))}
          helperText="Badge de match crítico (default 0.15)."
        />
      </Stack>
    </Paper>
  );
}
