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
  TextField,
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
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CampaignIcon from "@mui/icons-material/Campaign";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AdminLayout from "../../../../components/layout/AdminLayout";
import adminApiClient from "../../../../services/adminApi";
import { useSnackbar } from "notistack";

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  audience_id?: string;
  template_id?: string;
  sent_count?: number;
  created_at?: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "draft",
    audience_id: "",
    template_id: "",
  });

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await adminApiClient.get(
        "/api/admin/notifications/employees/campaigns",
      );
      setCampaigns(res.data || []);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      enqueueSnackbar("Error al cargar campañas", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      status: "draft",
      audience_id: "",
      template_id: "",
    });
    setOpen(true);
  };

  const handleOpenEdit = (camp: Campaign) => {
    setEditing(camp);
    setForm({
      name: camp.name || "",
      description: camp.description || "",
      status: camp.status,
      audience_id: camp.audience_id || "",
      template_id: camp.template_id || "",
    });
    setOpen(true);
  };

  const handleChange =
    (key: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleSave = async () => {
    try {
      if (editing) {
        await adminApiClient.put(
          `/api/admin/notifications/employees/campaigns/${editing.id}`,
          {
            name: form.name,
            description: form.description,
            status: form.status,
            audience_id: form.audience_id || undefined,
            template_id: form.template_id || undefined,
          },
        );
        enqueueSnackbar("Campaña actualizada", { variant: "success" });
      } else {
        await adminApiClient.post(
          "/api/admin/notifications/employees/campaigns",
          {
            name: form.name,
            description: form.description,
            status: form.status,
            audience_id: form.audience_id || undefined,
            template_id: form.template_id || undefined,
          },
        );
        enqueueSnackbar("Campaña creada", { variant: "success" });
      }
      setOpen(false);
      fetchCampaigns();
    } catch (error) {
      console.error("Save campaign failed:", error);
      enqueueSnackbar("Error al guardar la campaña", { variant: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Mover esta campaña a la papelera?")) return;
    try {
      await adminApiClient.delete(
        `/api/admin/notifications/employees/campaigns/${id}`,
      );
      enqueueSnackbar("Campaña movida a papelera", { variant: "success" });
      fetchCampaigns();
    } catch (error) {
      console.error("Delete campaign failed:", error);
      enqueueSnackbar("Error al eliminar la campaña", { variant: "error" });
    }
  };

  const handleSend = async (id: string) => {
    if (!window.confirm("¿Enviar esta campaña ahora?")) return;
    try {
      await adminApiClient.post(
        `/api/admin/notifications/employees/campaigns/${id}/send`,
      );
      enqueueSnackbar("Campaña enviada", { variant: "success" });
      fetchCampaigns();
    } catch (error) {
      console.error("Send campaign failed:", error);
      enqueueSnackbar("Error al enviar la campaña", { variant: "error" });
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
                  📢 Campañas de Empleados
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Gestiona campañas de notificación dirigidas a empleados
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              Nueva Campaña
            </Button>
          </Box>

          <Paper sx={{ p: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Enviadas</TableCell>
                    <TableCell>Creada</TableCell>
                    <TableCell sx={{ textAlign: "right" }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campaigns.map((camp) => (
                    <TableRow key={camp.id}>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {camp.name}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={camp.status}
                          size="small"
                          color={
                            camp.status === "sent" || camp.status === "active"
                              ? "success"
                              : camp.status === "draft"
                                ? "default"
                                : "warning"
                          }
                        />
                      </TableCell>
                      <TableCell>{camp.sent_count ?? 0}</TableCell>
                      <TableCell>
                        {camp.created_at
                          ? new Date(camp.created_at).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell sx={{ textAlign: "right" }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(camp)}
                          title="Editar"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleSend(camp.id)}
                          title="Enviar"
                        >
                          <SendIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(camp.id)}
                          title="Eliminar"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {campaigns.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        sx={{ textAlign: "center", color: "text.secondary" }}
                      >
                        No hay campañas disponibles.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {editing ? "Editar Campaña" : "Nueva Campaña"}
            </DialogTitle>
            <DialogContent
              sx={{ display: "flex", flexDirection: "column", gap: 2, py: 1 }}
            >
              <TextField
                fullWidth
                label="Nombre *"
                value={form.name}
                onChange={handleChange("name")}
                required
              />
              <TextField
                fullWidth
                label="Descripción"
                value={form.description}
                onChange={handleChange("description")}
                multiline
                rows={2}
              />
              <TextField
                fullWidth
                label="Estado"
                select
                value={form.status}
                onChange={handleChange("status")}
                slotProps={{ select: {} }}
              >
                <MenuItem value="draft">Borrador</MenuItem>
                <MenuItem value="active">Activa</MenuItem>
                <MenuItem value="paused">Pausada</MenuItem>
                <MenuItem value="completed">Completada</MenuItem>
              </TextField>
            </DialogContent>
            <DialogActions sx={{ pt: 0 }}>
              <Button onClick={() => setOpen(false)} startIcon={<CancelIcon />}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                startIcon={<SaveIcon />}
              >
                Guardar
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </AdminLayout>
  );
}
