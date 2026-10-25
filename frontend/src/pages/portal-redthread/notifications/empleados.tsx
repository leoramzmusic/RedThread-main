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
  IconButton,
  Chip,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import RefreshIcon from "@mui/icons-material/Refresh";
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

export default function EmpleadosNotificationDashboard() {
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

  const fetchKPIs = async () => {
    setLoading(true);
    try {
      const res = await adminApiClient.get(
        "/portal-redthread/notifications/kpis",
      );
      setKpis(res.data);
    } catch (error) {
      console.error("Failed to fetch notification KPIs:", error);
      enqueueSnackbar("Error al cargar KPIs de empleados", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

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
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 4,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton onClick={() => router.push("/portal-redthread")}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  🛡️ Notificaciones Empleados - Dashboard Operativo
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Centro de supervisión operativa y alertas internas para el
                  personal RETH
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchKPIs}
              >
                Actualizar
              </Button>
              <Button
                variant="contained"
                onClick={() => router.push("/portal-redthread/notifications")}
              >
                Ver Buzón Interno
              </Button>
            </Box>
          </Box>

          {/* KPI Cards Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card
                sx={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  color: "white",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ opacity: 0.9, fontWeight: 600 }}
                    >
                      ENVIADAS HOY
                    </Typography>
                    <SendIcon sx={{ opacity: 0.8, fontSize: 32 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {kpis.enviadas_hoy}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    Alertas operativas emitidas hoy
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card
                sx={{
                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                  color: "white",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ opacity: 0.9, fontWeight: 600 }}
                    >
                      NO LEÍDAS
                    </Typography>
                    <MarkEmailUnreadIcon sx={{ opacity: 0.8, fontSize: 32 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {kpis.no_leidas}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    Alertas pendientes por staff
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card
                sx={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                  color: "white",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ opacity: 0.9, fontWeight: 600 }}
                    >
                      ALERTAS P0
                    </Typography>
                    <WarningAmberIcon sx={{ opacity: 0.9, fontSize: 32 }} />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {kpis.alertas_p0}
                    </Typography>
                    {kpis.alertas_p0 > 0 && (
                      <Chip
                        label="Crítico"
                        size="small"
                        sx={{
                          bgcolor: "white",
                          color: "#b91c1c",
                          fontWeight: 700,
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    Incidentes operativos P0
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card
                sx={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #047857 100%)",
                  color: "white",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ opacity: 0.9, fontWeight: 600 }}
                    >
                      CTR PROMEDIO
                    </Typography>
                    <TrendingUpIcon sx={{ opacity: 0.8, fontSize: 32 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {kpis.ctr_promedio}%
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    Respuesta a comunicaciones
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card
                sx={{
                  background:
                    "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
                  color: "white",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ opacity: 0.9, fontWeight: 600 }}
                    >
                      PENDIENTES
                    </Typography>
                    <AssignmentLateIcon sx={{ opacity: 0.8, fontSize: 32 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {kpis.acciones_pendientes}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    Tickets de soporte y escalaciones
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Quick links */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Gestión Operativa - Empleados
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                onClick={() =>
                  router.push("/portal-redthread/empleados/listado")
                }
              >
                Listado de Empleados
              </Button>
              <Button
                variant="outlined"
                onClick={() => router.push("/portal-redthread/soporte/tickets")}
              >
                Tickets de Soporte
              </Button>
              <Button
                variant="outlined"
                onClick={() => router.push("/portal-redthread/denuncias")}
              >
                Denuncias Operativas
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </AdminLayout>
  );
}
