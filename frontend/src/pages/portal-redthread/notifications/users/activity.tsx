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
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HistoryIcon from "@mui/icons-material/History";
import SearchIcon from "@mui/icons-material/Search";
import AdminLayout from "../../../../components/layout/AdminLayout";
import adminApiClient from "../../../../services/adminApi";
import { useSnackbar } from "notistack";

interface Delivery {
  id: string;
  user_name: string;
  channel: string;
  status: string;
  title?: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
}

export default function ActivityPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [search, setSearch] = useState("");

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await adminApiClient.get(
        "/portal-redthread/notifications/users/deliveries",
      );
      setDeliveries(res.data || []);
    } catch (error) {
      console.error("Failed to fetch deliveries:", error);
      enqueueSnackbar("Error al cargar entregas", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const statusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "sent":
        return "info";
      case "delivered":
        return "success";
      case "opened":
        return "success";
      case "discarded":
        return "default";
      case "expired":
        return "warning";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  const filtered = deliveries.filter(
    (d) =>
      d.user_name.toLowerCase().includes(search.toLowerCase()) ||
      d.channel.toLowerCase().includes(search.toLowerCase()) ||
      (d.title || "").toLowerCase().includes(search.toLowerCase()),
  );

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
                  📊 Actividad y Entregas
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Historial de entregas de notificaciones a usuarios
                </Typography>
              </Box>
            </Box>
            <TextField
              fullWidth
              size="small"
              label="Buscar usuario, canal o título"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <SearchIcon sx={{ color: "text.secondary" }} />
                  ),
                },
              }}
            />
          </Box>

          <Paper sx={{ p: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Canal</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Título</TableCell>
                    <TableCell>Enviada</TableCell>
                    <TableCell>Entregada</TableCell>
                    <TableCell>Abierta</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {d.user_name}
                      </TableCell>
                      <TableCell>{d.channel}</TableCell>
                      <TableCell>
                        <Chip
                          label={d.status}
                          size="small"
                          color={statusColor(d.status)}
                        />
                      </TableCell>
                      <TableCell>{d.title || "-"}</TableCell>
                      <TableCell>
                        {d.sent_at ? new Date(d.sent_at).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell>
                        {d.delivered_at
                          ? new Date(d.delivered_at).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {d.opened_at
                          ? new Date(d.opened_at).toLocaleString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        sx={{ textAlign: "center", color: "text.secondary" }}
                      >
                        No hay entregas registradas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Container>
    </AdminLayout>
  );
}
