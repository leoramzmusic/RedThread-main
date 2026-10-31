import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArchiveIcon from "@mui/icons-material/Archive";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AdminLayout from "../../../components/layout/AdminLayout";
import adminApiClient from "../../../services/adminApi";
import { useSnackbar } from "notistack";

interface NotificationItem {
  id: string;
  category: string;
  content: string;
  priority: string;
  is_read: boolean;
  seen_at?: string;
  read_at?: string;
  archived_at?: string;
  expires_at?: string;
  action_url?: string;
  action_label?: string;
  created_at: string;
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0); // 0: All, 1: Unread
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (tab === 1) params.is_read = false;
      if (priorityFilter) params.priority = priorityFilter;
      if (categoryFilter) params.category = categoryFilter;

      const res = await adminApiClient.get(
        "/portal-redthread/employee/notifications/inbox",
        { params },
      );
      setNotifications(res.data?.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      enqueueSnackbar("Error al cargar notificaciones", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [tab, priorityFilter, categoryFilter]);

  const handleMarkRead = async (id: string) => {
    try {
      await adminApiClient.post(
        `/portal-redthread/employee/notifications/${id}/read`,
      );
      enqueueSnackbar("Notificación marcada como leída", {
        variant: "success",
      });
      fetchNotifications();
    } catch (error) {
      enqueueSnackbar("Error al actualizar notificación", { variant: "error" });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await adminApiClient.post(
        `/portal-redthread/employee/notifications/${id}/archive`,
      );
      enqueueSnackbar("Notificación archivada", { variant: "success" });
      fetchNotifications();
    } catch (error) {
      enqueueSnackbar("Error al archivar notificación", { variant: "error" });
    }
  };

  const handleActionClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      await handleMarkRead(notif.id);
    }
    if (notif.action_url) {
      router.push(notif.action_url);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P0":
        return "error";
      case "P1":
        return "warning";
      case "P2":
        return "info";
      case "P3":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <AdminLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box
            sx={{
              mb: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <NotificationsIcon sx={{ fontSize: 40, color: "primary.main" }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  Centro de Notificaciones & Bandeja
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Gestiona alertas operativas, anuncios y notificaciones P0-P3
                  en tiempo real.
                </Typography>
              </Box>
            </Box>
            <Button variant="outlined" onClick={fetchNotifications}>
              Actualizar
            </Button>
          </Box>

          {/* Filters & Tabs */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 2,
                alignItems: "center",
              }}
            >
              <Box sx={{ flex: 1, width: "100%" }}>
                <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
                  <Tab label="Todas" />
                  <Tab label="No leídas" />
                </Tabs>
              </Box>
              <Box sx={{ flex: 1, width: "100%" }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filtrar por Prioridad</InputLabel>
                  <Select
                    value={priorityFilter}
                    label="Filtrar por Prioridad"
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <MenuItem value="">Todas las Prioridades</MenuItem>
                    <MenuItem value="P0">P0 - Crítica</MenuItem>
                    <MenuItem value="P1">P1 - Alta</MenuItem>
                    <MenuItem value="P2">P2 - Normal</MenuItem>
                    <MenuItem value="P3">P3 - Baja</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: 1, width: "100%" }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filtrar por Categoría</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Filtrar por Categoría"
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <MenuItem value="">Todas las Categorías</MenuItem>
                    <MenuItem value="announcement">Anuncio</MenuItem>
                    <MenuItem value="alert">Alerta</MenuItem>
                    <MenuItem value="operational">Operacional</MenuItem>
                    <MenuItem value="security">Seguridad</MenuItem>
                    <MenuItem value="maintenance">Mantenimiento</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Paper>

          {/* Notifications List */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: "center" }}>
              <NotificationsIcon
                sx={{ fontSize: 60, color: "text.disabled", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                No hay notificaciones
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Estás al día con todas tus notificaciones y alertas operativas.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {notifications.map((notif) => (
                <Card
                  key={notif.id}
                  sx={{
                    borderLeft: "5px solid",
                    borderColor:
                      notif.priority === "P0"
                        ? "error.main"
                        : notif.priority === "P1"
                          ? "warning.main"
                          : notif.priority === "P2"
                            ? "info.main"
                            : "grey.400",
                    bgcolor: notif.is_read
                      ? "background.paper"
                      : "action.hover",
                    transition: "all 0.2s",
                    "&:hover": { boxShadow: 3 },
                  }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      justifyContent: "space-between",
                      alignItems: { sm: "center" },
                      gap: 2,
                    }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Chip
                          label={notif.priority}
                          color={getPriorityColor(notif.priority) as any}
                          size="small"
                          sx={{ fontWeight: "bold" }}
                        />
                        <Chip
                          label={notif.category}
                          variant="outlined"
                          size="small"
                        />
                        {!notif.is_read && (
                          <Chip label="Nueva" color="primary" size="small" />
                        )}
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", ml: "auto" }}
                        >
                          {new Date(notif.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: notif.is_read ? 400 : 600, mb: 1 }}
                      >
                        {notif.content}
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexShrink: 0,
                      }}
                    >
                      {notif.action_url && notif.action_label && (
                        <Button
                          variant="contained"
                          size="small"
                          endIcon={<OpenInNewIcon />}
                          onClick={() => handleActionClick(notif)}
                        >
                          {notif.action_label}
                        </Button>
                      )}
                      {!notif.is_read && (
                        <Tooltip title="Marcar como leída">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleMarkRead(notif.id)}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Archivar">
                        <IconButton
                          size="small"
                          onClick={() => handleArchive(notif.id)}
                        >
                          <ArchiveIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Container>
    </AdminLayout>
  );
}
