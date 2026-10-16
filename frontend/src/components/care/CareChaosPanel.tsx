import {
  Box,
  Button,
  Paper,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import { CHAOS_MAX, formatDelta } from "../../utils/careEquationModel";

export interface CareChaosPanelProps {
  chaosFactor: number;
  chaosSeed: string | null;
  /** Δ from the last simulation (mean delta), or null. */
  deltaIndicator?: number | null;
  onChaosChange: (factor: number) => void;
  onSeedChange: (seed: string | null) => void;
  onGenerateSeed: () => void;
}

const formatFactor = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

/** χ(t): a controlled ±X% max deviation with an optional reproducible seed. */
export default function CareChaosPanel({
  chaosFactor,
  chaosSeed,
  deltaIndicator = null,
  onChaosChange,
  onSeedChange,
  onGenerateSeed,
}: CareChaosPanelProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        Caos χ(t)
      </Typography>
      <Typography
        variant="body2"
        data-testid="chaos-label"
        sx={{ fontWeight: 700 }}
      >
        ±{formatFactor(chaosFactor)}% desviación máxima
      </Typography>
      <Slider
        data-testid="chaos-slider"
        value={chaosFactor}
        min={0}
        max={CHAOS_MAX}
        step={0.5}
        size="small"
        onChange={(_, value) =>
          onChaosChange(Array.isArray(value) ? value[0] : value)
        }
      />
      <Stack spacing={2} sx={{ mt: 2 }}>
        <TextField
          data-testid="chaos-seed"
          label="Semilla (reproducible)"
          size="small"
          fullWidth
          value={chaosSeed ?? ""}
          onChange={(event) =>
            onSeedChange(event.target.value === "" ? null : event.target.value)
          }
          helperText="Vacío = aleatoria."
        />
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}
        >
          <Button
            data-testid="chaos-generate-seed"
            size="small"
            variant="outlined"
            startIcon={<CasinoIcon />}
            onClick={onGenerateSeed}
          >
            Generar semilla
          </Button>
          <Button size="small" onClick={() => onSeedChange(null)}>
            Limpiar
          </Button>
          <Box sx={{ ml: "auto" }}>
            <Typography
              variant="body2"
              data-testid="chaos-delta"
              sx={{ fontWeight: 700 }}
            >
              Δ {deltaIndicator === null ? "—" : formatDelta(deltaIndicator)}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
