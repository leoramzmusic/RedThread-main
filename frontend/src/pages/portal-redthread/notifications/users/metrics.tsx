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
  Chip,
  Divider,
  LinearProgress,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BarChartIcon from "@mui/icons-material/BarChart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PeopleIcon from "@mui/icons-material/People";
import SendIcon from "@mui/icons-material/Send";
import ErrorIcon from "@mui/icons-material/Error";
import RefreshIcon from "@mui/icons-material/Refresh";
import AdminLayout from "../../../../components/layout/AdminLayout";
import adminApiClient from "../../../../services/adminApi";
import { useSnackbar } from "notistack";

interface MetricsResponse {
  ctr: number;
  open_rate: number;
  conversion_rate: number;
  users_reached: number;
  push_delivered: number;
  push_failed: number;
  campaigns_comparison: Array<{
    name: string;
    sent: number;
    opened: number;
    clicked: number;
    ctr: number;
  }>;
}

export default function MetricsPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricsResponse>({
    ctr: 0,
    open_rate: 0,
    conversion_rate: 0,
    users_reached: 0,
    push_delivered: 0,
    push_failed: 0,
    campaigns_comparison: [],
  });

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await adminApiClient.get(
        "/portal-redthread/notifications/users/metrics",
      );
      setMetrics(res.data);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
      enqueueSnackbar("Error al cargar métricas", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
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
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton onClick={() => router.back()}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  📈 Métricas de Usuarios
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Análisis profundo de engagement y entrega de notificaciones
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchMetrics}
              >
                Actualizar
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: "100%" }}>
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
                      CTR
                    </Typography>
                    <BarChartIcon sx={{ opacity: 0.8, fontSize: 32 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {metrics.ctr}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(metrics.ctr, 100)}
                    sx={{ height: 4, mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: "100%" }}>
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
                      TASA DE APERTURA
                    </Typography>
                    <TrendingUpIcon sx={{ opacity: 0.8, fontSize: 32 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {metrics.open_rate}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(metrics.open_rate, 100)}
                    sx={{ height: 4, mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: "100%" }}>
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
                      CONVERSIÓN
                    </Typography>
                    <PeopleIcon sx={{ opacity: 0.8, fontSize: 32 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {metrics.conversion_rate}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(metrics.conversion_rate, 100)}
                    sx={{ height: 4, mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: "100%" }}>
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
                      USUARIOS ALCANZADOS
                    </Typography>
                    <SendIcon sx={{ opacity: 0.8, fontSize: 32 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {metrics.users_reached}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    Usuarios únicos impactados
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: "100%" }}>
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
                      PUSH ENTREGADAS
                    </Typography>
                    <TrendingUpIcon sx={{ opacity: 0.8, fontSize: 32 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {metrics.push_delivered}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    Notificaciones push entregadas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: "100%" }}>
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
                    {metrics.push_failed}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    Notificaciones push fallidas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Comparativa de Campañas
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {metrics.campaigns_comparison.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  textAlign: "center",
                  color: "text.secondary",
                }}
              >
                <Typography variant="body1">
                  No hay datos de campañas para comparar.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
                {metrics.campaigns_comparison.map((camp) => (
                  <Card
                    key={camp.name}
                    sx={{
                      p: 1,
                      mb: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {camp.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        Enviadas: {camp.sent} · Abiertas: {camp.opened} · Clics:{" "}
                        {camp.clicked}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "baseline", gap: 1 }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {camp.ctr}%
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        CTR
                      </Typography>
                    </Box>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      </Container>
    </AdminLayout>
  );
}
