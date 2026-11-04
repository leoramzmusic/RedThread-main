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
  TextField,
  Select,
  MenuItem,
  IconButton,
  Divider,
  CircularProgress,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import AdminLayout from "../../../../components/layout/AdminLayout";
import adminApiClient from "../../../../services/adminApi";
import { useSnackbar } from "notistack";

interface Template {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  name: string;
}

export default function CreateNotificationPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [form, setForm] = useState({
    user_id: "",
    template_id: "",
    title: "",
    content: "",
    priority: "normal",
    action_url: "",
    action_label: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tplRes, userRes] = await Promise.all([
        adminApiClient.get("/notifications/users/templates"),
        adminApiClient.get("/portal-redthread/usuarios/listado"),
      ]);
      setTemplates(tplRes.data || []);
      setUsers(userRes.data || []);
    } catch (error) {
      console.error("Failed to load create form data:", error);
      enqueueSnackbar("Error al cargar datos del formulario", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await adminApiClient.post("/notifications/users/send", {
        user_id: form.user_id,
        template_id: form.template_id || undefined,
        title: form.title,
        content: form.content,
        priority: form.priority,
        action_url: form.action_url || undefined,
        action_label: form.action_label || undefined,
      });
      enqueueSnackbar("Notificación enviada correctamente", {
        variant: "success",
      });
      router.push("/portal-redthread/notifications/users/dashboard");
    } catch (error) {
      console.error("Send notification failed:", error);
      enqueueSnackbar("Error al enviar la notificación", {
        variant: "error",
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      <Container maxWidth="md">
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
                  Nueva Notificación
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Envía una notificación individual a un usuario
                </Typography>
              </Box>
            </Box>
            <Button variant="outlined" onClick={() => router.back()}>
              Volver
            </Button>
          </Box>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <form onSubmit={handleSubmit}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Datos de la Notificación
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Usuario *"
                      select
                      value={form.user_id}
                      onChange={handleChange("user_id")}
                      slotProps={{ select: {} }}
                      required
                    >
                      <MenuItem value="">-- Seleccionar usuario --</MenuItem>
                      {users.map((u) => (
                        <MenuItem key={u.id} value={u.id}>
                          {u.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Plantilla"
                      select
                      value={form.template_id}
                      onChange={handleChange("template_id")}
                      slotProps={{ select: {} }}
                    >
                      <MenuItem value="">
                        -- Usar contenido personalizado --
                      </MenuItem>
                      {templates.map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Prioridad"
                      select
                      value={form.priority}
                      onChange={handleChange("priority")}
                    >
                      <MenuItem value="low">Baja</MenuItem>
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="high">Alta</MenuItem>
                      <MenuItem value="urgent">Urgente</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="Título *"
                  multiline
                  rows={1}
                  value={form.title}
                  onChange={handleChange("title")}
                  required
                />

                <TextField
                  fullWidth
                  label="Contenido *"
                  multiline
                  rows={4}
                  value={form.content}
                  onChange={handleChange("content")}
                  required
                />

                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mt: 2, mb: 1 }}
                >
                  Acción (opcional)
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="URL de acción"
                      value={form.action_url}
                      onChange={handleChange("action_url")}
                      type="url"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Etiqueta del botón"
                      value={form.action_label}
                      onChange={handleChange("action_label")}
                    />
                  </Grid>
                </Grid>

                <Box
                  sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={sending}
                    startIcon={<SendIcon />}
                  >
                    {sending ? "Enviando..." : "Enviar Notificación"}
                  </Button>
                </Box>
              </form>
            </Box>
          </Paper>
        </Box>
      </Container>
    </AdminLayout>
  );
}
