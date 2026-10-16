import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TuneIcon from "@mui/icons-material/Tune";
import WarningIcon from "@mui/icons-material/Warning";
import AdminLayout from "../../../components/layout/AdminLayout";
import CareCriteriaTable from "../../../components/care/CareCriteriaTable";
import type { CareDimensionKey } from "../../../constants/careDimensions";
import {
  getActiveFormula,
  normalizeFormulaBlocks,
  type CareFormula,
  type FormulaBlocks,
} from "../../../services/careFormulaService";
import {
  encodeEquationDraft,
  formatActiveVersion,
  formatChaos,
  isBalanced,
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
            <Button
              variant="outlined"
              startIcon={<TuneIcon />}
              onClick={handleNormalizar}
              disabled={normalizing || loading}
            >
              {normalizing ? "Normalizando..." : "Normalizar"}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} data-testid="criteria-error">
              {error}
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
        </Box>
      </Container>
    </AdminLayout>
  );
}
