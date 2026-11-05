import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import animStyles from "./builder/notification-animations.module.css";
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
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AdminLayout from "../layout/AdminLayout";
import adminApiClient from "../../services/adminApi";
import { useSnackbar } from "notistack";
import PushPreview from "./builder/PushPreview";
import PanelPreview from "./builder/PanelPreview";

export interface Template {
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
  color?: string;
  channels?: string[];
  action_type?: string;
  action_destination?: string;
  persistent?: boolean;
  programmable?: boolean;
  silencable?: boolean;
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
  match: { category: "Social", priority: "P1", color: "#ec4899" },
  like: { category: "Social", priority: "P2", color: "#ec4899" },
  message: { category: "Mensajes", priority: "P1", color: "#2563eb" },
  survey: { category: "CARE", priority: "P2", color: "#f59e0b" },
  reminder: { category: "Perfil", priority: "P2", color: "#a855f7" },
  promo: { category: "Premium", priority: "P2", color: "#10b981" },
  security: { category: "Seguridad", priority: "P0", color: "#ef4444" },
};

export interface TemplatesManagerProps {
  apiBase?: string;
  title?: string;
  subtitle?: string;
  backTo?: string;
}

const PUSH_DEVICES: Array<{ key: string; label: string }> = [
  { key: "android", label: "Android" },
  { key: "ios", label: "iPhone" },
  { key: "tablet", label: "Tablet" },
  { key: "desktop", label: "Desktop" },
];

export default function TemplatesManager({
  apiBase = "/notifications/users/templates",
  title = "Plantillas de Notificación",
  subtitle = "Biblioteca maestra de plantillas reutilizables con variables dinámicas.",
  backTo,
}: TemplatesManagerProps) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
    color: "",
    channels: ["push", "panel"],
    action_type: "",
    action_destination: "",
    persistent: false,
    programmable: false,
    silencable: false,
  });
  const [seeding, setSeeding] = useState(false);
  const [previewMode, setPreviewMode] = useState<"push" | "panel">("push");
  const [pushDevice, setPushDevice] = useState<string>("android");
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("dark");
  const [multiView, setMultiView] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await adminApiClient.get(apiBase);
      const payload = res.data;
      const list = Array.isArray(payload) ? payload : (payload?.items ?? []);
      setTemplates(list);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      enqueueSnackbar("Error al cargar plantillas", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (templates.length > 0 && !selectedId) {
      setSelectedId(templates[0].id);
    }
  }, [templates, selectedId]);

  const selectedTemplate = templates.find((t) => t.id === selectedId) ?? null;

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
      color: "",
      channels: ["push", "panel"],
      action_type: "",
      action_destination: "",
      persistent: false,
      programmable: false,
      silencable: false,
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
      color: tpl.color || "",
      channels: tpl.channels || ["push", "panel"],
      action_type: tpl.action_type || "",
      action_destination: tpl.action_destination || "",
      persistent: tpl.persistent || false,
      programmable: tpl.programmable || false,
      silencable: tpl.silencable || false,
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

  const handleChangeChannel = (channel: string) => {
    setForm((prev) => {
      const channels = prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel];
      return { ...prev, channels };
    });
  };

  const computeTemplateMetrics = (tpl: Template) => {
    const titleLen = (tpl.title || "").length;
    const bodyLen = (tpl.body || "").length;
    const warnings: string[] = [];
    if (!tpl.title) warnings.push("⚠ Título vacío");
    else if (titleLen > 40)
      warnings.push("⚠ Título demasiado largo (se trunca en móvil)");
    if (!tpl.body) warnings.push("⚠ Cuerpo vacío");
    else if (bodyLen > 120)
      warnings.push("⚠ Mensaje largo (se trunca en algunas vistas)");
    if (tpl.action_type === "url" && !tpl.action_destination)
      warnings.push("⚠ Falta destino de la acción");
    return { titleLen, bodyLen, warnings };
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
        color: form.color || undefined,
        channels: form.channels || ["push", "panel"],
        action_type: form.action_type || undefined,
        action_destination: form.action_destination || undefined,
        persistent: form.persistent,
        programmable: form.programmable,
        silencable: form.silencable,
      };

      if (editing) {
        await adminApiClient.put(`${apiBase}/${editing.id}`, payload);
        enqueueSnackbar("Plantilla actualizada", { variant: "success" });
      } else {
        await adminApiClient.post(apiBase, payload);
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
      await adminApiClient.delete(`${apiBase}/${id}`);
      enqueueSnackbar("Plantilla eliminada", { variant: "success" });
      fetchTemplates();
      setSelectedId((prev) => (prev === id ? null : prev));
    } catch (error) {
      console.error("Delete template failed:", error);
      enqueueSnackbar("Error al eliminar la plantilla", { variant: "error" });
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await adminApiClient.post(`${apiBase}/seed-defaults`);
      const created = res.data?.created ?? 0;
      enqueueSnackbar(
        created > 0
          ? `${created} plantillas por defecto creadas`
          : "Las plantillas por defecto ya están cargadas",
        { variant: "success" },
      );
      await fetchTemplates();
    } catch (error) {
      console.error("Seed default templates failed:", error);
      enqueueSnackbar("Error al cargar las plantillas por defecto", {
        variant: "error",
      });
    } finally {
      setSeeding(false);
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

  const isSelected = (id: string) => id === selectedId;

  const deviceAccent = (label: string) => {
    if (label === "Desktop") return "#2563eb";
    if (label === "iPhone") return "#007AFF";
    if (label === "Android") return "#3DDC84";
    return "#7C3AED";
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
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton
                size="small"
                onClick={() => (backTo ? router.push(backTo) : router.back())}
                sx={{ color: "text.secondary" }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {title}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {subtitle}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ borderRadius: 6, px: 3, minHeight: 44 }}
                onClick={handleOpenCreate}
              >
                Nueva Plantilla
              </Button>
              {templates.length === 0 && (
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  disabled={seeding}
                  sx={{ borderRadius: 6, px: 3, minHeight: 44 }}
                  onClick={handleSeedDefaults}
                >
                  {seeding ? "Cargando…" : "Cargar plantillas por defecto"}
                </Button>
              )}
            </Box>
          </Paper>

          {templates.length === 0 ? (
            <Paper
              sx={{
                p: 2,
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        sx={{
                          textAlign: "center",
                          color: "text.secondary",
                          py: 4,
                        }}
                      >
                        No hay plantillas disponibles.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
                minHeight: 0,
                height: "calc(100vh - 260px)",
              }}
            >
              {/* ── Lista de plantillas (izquierda, ~40%) ── */}
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden",
                  }}
                >
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, width: 210 }}>
                            Título
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, width: 90 }}>
                            Categoría
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, width: 70 }}>
                            Prioridad
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, width: 70 }}>
                            Icono
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, width: 120 }}>
                            Variables
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 700,
                              width: 90,
                              textAlign: "center",
                            }}
                          >
                            Canales
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 700,
                              textAlign: "right",
                              width: 100,
                            }}
                          >
                            Acciones
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {templates.map((tpl) => {
                          const style = getStyle(tpl.category);
                          const active = isSelected(tpl.id);
                          return (
                            <TableRow
                              key={tpl.id}
                              sx={{
                                cursor: "pointer",
                                "&:hover": { bgcolor: "action.hover" },
                                bgcolor: active
                                  ? "action.selected"
                                  : "transparent",
                                borderRadius: 1,
                                mb: 0.5,
                              }}
                              onClick={() => setSelectedId(tpl.id)}
                            >
                              <TableCell sx={{ fontWeight: 500, minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {tpl.title}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={style.category}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    fontSize: "0.68rem",
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
                                    fontSize: "0.68rem",
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
                                    sx={{
                                      color: "text.secondary",
                                      minWidth: 0,
                                    }}
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
                              <TableCell sx={{ textAlign: "center" }}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 0.5,
                                    justifyContent: "center",
                                  }}
                                >
                                  <Chip
                                    label="✅ Push"
                                    size="small"
                                    color="success"
                                    sx={{
                                      fontSize: "0.62rem",
                                      fontWeight: 700,
                                      color: "#16a34a",
                                      borderColor: "#16a34a40",
                                    }}
                                  />
                                  <Chip
                                    label="✅ Panel"
                                    size="small"
                                    color="success"
                                    sx={{
                                      fontSize: "0.62rem",
                                      fontWeight: 700,
                                      color: "#16a34a",
                                      borderColor: "#16a34a40",
                                    }}
                                  />
                                </Box>
                              </TableCell>
                              <TableCell sx={{ textAlign: "right" }}>
                                <Box sx={{ display: "flex", gap: 0.5 }}>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedId(tpl.id);
                                    }}
                                    title="Vista previa"
                                    sx={{ color: "text.secondary" }}
                                  >
                                    <VisibilityIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEdit(tpl);
                                    }}
                                    title="Editar"
                                    sx={{ color: "text.secondary" }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(tpl.id);
                                    }}
                                    title="Eliminar"
                                    sx={{ color: "text.secondary" }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>

              {/* ── Preview Studio (derecha, ~45%) ── */}
              <Box
                sx={{
                  width: "45%",
                  maxWidth: 700,
                  flexShrink: 0,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  overflow: "hidden",
                }}
              >
                <Paper
                  sx={{
                    p: 0,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                  }}
                >
                  {/* Título reducido + controles */}
                  <Box
                    sx={{
                      p: 2,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        color: "text.secondary",
                        flex: 1,
                      }}
                    >
                      Vista previa
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          px: 0.5,
                          py: 0.25,
                          borderRadius: 6,
                          bgcolor:
                            previewTheme === "dark"
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(0,0,0,0.08)",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.65rem",
                            color: "text.secondary",
                          }}
                        >
                          {previewTheme === "dark" ? "🌙" : "☀"}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() =>
                            setPreviewTheme((p) =>
                              p === "dark" ? "light" : "dark",
                            )
                          }
                          sx={{
                            p: 0,
                            ml: 0.5,
                            borderRadius: 4,
                            fontSize: "0.68rem",
                            textTransform: "none",
                            color: "text.secondary",
                          }}
                          variant="text"
                        >
                          {previewTheme === "dark" ? "Claro" : "Oscuro"}
                        </Button>
                      </Box>
                      <Box
                        sx={{
                          ml: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          px: 0.5,
                          py: 0.25,
                          borderRadius: 6,
                          bgcolor: multiView
                            ? "rgba(37,99,235,0.12)"
                            : "rgba(255,255,255,0.04)",
                          border: multiView ? "1px solid #2563eb40" : "none",
                        }}
                      >
                        <Button
                          size="small"
                          onClick={() => setMultiView(!multiView)}
                          sx={{
                            p: 0,
                            ml: 0.5,
                            borderRadius: 4,
                            fontSize: "0.68rem",
                            textTransform: "none",
                            color: multiView ? "#2563eb" : "text.secondary",
                            fontWeight: multiView ? 700 : 500,
                          }}
                          variant="text"
                        >
                          Vista múltiple:{" "}
                          {multiView ? "Activada" : "Desactivada"}
                        </Button>
                      </Box>
                    </Box>
                  </Box>

                  {/* Separador PUSH */}
                  <Box
                    sx={{
                      py: 0.5,
                      px: 1,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        color: "text.secondary",
                        textTransform: "uppercase",
                        fontSize: "0.6875rem",
                        flexShrink: 0,
                      }}
                    ></Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        overflowX: "auto",
                        flexShrink: 0,
                      }}
                    >
                      {PUSH_DEVICES.map((d) => {
                        const active =
                          previewMode === "push" && pushDevice === d.key;
                        const accent = deviceAccent(d.label);
                        return (
                          <Button
                            key={d.key}
                            onClick={() => {
                              setPreviewMode("push");
                              setPushDevice(d.key);
                            }}
                            sx={{
                              border: active
                                ? `1px solid ${accent}`
                                : "1px solid transparent",
                              color: active ? accent : "text.secondary",
                              backgroundColor: active
                                ? `${accent}10`
                                : "transparent",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              px: 0.75,
                              py: 0.5,
                              borderRadius: 6,
                              "&:hover": {
                                bgcolor: active
                                  ? "transparent"
                                  : "action.hover",
                              },
                            }}
                          >
                            {d.label}
                          </Button>
                        );
                      })}
                    </Box>
                  </Box>

                  {/* Separador Panel RETH */}
                  <Box
                    sx={{
                      py: 0.5,
                      px: 1,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        color: "text.secondary",
                        textTransform: "uppercase",
                        fontSize: "0.6875rem",
                        flexShrink: 0,
                      }}
                    >
                      EN RETH
                    </Typography>
                    <Button
                      onClick={() => setPreviewMode("panel")}
                      sx={{
                        border:
                          previewMode === "panel"
                            ? "1px solid #ef4444"
                            : "1px solid transparent",
                        color:
                          previewMode === "panel"
                            ? "#ef4444"
                            : "text.secondary",
                        backgroundColor:
                          previewMode === "panel" ? "#fef2f2" : "transparent",
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        px: 0.75,
                        py: 0.5,
                        borderRadius: 6,
                        ml: 0.5,
                      }}
                    >
                      Panel de notificaciones
                    </Button>
                  </Box>

                  {/* Contenido de vista previa */}
                  <Box
                    sx={{
                      p: 2,
                      flex: 1,
                      minHeight: 0,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    {selectedTemplate ? (
                      multiView ? (
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 1,
                            width: "100%",
                            height: "100%",
                          }}
                        >
                          <PushPreview
                            device="android"
                            title={selectedTemplate.title}
                            body={selectedTemplate.body}
                            icon={selectedTemplate.icon}
                            category={selectedTemplate.category}
                            priority={selectedTemplate.priority}
                            actionUrl={selectedTemplate.action_url}
                            theme={previewTheme}
                            animate={true}
                            animationClass={animStyles.slideIn}
                          />
                          <PushPreview
                            device="ios"
                            title={selectedTemplate.title}
                            body={selectedTemplate.body}
                            icon={selectedTemplate.icon}
                            category={selectedTemplate.category}
                            priority={selectedTemplate.priority}
                            actionUrl={selectedTemplate.action_url}
                            theme={previewTheme}
                            animate={true}
                            animationClass={animStyles.slideIn}
                          />
                          <PushPreview
                            device="desktop"
                            title={selectedTemplate.title}
                            body={selectedTemplate.body}
                            icon={selectedTemplate.icon}
                            category={selectedTemplate.category}
                            priority={selectedTemplate.priority}
                            actionUrl={selectedTemplate.action_url}
                            theme={previewTheme}
                            animate={true}
                            animationClass={animStyles.slideIn}
                          />
                          <PanelPreview
                            title={selectedTemplate.title}
                            body={selectedTemplate.body}
                            icon={selectedTemplate.icon}
                            category={selectedTemplate.category}
                            priority={selectedTemplate.priority}
                            actionUrl={selectedTemplate.action_url}
                            theme={previewTheme}
                            animate={true}
                            animationClass={animStyles.slideIn}
                          />
                        </Box>
                      ) : previewMode === "panel" ? (
                        <PanelPreview
                          title={selectedTemplate.title}
                          body={selectedTemplate.body}
                          icon={selectedTemplate.icon}
                          category={selectedTemplate.category}
                          priority={selectedTemplate.priority}
                          actionUrl={selectedTemplate.action_url}
                          theme={previewTheme}
                          animate={true}
                          animationClass={animStyles.slideIn}
                        />
                      ) : (
                        <PushPreview
                          device={pushDevice}
                          title={selectedTemplate.title}
                          body={selectedTemplate.body}
                          icon={selectedTemplate.icon}
                          category={selectedTemplate.category}
                          priority={selectedTemplate.priority}
                          actionUrl={selectedTemplate.action_url}
                          theme={previewTheme}
                          animate={true}
                          animationClass={animStyles.slideIn}
                        />
                      )
                    ) : (
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column",
                          color: "text.disabled",
                        }}
                      >
                        <VisibilityIcon
                          sx={{ fontSize: 56, mb: 1, opacity: 0.3 }}
                        />
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          Selecciona una plantilla
                        </Typography>
                        <Typography variant="caption">
                          Su vista previa de Push y Panel aparecerá aquí.
                        </Typography>
                      </Box>
                    )}
                    {/* Métricas en tiempo real */}
                    {selectedTemplate && (
                      <Box
                        sx={{
                          pt: 1,
                          px: 0.5,
                          borderTop: "1px solid",
                          borderColor: "divider",
                          backgroundColor:
                            previewTheme === "dark"
                              ? "rgba(0,0,0,0.03)"
                              : "rgba(0,0,0,0.03)",
                          borderRadius: 4,
                        }}
                      >
                        {computeTemplateMetrics(selectedTemplate).warnings.map(
                          (w, i) => (
                            <Typography
                              key={i}
                              variant="caption"
                              sx={{
                                color: "#ef4444",
                                fontWeight: 700,
                                fontSize: "0.6875rem",
                                mb: 0.25,
                                display: "block",
                              }}
                            >
                              {w}
                            </Typography>
                          ),
                        )}
                        <Box
                          sx={{
                            display: "flex",
                            gap: 2,
                            fontSize: "0.6875rem",
                            color: "text.secondary",
                            fontWeight: 600,
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.disabled",
                                display: "block",
                                mb: 0.1,
                              }}
                            >
                              Título
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                display: "block",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {selectedTemplate.title} (
                              {
                                computeTemplateMetrics(selectedTemplate)
                                  .titleLen
                              }{" "}
                              / 40)
                            </Typography>
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.disabled",
                                display: "block",
                                mb: 0.1,
                              }}
                            >
                              Cuerpo
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                display: "block",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {selectedTemplate.body} (
                              {computeTemplateMetrics(selectedTemplate).bodyLen}{" "}
                              / 120)
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}

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
                    label="Color"
                    value={form.color}
                    onChange={handleChange("color")}
                    placeholder="#3b82f6"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Tipo de acción"
                    select
                    value={form.action_type}
                    onChange={handleChange("action_type")}
                    slotProps={{ select: {} }}
                  >
                    <MenuItem value="">Ninguna</MenuItem>
                    <MenuItem value="url">Abrir URL</MenuItem>
                    <MenuItem value="screen">Abrir pantalla interna</MenuItem>
                    <MenuItem value="chat">Abrir chat</MenuItem>
                    <MenuItem value="profile">Abrir perfil</MenuItem>
                    <MenuItem value="survey">Abrir encuesta</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Destino de la acción"
                    value={form.action_destination}
                    onChange={handleChange("action_destination")}
                    placeholder="/profile/{id} o https://..."
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckboxIcon
                    checked={form.persistent}
                    onChange={handleChangeCheckbox("persistent")}
                    sx={{
                      color: form.persistent
                        ? "primary.main"
                        : "text.secondary",
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Persistente
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckboxIcon
                    checked={form.programmable}
                    onChange={handleChangeCheckbox("programmable")}
                    sx={{
                      color: form.programmable
                        ? "primary.main"
                        : "text.secondary",
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Programable
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckboxIcon
                    checked={form.silencable}
                    onChange={handleChangeCheckbox("silencable")}
                    sx={{
                      color: form.silencable
                        ? "primary.main"
                        : "text.secondary",
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Silenciable
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Canales
              </Typography>
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckboxIcon
                    checked={form.channels.includes("push")}
                    onChange={() => handleChangeChannel("push")}
                    sx={{
                      color: form.channels.includes("push")
                        ? "primary.main"
                        : "text.secondary",
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Push
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckboxIcon
                    checked={form.channels.includes("panel")}
                    onChange={() => handleChangeChannel("panel")}
                    sx={{
                      color: form.channels.includes("panel")
                        ? "primary.main"
                        : "text.secondary",
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Panel de Notificaciones
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckboxIcon
                    checked={form.channels.includes("email")}
                    onChange={() => handleChangeChannel("email")}
                    sx={{
                      color: form.channels.includes("email")
                        ? "primary.main"
                        : "text.secondary",
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Email (futuro)
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckboxIcon
                    checked={form.channels.includes("sms")}
                    onChange={() => handleChangeChannel("sms")}
                    sx={{
                      color: form.channels.includes("sms")
                        ? "primary.main"
                        : "text.secondary",
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    SMS (futuro)
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
        borderRadius: 0.5,
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
