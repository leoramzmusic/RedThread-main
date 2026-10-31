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
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import RestoreIcon from "@mui/icons-material/Restore";
import AdminLayout from "../../../../components/layout/AdminLayout";
import adminApiClient from "../../../../services/adminApi";
import { useSnackbar } from "notistack";

interface TrashItem {
  id: string;
  type: string;
  name: string;
  deleted_at: string;
  deleted_by?: string;
}

export default function TrashPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<TrashItem[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<TrashItem | null>(null);
  const [actionType, setActionType] = useState<"restore" | "delete">("restore");

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await adminApiClient.get(
        "/api/admin/notifications/brands/trash",
      );
      setItems(res.data || []);
    } catch (error) {
      console.error("Failed to fetch trash:", error);
      enqueueSnackbar("Error al cargar papelera", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (id: string) => {
    try {
      await adminApiClient.post(
        `/api/admin/notifications/brands/trash/${id}/restore`,
      );
      enqueueSnackbar("Elemento restaurado", { variant: "success" });
      fetchTrash();
    } catch (error) {
      console.error("Restore failed:", error);
      enqueueSnackbar("Error al restaurar el elemento", { variant: "error" });
    }
  };

  const handlePurge = async (id: string) => {
    try {
      await adminApiClient.delete(
        `/api/admin/notifications/brands/trash/${id}`,
      );
      enqueueSnackbar("Elemento eliminado definitivamente", {
        variant: "success",
      });
      fetchTrash();
    } catch (error) {
      console.error("Purge failed:", error);
      enqueueSnackbar("Error al eliminar el elemento", { variant: "error" });
    }
  };

  const handleConfirm = () => {
    if (!pendingItem) return;
    if (actionType === "restore") {
      handleRestore(pendingItem.id);
    } else {
      handlePurge(pendingItem.id);
    }
    setConfirmOpen(false);
    setPendingItem(null);
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
                  🗑️ Papelera de Marcas
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Elementos eliminados del módulo de notificaciones de marcas
                </Typography>
              </Box>
            </Box>
            <Button variant="outlined" onClick={() => router.back()}>
              Volver
            </Button>
          </Box>

          {items.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                La papelera está vacía.
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 3 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Eliminado por</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell sx={{ textAlign: "right" }}>
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.type}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {item.name}
                        </TableCell>
                        <TableCell>{item.deleted_by || "-"}</TableCell>
                        <TableCell>
                          {new Date(item.deleted_at).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ textAlign: "right" }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setPendingItem(item);
                              setActionType("restore");
                              setConfirmOpen(true);
                            }}
                            title="Restaurar"
                          >
                            <RestoreIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setPendingItem(item);
                              setActionType("delete");
                              setConfirmOpen(true);
                            }}
                            title="Eliminar definitivamente"
                          >
                            <DeleteForeverIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          <Dialog
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            maxWidth="sm"
          >
            <DialogTitle>
              {actionType === "restore"
                ? "¿Restaurar elemento?"
                : "¿Eliminar definitivamente?"}
            </DialogTitle>
            <DialogContent>
              {pendingItem && (
                <Typography>
                  ¿Estás seguro de que quieres{" "}
                  {actionType === "restore"
                    ? "restaurar"
                    : "eliminar definitivamente"}{" "}
                  "{pendingItem.name}"?
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
              <Button variant="contained" onClick={handleConfirm} autoFocus>
                {actionType === "restore" ? "Restaurar" : "Eliminar"}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </AdminLayout>
  );
}
