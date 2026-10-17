import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PsychologyIcon from "@mui/icons-material/Psychology";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DownloadIcon from "@mui/icons-material/Download";
import AdminLayout from "../../../components/layout/AdminLayout";
import UserSearchAutocomplete, {
  type SearchUser,
} from "../../../components/common/UserSearchAutocomplete";
import { useAppTheme } from "../../../context/ThemeContext";
import CareScoreBreakdown from "../../../components/care/CareScoreBreakdown";
import CareNarrativeTrio from "../../../components/care/CareNarrativeTrio";
import {
  getActiveFormula,
  previewFormula,
  type CareFormula,
  type FormulaPayload,
  type NarrativeResult,
  type PreviewResult,
} from "../../../services/careFormulaService";
import {
  TONE_OPTIONS,
  previewErrorMessage,
} from "../../../utils/careEquationModel";
import {
  buildReport,
  computeContributions,
  downloadJson,
  reportFilename,
  resolveBand,
} from "../../../utils/careInterpreterModel";

const toPayload = (formula: CareFormula): FormulaPayload => ({
  version: formula.version,
  blocks: formula.blocks,
  chaos_factor: formula.chaos_factor,
  chaos_seed: formula.chaos_seed,
  min_compatibility: formula.min_compatibility,
  match_critical: formula.match_critical,
});

export default function CareInterpreterPage() {
  const { mode } = useAppTheme();
  const isDark = mode === "dark";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formula, setFormula] = useState<CareFormula | null>(null);
  const [userA, setUserA] = useState<SearchUser | null>(null);
  const [userB, setUserB] = useState<SearchUser | null>(null);
  const [tone, setTone] = useState<NarrativeResult["tone"]>("directo");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const active = await getActiveFormula();
        if (!cancelled) setFormula(active);
      } catch {
        if (!cancelled) setError("No se pudo cargar la fórmula activa.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    formula && previewResult
      ? computeContributions(formula.blocks, previewResult.proposed.breakdown)
      : [];
  const compatibilityLabel = previewResult
    ? resolveBand(
        previewResult.proposed.breakdown.compatibility_label,
        previewResult.proposed.score,
      )
    : "";

  const handlePreview = async () => {
    if (!formula || !userA || !userB || userA.id === userB.id) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const result = await previewFormula({
        formula: toPayload(formula),
        user_a_id: userA.id,
        user_b_id: userB.id,
        tone,
      });
      setPreviewResult(result);
    } catch (err) {
      setPreviewError(previewErrorMessage(err));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExport = () => {
    if (!formula || !previewResult || !userA || !userB) return;
    const generatedAt = new Date().toISOString();
    const report = buildReport(
      {
        userA: userA.id,
        userB: userB.id,
        formulaVersion: formula.version,
        breakdown: rows,
        chi: previewResult.proposed.chi,
        narrative: previewResult.narrative,
        tone,
        compatibilityLabel,
      },
      generatedAt,
    );
    downloadJson(reportFilename(userA.id, userB.id, generatedAt), report);
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
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
                  CARE Interpreter
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Explicabilidad del score: fᵢ, wᵢ y contribución wᵢ·fᵢ por
                  dimensión.
                </Typography>
              </Box>
            </Box>
            <Button
              data-testid="interpreter-export"
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={!previewResult}
            >
              Exportar Reporte
            </Button>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              data-testid="interpreter-error"
            >
              {error}
            </Alert>
          )}

          {loading ? (
            <Box
              sx={{ display: "flex", justifyContent: "center", py: 8 }}
              data-testid="interpreter-loading"
            >
              <CircularProgress />
            </Box>
          ) : formula ? (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, mb: 2 }}
                  >
                    Par a evaluar
                  </Typography>
                  <Stack spacing={2}>
                    <UserSearchAutocomplete
                      label="Usuario A"
                      placeholder="Buscar por nombre, alias o correo"
                      value={userA}
                      onChange={setUserA}
                      excludeId={userB?.id ?? null}
                      isDark={isDark}
                    />
                    <UserSearchAutocomplete
                      label="Usuario B"
                      placeholder="Buscar por nombre, alias o correo"
                      value={userB}
                      onChange={setUserB}
                      excludeId={userA?.id ?? null}
                      isDark={isDark}
                    />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        Tono narrativo
                      </Typography>
                      <Stack
                        direction="row"
                        sx={{ flexWrap: "wrap", gap: 1, mt: 0.5 }}
                      >
                        {TONE_OPTIONS.map((option) => (
                          <Chip
                            key={option.value}
                            data-testid={`interpreter-tone-${option.value}`}
                            label={option.label}
                            size="small"
                            color={
                              tone === option.value ? "primary" : "default"
                            }
                            variant={
                              tone === option.value ? "filled" : "outlined"
                            }
                            onClick={() =>
                              setTone(option.value as NarrativeResult["tone"])
                            }
                          />
                        ))}
                      </Stack>
                    </Box>
                    <Button
                      data-testid="interpreter-run"
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={handlePreview}
                      disabled={
                        previewLoading ||
                        !userA ||
                        !userB ||
                        userA.id === userB.id
                      }
                    >
                      {previewLoading ? "Evaluando..." : "Interpretar par"}
                    </Button>
                    {previewLoading && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          py: 1,
                        }}
                        data-testid="interpreter-preview-loading"
                      >
                        <CircularProgress size={24} />
                      </Box>
                    )}
                    {previewError && (
                      <Alert
                        severity="error"
                        data-testid="interpreter-preview-error"
                      >
                        {previewError}
                      </Alert>
                    )}
                  </Stack>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 8 }}>
                {previewResult ? (
                  <Stack spacing={3}>
                    <CareScoreBreakdown rows={rows} />
                    <CareNarrativeTrio
                      evaluation={previewResult.proposed}
                      compatibilityLabel={compatibilityLabel}
                      narrative={previewResult.narrative}
                    />
                  </Stack>
                ) : (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 4,
                      minHeight: 400,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    data-testid="interpreter-empty"
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Selecciona dos usuarios y ejecuta para ver el desglose y
                      la narrativa.
                    </Typography>
                  </Paper>
                )}
              </Grid>
            </Grid>
          ) : null}
        </Box>
      </Container>
    </AdminLayout>
  );
}
