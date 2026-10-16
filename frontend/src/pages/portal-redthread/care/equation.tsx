import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import FunctionsIcon from "@mui/icons-material/Functions";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ScienceIcon from "@mui/icons-material/Science";
import AdminLayout from "../../../components/layout/AdminLayout";
import CareEquationHeader from "../../../components/care/CareEquationHeader";
import CareFormulaCanvas from "../../../components/care/CareFormulaCanvas";
import CareEquationBlocks from "../../../components/care/CareEquationBlocks";
import CareChaosPanel from "../../../components/care/CareChaosPanel";
import CareThresholdsPanel from "../../../components/care/CareThresholdsPanel";
import CareFormulaJsonEditor from "../../../components/care/CareFormulaJsonEditor";
import CareSimulationTable from "../../../components/care/CareSimulationTable";
import type { CareDimensionKey } from "../../../constants/careDimensions";
import {
  getActiveFormula,
  simulateFormula,
  validateFormula,
  type SimulateResult,
} from "../../../services/careFormulaService";
import { decodeEquationDraft } from "../../../utils/careCriteriaModel";
import {
  clientValidation,
  detectDegenerate,
  draftToPayload,
  parseDraft,
  serializeDraft,
  smokeAlerts,
  toEquationDraft,
  type EquationDraft,
} from "../../../utils/careEquationModel";

const SEED_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

const randomSeed = (): string => {
  let out = "";
  for (let i = 0; i < 12; i += 1) {
    out += SEED_CHARS[Math.floor(Math.random() * SEED_CHARS.length)];
  }
  return out;
};

export default function CareEquationPage() {
  const router = useRouter();
  const ready = router.isReady;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<EquationDraft | null>(null);
  const [focus, setFocus] = useState<CareDimensionKey | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [jsonValid, setJsonValid] = useState(true);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [validateErrors, setValidateErrors] = useState<string[]>([]);
  const [validateAlerts, setValidateAlerts] = useState<string[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<SimulateResult | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const active = await getActiveFormula();
        if (cancelled) return;
        const decoded = decodeEquationDraft(router.query);
        const base = toEquationDraft(active);
        const next: EquationDraft = decoded
          ? { ...base, blocks: decoded.blocks }
          : base;
        setDraft(next);
        setFocus(decoded?.focus ?? null);
        setJsonText(serializeDraft(next));
        setJsonValid(true);
        setJsonError(null);
      } catch {
        if (!cancelled) setError("No se pudo cargar la fórmula activa.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, router.query]);

  const applyDraft = (next: EquationDraft) => {
    setDraft(next);
    setJsonText(serializeDraft(next));
    setJsonValid(true);
    setJsonError(null);
  };

  const handleBlockChange = (key: CareDimensionKey, percent: number) => {
    if (!draft) return;
    applyDraft({
      ...draft,
      blocks: {
        ...draft.blocks,
        [key]: Math.max(0, Math.min(1, percent / 100)),
      },
    });
  };

  const handleChaosChange = (factor: number) => {
    if (!draft) return;
    applyDraft({ ...draft, chaosFactor: factor });
  };

  const handleSeedChange = (seed: string | null) => {
    if (!draft) return;
    applyDraft({ ...draft, chaosSeed: seed });
  };

  const handleGenerateSeed = () => handleSeedChange(randomSeed());

  const handleMinChange = (value: number) => {
    if (!draft) return;
    applyDraft({ ...draft, minCompatibility: value });
  };

  const handleMatchChange = (value: number) => {
    if (!draft) return;
    applyDraft({ ...draft, matchCritical: value });
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    const parsed = parseDraft(text);
    if (parsed.ok) {
      setDraft(parsed.draft);
      setJsonValid(true);
      setJsonError(null);
    } else {
      setJsonValid(false);
      setJsonError(parsed.error);
    }
  };

  const handleValidate = async () => {
    if (!draft) return;
    setValidating(true);
    setValidateErrors([]);
    setValidateAlerts(detectDegenerate(draft.blocks));
    const local = clientValidation(draft.blocks);
    if (local.length > 0) {
      setValidateErrors(local);
      setValidating(false);
      return;
    }
    try {
      const result = await validateFormula(draftToPayload(draft));
      setValidateErrors(result.errors);
      if (result.valid) {
        const sim = await simulateFormula({ formula: draftToPayload(draft) });
        setValidateAlerts((prev) => [...prev, ...smokeAlerts(sim.ranking)]);
      }
    } catch {
      setValidateErrors(["No se pudo validar contra el servidor."]);
    } finally {
      setValidating(false);
    }
  };

  const handleSimulate = async () => {
    if (!draft) return;
    setSimulating(true);
    setSimError(null);
    try {
      const result = await simulateFormula({ formula: draftToPayload(draft) });
      setSimResult(result);
    } catch {
      setSimError("No se pudo simular la fórmula.");
    } finally {
      setSimulating(false);
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
                <FunctionsIcon sx={{ fontSize: 32, color: "white" }} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}
                >
                  Editor de Fórmula Ψ/M
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  CARE_score = Σ wᵢ·fᵢ + χ(t) — validar, simular y guardar en
                  versión nueva.
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                data-testid="action-validate"
                variant="outlined"
                startIcon={<ScienceIcon />}
                onClick={handleValidate}
                disabled={validating || loading}
              >
                {validating ? "Validando..." : "Validar"}
              </Button>
              <Button
                data-testid="action-simulate"
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleSimulate}
                disabled={simulating || loading}
              >
                {simulating ? "Simulando..." : "Simular"}
              </Button>
            </Stack>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} data-testid="equation-error">
              {error}
            </Alert>
          )}

          {!loading && validateErrors.length > 0 && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              data-testid="validate-errors"
            >
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {validateErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </Alert>
          )}

          {!loading && validateAlerts.length > 0 && (
            <Alert
              severity="warning"
              sx={{ mb: 2 }}
              data-testid="validate-alerts"
            >
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {validateAlerts.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </Alert>
          )}

          {simError && (
            <Alert severity="error" sx={{ mb: 2 }} data-testid="simulate-error">
              {simError}
            </Alert>
          )}

          {loading ? (
            <Box
              sx={{ display: "flex", justifyContent: "center", py: 8 }}
              data-testid="equation-loading"
            >
              <CircularProgress />
            </Box>
          ) : draft ? (
            <>
              <CareEquationHeader blocks={draft.blocks} focus={focus} />
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Stack spacing={3}>
                    <CareEquationBlocks
                      blocks={draft.blocks}
                      focus={focus}
                      onSliderChange={handleBlockChange}
                    />
                    <CareFormulaCanvas blocks={draft.blocks} focus={focus} />
                    <CareChaosPanel
                      chaosFactor={draft.chaosFactor}
                      chaosSeed={draft.chaosSeed}
                      deltaIndicator={simResult ? simResult.mean_delta : null}
                      onChaosChange={handleChaosChange}
                      onSeedChange={handleSeedChange}
                      onGenerateSeed={handleGenerateSeed}
                    />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                  <CareThresholdsPanel
                    minCompatibility={draft.minCompatibility}
                    matchCritical={draft.matchCritical}
                    onMinChange={handleMinChange}
                    onMatchChange={handleMatchChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                  <CareFormulaJsonEditor
                    value={jsonText}
                    valid={jsonValid}
                    error={jsonError}
                    onChange={handleJsonChange}
                  />
                </Grid>
              </Grid>

              <CareSimulationTable result={simResult} loading={simulating} />
            </>
          ) : null}
        </Box>
      </Container>
    </AdminLayout>
  );
}
