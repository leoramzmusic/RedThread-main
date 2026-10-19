import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  CARE_DIMENSIONS,
  CARE_DIMENSION_KEYS,
  type CareDimensionKey,
} from "../../constants/careDimensions";
import {
  createPreference,
  deletePreference,
  listPreferences,
  preferenceErrorMessage,
  updatePreference,
  type CarePreference,
} from "../../services/carePreferencesService";

interface RowState {
  preference: CarePreference | null;
  score: number;
  saving: boolean;
  error: string | null;
}

type RowsState = Record<CareDimensionKey, RowState>;

const emptyRows = (): RowsState =>
  CARE_DIMENSIONS.reduce((acc, dimension) => {
    acc[dimension.key] = {
      preference: null,
      score: 5,
      saving: false,
      error: null,
    };
    return acc;
  }, {} as RowsState);

const rowsFrom = (items: CarePreference[]): RowsState => {
  const rows = emptyRows();
  for (const item of items) {
    if (rows[item.dimension]) {
      rows[item.dimension] = {
        ...rows[item.dimension],
        preference: item,
        score: Math.round(item.score / 10),
      };
    }
  }
  return rows;
};

const pendingKeysFrom = (rows: RowsState): CareDimensionKey[] =>
  CARE_DIMENSION_KEYS.filter((key) => !rows[key].preference);

interface CarePreferenceSurveyProps {
  onPendingChange?: (pending: number) => void;
}

export default function CarePreferenceSurvey({
  onPendingChange,
}: CarePreferenceSurveyProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rows, setRows] = useState<RowsState>(emptyRows);
  const [order, setOrder] = useState<CareDimensionKey[]>([
    ...CARE_DIMENSION_KEYS,
  ]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await listPreferences();
        if (cancelled) return;
        const loaded = rowsFrom(items);
        setRows(loaded);
        const firstPending = CARE_DIMENSION_KEYS.findIndex(
          (key) => !loaded[key].preference,
        );
        setStep(
          firstPending === -1 ? CARE_DIMENSION_KEYS.length : firstPending,
        );
      } catch (error) {
        if (!cancelled) setLoadError(preferenceErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const patchRow = (key: CareDimensionKey, patch: Partial<RowState>) => {
    setRows((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const handleCommit = async (key: CareDimensionKey, score: number) => {
    const row = rows[key];
    patchRow(key, { score, saving: true, error: null });
    try {
      const saved = row.preference
        ? await updatePreference(row.preference.id, { score: score * 10 })
        : await createPreference({ dimension: key, score: score * 10 });
      patchRow(key, {
        preference: saved,
        score: Math.round(saved.score / 10),
        saving: false,
        error: null,
      });
    } catch (error) {
      patchRow(key, {
        saving: false,
        error: preferenceErrorMessage(error),
      });
    }
  };

  const handleDelete = async (key: CareDimensionKey) => {
    const row = rows[key];
    if (!row.preference) return;
    patchRow(key, { saving: true, error: null });
    try {
      await deletePreference(row.preference.id);
      patchRow(key, {
        preference: null,
        score: 5,
        saving: false,
        error: null,
      });
    } catch (error) {
      patchRow(key, {
        saving: false,
        error: preferenceErrorMessage(error),
      });
    }
  };

  const goNext = () => setStep((value) => Math.min(value + 1, order.length));
  const goPrev = () => setStep((value) => Math.max(value - 1, 0));
  const reviewPending = () => {
    setOrder(pendingKeysFrom(rows));
    setStep(0);
  };
  const reviewAll = () => {
    setOrder([...CARE_DIMENSION_KEYS]);
    setStep(0);
  };

  const pendingCount = pendingKeysFrom(rows).length;
  const finished = step >= order.length;
  const current = finished ? null : order[step];
  const currentRow = current ? rows[current] : null;
  const currentDimension = current
    ? CARE_DIMENSIONS.find((dimension) => dimension.key === current)
    : null;

  useEffect(() => {
    if (loading) return;
    onPendingChange?.(pendingCount);
  }, [loading, onPendingChange, pendingCount]);

  return (
    <Box data-testid="care-preferences">
      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      )}
      {loading ? (
        <Box
          sx={{ display: "flex", justifyContent: "center", py: 3 }}
          data-testid="preferences-loading"
        >
          <CircularProgress size={24} />
        </Box>
      ) : finished && pendingCount > 0 ? (
        <Stack
          data-testid="survey-end"
          spacing={2}
          sx={{ alignItems: "flex-start", py: 1 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {pendingCount === 1
              ? "Te queda 1 pregunta sin responder."
              : `Te quedan ${pendingCount} preguntas sin responder.`}
          </Typography>
          <Button
            data-testid="survey-end-pending"
            variant="contained"
            onClick={reviewPending}
          >
            Responder pendientes
          </Button>
        </Stack>
      ) : finished ? (
        <Stack data-testid="survey-end-complete" spacing={2} sx={{ py: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Encuesta completa
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
            Gracias por compartir lo que te importa.
          </Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
            {CARE_DIMENSIONS.map((dimension) => (
              <Chip
                key={dimension.key}
                data-testid={`survey-summary-${dimension.key}`}
                label={`${dimension.surveyLabel ?? dimension.label} · ${
                  rows[dimension.key].score
                }/10`}
                size="small"
                sx={{ bgcolor: dimension.color, color: "#fff" }}
              />
            ))}
          </Stack>
          <Button
            data-testid="survey-restart"
            variant="outlined"
            onClick={reviewAll}
            sx={{ color: "#FFFFFF", alignSelf: "flex-start" }}
          >
            Revisar respuestas
          </Button>
        </Stack>
      ) : (
        current &&
        currentRow &&
        currentDimension && (
          <Stack spacing={1.5}>
            <Box>
              <Typography
                variant="caption"
                data-testid="survey-progress"
                sx={{ color: "rgba(255,255,255,0.7)" }}
              >
                Pregunta {step + 1} de {order.length}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={((step + 1) / order.length) * 100}
                sx={{ mt: 0.5, borderRadius: "4px" }}
              />
            </Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Chip
                label={currentDimension.chip}
                size="small"
                sx={{ bgcolor: currentDimension.color, color: "#fff" }}
              />
              <Typography
                variant="subtitle1"
                sx={{ flexGrow: 1, fontWeight: 700 }}
              >
                {currentDimension.surveyLabel ?? currentDimension.label}
              </Typography>
              <Typography
                variant="caption"
                data-testid={`preference-status-${currentDimension.key}`}
                sx={{ color: "rgba(255,255,255,0.7)" }}
              >
                {currentRow.preference ? "Guardado" : "Sin guardar"}
              </Typography>
              {currentRow.saving && (
                <CircularProgress
                  size={14}
                  data-testid={`preference-saving-${currentDimension.key}`}
                />
              )}
              <Tooltip title="Quitar preferencia">
                <span>
                  <IconButton
                    data-testid={`preference-delete-${currentDimension.key}`}
                    size="small"
                    color="error"
                    disabled={!currentRow.preference || currentRow.saving}
                    onClick={() => handleDelete(currentDimension.key)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
            <Typography variant="body1">{currentDimension.question}</Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.65)" }}
            >
              Ejemplo: {currentDimension.example}
            </Typography>
            <Slider
              data-testid={`preference-slider-${currentDimension.key}`}
              value={currentRow.score}
              min={0}
              max={10}
              step={1}
              marks={[
                { value: 0, label: "0" },
                { value: 5, label: "5" },
                { value: 10, label: "10" },
              ]}
              valueLabelDisplay="auto"
              onChange={(_, value) =>
                patchRow(currentDimension.key, { score: value as number })
              }
              onChangeCommitted={(_, value) =>
                handleCommit(currentDimension.key, value as number)
              }
              disabled={currentRow.saving}
              sx={{
                color: currentDimension.color,
                "& .MuiSlider-markLabel": {
                  color: "rgba(255,255,255,0.5)",
                },
              }}
            />
            {currentRow.error && (
              <Typography
                variant="caption"
                color="error"
                data-testid={`preference-error-${currentDimension.key}`}
              >
                {currentRow.error}
              </Typography>
            )}
            <Stack
              direction="row"
              spacing={1}
              sx={{ justifyContent: "flex-end" }}
            >
              <Button
                data-testid="survey-prev"
                onClick={goPrev}
                disabled={step === 0 || currentRow.saving}
                sx={{ color: "#FFFFFF" }}
              >
                Atrás
              </Button>
              <Button
                data-testid="survey-skip"
                onClick={goNext}
                disabled={currentRow.saving}
                sx={{ color: "rgba(255,255,255,0.7)" }}
              >
                Saltar
              </Button>
              <Button
                data-testid="survey-next"
                variant="contained"
                onClick={goNext}
                disabled={!currentRow.preference || currentRow.saving}
              >
                {step === order.length - 1 ? "Terminar" : "Siguiente"}
              </Button>
            </Stack>
          </Stack>
        )
      )}
    </Box>
  );
}
