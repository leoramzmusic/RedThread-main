import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
  Grid,
  Divider,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import AdminLayout from "../../../components/layout/AdminLayout";
import { useAppTheme } from "../../../context/ThemeContext";
import { alpha } from "@mui/material/styles";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ScienceIcon from "@mui/icons-material/Science";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import StarsIcon from "@mui/icons-material/Stars";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SettingsIcon from "@mui/icons-material/Settings";
import { liquidColors } from "../../../theme/liquidGlass";
import UserSearchAutocomplete, {
  type SearchUser,
} from "../../../components/common/UserSearchAutocomplete";
import {
  getActiveFormula,
  previewFormula,
  type CareFormula,
  type FormulaPayload,
} from "../../../services/careFormulaService";
import {
  buildExperimentFormula,
  computeMetricsFromHistory,
  EXPERIMENT_META,
  type SimulationResult,
} from "../../../utils/careExperiments";

type ExperimentStatus = "active" | "running" | "completed";

interface Experiment {
  id: string;
  name: string;
  status: ExperimentStatus;
  matchRate: number;
  avgEngagement: number;
  chatDuration: string;
  formula: FormulaPayload;
  tone: string;
  history: SimulationResult[];
}

const STATUS_ORDER: Record<ExperimentStatus, number> = {
  active: 0,
  running: 1,
  completed: 2,
};

function statusColors(mode: "dark" | "light") {
  return {
    active: {
      dotBg: mode === "dark" ? "#4CAF50" : "#1B5E20",
      badgeBg: mode === "dark" ? "rgba(76,175,80,0.18)" : "rgba(27,94,32,0.08)",
      text: mode === "dark" ? "#A5D6A7" : "#1B5E20",
    },
    running: {
      dotBg: mode === "dark" ? "#64B5F6" : "#0D47A1",
      badgeBg:
        mode === "dark" ? "rgba(33,150,243,0.18)" : "rgba(13,71,161,0.08)",
      text: mode === "dark" ? "#90CAF9" : "#0D47A1",
    },
    completed: {
      dotBg: mode === "dark" ? "#9E9E9E" : "#424242",
      badgeBg:
        mode === "dark" ? "rgba(127,127,127,0.18)" : "rgba(66,66,66,0.08)",
      text: mode === "dark" ? "#BDBDBD" : "#424242",
    },
  };
}

const statusConfig: Record<
  ExperimentStatus,
  { label: string; dotBg: string; badgeBg: string; text: string }
> = {
  active: { label: "ACTIVO", ...statusColors("dark").active },
  running: { label: "EN EJECUCIÓN", ...statusColors("dark").running },
  completed: { label: "COMPLETADO", ...statusColors("dark").completed },
};

export default function CareLabPage() {
  const { mode } = useAppTheme();
  const isDark = mode === "dark";
  const [profileA, setProfileA] = useState<SearchUser | null>(null);
  const [profileB, setProfileB] = useState<SearchUser | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [selectedExperimentId, setSelectedExperimentId] = useState("exp_001");
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [simResult, setSimResult] = useState<{
    score: number;
    narrative: string;
    experimentName: string;
  } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getActiveFormula()
      .then((formula: CareFormula) => {
        if (!active) return;
        setExperiments(
          EXPERIMENT_META.map((meta) => ({
            id: meta.id,
            name: meta.name,
            status: meta.status,
            matchRate: meta.matchRate,
            avgEngagement: meta.avgEngagement,
            chatDuration: meta.chatDuration,
            formula: buildExperimentFormula(formula, meta.variant),
            tone: meta.tone,
            history: [],
          })),
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const selectedExperiment =
    experiments.find((e) => e.id === selectedExperimentId) ?? null;

  const handleSimulate = async () => {
    if (!profileA || !profileB || !selectedExperiment) return;
    setSimulating(true);
    setSimResult(null);
    try {
      const result = await previewFormula({
        formula: selectedExperiment.formula,
        user_a_id: profileA.id,
        user_b_id: profileB.id,
        tone: selectedExperiment.tone,
      });
      const score = Math.round((result.proposed?.score ?? 0) * 100);
      const narrative = result.narrative?.text ?? "";
      setSimResult({
        score,
        narrative,
        experimentName: selectedExperiment.name,
      });
      const sim: SimulationResult = {
        score,
        narrative,
        timestamp: new Date().toISOString(),
        userA: profileA.id,
        userB: profileB.id,
      };
      setExperiments((prev) =>
        prev.map((e) =>
          e.id === selectedExperiment.id
            ? { ...e, history: [...e.history, sim] }
            : e,
        ),
      );
    } catch {
      setSimResult(null);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box
          sx={{
            py: 4,
            "@keyframes labPulseGlow": {
              "0%, 100%": { boxShadow: "0 0 0 0 rgba(76,175,80,0.5)" },
              "50%": { boxShadow: "0 0 0 10px rgba(76,175,80,0)" },
            },
            "@keyframes labPulseBorder": {
              "0%, 100%": { boxShadow: "0 0 0 0 rgba(76,175,80,0.35)" },
              "50%": { boxShadow: "0 0 0 8px rgba(76,175,80,0)" },
            },
          }}
        >
          {/* Header */}
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
                <ScienceIcon sx={{ fontSize: 32, color: "white" }} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}
                >
                  Laboratorio (A/B)
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Experimenta con diferentes configuraciones y mide el impacto.
                </Typography>
              </Box>
            </Box>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="exp-select-label">Experimento</InputLabel>
              <Select
                value={selectedExperimentId}
                labelId="exp-select-label"
                label="Experimento"
                onChange={(e) => setSelectedExperimentId(e.target.value)}
                sx={{ "& .MuiSelect-select": { pr: 4 } }}
              >
                {[...experiments]
                  .sort(
                    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
                  )
                  .map((exp) => {
                    const cfg = statusConfig[exp.status];
                    return (
                      <MenuItem key={exp.id} value={exp.id} sx={{ py: 1.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            width: "100%",
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: cfg.dotBg,
                            }}
                          />
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {exp.name}
                          </Typography>
                          <Chip
                            label={cfg.label}
                            size="small"
                            sx={{
                              bgcolor: cfg.badgeBg,
                              fontWeight: 700,
                              fontSize: "0.65rem",
                              height: 20,
                              color: cfg.text,
                              "& .MuiChip-label": { px: 1 },
                            }}
                          />
                        </Box>
                      </MenuItem>
                    );
                  })}
              </Select>
            </FormControl>
          </Box>

          <Grid container spacing={4}>
            {/* Simulador de Conexión */}
            <Grid
              size={{ xs: 12, md: 6 }}
              sx={{ display: "flex", flexDirection: "column" }}
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  mb: 1.5,
                  color: isDark ? "#FFFFFF" : "text.primary",
                }}
              >
                Simulador de Conexión
              </Typography>
              <Paper
                sx={{
                  p: 3,
                  flex: 1,
                  minHeight: 420,
                  borderRadius: 2,
                  bgcolor: isDark ? "#1E1E1E" : "background.paper",
                  border: `1px solid ${isDark ? "#333333" : "rgba(230,57,70,0.15)"}`,
                  boxShadow: isDark
                    ? "0 4px 16px rgba(0,0,0,0.4)"
                    : "0 4px 16px rgba(26,27,30,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
                  transition: "box-shadow 0.2s ease, transform 0.2s ease",
                  "&:hover": {
                    boxShadow: isDark
                      ? "0 8px 24px rgba(0,0,0,0.5)"
                      : "0 8px 24px rgba(26,27,30,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
                  },
                }}
              >
                <Stack spacing={3}>
                  {/* Perfiles */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      flexDirection: { xs: "column", md: "row" },
                    }}
                  >
                    <Box
                      sx={{
                        flex: 1,
                        p: 2,
                        bgcolor: isDark ? "#2A2A2A" : "grey.50",
                        borderRadius: 2,
                        border: `1px dashed ${isDark ? "#333333" : "rgba(26,27,30,0.12)"}`,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: mode === "dark" ? "#4FC3F7" : "info.main",
                          }}
                        />
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                            color: isDark ? "#AAAAAA" : "text.primary",
                          }}
                        >
                          Perfil A (Usuario)
                        </Typography>
                      </Box>
                      <UserSearchAutocomplete
                        placeholder="Buscar usuario por nombre o alias"
                        value={profileA}
                        onChange={setProfileA}
                        excludeId={profileB?.id ?? null}
                        isDark={isDark}
                      />
                    </Box>
                    <Box
                      sx={{
                        flex: 1,
                        p: 2,
                        bgcolor: isDark ? "#2A2A2A" : "grey.50",
                        borderRadius: 2,
                        border: `1px dashed ${isDark ? "#333333" : "rgba(26,27,30,0.12)"}`,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: mode === "dark" ? "#EF5350" : "error.main",
                          }}
                        />
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                            color: isDark ? "#AAAAAA" : "text.primary",
                          }}
                        >
                          Perfil B (Candidato)
                        </Typography>
                      </Box>
                      <UserSearchAutocomplete
                        placeholder="Buscar candidato por nombre o alias"
                        value={profileB}
                        onChange={setProfileB}
                        excludeId={profileA?.id ?? null}
                        isDark={isDark}
                      />
                    </Box>
                  </Box>

                  {/* Botón principal */}
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={simulating ? null : <PlayArrowIcon />}
                    onClick={handleSimulate}
                    disabled={simulating || !profileA || !profileB}
                    sx={{
                      bgcolor: isDark ? "#4CAF50" : "primary.main",
                      px: 4,
                      py: 1.5,
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      borderRadius: 2,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: isDark ? "#66BB6A" : "primary.light",
                        boxShadow: isDark
                          ? "0 4px 16px rgba(76,175,80,0.45)"
                          : "0 4px 12px rgba(230,57,70,0.35)",
                      },
                      ...(isDark &&
                        simulating && {
                          animation: "labPulseGlow 1.2s ease-in-out infinite",
                        }),
                      "&:disabled": {
                        bgcolor: "action.disabledBackground",
                        color: "text.disabled",
                        boxShadow: "none",
                        animation: "none",
                      },
                    }}
                    aria-label={
                      simulating
                        ? "Simulación en ejecución"
                        : "Ejecutar simulación de conexión"
                    }
                  >
                    {simulating ? (
                      <CircularProgress
                        size={20}
                        color="inherit"
                        thickness={4}
                      />
                    ) : (
                      "Ejecutar Simulación"
                    )}
                  </Button>
                </Stack>
              </Paper>
            </Grid>

            {/* Resultado del Motor CARE */}
            <Grid
              size={{ xs: 12, md: 6 }}
              sx={{ display: "flex", flexDirection: "column" }}
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  mb: 1.5,
                  color: isDark ? "#FFFFFF" : "text.primary",
                }}
              >
                Resultado del Motor CARE
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  flex: 1,
                  minHeight: 420,
                  borderRadius: 2,
                  border: "2px solid ",
                  borderColor: simResult
                    ? isDark
                      ? "rgba(76,175,80,0.6)"
                      : "primary.light"
                    : isDark
                      ? "#333333"
                      : "divider",
                  transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                  background: simResult
                    ? isDark
                      ? "linear-gradient(135deg, rgba(76,175,80,0.08) 0%, rgba(30,30,30,0) 40%)"
                      : "linear-gradient(135deg, rgba(230,57,70,0.04) 0%, rgba(255,255,255,0) 40%)"
                    : "transparent",
                  ...(isDark &&
                    simulating && {
                      animation: "labPulseBorder 1.2s ease-in-out infinite",
                    }),
                }}
              >
                {/* Parámetros del experimento activo */}
                {selectedExperiment && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="overline"
                      sx={{
                        color: isDark ? "#DDDDDD" : "text.secondary",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        mb: 1,
                      }}
                    >
                      Parámetros del experimento
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      <Chip
                        label={`Caos ${selectedExperiment.formula.chaos_factor ?? 0}%`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`Tono: ${selectedExperiment.tone}`}
                        size="small"
                        variant="outlined"
                      />
                      {Object.entries(selectedExperiment.formula.blocks)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([k, v]) => (
                          <Chip
                            key={k}
                            label={`${k} ${(v * 100).toFixed(0)}%`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                    </Box>
                  </Box>
                )}
                {simResult ? (
                  <>
                    {/* Fila de resultados */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        mb: 3,
                      }}
                    >
                      {/* Avatar A */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          textAlign: "center",
                        }}
                      >
                        <Avatar
                          src={profileA?.photo ?? undefined}
                          sx={{
                            width: 72,
                            height: 72,
                            mb: 1,
                            bgcolor: "info.light",
                            color: "info.main",
                            fontWeight: 700,
                            fontSize: "1.4rem",
                            transition: "box-shadow 0.2s ease",
                            "&:hover": {
                              boxShadow: `0 4px 12px ${alpha(mode === "dark" ? "#4FC3F7" : liquidColors.info, 0.35)}`,
                            },
                          }}
                        >
                          {(profileA?.display_name || profileA?.nickname || "A")
                            .charAt(0)
                            .toUpperCase()}
                        </Avatar>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            mt: 0.5,
                            maxWidth: 120,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {profileA?.display_name || "Usuario"}
                        </Typography>
                      </Box>

                      {/* Score central */}
                      <Box sx={{ flexGrow: 1, textAlign: "center" }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            fontWeight: 600,
                            mb: 0.25,
                            display: "block",
                          }}
                        >
                          {simResult.experimentName}
                        </Typography>
                        <Typography
                          variant="overline"
                          sx={{
                            color:
                              mode === "dark"
                                ? "#CFD8DC"
                                : liquidColors.primary,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            mb: 0.5,
                          }}
                        >
                          CARE Affinity Score
                        </Typography>
                        <Typography
                          variant="h2"
                          sx={{
                            fontWeight: 800,
                            color:
                              mode === "dark"
                                ? "#FFFFFF"
                                : liquidColors.primary,
                            lineHeight: 1.1,
                            mb: 1.5,
                          }}
                        >
                          {simResult.score}%
                        </Typography>
                        <Chip
                          label={
                            simResult.score >= 70
                              ? "Alta compatibilidad"
                              : simResult.score >= 50
                                ? "Compatibilidad moderada"
                                : "Baja compatibilidad"
                          }
                          color={
                            simResult.score >= 70
                              ? "success"
                              : simResult.score >= 50
                                ? "warning"
                                : "error"
                          }
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            height: 24,
                          }}
                        />
                      </Box>

                      {/* Avatar B */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          textAlign: "center",
                        }}
                      >
                        <Avatar
                          src={profileB?.photo ?? undefined}
                          sx={{
                            width: 72,
                            height: 72,
                            mb: 1,
                            bgcolor: "error.light",
                            color: liquidColors.error,
                            fontWeight: 700,
                            fontSize: "1.4rem",
                            transition: "box-shadow 0.2s ease",
                            "&:hover": {
                              boxShadow: `0 4px 12px ${alpha(mode === "dark" ? "#EF5350" : liquidColors.error, 0.35)}`,
                            },
                          }}
                        >
                          {(profileB?.display_name || profileB?.nickname || "B")
                            .charAt(0)
                            .toUpperCase()}
                        </Avatar>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            mt: 0.5,
                            maxWidth: 120,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {profileB?.display_name || "Candidato"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Narrative output */}
                    <Box
                      sx={{
                        p: 2.5,
                        bgcolor: isDark ? "#1E1E1E" : "grey.50",
                        borderRadius: 2,
                        border: `1px solid ${isDark ? "#333333" : "rgba(26,27,30,0.08)"}`,
                        transition:
                          "background 0.2s ease, border-color 0.2s ease",
                        "&:hover": { bgcolor: isDark ? "#262626" : "grey.100" },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <AutoAwesomeIcon
                          sx={{
                            fontSize: 16,
                            color: isDark ? "#4CAF50" : "primary.main",
                          }}
                        />
                        <Typography
                          variant="overline"
                          sx={{
                            color: isDark ? "#DDDDDD" : "text.secondary",
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                          }}
                        >
                          Narrativa
                        </Typography>
                      </Box>
                      <Typography
                        variant="body1"
                        sx={{
                          fontStyle: "italic",
                          color: isDark ? "#FFFFFF" : "text.primary",
                          fontWeight: 500,
                          fontSize: "1.05rem",
                          lineHeight: 1.8,
                        }}
                      >
                        "{simResult.narrative}"
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 260,
                      bgcolor:
                        mode === "dark" ? "rgba(255,255,255,0.03)" : "grey.50",
                      borderRadius: 2,
                      border: `2px dashed ${mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(26,27,30,0.12)"}`,
                    }}
                  >
                    <ScienceIcon
                      sx={{
                        fontSize: 56,
                        color: mode === "dark" ? "#546E7A" : "text.disabled",
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="body1"
                      sx={{
                        color: mode === "dark" ? "#78909C" : "text.disabled",
                        fontWeight: 500,
                        textAlign: "center",
                        maxWidth: 280,
                      }}
                    >
                      Ingresa dos perfiles y ejecuta una simulación para ver el
                      resultado
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Divider */}
          <Divider sx={{ my: 4, borderColor: "divider" }} />

          {/* Comparación de Experimentos */}
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}
          >
            <CompareArrowsIcon sx={{ color: "primary.main", fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Comparación de Experimentos
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {experiments.map((exp) => {
              const cfg = statusConfig[exp.status];
              const isDarkCard = mode === "dark";
              const metrics = computeMetricsFromHistory(exp.history, {
                matchRate: exp.matchRate,
                avgEngagement: exp.avgEngagement,
                chatDuration: exp.chatDuration,
              });
              const lastScore = exp.history[exp.history.length - 1]?.score ?? 0;
              const prevScore =
                exp.history[exp.history.length - 2]?.score ?? lastScore;
              const trend = lastScore - prevScore;
              const isExpanded = expandedId === exp.id;
              return (
                <Grid size={{ xs: 12, md: 4 }} key={exp.id}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      height: "100%",
                      borderRadius: 2,
                      bgcolor: isDarkCard
                        ? "rgba(30,30,30,0.65)"
                        : "background.paper",
                      boxShadow: isDarkCard
                        ? "0 8px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)"
                        : "0 2px 8px rgba(26,27,30,0.06), inset 0 1px 0 rgba(255,255,255,0.5)",
                      transition:
                        "border-top-color 0.3s ease, box-shadow 0.2s ease",
                      cursor: "default",
                      "&:hover": {
                        boxShadow: isDarkCard
                          ? `0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${cfg.dotBg}80`
                          : "0 6px 20px rgba(26,27,30,0.10), inset 0 1px 0 rgba(255,255,255,0.55)",
                        borderColor: cfg.dotBg,
                      },
                      borderTop: `3px solid ${cfg.dotBg}`,
                    }}
                  >
                    {/* Header: nombre + estado */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 700,
                            fontSize: "1rem",
                            lineHeight: 1.3,
                            color: mode === "dark" ? "#ECEFF1" : "text.primary",
                          }}
                        >
                          {exp.name}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mt: 0.75,
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: cfg.dotBg,
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: cfg.text,
                              fontWeight: 700,
                              letterSpacing: "0.05em",
                            }}
                          >
                            {cfg.label}
                          </Typography>
                          {exp.history.length > 0 && (
                            <Chip
                              label={`${exp.history.length} sims`}
                              size="small"
                              sx={{
                                bgcolor: "rgba(76,175,80,0.18)",
                                color: "#A5D6A7",
                                fontWeight: 700,
                                ml: 1,
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>

                    {/* Métricas */}
                    <Stack spacing={2} sx={{ mt: 1.5 }}>
                      {/* Match Rate */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 1.5,
                          bgcolor: "grey.700",
                          borderRadius: 1.5,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <TrendingUpIcon
                            sx={{ fontSize: 18, color: "#4FC3F7" }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ color: "#B0BEC5", fontWeight: 500 }}
                          >
                            Match Rate
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
                            fontSize: "1.1rem",
                            color: "#E0E0E0",
                          }}
                        >
                          {metrics.matchRate}%
                          {exp.history.length >= 2 && (
                            <Typography
                              component="span"
                              sx={{
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                ml: 0.5,
                                color:
                                  trend > 0
                                    ? "#66BB6A"
                                    : trend < 0
                                      ? "#EF5350"
                                      : "#9E9E9E",
                              }}
                            >
                              {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"}
                            </Typography>
                          )}
                        </Typography>
                      </Box>

                      {/* Engagement */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 1.5,
                          bgcolor: "grey.700",
                          borderRadius: 1.5,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <StarsIcon sx={{ fontSize: 18, color: "#FFD54F" }} />
                          <Typography
                            variant="body2"
                            sx={{ color: "#B0BEC5", fontWeight: 500 }}
                          >
                            Engagement
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
                            fontSize: "1.1rem",
                          }}
                        >
                          {metrics.avgEngagement.toFixed(1)}
                          <Typography
                            component="span"
                            sx={{
                              color: "#B0BEC5",
                              fontWeight: 500,
                              marginLeft: 0.5,
                            }}
                          >
                            / 5
                          </Typography>
                        </Typography>
                      </Box>

                      {/* Duración */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 1.5,
                          bgcolor: "grey.700",
                          borderRadius: 1.5,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <ScheduleIcon
                            sx={{ fontSize: 18, color: "#CFD8DC" }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ color: "#B0BEC5", fontWeight: 500 }}
                          >
                            Duración chat
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: "#FFFFFF",
                          }}
                        >
                          {metrics.chatDuration}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Expandir detalles */}
                    <Box sx={{ mt: 2 }}>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : exp.id)
                        }
                        startIcon={<CompareArrowsIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          color: isDarkCard ? "#90CAF9" : "primary.main",
                          fontWeight: 600,
                          textTransform: "none",
                          fontSize: "0.8rem",
                        }}
                      >
                        {isExpanded ? "Ocultar detalles" : "Ver detalles"}
                      </Button>
                      {isExpanded && (
                        <Box
                          sx={{
                            mt: 1.5,
                            p: 1.5,
                            bgcolor: isDarkCard
                              ? "rgba(255,255,255,0.04)"
                              : "grey.50",
                            borderRadius: 1.5,
                            border: `1px solid ${isDarkCard ? "rgba(255,255,255,0.08)" : "rgba(26,27,30,0.08)"}`,
                          }}
                        >
                          {exp.history.length === 0 ? (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontStyle: "italic",
                              }}
                            >
                              Sin simulaciones todavía.
                            </Typography>
                          ) : (
                            <Stack spacing={1}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 700,
                                  color: isDarkCard
                                    ? "#B0BEC5"
                                    : "text.secondary",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                ÚLTIMOS {Math.min(5, exp.history.length)}{" "}
                                RESULTADOS
                              </Typography>
                              {exp.history
                                .slice(-5)
                                .reverse()
                                .map((r, i) => (
                                  <Box
                                    key={i}
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      fontSize: "0.8rem",
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: isDarkCard
                                          ? "#B0BEC5"
                                          : "text.secondary",
                                      }}
                                    >
                                      #{exp.history.length - i} ·{" "}
                                      {r.userA.slice(0, 6)}↔
                                      {r.userB.slice(0, 6)}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontWeight: 700,
                                        color:
                                          r.score >= 70
                                            ? "#66BB6A"
                                            : r.score >= 50
                                              ? "#FFD54F"
                                              : "#EF5350",
                                      }}
                                    >
                                      {r.score}%
                                    </Typography>
                                  </Box>
                                ))}
                            </Stack>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Container>
    </AdminLayout>
  );
}
