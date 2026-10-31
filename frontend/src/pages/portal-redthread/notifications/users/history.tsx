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

interface AuditEntry {
  id: string;
  actor_name: string;
  action: string;
  target_type: string;
  target_name: string;
  result: string;
  created_at: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await adminApiClient.get(
        "/portal-redthread/notifications/users/history",
      );
      setHistory(res.data || []);
    } catch (error) {
      console.error("Failed to fetch audit history:", error);
      enqueueSnackbar("Error al cargar historial de auditoría", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const resultColor = (result: string) => {
    switch (result.toLowerCase()) {
      case "success":
        return "success";
      case "failed":
        return "error";
      case "warning":
        return "warning";
      default:
        return "default";
    }
  };

  const filtered = history.filter(
    (h) =>
      h.actor_name.toLowerCase().includes(search.toLowerCase()) ||
      h.action.toLowerCase().includes(search.toLowerCase()) ||
      h.target_name.toLowerCase().includes(search.toLowerCase()),
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
                  📜 Historial de Auditoría
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Registro de acciones realizadas en el módulo de usuarios
                </Typography>
              </Box>
            </Box>
            <TextField
              fullWidth
              size="small"
              label="Buscar actor, acción o objetivo"
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
                    <TableCell>Actor</TableCell>
                    <TableCell>Acción</TableCell>
                    <TableCell>Objetivo</TableCell>
                    <TableCell>Resultado</TableCell>
                    <TableCell>Fecha</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {h.actor_name}
                      </TableCell>
                      <TableCell>{h.action}</TableCell>
                      <TableCell>
                        {h.target_type} · {h.target_name}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={h.result}
                          size="small"
                          color={resultColor(h.result)}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(h.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        sx={{ textAlign: "center", color: "text.secondary" }}
                      >
                        No hay registros de auditoría.
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
