import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  CARE_DIMENSIONS,
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
      score: 50,
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
        score: item.score,
      };
    }
  }
  return rows;
};

export default function CarePreferenceCards() {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rows, setRows] = useState<RowsState>(emptyRows);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await listPreferences();
        if (!cancelled) setRows(rowsFrom(items));
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
        ? await updatePreference(row.preference.id, { score })
        : await createPreference({ dimension: key, score });
      patchRow(key, {
        preference: saved,
        score: saved.score,
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
        score: 50,
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

  return (
    <Card
      data-testid="care-preferences"
      sx={{
        bgcolor: "#1F1F1F",
        color: "#FFFFFF",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "8px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            ¿Qué te importa más al elegir alguien?
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "rgba(255,255,255,0.65)" }}
          >
            Desliza de 0 a 100 para darle importancia a cada dimensión CARE.
          </Typography>
        </Box>
        <IconButton
          data-testid="preferences-toggle"
          aria-label={
            expanded ? "Contraer preferencias" : "Expandir preferencias"
          }
          onClick={() => setExpanded((value) => !value)}
          sx={{ color: "#FFFFFF" }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <CardContent sx={{ pt: 0 }}>
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
          ) : (
            <Stack spacing={2}>
              {CARE_DIMENSIONS.map((dimension) => {
                const row = rows[dimension.key];
                return (
                  <Box key={dimension.key}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center" }}
                    >
                      <Chip
                        label={dimension.chip}
                        size="small"
                        sx={{ bgcolor: dimension.color, color: "#fff" }}
                      />
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {dimension.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        data-testid={`preference-status-${dimension.key}`}
                        sx={{ color: "rgba(255,255,255,0.7)" }}
                      >
                        {row.preference ? "Guardado" : "Sin guardar"}
                      </Typography>
                      {row.saving && (
                        <CircularProgress
                          size={14}
                          data-testid={`preference-saving-${dimension.key}`}
                        />
                      )}
                      <Tooltip title="Quitar preferencia">
                        <span>
                          <IconButton
                            data-testid={`preference-delete-${dimension.key}`}
                            size="small"
                            color="error"
                            disabled={!row.preference || row.saving}
                            onClick={() => handleDelete(dimension.key)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                    <Slider
                      data-testid={`preference-slider-${dimension.key}`}
                      value={row.score}
                      min={0}
                      max={100}
                      step={5}
                      marks={[
                        { value: 0, label: "0" },
                        { value: 50, label: "50" },
                        { value: 100, label: "100" },
                      ]}
                      onChange={(_, value) =>
                        patchRow(dimension.key, { score: value as number })
                      }
                      onChangeCommitted={(_, value) =>
                        handleCommit(dimension.key, value as number)
                      }
                      disabled={row.saving}
                      sx={{
                        color: dimension.color,
                        "& .MuiSlider-markLabel": {
                          color: "rgba(255,255,255,0.5)",
                        },
                      }}
                    />
                    {row.error && (
                      <Typography
                        variant="caption"
                        color="error"
                        data-testid={`preference-error-${dimension.key}`}
                      >
                        {row.error}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
}
