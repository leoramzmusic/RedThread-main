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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import ErrorIcon from "@mui/icons-material/Error";
import PeopleIcon from "@mui/icons-material/People";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import RefreshIcon from "@mui/icons-material/Refresh";
import AdminLayout from "../../../../components/layout/AdminLayout";
import adminApiClient from "../../../../services/adminApi";
import { useSnackbar } from "notistack";

interface BrandsKPIResponse {
  enviadas_hoy: number;
  entregadas: number;
  leidas: number;
  pendientes: number;
  push_fallidas: number;
  marcas_alcanzadas: number;
  campanas_activas: number;
}

export default function BrandsDashboardPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<BrandsKPIResponse>({
    enviadas_hoy: 0,
    entregadas: 0,
    leidas: 0,
    pendientes: 0,
    push_fallidas: 0,
    marcas_alcanzadas: 0,
    campanas_activas: 0,
  });

  const fetchKPIs = async () => {
    setLoading(true);
    try {
      const res = await adminApiClient.get(
        "/api/admin/notifications/brands/metrics",
      );
      setKpis(res.data);
    } catch (error) {
      console.error("Failed to fetch brands KPIs:", error);
      try {
        const resAlt = await adminApiClient.get(
          "/api/admin/notifications/brands/kpis",
        );
        setKpis(resAlt.data);
      } catch (err2) {
        enqueueSnackbar("Error al cargar KPIs de marcas", {
          variant: "error",
        });
      }
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
                  🏷️ Dashboard Marcas
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  KPIs y estado de notificaciones dirigidas a marcas
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
                Ver Bandeja Completa
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                    Notificaciones enviadas hoy a marcas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                      ENTREGADAS
                    </Typography>
                    <CheckCircleIcon sx={{ opacity: 0.8, fontSize: 32 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {kpis.entregadas}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    Notificaciones entregadas correctamente
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                      LEÍDAS
                    </Typography>
                    <MarkEmailUnreadIcon sx={{ opacity: 0.8, fontSize: 32 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {kpis.leidas}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    Notificaciones abiertas por marcas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                    {kpis.pendientes}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    Notificaciones pendientes de entrega
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                      PUSH FALLIDAS
                    </Typography>
                    <ErrorIcon sx={{ opacity: 0.8, fontSize: 32 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {kpis.push_fallidas}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    Notificaciones push que fallaron al enviar
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  background:
                    "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
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
                      MARCAS ALCANZADAS
                    </Typography>
                    <PeopleIcon sx={{ opacity: 0.8, fontSize: 32 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {kpis.marcas_alcanzadas}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    Marcas únicas con notificaciones activas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                      CAMPANAS ACTIVAS
                    </Typography>
                    <TrendingUpIcon sx={{ opacity: 0.8, fontSize: 32 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {kpis.campanas_activas}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    Campañas de notificación activas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Gestión Rápida - Marcas
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                onClick={() =>
                  router.push("/portal-redthread/notifications/brands/create")
                }
              >
                + Nueva Notificación
              </Button>
              <Button
                variant="outlined"
                onClick={() =>
                  router.push(
                    "/portal-redthread/notifications/brands/campaigns",
                  )
                }
              >
                Campañas
              </Button>
              <Button
                variant="outlined"
                onClick={() =>
                  router.push(
                    "/portal-redthread/notifications/brands/templates",
                  )
                }
              >
                Plantillas
              </Button>
              <Button
                variant="outlined"
                onClick={() =>
                  router.push(
                    "/portal-redthread/notifications/brands/audiences",
                  )
                }
              >
                Audiencias
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </AdminLayout>
  );
}
