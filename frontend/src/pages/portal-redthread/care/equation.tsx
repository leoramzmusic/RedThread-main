import { useEffect, useRef, useState } from "react";
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
  Stack,
  TextField,
  Typography,
  Paper,
  Collapse,
  IconButton,
  Divider,
  Tooltip,
} from "@mui/material";
import FunctionsIcon from "@mui/icons-material/Functions";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CodeIcon from "@mui/icons-material/Code";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlined";
import AdminLayout from "../../../components/layout/AdminLayout";
import { useAppTheme } from "../../../context/ThemeContext";
import CareEquationHeader from "../../../components/care/CareEquationHeader";
import CareFormulaCanvas from "../../../components/care/CareFormulaCanvas";
import CareCriteriaTable from "../../../components/care/CareCriteriaTable";
import CareChaosPanel from "../../../components/care/CareChaosPanel";
import CareThresholdsPanel from "../../../components/care/CareThresholdsPanel";
import CareFormulaJsonEditor from "../../../components/care/CareFormulaJsonEditor";
import CareSimulationTable from "../../../components/care/CareSimulationTable";
import CarePreviewPanel from "../../../components/care/CarePreviewPanel";
import CareVersionsPanel from "../../../components/care/CareVersionsPanel";
import CareProfilesPanel from "../../../components/care/CareProfilesPanel";
import type { SearchUser } from "../../../components/common/UserSearchAutocomplete";
import type { CareDimensionKey } from "../../../constants/careDimensions";
import {
  getActiveFormula,
  listFormulaVersions,
  normalizeFormulaBlocks,
  previewFormula,
  rollbackFormula,
  saveFormula,
  simulateFormula,
  validateFormula,
  type CareFormula,
  type FormulaPayload,
  type NarrativeResult,
  type PreviewResult,
  type SimulateResult,
} from "../../../services/careFormulaService";
import {
  createProfile,
  deleteProfile,
  listProfiles,
  updateProfile,
} from "../../../services/careProfileService";
import {
  clampBlockPercent,
  computeDeltas,
  decodeEquationDraft,
  formatActiveVersion,
  formatChaos,
  isBalanced,
  saveErrorMessage,
  toggleLocked,
  totalPercent,
  withFraction,
} from "../../../utils/careCriteriaModel";
import {
  clientValidation,
  detectDegenerate,
  draftToPayload,
  parseDraft,
  previewErrorMessage,
  serializeDraft,
  smokeAlerts,
  toEquationDraft,
  type EquationDraft,
} from "../../../utils/careEquationModel";
import {
  BUILTIN_PROFILES,
  applyProfileToDraft,
  profileErrorMessage,
  profileMatchesDraft,
  toProfileView,
  type ProfileView,
} from "../../../utils/careProfileModel";

const SEED_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

const GLOW_MS = 700;

const LIMIT_HINT_MS = 1200;

/** Compact legend for the Ψ/M notation, shown next to the weights panel. */
const GLOSSARY_ENTRIES: { symbol: string; description: string }[] = [
  { symbol: "wᵢ", description: "Peso asignado a cada dimensión." },
  { symbol: "fᵢ", description: "Factor o valor de la dimensión." },
  { symbol: "Σ", description: "Suma de todos los términos." },
  { symbol: "χ(t)", description: "Factor de caos dinámico." },
];

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
  const { mode } = useAppTheme();
  const isDark = mode === "dark";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<EquationDraft | null>(null);
  const [activeFormula, setActiveFormula] = useState<CareFormula | null>(null);
  const [focus, setFocus] = useState<CareDimensionKey | null>(null);
  const [glowKey, setGlowKey] = useState<CareDimensionKey | null>(null);
  const [pulseToken, setPulseToken] = useState(0);
  const glowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [locked, setLocked] = useState<string[]>([]);
  const [jsonText, setJsonText] = useState("");
  const [jsonValid, setJsonValid] = useState(true);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validateErrors, setValidateErrors] = useState<string[]>([]);
  const [validateAlerts, setValidateAlerts] = useState<string[]>([]);
  const [simResult, setSimResult] = useState<SimulateResult | null>(null);
  const [previewUserA, setPreviewUserA] = useState<SearchUser | null>(null);
  const [previewUserB, setPreviewUserB] = useState<SearchUser | null>(null);
  const [previewTone, setPreviewTone] =
    useState<NarrativeResult["tone"]>("directo");
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(
    null,
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [versions, setVersions] = useState<CareFormula[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [activeVersion, setActiveVersion] = useState<number | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [changelog, setChangelog] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileView[]>(BUILTIN_PROFILES);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileConfirm, setProfileConfirm] = useState<{
    kind: "update" | "delete";
    profile: ProfileView;
  } | null>(null);
  const [limitHint, setLimitHint] = useState(false);
  const limitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        setActiveFormula(active);
        setDraft(next);
        setFocus(decoded?.focus ?? null);
        setJsonText(serializeDraft(next));
        setJsonValid(true);
        setJsonError(null);
        setActiveVersion(active.version);
        setVersionsLoading(true);
        try {
          const history = await listFormulaVersions(50);
          if (!cancelled) setVersions(history);
        } catch {
          if (!cancelled) setVersions([]);
        } finally {
          if (!cancelled) setVersionsLoading(false);
        }
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

  /** Flashes the touched dimension in the diagram node and the formula term. */
  const flashGlow = (key: CareDimensionKey) => {
    setGlowKey(key);
    if (glowTimer.current) clearTimeout(glowTimer.current);
    glowTimer.current = setTimeout(() => setGlowKey(null), GLOW_MS);
  };

  useEffect(
    () => () => {
      if (glowTimer.current) clearTimeout(glowTimer.current);
      if (limitTimer.current) clearTimeout(limitTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      setProfilesLoading(true);
      try {
        const saved = await listProfiles();
        if (!cancelled) {
          setProfiles([...BUILTIN_PROFILES, ...saved.map(toProfileView)]);
        }
      } catch {
        if (!cancelled) setProfiles(BUILTIN_PROFILES);
      } finally {
        if (!cancelled) setProfilesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  const handleBlockChange = (key: CareDimensionKey, percent: number) => {
    if (!draft || locked.includes(key)) return;
    const clamped = clampBlockPercent(draft.blocks, key, percent);
    if (percent > clamped) {
      setLimitHint(true);
      if (limitTimer.current) clearTimeout(limitTimer.current);
      limitTimer.current = setTimeout(() => setLimitHint(false), LIMIT_HINT_MS);
    }
    applyDraft({
      ...draft,
      blocks: withFraction(draft.blocks, key, clamped),
    });
    flashGlow(key);
  };

  const handleBlockCommit = async (key: CareDimensionKey, percent: number) => {
    if (!draft) return;
    setError(null);
    try {
      const { blocks: normalized } = await normalizeFormulaBlocks(
        withFraction(draft.blocks, key, percent),
        locked,
      );
      applyDraft({ ...draft, blocks: normalized });
    } catch {
      setError("No se pudieron normalizar los pesos.");
    }
  };

  const handleToggleLock = (key: CareDimensionKey) => {
    setLocked((prev) => toggleLocked(prev, key));
  };

  const handleSelectProfile = (id: string) => {
    if (!draft) return;
    const profile = profiles.find((item) => item.id === id);
    if (!profile) return;
    applyDraft(applyProfileToDraft(draft, profile));
    setSelectedProfileId(id);
  };

  const handleReestablecer = () => {
    if (!draft) return;
    applyDraft(applyProfileToDraft(draft, BUILTIN_PROFILES[0]));
    setSelectedProfileId(BUILTIN_PROFILES[0].id);
  };

  const handleProfileSaveAsOpen = () => {
    setProfileError(null);
    setProfileName("");
    setProfileDialogOpen(true);
  };

  const handleProfileCreate = async () => {
    if (!draft) return;
    setProfileSaving(true);
    setProfileError(null);
    try {
      const created = await createProfile({
        name: profileName.trim(),
        blocks: draft.blocks,
        chaos_factor: draft.chaosFactor,
      });
      const view = toProfileView(created);
      setProfiles((prev) => [...prev, view]);
      setSelectedProfileId(view.id);
      setProfileDialogOpen(false);
      setProfileSuccess(`Perfil "${view.name}" guardado.`);
    } catch (err) {
      setProfileError(profileErrorMessage(err));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleProfileUpdateConfirm = async () => {
    if (!draft || !profileConfirm || profileConfirm.kind !== "update") return;
    setProfileSaving(true);
    setProfileError(null);
    try {
      const updated = await updateProfile(profileConfirm.profile.id, {
        blocks: draft.blocks,
        chaos_factor: draft.chaosFactor,
      });
      const view = toProfileView(updated);
      setProfiles((prev) =>
        prev.map((profile) => (profile.id === view.id ? view : profile)),
      );
      setProfileConfirm(null);
      setProfileSuccess(`Perfil "${view.name}" actualizado.`);
    } catch (err) {
      setProfileError(profileErrorMessage(err));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleProfileDeleteConfirm = async () => {
    if (!profileConfirm || profileConfirm.kind !== "delete") return;
    const target = profileConfirm.profile;
    setProfileSaving(true);
    setProfileError(null);
    try {
      await deleteProfile(target.id);
      setProfiles((prev) => prev.filter((profile) => profile.id !== target.id));
      if (selectedProfileId === target.id) setSelectedProfileId(null);
      setProfileConfirm(null);
      setProfileSuccess(`Perfil "${target.name}" eliminado.`);
    } catch (err) {
      setProfileError(profileErrorMessage(err));
    } finally {
      setProfileSaving(false);
    }
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

  const handleProbar = async () => {
    if (!draft) return;
    setPulseToken((token) => token + 1);
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
        setSimResult(sim);
        setValidateAlerts((prev) => [...prev, ...smokeAlerts(sim.ranking)]);
      }
    } catch {
      setValidateErrors(["No se pudo validar contra el servidor."]);
    } finally {
      setValidating(false);
    }
  };

  const handlePreview = async () => {
    if (
      !draft ||
      !previewUserA ||
      !previewUserB ||
      previewUserA.id === previewUserB.id
    )
      return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const result = await previewFormula({
        formula: draftToPayload(draft),
        user_a_id: previewUserA.id,
        user_b_id: previewUserB.id,
        tone: previewTone,
      });
      setPreviewResult(result);
    } catch (err) {
      setPreviewError(previewErrorMessage(err));
    } finally {
      setPreviewLoading(false);
    }
  };

  const reloadVersions = async () => {
    try {
      setVersions(await listFormulaVersions(50));
    } catch {
      setVersions([]);
    }
  };

  const handleOpenModal = () => {
    setSaveError(null);
    setSaveSuccess(null);
    setSaveOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setSaveOpen(false);
  };

  const handleSave = async () => {
    if (!draft) return;
    if (changelog.trim() === "") {
      setSaveError("El changelog es obligatorio.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const { blocks: exact } = await normalizeFormulaBlocks(
        draft.blocks,
        locked,
      );
      const payload: FormulaPayload = {
        version: activeVersion ?? undefined,
        blocks: exact,
        chaos_factor: draft.chaosFactor,
        chaos_seed: draft.chaosSeed,
        min_compatibility: draft.minCompatibility,
        match_critical: draft.matchCritical,
        changelog: changelog.trim(),
      };
      const saved = await saveFormula(payload, "equation");
      setActiveFormula(saved);
      applyDraft(toEquationDraft(saved));
      setVersions((prev) => [
        saved,
        ...prev.filter((v) => v.version !== saved.version),
      ]);
      setActiveVersion(saved.version);
      setSaveOpen(false);
      setChangelog("");
      setSaveSuccess(`Versión v${saved.version} guardada.`);
    } catch (err) {
      setSaveError(saveErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRollback = async (version: number) => {
    try {
      const rolled = await rollbackFormula(version);
      setActiveFormula(rolled);
      applyDraft(toEquationDraft(rolled));
      setActiveVersion(rolled.version);
      await reloadVersions();
    } catch {
      setError("No se pudo restaurar la versión.");
    }
  };

  const balanced = draft ? isBalanced(draft.blocks) : false;
  const selectedProfile =
    profiles.find((profile) => profile.id === selectedProfileId) ?? null;
  const profileModified =
    draft !== null &&
    !profileMatchesDraft(selectedProfile, draft.blocks, draft.chaosFactor);

  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 4,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  bgcolor: "primary.main",
                  p: 1.5,
                  borderRadius: 2,
                  display: "flex",
                  mr: 2,
                  boxShadow: "0 4px 12px rgba(230,57,70,0.35)",
                  transition: "transform 0.2s ease",
                  "&:hover": { transform: "scale(1.05)" },
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
                  Ajusta los pesos, prueba la fórmula y guarda una versión
                  nueva.
                </Typography>
              </Box>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} data-testid="equation-error">
              {error}
            </Alert>
          )}

          {saveSuccess && (
            <Alert severity="success" sx={{ mb: 3 }} data-testid="save-success">
              {saveSuccess}
            </Alert>
          )}

          {profileSuccess && (
            <Alert
              severity="success"
              sx={{ mb: 3 }}
              data-testid="profile-success"
            >
              {profileSuccess}
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

          {loading ? (
            <Box
              sx={{ display: "flex", justifyContent: "center", py: 8 }}
              data-testid="equation-loading"
            >
              <CircularProgress />
            </Box>
          ) : draft && activeFormula ? (
            <>
              {/* KPIs de la versión activa */}
              <Grid container spacing={3} sx={{ mb: 3, alignItems: "stretch" }}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      textAlign: "center",
                      height: "100%",
                      minHeight: 120,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
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
                      {totalPercent(draft.blocks)}%
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
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      textAlign: "center",
                      height: "100%",
                      minHeight: 120,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
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
                      {formatActiveVersion(activeFormula)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      textAlign: "center",
                      height: "100%",
                      minHeight: 120,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
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
                      {formatChaos(
                        activeFormula.chaos_factor,
                        activeFormula.chaos_seed,
                      )}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Ecuación canónica */}
              <CareEquationHeader
                blocks={draft.blocks}
                focus={focus}
                glow={glowKey}
              />

              {/* Fila principal: diagrama + vista previa | pesos + acciones */}
              <Grid
                container
                spacing={3}
                sx={{ mb: 3, alignItems: "flex-start" }}
              >
                <Grid
                  size={{ xs: 12, md: 7 }}
                  sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <CareFormulaCanvas
                    blocks={draft.blocks}
                    focus={focus}
                    onNodeHover={setFocus}
                    glow={glowKey}
                    pulseToken={pulseToken}
                  />

                  {/* Vista previa de fórmula: bloque independiente */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: isDark ? "#1E1E1E" : "#F5F5F5",
                      border: `1px solid ${isDark ? "#333333" : "#CCCCCC"}`,
                      color: isDark ? "#FFFFFF" : "#222222",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        mb: 1,
                      }}
                    >
                      <HelpOutlineIcon
                        sx={{
                          fontSize: 16,
                          color: isDark ? "#CCCCCC" : "#666666",
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: isDark ? "#CCCCCC" : "#666666",
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                        }}
                      >
                        VISTA PREVIA DE FÓRMULA
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        mb: 1.5,
                      }}
                    >
                      <Chip
                        label={`${Object.values(draft.blocks).filter((v) => v > 0).length} variables activas`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`Σ pesos ${totalPercent(draft.blocks) / 100}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`Caos ${draft.chaosFactor}%`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`Mín ${draft.minCompatibility}%`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`Crítico ${draft.matchCritical}%`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: isDark ? "#CCCCCC" : "#666666",
                        display: "block",
                        lineHeight: 1.5,
                      }}
                    >
                      Los pesos (wᵢ) definen la importancia de cada dimensión;
                      el factor caos (χ) añade variabilidad controlada. Pasa el
                      cursor sobre un slider o una fila de la tabla para
                      resaltar su nodo en el diagrama.
                    </Typography>
                  </Paper>

                  {/* Buscador de usuario A/B + preview (Interpreter) */}
                  <CarePreviewPanel
                    userA={previewUserA}
                    userB={previewUserB}
                    tone={previewTone}
                    result={previewResult}
                    isDark={isDark}
                    loading={previewLoading}
                    error={previewError}
                    onUserAChange={setPreviewUserA}
                    onUserBChange={setPreviewUserB}
                    onToneChange={setPreviewTone}
                    onRun={handlePreview}
                  />
                </Grid>

                {/* Panel de pesos: tabla + Σ en vivo + acciones */}
                <Grid size={{ xs: 12, md: 5 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: isDark ? "#1E1E1E" : "#F5F5F5",
                      border: `1px solid ${isDark ? "#333333" : "#CCCCCC"}`,
                    }}
                  >
                    <CareProfilesPanel
                      profiles={profiles}
                      selectedId={selectedProfileId}
                      modified={profileModified}
                      loading={profilesLoading}
                      onSelect={handleSelectProfile}
                      onSaveAs={handleProfileSaveAsOpen}
                      onUpdate={() => {
                        if (selectedProfile && !selectedProfile.builtin) {
                          setProfileError(null);
                          setProfileConfirm({
                            kind: "update",
                            profile: selectedProfile,
                          });
                        }
                      }}
                      onDelete={() => {
                        if (selectedProfile && !selectedProfile.builtin) {
                          setProfileError(null);
                          setProfileConfirm({
                            kind: "delete",
                            profile: selectedProfile,
                          });
                        }
                      }}
                    />
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700, mb: 1.5 }}
                    >
                      Pesos canónicos
                    </Typography>
                    <CareCriteriaTable
                      blocks={draft.blocks}
                      locked={locked}
                      focus={focus}
                      onSliderChange={handleBlockChange}
                      onSliderCommit={handleBlockCommit}
                      onToggleLock={handleToggleLock}
                      onProbar={setFocus}
                      onBlockHover={setFocus}
                    />

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: 2,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Σ en vivo
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {limitHint && (
                          <Chip
                            data-testid="limit-hint"
                            label="Límite 100%"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                        <Typography
                          variant="body2"
                          data-testid="weights-total"
                          sx={{
                            fontWeight: 800,
                            color: balanced ? "success.main" : "error.main",
                          }}
                        >
                          {totalPercent(draft.blocks)}%
                        </Typography>
                      </Box>
                    </Box>

                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}
                    >
                      <Tooltip title="Vuelve al perfil Default">
                        <span>
                          <Button
                            data-testid="action-reestablecer"
                            variant="outlined"
                            size="small"
                            startIcon={<RestartAltIcon />}
                            onClick={handleReestablecer}
                            disabled={loading}
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              fontWeight: 600,
                            }}
                          >
                            Reestablecer
                          </Button>
                        </span>
                      </Tooltip>
                      <Button
                        data-testid="action-probar"
                        variant="contained"
                        size="small"
                        startIcon={<PlayArrowIcon />}
                        onClick={handleProbar}
                        disabled={validating || loading}
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                          boxShadow: isDark
                            ? "0 4px 12px rgba(230,57,70,0.35)"
                            : "0 4px 12px rgba(230,57,70,0.25)",
                        }}
                      >
                        {validating ? "Probando..." : "Probar fórmula"}
                      </Button>
                      <Button
                        data-testid="open-save-modal"
                        variant="contained"
                        color="secondary"
                        size="small"
                        startIcon={<SaveIcon />}
                        onClick={handleOpenModal}
                        disabled={!balanced || saving || loading}
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        Guardar
                      </Button>
                    </Stack>
                  </Paper>

                  {/* Glosario de símbolos: leyenda compacta del diagrama */}
                  <Paper
                    variant="outlined"
                    data-testid="glossary"
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: isDark ? "#1E1E1E" : "#F5F5F5",
                      border: `1px solid ${isDark ? "#333333" : "#CCCCCC"}`,
                      color: isDark ? "#FFFFFF" : "#222222",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: isDark ? "#CCCCCC" : "#666666",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                      }}
                    >
                      GLOSARIO DE SÍMBOLOS
                    </Typography>
                    <Stack spacing={0.75} sx={{ mt: 1 }}>
                      {GLOSSARY_ENTRIES.map((entry) => (
                        <Box
                          key={entry.symbol}
                          sx={{ display: "flex", alignItems: "baseline" }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 800,
                              minWidth: 40,
                              color: isDark ? "#FFFFFF" : "#222222",
                            }}
                          >
                            {entry.symbol}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: isDark ? "#CCCCCC" : "#666666" }}
                          >
                            {entry.description}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              {/* Panel de parámetros técnicos + JSON - plegable */}
              <Paper
                variant="outlined"
                sx={{
                  mb: 3,
                  bgcolor: isDark ? "#1E1E1E" : "#F5F5F5",
                  boxShadow: isDark
                    ? "0 4px 16px rgba(0,0,0,0.4)"
                    : "0 4px 16px rgba(26,27,30,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                  onClick={() => setJsonOpen(!jsonOpen)}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CodeIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Parámetros técnicos y JSON
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", ml: 1 }}
                    >
                      (Ver JSON completo)
                    </Typography>
                  </Box>
                  <IconButton size="small">
                    {jsonOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                <Collapse in={jsonOpen}>
                  <Divider />
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <CareChaosPanel
                          chaosFactor={draft.chaosFactor}
                          chaosSeed={draft.chaosSeed}
                          deltaIndicator={
                            simResult ? simResult.mean_delta : null
                          }
                          onChaosChange={handleChaosChange}
                          onSeedChange={handleSeedChange}
                          onGenerateSeed={handleGenerateSeed}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <CareThresholdsPanel
                          minCompatibility={draft.minCompatibility}
                          matchCritical={draft.matchCritical}
                          onMinChange={handleMinChange}
                          onMatchChange={handleMatchChange}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CareFormulaJsonEditor
                          value={jsonText}
                          valid={jsonValid}
                          error={jsonError}
                          onChange={handleJsonChange}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>
              </Paper>

              <CareSimulationTable result={simResult} loading={validating} />

              <Box sx={{ mt: 3 }}>
                <CareVersionsPanel
                  versions={versions}
                  activeVersion={activeVersion}
                  loading={versionsLoading}
                  onRollback={handleRollback}
                />
              </Box>
            </>
          ) : null}

          <Dialog
            open={saveOpen}
            onClose={handleCloseModal}
            maxWidth="sm"
            fullWidth
            data-testid="save-modal"
          >
            <DialogTitle>Guardar cambios</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography
                  variant="body2"
                  data-testid="modal-sum"
                  sx={{ fontWeight: 700 }}
                >
                  Suma: {draft ? totalPercent(draft.blocks) : 0}%
                </Typography>

                {activeFormula &&
                  draft &&
                  (computeDeltas(activeFormula.blocks, draft.blocks).length ===
                  0 ? (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Sin cambios respecto a v{activeFormula.version}
                    </Typography>
                  ) : (
                    computeDeltas(activeFormula.blocks, draft.blocks).map(
                      (delta) => (
                        <Typography
                          key={delta.key}
                          variant="body2"
                          data-testid={`delta-${delta.key}`}
                        >
                          {delta.label}: {delta.deltaPercent > 0 ? "+" : ""}
                          {delta.deltaPercent}%
                        </Typography>
                      ),
                    )
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

          <Dialog
            open={profileDialogOpen}
            onClose={() => {
              if (!profileSaving) setProfileDialogOpen(false);
            }}
            maxWidth="xs"
            fullWidth
            data-testid="profile-name-dialog"
          >
            <DialogTitle>Guardar como perfil</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  data-testid="profile-name-input"
                  label="Nombre del perfil"
                  required
                  fullWidth
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  helperText="Entre 1 y 60 caracteres."
                />
                {profileError && (
                  <Alert severity="error" data-testid="profile-name-error">
                    {profileError}
                  </Alert>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setProfileDialogOpen(false)}
                disabled={profileSaving}
              >
                Cancelar
              </Button>
              <Button
                data-testid="profile-name-save"
                variant="contained"
                onClick={handleProfileCreate}
                disabled={profileName.trim().length === 0 || profileSaving}
              >
                {profileSaving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={profileConfirm !== null}
            onClose={() => {
              if (!profileSaving) setProfileConfirm(null);
            }}
            maxWidth="xs"
            fullWidth
            data-testid="profile-confirm-dialog"
          >
            <DialogTitle>
              {profileConfirm?.kind === "delete"
                ? "Eliminar perfil"
                : "Actualizar perfil"}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography variant="body2">
                  {profileConfirm?.kind === "delete"
                    ? `¿Eliminar el perfil "${profileConfirm?.profile.name}"? Esta acción no se puede deshacer.`
                    : `¿Sobrescribir "${profileConfirm?.profile.name}" con los pesos actuales del editor?`}
                </Typography>
                {profileError && (
                  <Alert severity="error" data-testid="profile-confirm-error">
                    {profileError}
                  </Alert>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button
                data-testid="profile-confirm-cancel"
                onClick={() => setProfileConfirm(null)}
                disabled={profileSaving}
              >
                Cancelar
              </Button>
              <Button
                data-testid="profile-confirm-accept"
                variant="contained"
                color={profileConfirm?.kind === "delete" ? "error" : "primary"}
                onClick={
                  profileConfirm?.kind === "delete"
                    ? handleProfileDeleteConfirm
                    : handleProfileUpdateConfirm
                }
                disabled={profileSaving}
              >
                {profileConfirm?.kind === "delete" ? "Eliminar" : "Actualizar"}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </AdminLayout>
  );
}
