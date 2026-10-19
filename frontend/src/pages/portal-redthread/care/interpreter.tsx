import { useEffect, useState, type HTMLAttributes } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PsychologyIcon from "@mui/icons-material/Psychology";
import AdminLayout from "../../../components/layout/AdminLayout";
import CarePreferenceInsights from "../../../components/care/CarePreferenceInsights";
import { useAppTheme } from "../../../context/ThemeContext";
import {
  CARE_DIMENSION_BY_KEY,
  CARE_DIMENSIONS,
  type CareDimensionKey,
} from "../../../constants/careDimensions";
import {
  exportPreferences,
  getPreferenceInsights,
  listAllPreferences,
  type PreferenceExportResult,
  type PreferenceInsights,
  type PreferenceListResponse,
} from "../../../services/carePreferencesAdminService";
import { downloadJson } from "../../../utils/careInterpreterModel";

const dateLabel = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString("es-MX");
};

export default function CareInterpreterPage() {
  const { mode } = useAppTheme();
  const isDark = mode === "dark";
  const [insights, setInsights] = useState<PreferenceInsights | null>(null);
  const [dataset, setDataset] = useState<PreferenceListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimension, setDimension] = useState<CareDimensionKey | "">("");
  const [limit, setLimit] = useState(100);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] =
    useState<PreferenceExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [nextInsights, nextDataset] = await Promise.all([
          getPreferenceInsights(),
          listAllPreferences(dimension ? { limit, dimension } : { limit }),
        ]);
        if (!cancelled) {
          setInsights(nextInsights);
          setDataset(nextDataset);
        }
      } catch {
        if (!cancelled) setError("No se pudieron cargar las preferencias.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dimension, limit]);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const result = await exportPreferences();
      setExportResult(result);
      downloadJson(`preferences-${result.date}.json`, result);
    } catch {
      setExportError("No se pudo exportar el dataset.");
    } finally {
      setExporting(false);
    }
  };

  const rows = dataset?.items ?? [];

  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  bgcolor: "primary.main",
                  p: 1.5,
                  borderRadius: "8px",
                  display: "flex",
                  mr: 2,
                  boxShadow: "0 4px 12px rgba(255,77,79,0.3)",
                }}
              >
                <PsychologyIcon sx={{ fontSize: 32, color: "white" }} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}
                >
                  Preferencias & Insights
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: isDark ? "#CCCCCC" : "#666666" }}
                >
                  Repositorio de lo que los usuarios valoran y dataset para IA.
                </Typography>
              </Box>
            </Box>
            <Button
              data-testid="preferences-export"
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? "Exportando..." : "Exportar dataset"}
            </Button>
          </Box>

          {exportResult && (
            <Alert
              severity="success"
              sx={{ mb: 2, wordBreak: "break-all" }}
              data-testid="preferences-export-alert"
            >
              {exportResult.count} filas exportadas. JSON:{" "}
              {exportResult.files.json} · CSV: {exportResult.files.csv}
            </Alert>
          )}
          {exportError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              data-testid="preferences-export-error"
            >
              {exportError}
            </Alert>
          )}

          {loading ? (
            <Box
              sx={{ display: "flex", justifyContent: "center", py: 8 }}
              data-testid="preferences-loading"
            >
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" data-testid="preferences-error">
              {error}
            </Alert>
          ) : (
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2.5 }}>
                    <Typography variant="overline" color="text.secondary">
                      Registros
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 800 }}
                      data-testid="preferences-total"
                    >
                      {insights?.total_records ?? 0}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2.5 }}>
                    <Typography variant="overline" color="text.secondary">
                      Usuarios únicos
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 800 }}
                      data-testid="preferences-users"
                    >
                      {insights?.unique_users ?? 0}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <CarePreferenceInsights insights={insights} />

              <Paper variant="outlined">
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ p: 2, alignItems: { sm: "center" } }}
                >
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel id="preferences-dimension-label">
                      Dimensión
                    </InputLabel>
                    <Select
                      labelId="preferences-dimension-label"
                      label="Dimensión"
                      SelectDisplayProps={
                        {
                          "data-testid": "preferences-filter",
                        } as HTMLAttributes<HTMLDivElement>
                      }
                      value={dimension}
                      onChange={(event) =>
                        setDimension(
                          event.target.value as CareDimensionKey | "",
                        )
                      }
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {CARE_DIMENSIONS.map((item) => (
                        <MenuItem key={item.key} value={item.key}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel id="preferences-limit-label">Límite</InputLabel>
                    <Select
                      labelId="preferences-limit-label"
                      label="Límite"
                      data-testid="preferences-limit"
                      value={limit}
                      onChange={(event) => setLimit(Number(event.target.value))}
                    >
                      {[50, 100, 200].map((value) => (
                        <MenuItem key={value} value={value}>
                          {value}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Typography variant="body2" color="text.secondary">
                    {dataset?.total ?? 0} registros en total
                  </Typography>
                </Stack>

                {rows.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ p: 3 }}
                    data-testid="preferences-empty"
                  >
                    Aún no hay preferencias registradas.
                  </Typography>
                ) : (
                  <Table size="small" data-testid="preferences-dataset">
                    <TableHead>
                      <TableRow>
                        <TableCell>Usuario</TableCell>
                        <TableCell>Dimensión</TableCell>
                        <TableCell>Tag</TableCell>
                        <TableCell align="right">Score</TableCell>
                        <TableCell align="right">Actualizado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-testid={`preferences-row-${row.id}`}
                        >
                          <TableCell sx={{ fontFamily: "monospace" }}>
                            {row.user_id}
                          </TableCell>
                          <TableCell>
                            {CARE_DIMENSION_BY_KEY[row.dimension]?.label ??
                              row.dimension}
                          </TableCell>
                          <TableCell>{row.tag ?? "—"}</TableCell>
                          <TableCell align="right">{row.score}</TableCell>
                          <TableCell align="right">
                            {dateLabel(row.updated_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>
            </Stack>
          )}
        </Box>
      </Container>
    </AdminLayout>
  );
}
