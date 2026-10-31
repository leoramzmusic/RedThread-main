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
import DescriptionIcon from "@mui/icons-material/Description";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AdminLayout from "../../../../components/layout/AdminLayout";
import adminApiClient from "../../../../services/adminApi";
import { useSnackbar } from "notistack";

interface Template {
  id: string;
  name: string;
  channel: string;
  title?: string;
  content?: string;
  variables?: string[];
  is_active?: boolean;
}

export default function TemplatesPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState({
    name: "",
    channel: "email",
    title: "",
    content: "",
    variables: "",
    is_active: true,
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await adminApiClient.get(
        "/portal-redthread/notifications/users/templates",
      );
      setTemplates(res.data || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      enqueueSnackbar("Error al cargar plantillas", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      channel: "email",
      title: "",
      content: "",
      variables: "",
      is_active: true,
    });
    setOpen(true);
  };

  const handleOpenEdit = (tpl: Template) => {
    setEditing(tpl);
    setForm({
      name: tpl.name || "",
      channel: tpl.channel || "email",
      title: tpl.title || "",
      content: tpl.content || "",
      variables: (tpl.variables || []).join(","),
      is_active: tpl.is_active ?? true,
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
          `/portal-redthread/notifications/users/templates/${editing.id}`,
          {
            name: form.name,
            channel: form.channel,
            title: form.title,
            content: form.content,
            variables: form.variables
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),
            is_active: form.is_active,
          },
        );
        enqueueSnackbar("Plantilla actualizada", { variant: "success" });
      } else {
        await adminApiClient.post(
          "/portal-redthread/notifications/users/templates",
          {
            name: form.name,
            channel: form.channel,
            title: form.title,
            content: form.content,
            variables: form.variables
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),
            is_active: form.is_active,
          },
        );
        enqueueSnackbar("Plantilla creada", { variant: "success" });
      }
      setOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error("Save template failed:", error);
      enqueueSnackbar("Error al guardar la plantilla", { variant: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Mover esta plantilla a la papelera?")) return;
    try {
      await adminApiClient.delete(
        `/portal-redthread/notifications/users/templates/${id}`,
      );
      enqueueSnackbar("Plantilla movida a papelera", { variant: "success" });
      fetchTemplates();
    } catch (error) {
      console.error("Delete template failed:", error);
      enqueueSnackbar("Error al eliminar la plantilla", { variant: "error" });
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
                  📄 Plantillas de Notificación
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Gestiona plantillas reutilizables para usuarios
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              Nueva Plantilla
            </Button>
          </Box>

          <Paper sx={{ p: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Canal</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell sx={{ textAlign: "right" }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map((tpl) => (
                    <TableRow key={tpl.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{tpl.name}</TableCell>
                      <TableCell>{tpl.channel}</TableCell>
                      <TableCell>
                        <Chip
                          label={tpl.is_active ? "Activa" : "Inactiva"}
                          size="small"
                          color={tpl.is_active ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: "right" }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(tpl)}
                          title="Editar"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(tpl.id)}
                          title="Eliminar"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {templates.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        sx={{ textAlign: "center", color: "text.secondary" }}
                      >
                        No hay plantillas disponibles.
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
              {editing ? "Editar Plantilla" : "Nueva Plantilla"}
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
                label="Canal"
                select
                value={form.channel}
                onChange={handleChange("channel")}
                slotProps={{ select: {} }}
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="push">Push</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="in_app">In-App</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Título"
                value={form.title}
                onChange={handleChange("title")}
              />
              <TextField
                fullWidth
                label="Contenido"
                multiline
                rows={3}
                value={form.content}
                onChange={handleChange("content")}
              />
              <TextField
                fullWidth
                label="Variables (separadas por coma)"
                placeholder="Ej: first_name, matches_count, care_remaining"
                value={form.variables}
                onChange={handleChange("variables")}
              />
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
