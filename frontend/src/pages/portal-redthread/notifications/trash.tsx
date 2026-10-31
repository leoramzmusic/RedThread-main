import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tooltip,
  IconButton,
} from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import RestoreIcon from "@mui/icons-material/Restore";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AdminLayout from "../../../components/layout/AdminLayout";
import adminApiClient from "../../../services/adminApi";
import { useSnackbar } from "notistack";

interface TrashItem {
  id: string;
  tipo: string;
  nombre: string;
  categoria: string;
  eliminado_por: string;
  fecha_eliminacion: string | null;
  recipient_type: string;
  priority: string;
}

interface TrashResponse {
  items: TrashItem[];
  total: number;
}

export default function NotificationTrashPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<TrashItem[]>([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "restore" | "delete" | null
  >(null);

  const API_TRASH = "/api/admin/notifications/trash";

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await adminApiClient.get<TrashResponse>(API_TRASH);
      setItems(res.data?.items || []);
    } catch (error) {
      console.error("Failed to fetch trash:", error);
      enqueueSnackbar("Error al cargar la papelera", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const formatDate = (iso: string | null) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString("es-ES");
    } catch {
      return "-";
    }
  };

  const handleRestore = (id: string) => {
    setPendingId(id);
    setPendingAction("restore");
    setOpenRestoreDialog(true);
  };

  const handleDelete = (id: string) => {
    setPendingId(id);
    setPendingAction("delete");
    setOpenDeleteDialog(true);
  };

  const confirmAction = async () => {
    if (!pendingId || !pendingAction) return;
    try {
      if (pendingAction === "restore") {
        await adminApiClient.post(`${API_TRASH}/${pendingId}/restore`);
        enqueueSnackbar("Ítem restaurado correctamente", {
          variant: "success",
        });
      } else {
        await adminApiClient.delete(`${API_TRASH}/${pendingId}`);
        enqueueSnackbar("Ítem eliminado definitivamente", {
          variant: "success",
        });
      }
      setOpenDeleteDialog(false);
      setOpenRestoreDialog(false);
      setPendingId(null);
      setPendingAction(null);
      fetchTrash();
    } catch (error) {
      console.error("Trash action failed:", error);
      enqueueSnackbar("Error al ejecutar la acción", { variant: "error" });
      setOpenDeleteDialog(false);
      setOpenRestoreDialog(false);
      setPendingId(null);
      setPendingAction(null);
    }
  };

  const handleEmptyTrash = async () => {
    if (
      !window.confirm(
        "¿Seguro que deseas vaciar la papelera? Esta acción es irreversible.",
      )
    )
      return;
    try {
      await adminApiClient.delete(API_TRASH);
      enqueueSnackbar("Papelera vaciada correctamente", { variant: "success" });
      fetchTrash();
    } catch (error) {
      console.error("Failed to empty trash:", error);
      enqueueSnackbar("Error al vaciar la papelera", { variant: "error" });
    }
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "Alerta":
      case "alert":
        return "warning";
      case "Seguridad":
      case "security":
        return "error";
      case "Operacional":
      case "operational":
        return "info";
      case "Mantenimiento":
      case "maintenance":
        return "default";
      default:
        return "primary";
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
              <DeleteOutlinedIcon sx={{ fontSize: 36, color: "error.main" }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  Papelera Global - Gestor de Notificaciones
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Elementos eliminados de todas las audiencias (usuarios,
                  empleados, marcas)
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RestoreIcon />}
                onClick={fetchTrash}
              >
                Actualizar
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteForeverIcon />}
                onClick={handleEmptyTrash}
                disabled={items.length === 0}
              >
                Vaciar Papelera
              </Button>
            </Box>
          </Box>

          {items.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: "center" }}>
              <RestoreIcon
                sx={{ fontSize: 80, color: "text.disabled", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                Papelera vacía
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No hay elementos eliminados en la papelera global.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table sx={{ fontSize: "0.9rem" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 60 }}>
                      Tipo
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 120 }}>
                      Categoría
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 150 }}>
                      Eliminado por
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 160 }}>
                      Fecha de eliminación
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, width: 140, textAlign: "center" }}
                    >
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.id}
                      sx={{
                        "&:last-child td": {
                          borderBottom: "1px solid",
                          borderColor: "divider",
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>
                        <Chip
                          label={item.tipo}
                          size="small"
                          variant="outlined"
                          sx={{ height: 24, fontSize: "0.75rem" }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {item.nombre}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.categoria}
                          size="small"
                          color={categoryColor(item.categoria)}
                          sx={{ fontSize: "0.75rem", height: 24 }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{ color: "text.secondary", fontSize: "0.85rem" }}
                      >
                        {item.eliminado_por}
                      </TableCell>
                      <TableCell
                        sx={{ color: "text.secondary", fontSize: "0.85rem" }}
                      >
                        {formatDate(item.fecha_eliminacion)}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Tooltip title="Restaurar">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleRestore(item.id)}
                          >
                            <RestoreIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar definitivamente">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(item.id)}
                          >
                            <DeleteForeverIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {items.length} ítem{items.length !== 1 ? "s" : ""} en la papelera
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={handleEmptyTrash}
              disabled={items.length === 0}
            >
              Vaciar Papelera Completa
            </Button>
          </Box>
        </Box>

        <Dialog
          open={openRestoreDialog}
          onClose={() => setOpenRestoreDialog(false)}
          maxWidth="sm"
        >
          <DialogTitle>¿Restaurar elemento?</DialogTitle>
          <DialogContent>
            <Typography>
              ¿Estás seguro de que deseas restaurar este elemento? Vuelve a
              estar disponible en su audiencia original.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRestoreDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={confirmAction}
              autoFocus
            >
              Restaurar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          maxWidth="sm"
        >
          <DialogTitle>¿Eliminar definitivamente?</DialogTitle>
          <DialogContent>
            <Typography>
              Esta acción es irreversible. El elemento se eliminará
              permanentemente del sistema.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
            <Button
              variant="contained"
              color="error"
              onClick={confirmAction}
              autoFocus
            >
              Eliminar Definitivamente
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminLayout>
  );
}
