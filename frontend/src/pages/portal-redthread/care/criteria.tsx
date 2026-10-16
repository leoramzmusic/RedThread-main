import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SaveIcon from "@mui/icons-material/Save";
import TuneIcon from "@mui/icons-material/Tune";
import WarningIcon from "@mui/icons-material/Warning";
import AdminLayout from "../../../components/layout/AdminLayout";
import CareCriteriaTable from "../../../components/care/CareCriteriaTable";
import type { CareDimensionKey } from "../../../constants/careDimensions";
import {
  getActiveFormula,
  normalizeFormulaBlocks,
  saveFormula,
  type CareFormula,
  type FormulaBlocks,
  type FormulaPayload,
} from "../../../services/careFormulaService";
import {
  computeDeltas,
  encodeEquationDraft,
  formatActiveVersion,
  formatChaos,
  isBalanced,
  saveErrorMessage,
  toggleLocked,
  totalPercent,
  withFraction,
} from "../../../utils/careCriteriaModel";

const EQUATION_PATH = "/portal-redthread/care/equation";

export default function CareCriteriaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [normalizing, setNormalizing] = useState(false);
  const [formula, setFormula] = useState<CareFormula | null>(null);
  const [blocks, setBlocks] = useState<FormulaBlocks>({});
  const [locked, setLocked] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [changelog, setChangelog] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const active = await getActiveFormula();
        if (cancelled) return;
        setFormula(active);
        setBlocks({ ...active.blocks });
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

  const balanced = isBalanced(blocks);

  const handleSliderChange = (key: CareDimensionKey, percent: number) => {
    if (locked.includes(key)) return;
    setBlocks((prev) => withFraction(prev, key, percent));
  };

  const handleSliderCommit = async (key: CareDimensionKey, percent: number) => {
    setError(null);
    try {
      const { blocks: normalized } = await normalizeFormulaBlocks(
        withFraction(blocks, key, percent),
        locked,
      );
      setBlocks(normalized);
    } catch {
      setError("No se pudieron normalizar los pesos.");
    }
  };

  const handleToggleLock = (key: CareDimensionKey) => {
    setLocked((prev) => toggleLocked(prev, key));
  };

  const handleNormalizar = async () => {
    setNormalizing(true);
    setError(null);
    try {
      const { blocks: normalized } = await normalizeFormulaBlocks(
        blocks,
        locked,
      );
      setBlocks(normalized);
    } catch {
      setError("No se pudieron normalizar los pesos (revisa los bloqueos).");
    } finally {
      setNormalizing(false);
    }
  };

  const handleProbar = (key: CareDimensionKey) => {
    void router.push({
      pathname: EQUATION_PATH,
      query: encodeEquationDraft(blocks, key),
    });
  };

  const handleOpenModal = () => {
    setSaveError(null);
    setSaveSuccess(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleSave = async () => {
    if (!formula) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { blocks: exact } = await normalizeFormulaBlocks(blocks, locked);
      const payload: FormulaPayload = {
        version: formula.version,
        blocks: exact,
        chaos_factor: formula.chaos_factor,
        chaos_seed: formula.chaos_seed,
        min_compatibility: formula.min_compatibility,
        match_critical: formula.match_critical,
        changelog: changelog.trim(),
      };
      const saved = await saveFormula(payload, "criteria");
      setFormula(saved);
      setBlocks({ ...saved.blocks });
      setModalOpen(false);
      setChangelog("");
      setSaveSuccess(`Versión v${saved.version} guardada.`);
    } catch (err) {
      setSaveError(saveErrorMessage(err));
    } finally {
      setSaving(false);
    }
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
                <BarChartIcon sx={{ fontSize: 32, color: "white" }} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}
                >
                  Panel de Criterios
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Pesos canónicos de la matriz CARE M (7 dimensiones, suma
                  100%).
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<TuneIcon />}
                onClick={handleNormalizar}
                disabled={normalizing || loading}
              >
                {normalizing ? "Normalizando..." : "Normalizar"}
              </Button>
              <Button
                data-testid="open-save-modal"
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleOpenModal}
                disabled={!balanced || saving || loading}
              >
                Aplicar Cambios
              </Button>
            </Stack>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} data-testid="criteria-error">
              {error}
            </Alert>
          )}

          {saveSuccess && (
            <Alert
              severity="success"
              sx={{ mb: 3 }}
              data-testid="criteria-success"
            >
              {saveSuccess}
            </Alert>
          )}

          {loading ? (
            <Box
              sx={{ display: "flex", justifyContent: "center", py: 8 }}
              data-testid="criteria-loading"
            >
              <CircularProgress />
            </Box>
          ) : formula ? (
            <>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      textAlign: "center",
                      borderColor: balanced ? "success.light" : "error.light",
                      borderStyle: "dashed",
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{ color: "text.secondary" }}
                    >
                      Total Ponderado
                    </Typography>
                    <Typography
                      variant="h4"
                      data-testid="kpi-total"
                      color={balanced ? "success.main" : "error.main"}
                      sx={{ fontWeight: 800 }}
                    >
                      {totalPercent(blocks)}%
                    </Typography>
                    <Chip
                      data-testid="kpi-total-badge"
                      icon={balanced ? <CheckCircleIcon /> : <WarningIcon />}
                      label={balanced ? "Válido" : "Inválido"}
                      size="small"
                      color={balanced ? "success" : "error"}
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                    <Typography
                      variant="overline"
                      sx={{ color: "text.secondary" }}
                    >
                      Versión Activa
                    </Typography>
                    <Typography
                      variant="h6"
                      data-testid="kpi-version"
                      sx={{ fontWeight: 800, mt: 1 }}
                    >
                      {formatActiveVersion(formula)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                    <Typography
                      variant="overline"
                      sx={{ color: "text.secondary" }}
                    >
                      Caos Actual
                    </Typography>
                    <Typography
                      variant="h6"
                      data-testid="kpi-chaos"
                      sx={{ fontWeight: 800, mt: 1 }}
                    >
                      {formatChaos(formula.chaos_factor, formula.chaos_seed)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <CareCriteriaTable
                blocks={blocks}
                locked={locked}
                onSliderChange={handleSliderChange}
                onSliderCommit={handleSliderCommit}
                onToggleLock={handleToggleLock}
                onProbar={handleProbar}
              />
            </>
          ) : null}

          <Dialog
            open={modalOpen}
            onClose={handleCloseModal}
            maxWidth="sm"
            fullWidth
            data-testid="save-modal"
          >
            <DialogTitle>Aplicar cambios</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography
                  variant="body2"
                  data-testid="modal-sum"
                  sx={{ fontWeight: 700 }}
                >
                  Suma: {totalPercent(blocks)}%
                </Typography>

                {formula &&
                  (computeDeltas(formula.blocks, blocks).length === 0 ? (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Sin cambios respecto a v{formula.version}
                    </Typography>
                  ) : (
                    computeDeltas(formula.blocks, blocks).map((delta) => (
                      <Typography
                        key={delta.key}
                        variant="body2"
                        data-testid={`delta-${delta.key}`}
                      >
                        {delta.label}: {delta.deltaPercent > 0 ? "+" : ""}
                        {delta.deltaPercent}%
                      </Typography>
                    ))
                  ))}

                <TextField
                  data-testid="changelog-input"
                  label="Changelog"
                  required
                  multiline
                  minRows={2}
                  fullWidth
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  helperText="Describe el motivo del cambio (obligatorio)."
                />

                {saveError && (
                  <Alert severity="error" data-testid="save-error">
                    {saveError}
                  </Alert>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseModal} disabled={saving}>
                Cancelar
              </Button>
              <Button
                data-testid="modal-save"
                variant="contained"
                onClick={handleSave}
                disabled={changelog.trim().length === 0 || saving}
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </AdminLayout>
  );
}
