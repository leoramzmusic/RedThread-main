import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
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
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import AdminLayout from "../../../components/layout/AdminLayout";
import adminApiClient from "../../../services/adminApi";
import { useSnackbar } from "notistack";

interface Template {
  id: string;
  title: string;
  body: string;
  icon: string;
  action_url?: string;
  category: string;
  priority: string;
  required_action: boolean;
  critical: boolean;
  variables: Array<{ name: string; type: string }>;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  deleted_by?: string;
}

interface CategoryPriority {
  category: string;
  priority: string;
  color: string;
}

const CATEGORY_PRIORITY_STYLES: Record<string, CategoryPriority> = {
  system: { category: "Sistema", priority: "P0", color: "#3b82f6" },
  match: { category: "Social", priority: "P1", color: "#8b5cf6" },
  like: { category: "Social", priority: "P2", color: "#8b5cf6" },
  message: { category: "Social", priority: "P1", color: "#8b5cf6" },
  survey: { category: "CARE", priority: "P2", color: "#f59e0b" },
  reminder: { category: "Perfil", priority: "P2", color: "#f59e0b" },
  promo: { category: "Premium", priority: "P2", color: "#10b981" },
  security: { category: "Seguridad", priority: "P0", color: "#ef4444" },
};

export default function TemplatesPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState({
    title: "",
    body: "",
    icon: "description",
    category: "system",
    priority: "P2",
    action_url: "",
    required_action: false,
    critical: false,
    variables: "",
  });

  const API_BASE = "/notifications/users/templates";

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await adminApiClient.get(API_BASE);
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
      title: "",
      body: "",
      icon: "description",
      category: "system",
      priority: "P2",
      action_url: "",
      required_action: false,
      critical: false,
      variables: "",
    });
    setOpen(true);
  };

  const handleOpenEdit = (tpl: Template) => {
    setEditing(tpl);
    setForm({
      title: tpl.title,
      body: tpl.body,
      icon: tpl.icon,
      category: tpl.category,
      priority: tpl.priority,
      action_url: tpl.action_url || "",
      required_action: tpl.required_action,
      critical: tpl.critical,
      variables: (tpl.variables || []).map((v) => v.name).join(", "),
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

  const handleChangeCheckbox = (key: string) => (checked: boolean) => {
    setForm((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSave = async () => {
    try {
      const variables = form.variables
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
        .map((name) => ({ name, type: "string" }));

      const payload = {
        title: form.title,
        body: form.body,
        icon: form.icon,
        category: form.category,
        priority: form.priority,
        action_url: form.action_url || undefined,
        required_action: form.required_action,
        critical: form.critical,
        variables,
      };

      if (editing) {
        await adminApiClient.put(`${API_BASE}/${editing.id}`, payload);
        enqueueSnackbar("Plantilla actualizada", { variant: "success" });
      } else {
        await adminApiClient.post(API_BASE, payload);
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
    if (!window.confirm("¿Eliminar esta plantilla definitivamente?")) return;
    try {
      await adminApiClient.delete(`${API_BASE}/${id}`);
      enqueueSnackbar("Plantilla eliminada", { variant: "success" });
      fetchTemplates();
    } catch (error) {
      console.error("Delete template failed:", error);
      enqueueSnackbar("Error al eliminar la plantilla", { variant: "error" });
    }
  };

  const getStyle = (category: string) => {
    const key = category;
    return (
      CATEGORY_PRIORITY_STYLES[key] || {
        category: "Otra",
        priority: "P2",
        color: "#6b7280",
      }
    );
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
          {/* Encabezado */}
          <Paper
            sx={{
              p: 3,
              borderRadius: 10,
              border: "1px solid",
              borderColor: "divider",
              mb: 4,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton
                size="small"
                onClick={() => router.push("/portal-redthread")}
                sx={{ color: "text.secondary" }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  📄 Plantillas de Notificación
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Biblioteca maestra de plantillas reutilizables con variables
                  dinámicas.
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ borderRadius: 6, px: 3, minHeight: 44 }}
              onClick={handleOpenCreate}
            >
              Nueva Plantilla
            </Button>
          </Paper>

          {/* Listado de plantillas */}
          <Paper
            sx={{
              p: 2,
              borderRadius: 10,
              border: "1px solid",
              borderColor: "divider",
              mb: 4,
            }}
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 200 }}>
                      Título
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 120 }}>
                      Categoría
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 100 }}>
                      Prioridad
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 120 }}>
                      Icono
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 120 }}>
                      Variables
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, textAlign: "right", width: 120 }}
                    >
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(Array.isArray(templates) ? templates : []).map((tpl) => {
                    const style = getStyle(tpl.category);
                    return (
                      <TableRow
                        key={tpl.id}
                        sx={{ "&:hover": { bgcolor: "action.hover" } }}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>
                          {tpl.title}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={style.category}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              borderRadius: 6,
                              color: style.color,
                              borderColor: `${style.color}40`,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tpl.priority}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              borderRadius: 6,
                              color:
                                tpl.priority === "P0"
                                  ? "#ef4444"
                                  : tpl.priority === "P1"
                                    ? "#f59e0b"
                                    : tpl.priority === "P2"
                                      ? "#10b981"
                                      : "#6b7280",
                              borderColor: "divider",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              bgcolor: `${style.color}12`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: style.color,
                              fontSize: 14,
                            }}
                          >
                            {tpl.icon}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {(tpl.variables || []).length > 0 ? (
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              {(tpl.variables || [])
                                .map((v) => v.name)
                                .join(", ")}
                            </Typography>
                          ) : (
                            <Typography
                              variant="caption"
                              sx={{ color: "text.disabled" }}
                            >
                              –
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ textAlign: "right" }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(tpl)}
                            title="Editar"
                            sx={{ color: "text.secondary" }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(tpl.id)}
                            title="Eliminar"
                            sx={{ color: "text.secondary" }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {templates.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        sx={{
                          textAlign: "center",
                          color: "text.secondary",
                          py: 4,
                        }}
                      >
                        No hay plantillas disponibles.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Dialog crear/editar */}
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            maxWidth="md"
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
                label="Título *"
                value={form.title}
                onChange={handleChange("title")}
                required
              />
              <TextField
                fullWidth
                label="Cuerpo (usa {{variable}} para variables dinámicas)"
                multiline
                rows={4}
                value={form.body}
                onChange={handleChange("body")}
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    label="Ícono (material name)"
                    value={form.icon}
                    onChange={handleChange("icon")}
                    placeholder="Ej: description, favorite, message"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    label="Categoría"
                    select
                    value={form.category}
                    onChange={handleChange("category")}
                    slotProps={{ select: {} }}
                  >
                    <MenuItem value="system">Sistema</MenuItem>
                    <MenuItem value="match">Match</MenuItem>
                    <MenuItem value="like">Like</MenuItem>
                    <MenuItem value="message">Mensaje</MenuItem>
                    <MenuItem value="survey">Encuesta</MenuItem>
                    <MenuItem value="reminder">Recordatorio</MenuItem>
                    <MenuItem value="promo">Promoción</MenuItem>
                    <MenuItem value="security">Seguridad</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    label="Prioridad"
                    select
                    value={form.priority}
                    onChange={handleChange("priority")}
                    slotProps={{ select: {} }}
                  >
                    <MenuItem value="P0">P0 Crítica</MenuItem>
                    <MenuItem value="P1">P1 Alta</MenuItem>
                    <MenuItem value="P2">P2 Normal</MenuItem>
                    <MenuItem value="P3">P3 Baja</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    label="URL de acción (opcional)"
                    value={form.action_url}
                    onChange={handleChange("action_url")}
                    placeholder="/profile/{id}"
                  />
                </Grid>
              </Grid>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Opciones
              </Typography>
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckboxIcon
                    checked={form.required_action}
                    onChange={handleChangeCheckbox("required_action")}
                    sx={{
                      color: form.required_action
                        ? "primary.main"
                        : "text.secondary",
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Requiere acción del usuario
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckboxIcon
                    checked={form.critical}
                    onChange={handleChangeCheckbox("critical")}
                    sx={{
                      color: form.critical ? "error.main" : "text.secondary",
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Crítica (sobrepasa No Molestar)
                  </Typography>
                </Box>
              </Box>
              <TextField
                fullWidth
                label="Variables (separadas por coma)"
                placeholder="Ej: first_name, matches_count, care_remaining, city"
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

// Componente interno para checkbox sin importar Checkbox (evita conflictos de estilo)
function CheckboxIcon({ checked, onChange, sx }: any) {
  return (
    <IconButton
      size="small"
      onClick={() => onChange(!checked)}
      sx={{
        px: 0,
        borderRadius: 6,
        border: "1px solid",
        borderColor: "divider",
        ...sx,
      }}
    >
      {checked ? (
        <CheckCircleIcon style={{ fontSize: 20 }} />
      ) : (
        <RadioButtonUncheckedIcon style={{ fontSize: 20 }} />
      )}
    </IconButton>
  );
}
