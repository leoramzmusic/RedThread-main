import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Table,
  TableContainer,
  TableBody,
  TableCell,
  TableRow,
  LinearProgress,
  Chip,
  Divider,
} from "@mui/material";
import {
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  MailOutlined as MailOutlineIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Shield as ShieldIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  ShieldOutlined as ShieldOutlineIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import AdminLayout from "../../../components/layout/AdminLayout";
import adminApiClient from "../../../services/adminApi";
import { useSnackbar } from "notistack";

interface KPIResponse {
  enviadas_hoy: number;
  no_leidas: number;
  alertas_p0: number;
  ctr_promedio: number;
  acciones_pendientes: number;
}

interface AudienceItem {
  type: string;
  key: string;
  count: number;
  percentage: number;
}

interface AudiencesResponse {
  audiences: AudienceItem[];
  total: number;
}

interface ActivityItem {
  id: string;
  timestamp: string;
  campaign: string;
  audience: string;
  recipients: number;
  priority: string;
  category: string;
  is_read: boolean;
}

interface ActivityResponse {
  activities: ActivityItem[];
}

interface CampaignItem {
  id: string;
  name: string;
  scheduled_at: string | null;
  type: string;
  audience: string;
  status: string;
  sent_count: number;
}

interface ScheduledCampaignsResponse {
  campaigns: CampaignItem[];
}

interface SystemHealthResponse {
  alertas_criticas: number;
  acciones_requeridas: number;
  push_fallidas: number;
  campanas_activas: number;
  estado: string;
  timestamp: string;
}

const API_BASE = "/api/admin/notifications";

async function fetchJson<T>(path: string): Promise<T> {
  const lastErr: any = {};
  const candidates = [
    `${API_BASE}${path}`,
    `/portal-redthread/notifications${path.replace("/kpis", "")}`,
  ];
  for (const url of candidates) {
    try {
      const res = await adminApiClient.get(url);
      return res.data as T;
    } catch (err: any) {
      lastErr[url] = err;
    }
  }
  throw lastErr[candidates[0]] || new Error(`Failed to fetch ${path}`);
}

export default function NotificationDashboardPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIResponse>({
    enviadas_hoy: 0,
    no_leidas: 0,
    alertas_p0: 0,
    ctr_promedio: 0.0,
    acciones_pendientes: 0,
  });
  const [audiences, setAudiences] = useState<AudienceItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [scheduledCampaigns, setScheduledCampaigns] = useState<CampaignItem[]>(
    [],
  );
  const [systemHealth, setSystemHealth] = useState<SystemHealthResponse>({
    alertas_criticas: 0,
    acciones_requeridas: 0,
    push_fallidas: 0,
    campanas_activas: 0,
    estado: "operativo",
    timestamp: "",
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [kpisRes, audiencesRes, activityRes, campaignsRes, healthRes] =
        await Promise.all([
          fetchJson<KPIResponse>("/kpis"),
          fetchJson<AudiencesResponse>("/kpis/audiences"),
          fetchJson<ActivityResponse>("/activity/recent"),
          fetchJson<ScheduledCampaignsResponse>("/campaigns/scheduled"),
          fetchJson<SystemHealthResponse>("/system/health"),
        ]);
      setKpis(kpisRes);
      setAudiences(audiencesRes.audiences || []);
      setActivities(activityRes.activities || []);
      setScheduledCampaigns(campaignsRes.campaigns || []);
      setSystemHealth(healthRes);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      enqueueSnackbar("Error al cargar el dashboard ejecutivo", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const formatTimeAgo = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return "Hace un momento";
      if (diffMin < 60) return `Hace ${diffMin} min`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return `Hace ${diffH} h`;
      return `Hace ${Math.floor(diffH / 24)} d`;
    } catch {
      return "";
    }
  };

  const audienceColor = (key: string) => {
    switch (key) {
      case "users":
        return "primary.main";
      case "employees":
        return "secondary.main";
      case "brands":
        return "warning.main";
      default:
        return "info.main";
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "80vh",
          }}
        >
          <CircularProgress size={40} />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 3,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <ShieldOutlineIcon sx={{ fontSize: 36, color: "primary.main" }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  Dashboard Ejecutivo - Gestor de Notificaciones
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Centro de control de comunicaciones, alertas y campañas RETH
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchAll}
              >
                Actualizar
              </Button>
            </Box>
          </Box>

          {/* KPI Cards Row */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card
                sx={{
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 3,
                  boxShadow: 1,
                  transition: "transform 0.2s",
                  "&:hover": { transform: "translateY(-4px)" },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "text.secondary",
                      }}
                    >
                      Enviadas Hoy
                    </Typography>
                    <SendIcon
                      sx={{ fontSize: 28, color: "primary.main", opacity: 0.8 }}
                    />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                    {kpis.enviadas_hoy}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Notificaciones y campañas emitidas hoy
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card
                sx={{
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 3,
                  boxShadow: 1,
                  "&:hover": {
                    transform: "translateY(-4px)",
                    transition: "transform 0.2s",
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "text.secondary",
                      }}
                    >
                      Entregadas
                    </Typography>
                    <CheckCircleIcon
                      sx={{ fontSize: 28, color: "success.main", opacity: 0.8 }}
                    />
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 800, mb: 0.5, color: "success.main" }}
                  >
                    {kpis.enviadas_hoy}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Notificaciones entregadas a destinatarios
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card
                sx={{
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 3,
                  boxShadow: 1,
                  "&:hover": {
                    transform: "translateY(-4px)",
                    transition: "transform 0.2s",
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "text.secondary",
                      }}
                    >
                      Leídas
                    </Typography>
                    <MailOutlineIcon
                      sx={{ fontSize: 28, color: "info.main", opacity: 0.8 }}
                    />
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 800, mb: 0.5, color: "info.main" }}
                  >
                    {Math.max(kpis.enviadas_hoy - kpis.no_leidas, 0)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Notificaciones leídas por destinatarios
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card
                sx={{
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 3,
                  boxShadow: 1,
                  "&:hover": {
                    transform: "translateY(-4px)",
                    transition: "transform 0.2s",
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "text.secondary",
                      }}
                    >
                      Pendientes
                    </Typography>
                    <AssignmentIcon
                      sx={{ fontSize: 28, color: "warning.main", opacity: 0.8 }}
                    />
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 800, mb: 0.5, color: "warning.main" }}
                  >
                    {kpis.acciones_pendientes}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Tickets, reportes y aprobaciones pendientes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card
                sx={{
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 3,
                  boxShadow: 2,
                  border: "1px solid",
                  borderColor: "error.main",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    transition: "transform 0.2s",
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "error.main",
                      }}
                    >
                      Alertas Críticas (P0)
                    </Typography>
                    <WarningIcon
                      sx={{ fontSize: 28, color: "error.main", opacity: 0.9 }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{ fontWeight: 800, color: "error.main" }}
                    >
                      {kpis.alertas_p0}
                    </Typography>
                    <Chip
                      label="P0"
                      size="small"
                      color="error"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Incidentes críticos y escalaciones activas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Distribución por audiencia */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                sx={{
                  p: 2.5,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <PeopleIcon
                    sx={{ fontSize: 24, color: "primary.main", mr: 1 }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Distribución por Audiencia
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {audiences.map((a) => (
                  <Box key={a.key} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, width: 80 }}
                      >
                        {a.type}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {a.percentage}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={a.percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: audienceColor(a.key),
                          borderRadius: 4,
                        },
                        "& .MuiLinearProgress-barColorPrimary": {
                          backgroundColor: audienceColor(a.key),
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", mt: 0.5 }}
                    >
                      {a.count} notificación{a.count !== 1 ? "es" : ""}
                    </Typography>
                  </Box>
                ))}
                {audiences.length === 0 && (
                  <Box
                    sx={{ textAlign: "center", py: 2, color: "text.secondary" }}
                  >
                    Sin datos de audiencia disponibles
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Actividad reciente */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 2.5, height: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <ScheduleIcon
                    sx={{ fontSize: 24, color: "primary.main", mr: 1 }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Actividad Reciente
                  </Typography>
                </Box>
                <Divider sx={{ mb: 1.5 }} />
                {activities.length > 0 ? (
                  <TableContainer>
                    <Table size="small" sx={{ fontSize: "0.85rem" }}>
                      <TableBody>
                        {activities.map((a) => (
                          <TableRow
                            key={a.id}
                            sx={{ "&:last-child td": { borderBottom: 0 } }}
                          >
                            <TableCell sx={{ width: 56, py: 1 }}>
                              <Chip
                                label={a.priority}
                                size="small"
                                color={
                                  a.priority === "P0"
                                    ? "error"
                                    : a.priority === "P1"
                                      ? "warning"
                                      : "default"
                                }
                                sx={{
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  height: 20,
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ py: 1, fontWeight: 500 }}>
                              {a.campaign}
                            </TableCell>
                            <TableCell sx={{ py: 1, fontWeight: 400 }}>
                              {a.audience} · {a.recipients} usuari
                              {a.recipients === 1 ? "o" : "os"}
                            </TableCell>
                            <TableCell
                              sx={{
                                py: 1,
                                color: "text.secondary",
                                fontSize: "0.75rem",
                              }}
                            >
                              {formatTimeAgo(a.timestamp)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box
                    sx={{ textAlign: "center", py: 2, color: "text.secondary" }}
                  >
                    Sin actividad reciente registrada
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Próximas campañas */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 2.5, height: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <TrendingUpIcon
                    sx={{ fontSize: 24, color: "primary.main", mr: 1 }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Próximas Campañas
                  </Typography>
                </Box>
                <Divider sx={{ mb: 1.5 }} />
                {scheduledCampaigns.length > 0 ? (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                  >
                    {scheduledCampaigns.map((c) => (
                      <Card
                        key={c.id}
                        sx={{
                          p: 1.5,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        >
                          {c.name}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {c.type} · {c.audience}
                          </Typography>
                          <Chip
                            label={c.status}
                            size="small"
                            color="primary"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          {c.scheduled_at
                            ? new Date(c.scheduled_at).toLocaleString("es-ES")
                            : "Pendiente"}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", mt: 0.5 }}
                        >
                          {c.sent_count} enviad{c.sent_count !== 1 ? "as" : "a"}
                        </Typography>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Box
                    sx={{ textAlign: "center", py: 2, color: "text.secondary" }}
                  >
                    No hay campañas programadas
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 3 }}>
            {/* Estado del sistema */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2.5, height: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <ShieldIcon
                    sx={{ fontSize: 24, color: "primary.main", mr: 1 }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Estado del Sistema
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Alertas Críticas
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color:
                          systemHealth.alertas_criticas > 0
                            ? "error.main"
                            : "success.main",
                      }}
                    >
                      {systemHealth.alertas_criticas}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Acciones Requeridas
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "warning.main" }}
                    >
                      {systemHealth.acciones_requeridas}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Push Fallidas
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "error.main" }}
                    >
                      {systemHealth.push_fallidas}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Campañas Activas
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "success.main" }}
                    >
                      {systemHealth.campanas_activas}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      mt: 2,
                      pt: 1,
                      borderTop: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        Estado General
                      </Typography>
                      <Chip
                        label={
                          systemHealth.estado === "operativo"
                            ? "Operativo"
                            : "Requiere Atención"
                        }
                        size="small"
                        color={
                          systemHealth.estado === "operativo"
                            ? "success"
                            : "warning"
                        }
                      />
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Accesos rápidos */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2.5, height: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <AddIcon
                    sx={{ fontSize: 24, color: "primary.main", mr: 1 }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Accesos Rápidos
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1.5,
                  }}
                >
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<SendIcon />}
                    size="large"
                    sx={{ justifyContent: "flex-start", py: 1.5 }}
                    onClick={() =>
                      router.push("/portal-redthread/notifications")
                    }
                  >
                    + Nueva Notificación
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    sx={{ justifyContent: "flex-start", py: 1.5 }}
                    onClick={() =>
                      router.push("/portal-redthread/notifications/templates")
                    }
                  >
                    + Nueva Plantilla
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    sx={{ justifyContent: "flex-start", py: 1.5 }}
                    onClick={() =>
                      router.push("/portal-redthread/notifications/audiences")
                    }
                  >
                    + Nueva Audiencia
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<TrendingUpIcon />}
                    size="large"
                    sx={{ justifyContent: "flex-start", py: 1.5 }}
                    onClick={() => router.push("/portal-redthread/campanas")}
                  >
                    + Nueva Campaña
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ScheduleIcon />}
                    size="large"
                    sx={{ justifyContent: "flex-start", py: 1.5 }}
                    onClick={() =>
                      router.push("/portal-redthread/notifications/campaigns")
                    }
                  >
                    + Programar Campaña
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    sx={{ justifyContent: "flex-start", py: 1.5 }}
                    onClick={() =>
                      router.push("/portal-redthread/notifications/trash")
                    }
                  >
                    🗑️ Papelera Global
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </AdminLayout>
  );
}
