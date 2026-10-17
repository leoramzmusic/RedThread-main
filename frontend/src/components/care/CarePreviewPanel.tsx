import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UserSearchAutocomplete, {
  type SearchUser,
} from "../common/UserSearchAutocomplete";
import { CARE_DIMENSIONS } from "../../constants/careDimensions";
import CareBreakdownBars from "../profile/CareBreakdownBars";
import type {
  NarrativeResult,
  PreviewResult,
} from "../../services/careFormulaService";
import { formatDelta } from "../../utils/careEquationModel";

const TONES: NarrativeResult["tone"][] = [
  "directo",
  "poetico",
  "ludico",
  "emocional",
  "curioso",
];
const TONE_LABELS: Record<NarrativeResult["tone"], string> = {
  directo: "Directo",
  poetico: "Poético",
  ludico: "Lúdico",
  emocional: "Emocional",
  curioso: "Curioso",
};

export interface CarePreviewPanelProps {
  userA: SearchUser | null;
  userB: SearchUser | null;
  tone: NarrativeResult["tone"];
  result: PreviewResult | null;
  isDark?: boolean;
  loading?: boolean;
  error?: string | null;
  onUserAChange: (user: SearchUser | null) => void;
  onUserBChange: (user: SearchUser | null) => void;
  onToneChange: (tone: NarrativeResult["tone"]) => void;
  onRun: () => void;
}

/** Read-only preview of the proposed formula against two real users. */
export default function CarePreviewPanel({
  userA,
  userB,
  tone,
  result,
  isDark = false,
  loading = false,
  error = null,
  onUserAChange,
  onUserBChange,
  onToneChange,
  onRun,
}: CarePreviewPanelProps) {
  const samePair = Boolean(userA && userB && userA.id === userB.id);
  const secondary = isDark ? "#CCCCCC" : "#666666";

  const bars = {
    values: result ? result.deltas.values : 0,
    relationship_goals: result ? result.deltas.relationship_goals : 0,
    neurodiversity: result ? result.deltas.neurodiversity : 0,
    responsiveness: result ? result.deltas.responsiveness : 0,
    music: result ? result.deltas.music : 0,
    love_language: result ? result.deltas.love_language : 0,
    communication_style: result ? result.deltas.communication_style : 0,
  } as Record<string, number>;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        bgcolor: isDark ? "#1E1E1E" : "#F5F5F5",
        borderColor: isDark ? "#333333" : "#CCCCCC",
        color: isDark ? "#FFFFFF" : "#222222",
        boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.4)" : undefined,
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Vista previa (Interpreter)
      </Typography>
      <Stack spacing={2}>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: secondary, fontWeight: 700, letterSpacing: "0.05em" }}
          >
            BUSCADOR DE USUARIO A/B
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mt: 1 }}
          >
            <UserSearchAutocomplete
              label="Usuario A"
              placeholder="Buscar por nombre, alias o correo"
              value={userA}
              onChange={onUserAChange}
              excludeId={userB?.id ?? null}
              isDark={isDark}
            />
            <UserSearchAutocomplete
              label="Usuario B"
              placeholder="Buscar por nombre, alias o correo"
              value={userB}
              onChange={onUserBChange}
              excludeId={userA?.id ?? null}
              isDark={isDark}
            />
          </Stack>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: secondary }}>
            Tono narrativo
          </Typography>
          <Stack
            data-testid="preview-tone"
            direction="row"
            spacing={1}
            sx={{ flexWrap: "wrap", gap: 1, mt: 0.5 }}
          >
            {TONES.map((option) => (
              <Chip
                key={option}
                data-testid={`tone-${option}`}
                label={TONE_LABELS[option]}
                size="small"
                color={tone === option ? "primary" : "default"}
                variant={tone === option ? "filled" : "outlined"}
                onClick={() => onToneChange(option)}
              />
            ))}
          </Stack>
        </Box>
        <Button
          data-testid="preview-run"
          variant="contained"
          startIcon={<VisibilityIcon />}
          onClick={onRun}
          disabled={loading || !userA || !userB || samePair}
        >
          {loading ? "Evaluando..." : "Interpretar par"}
        </Button>

        {loading && (
          <Box
            sx={{ display: "flex", justifyContent: "center", py: 2 }}
            data-testid="preview-loading"
          >
            <CircularProgress size={24} />
          </Box>
        )}
        {error && (
          <Alert severity="error" data-testid="preview-error">
            {error}
          </Alert>
        )}

        {result && !loading && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={3}>
              <Typography variant="body2" data-testid="preview-current">
                Actual: <strong>{result.current.score.toFixed(3)}</strong>
              </Typography>
              <Typography variant="body2" data-testid="preview-proposed">
                Propuesto: <strong>{result.proposed.score.toFixed(3)}</strong>
              </Typography>
            </Stack>
            {result.chi_proposed !== 0 && (
              <Alert severity="info" data-testid="preview-saturated">
                Caos χ aplicado: {formatDelta(result.chi_proposed)} (semilla
                reproducible).
              </Alert>
            )}
            <Box>
              {CARE_DIMENSIONS.map((dim) => (
                <Box
                  key={dim.key}
                  data-testid={`preview-delta-${dim.key}`}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 0.25,
                  }}
                >
                  <Typography variant="body2">{dim.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {formatDelta(bars[dim.key])}
                  </Typography>
                </Box>
              ))}
            </Box>
            <CareBreakdownBars breakdown={bars} valueRange="0-1" />
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: isDark ? "#2A2A2A" : "grey.50",
                borderColor: isDark ? "#333333" : undefined,
              }}
            >
              <Chip
                data-testid="preview-narrative-label"
                label={result.narrative.label}
                size="small"
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" data-testid="preview-narrative-text">
                {result.narrative.text}
              </Typography>
            </Paper>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
