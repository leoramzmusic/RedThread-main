import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
  Grid,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
} from "@mui/material";
import AdminLayout from "../../../components/layout/AdminLayout";
import HistoryIcon from "@mui/icons-material/History";
import ReplayIcon from "@mui/icons-material/Replay";
import PersonIcon from "@mui/icons-material/Person";
import PsychologyIcon from "@mui/icons-material/Psychology";
import FunctionsIcon from "@mui/icons-material/Functions";
import BarChartIcon from "@mui/icons-material/BarChart";
import ScienceIcon from "@mui/icons-material/Science";
import BadgeIcon from "@mui/icons-material/Badge";
import EventIcon from "@mui/icons-material/Event";

type ChangeType = "adjustment" | "rollback" | "experiment" | "narrative";

const auditLog = [
  {
    id: "log_001",
    timestamp: "2026-10-14 15:32",
    admin: "admin@redthread.com",
    action: "weights_updated",
    module: "criteria",
    details: "Pesos de Compatibility actualizados: Engagement 10% → 12%",
    type: "adjustment" as ChangeType,
    icon: <BarChartIcon />,
  },
  {
    id: "log_002",
    timestamp: "2026-10-14 11:20",
    admin: "admin@redthread.com",
    action: "formula_modified",
    module: "equation",
    details: "Factor Caos ajustado de 5% a 8%",
    type: "rollback" as ChangeType,
    icon: <FunctionsIcon />,
  },
  {
    id: "log_003",
    timestamp: "2026-10-13 16:45",
    admin: "supervisor@redthread.com",
    action: "experiment_created",
    module: "lab",
    details: "Nuevo experimento: Neurodiversidad Boost",
    type: "experiment" as ChangeType,
    icon: <ScienceIcon />,
  },
  {
    id: "log_004",
    timestamp: "2026-10-13 09:12",
    admin: "admin@redthread.com",
    action: "rollback_executed",
    module: "equation",
    details: "Rollback a fórmula v2.0 aplicado",
    type: "rollback" as ChangeType,
    icon: <ReplayIcon />,
  },
  {
    id: "log_005",
    timestamp: "2026-10-12 14:00",
    admin: "supervisor@redthread.com",
    action: "interpreter_config",
    module: "interpreter",
    details: 'Tono narrativo predeterminado cambiado a "Poético"',
    type: "narrative" as ChangeType,
    icon: <PsychologyIcon />,
  },
];

const typeConfig: Record<
  ChangeType,
  { color: string; bgColor: string; label: string }
> = {
  adjustment: { color: "info.main", bgColor: "info.light", label: "Ajuste" },
  rollback: { color: "error.main", bgColor: "error.light", label: "Rollback" },
  experiment: {
    color: "success.main",
    bgColor: "success.light",
    label: "Experimento",
  },
  narrative: {
    color: "secondary.main",
    bgColor: "secondary.light",
    label: "Narrativa",
  },
};

export default function CareAuditPage() {
  const [confirmRollback, setConfirmRollback] = useState<string | null>(null);

  const activeAdmins = [...new Set(auditLog.map((l) => l.admin))];
  const lastRollback =
    auditLog.find((l) => l.type === "rollback") ??
    auditLog[auditLog.length - 1];

  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          {/* Header */}
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
                  borderRadius: 2,
                  display: "flex",
                  mr: 2,
                  boxShadow: "0 4px 12px rgba(255,77,79,0.3)",
                }}
              >
                <HistoryIcon sx={{ fontSize: 32, color: "white" }} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}
                >
                  Historial & Auditoría
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Registro de cambios, rollback y trazabilidad de admins.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Grid container spacing={4}>
            {/* Registro de Cambios */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Registro de Cambios
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  {auditLog.map((log) => {
                    const config = typeConfig[log.type];
                    return (
                      <Paper
                        key={log.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          transition: "all 0.2s ease",
                          borderLeft: "4px solid",
                          borderColor: config.color,
                          "&:hover": {
                            bgcolor: "action.hover",
                            boxShadow: 2,
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 2,
                          }}
                        >
                          {/* Icon badge */}
                          <Avatar
                            sx={{
                              bgcolor: config.bgColor,
                              width: 40,
                              height: 40,
                              flexShrink: 0,
                              color: config.color,
                            }}
                          >
                            {log.icon}
                          </Avatar>

                          {/* Contenido */}
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 700, lineHeight: 1.3 }}
                              >
                                {log.details}
                              </Typography>
                              <Chip
                                label={config.label}
                                size="small"
                                color="default"
                                sx={{
                                  bgcolor: config.bgColor,
                                  color: config.color,
                                  fontWeight: 700,
                                  fontSize: "0.65rem",
                                  height: 20,
                                  "& .MuiChip-label": { px: 1 },
                                }}
                              />
                            </Box>
                            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                {log.timestamp}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                <PersonIcon sx={{ fontSize: 12 }} /> {log.admin}
                              </Typography>
                            </Stack>
                          </Box>

                          {/* Rollback button */}
                          <Tooltip title="Revertir a este punto">
                            <IconButton
                              size="small"
                              onClick={() => setConfirmRollback(log.id)}
                            >
                              <ReplayIcon fontSize="small" color="action" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Paper>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>

            {/* Resumen de Auditoría — Dashboard KPIs */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Resumen de Auditoría
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 2.5, bgcolor: "background.paper" }}
              >
                <Stack spacing={2}>
                  {/* KPI: Cambios esta semana */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: "info.light",
                        borderRadius: 2,
                        color: "info.main",
                      }}
                    >
                      <EventIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{ color: "text.secondary" }}
                      >
                        Cambios esta semana
                      </Typography>
                      <Typography
                        variant="h3"
                        sx={{ fontWeight: 800, lineHeight: 1.1 }}
                      >
                        {auditLog.length}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider />

                  {/* KPI: Admins activos */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: "secondary.light",
                        borderRadius: 2,
                        color: "secondary.main",
                      }}
                    >
                      <BadgeIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{ color: "text.secondary" }}
                      >
                        Admins activos
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mt: 0.5 }}
                      >
                        {activeAdmins.length}
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                        {activeAdmins.map((admin) => (
                          <Chip
                            key={admin}
                            label={admin.split("@")[0]}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  </Box>

                  <Divider />

                  {/* KPI: Último rollback */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: "error.light",
                        borderRadius: 2,
                        color: "error.main",
                      }}
                    >
                      <ReplayIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{ color: "text.secondary" }}
                      >
                        Último rollback
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, mt: 0.5 }}
                      >
                        {lastRollback?.timestamp}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {lastRollback?.details}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Diálogo de confirmación — SIN CAMBIOS */}
      <Dialog
        open={confirmRollback !== null}
        onClose={() => setConfirmRollback(null)}
      >
        <DialogTitle>Confirmar Rollback</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas revertir el estado del motor CARE a este
            punto? Esta acción quedará registrada en la auditoría.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRollback(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => setConfirmRollback(null)}
          >
            Confirmar Rollback
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
