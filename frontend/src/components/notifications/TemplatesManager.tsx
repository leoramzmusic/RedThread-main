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
  Icon,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  Switch,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import MoreVert from "@mui/icons-material/MoreVert";
import ContentCopy from "@mui/icons-material/ContentCopy";
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
  icon_type: string;
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

const SOCIAL_CATEGORIES = new Set(["match", "like", "message"]);

const ICON_EMOJI: Record<string, string> = {
  lock: "🔒",
  security: "🛡️",
  star: "⭐",
  diamond: "💎",
  person: "👤",
  add_a_photo: "📷",
  message: "💬",
  wave: "👋",
  announcement: "📢",
  build: "🔧",
  question_answer: "❓",
  check_circle: "✅",
  favorite: "❤️",
  thumb_up: "👍",
};

const getEmoji = (iconName: string): string => ICON_EMOJI[iconName] ?? "🔔";

const ICON_EMOJI_GRID: string[] = [
  "❤️",
  "🔒",
  "🛡️",
  "💎",
  "⭐",
  "💬",
  "👤",
  "📷",
  "👋",
  "📢",
  "🔧",
  "❓",
  "✅",
  "👍",
  "🔔",
  "📋",
  "★",
  "💰",
];

const VARIABLE_PRESETS: string[] = [
  "first_name",
  "city",
  "nombre_match",
  "nombre_usuario",
  "ciudad",
  "cuestionarios_pendientes",
  "matches_count",
];

const PREVIEW_DATA: Record<string, string> = {
  first_name: "Carlos",
  city: "Madrid",
  nombre_match: "María",
  nombre_usuario: "Lucía",
  ciudad: "Barcelona",
  cuestionarios_pendientes: "3",
  matches_count: "2",
  titulo_anuncio: "Novedades de la semana",
  mensaje: "Tenemos grandes noticias para ti",
};

function resolvePreview(text: string): string {
  if (!text) return text;
  return text.replace(/\{\{([^}]+)\}\}/g, (_match, key) => {
    return PREVIEW_DATA[key.trim()] ?? `{${key.trim()}}`;
  });
}

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

const getIconType = (category: string): "dynamic_avatar" | "system_icon" =>
  SOCIAL_CATEGORIES.has(category) ? "dynamic_avatar" : "system_icon";

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
    icon_type: "system_icon",
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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [anchorRef, setAnchorRef] = useState<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | "none">(
    "none",
  );

  const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

  const list = templates
    .filter((tpl) => {
      const matchesSearch =
        tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tpl.body || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory || tpl.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .slice();

  const filteredTemplates = (() => {
    if (sortBy === "title") {
      return list.sort((a, b) => {
        const cmp = (a.title || "").localeCompare(b.title || "");
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }
    if (sortBy === "category") {
      return list.sort((a, b) => {
        const cmp = (a.category || "").localeCompare(b.category || "");
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }
    if (sortBy === "priority") {
      return list.sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority] ?? 99;
        const pb = PRIORITY_ORDER[b.priority] ?? 99;
        return sortDirection === "asc" ? pa - pb : pb - pa;
      });
    }
    return list;
  })();

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
      icon_type: "system_icon",
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
      icon_type: tpl.icon_type || "system_icon",
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

  const handleChangeCheckbox =
    (key: string) => (_event: any, checked: boolean) => {
      setForm((prev) => ({ ...prev, [key]: checked }));
    };

  const handleChangeChannelForTemplate = (
    templateId: string,
    channel: string,
  ) => {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        const channels = t.channels?.includes(channel)
          ? t.channels.filter((c) => c !== channel)
          : [...(t.channels ?? []), channel];
        return { ...t, channels };
      }),
    );
  };

  const handleChangeChannel = (channel: string) => {
    setForm((prev) => {
      const channels = prev.channels?.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...(prev.channels ?? []), channel];
      return { ...prev, channels };
    });
  };

  const handleDuplicateTemplate = async (tpl: Template) => {
    try {
      const { id, ...rest } = tpl;
      const newPayload = {
        ...rest,
        title: `${rest.title} (Copia)`,
        body: rest.body,
      };
      const res = await adminApiClient.post(apiBase, newPayload);
      enqueueSnackbar("Plantilla duplicada", { variant: "success" });
      fetchTemplates();
    } catch (error) {
      console.error("Duplicate template failed:", error);
      enqueueSnackbar("Error al duplicar plantilla", { variant: "error" });
    }
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
        icon_type: form.icon_type,
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
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <IconButton
                size="small"
                onClick={() => (backTo ? router.push(backTo) : router.back())}
                sx={{ color: "text.secondary" }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mb: 0 }}
                >
                  {subtitle}
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Buscar plantilla..."
                  sx={{ width: 200 }}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Button
                    size="small"
                    variant={
                      selectedCategory === null ? "contained" : "outlined"
                    }
                    sx={{
                      px: 1,
                      py: 0.5,
                      fontSize: "0.68rem",
                      borderRadius: 0,
                      color:
                        selectedCategory === null ? "#fff" : "text.secondary",
                    }}
                    onClick={() => setSelectedCategory(null)}
                  >
                    Todas
                  </Button>
                  {Object.entries(CATEGORY_PRIORITY_STYLES).map(
                    ([key, style]) => (
                      <Button
                        key={key}
                        size="small"
                        variant={
                          selectedCategory === key ? "contained" : "outlined"
                        }
                        sx={{
                          px: 1,
                          py: 0.5,
                          fontSize: "0.68rem",
                          borderRadius: 0,
                          color:
                            selectedCategory === key ? "#fff" : style.color,
                          borderColor:
                            selectedCategory === key
                              ? style.color
                              : `${style.color}40`,
                          backgroundColor:
                            selectedCategory === key
                              ? style.color
                              : "transparent",
                        }}
                        onClick={() =>
                          setSelectedCategory(
                            selectedCategory === key ? null : key,
                          )
                        }
                      >
                        {style.category}
                      </Button>
                    ),
                  )}
                </Box>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  borderRadius: 10,
                  px: 1.5,
                  py: 0.5,
                  minHeight: 40,
                  fontSize: "0.875rem",
                  height: 40,
                }}
                onClick={handleOpenCreate}
              >
                Nueva Plantilla
              </Button>
            </Box>
          </Paper>

          {filteredTemplates.length === 0 ? (
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
                    overflowY: "auto",
                  }}
                >
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow
                          sx={{
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                            backgroundColor: "background.paper",
                          }}
                        >
                          <SortableHeader
                            label="Título"
                            sortKey="title"
                            sortBy={sortBy}
                            sortDirection={sortDirection}
                            setSortBy={setSortBy}
                            setSortDirection={setSortDirection}
                            colWidth="35%"
                            colSticky
                          />
                          <SortableHeader
                            label="Categoría"
                            sortKey="category"
                            sortBy={sortBy}
                            sortDirection={sortDirection}
                            setSortBy={setSortBy}
                            setSortDirection={setSortDirection}
                            colWidth="15%"
                          />
                          <SortableHeader
                            label="Prioridad"
                            sortKey="priority"
                            sortBy={sortBy}
                            sortDirection={sortDirection}
                            setSortBy={setSortBy}
                            setSortDirection={setSortDirection}
                            colWidth="10%"
                          />
                          <TableCell sx={{ fontWeight: 700, width: "10%" }}>
                            Icono
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 700,
                              width: "10%",
                              textAlign: "center",
                            }}
                          >
                            Canales
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 700,
                              textAlign: "right",
                              width: "10%",
                            }}
                          >
                            Acciones
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredTemplates.map((tpl) => {
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
                              <TableCell
                                sx={{
                                  fontWeight: 500,
                                  minWidth: 0,
                                  position: "sticky",
                                  left: 0,
                                  zIndex: 1,
                                  backgroundColor: "background.paper",
                                }}
                              >
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
                                <TemplatePreviewCell tpl={tpl} />
                              </TableCell>
                              <TableCell
                                sx={{
                                  textAlign: "center",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 0.25,
                                    justifyContent: "center",
                                  }}
                                >
                                  <CheckboxIcon
                                    checked={(tpl.channels ?? []).includes(
                                      "push",
                                    )}
                                    onChange={() =>
                                      handleChangeChannelForTemplate(
                                        tpl.id,
                                        "push",
                                      )
                                    }
                                    sx={{
                                      p: 0,
                                      borderRadius: 0,
                                      border: "none",
                                      color: (tpl.channels ?? []).includes(
                                        "push",
                                      )
                                        ? "#16a34a"
                                        : "text.secondary",
                                    }}
                                  />
                                  <CheckboxIcon
                                    checked={(tpl.channels ?? []).includes(
                                      "panel",
                                    )}
                                    onChange={() =>
                                      handleChangeChannelForTemplate(
                                        tpl.id,
                                        "panel",
                                      )
                                    }
                                    sx={{
                                      p: 0,
                                      borderRadius: 0,
                                      border: "none",
                                      color: (tpl.channels ?? []).includes(
                                        "panel",
                                      )
                                        ? "#16a34a"
                                        : "text.secondary",
                                    }}
                                  />
                                </Box>
                              </TableCell>
                              <TableCell
                                sx={{
                                  textAlign: "right",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <Menu
                                  anchorEl={
                                    openMenu === tpl.id ? anchorRef : undefined
                                  }
                                  open={openMenu === tpl.id}
                                  onClose={() => setOpenMenu(null)}
                                  anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                  }}
                                  transformOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                  }}
                                >
                                  <MenuItem
                                    onClick={() => {
                                      setOpenMenu(null);
                                      setSelectedId(tpl.id);
                                    }}
                                  >
                                    <VisibilityIcon
                                      fontSize="small"
                                      sx={{ mr: 1 }}
                                    />
                                    Ver
                                  </MenuItem>
                                  <MenuItem
                                    onClick={() => {
                                      setOpenMenu(null);
                                      handleOpenEdit(tpl);
                                    }}
                                  >
                                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                                    Editar
                                  </MenuItem>
                                  <MenuItem
                                    onClick={() => {
                                      setOpenMenu(null);
                                      handleDuplicateTemplate(tpl);
                                    }}
                                  >
                                    <ContentCopy
                                      fontSize="small"
                                      sx={{ mr: 1 }}
                                    />
                                    Duplicar
                                  </MenuItem>
                                  <MenuItem
                                    onClick={() => {
                                      setOpenMenu(null);
                                      handleDelete(tpl.id);
                                    }}
                                    sx={{ color: "#ef4444" }}
                                  >
                                    <DeleteIcon
                                      fontSize="small"
                                      sx={{ mr: 1 }}
                                    />
                                    Eliminar
                                  </MenuItem>
                                </Menu>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (e.currentTarget) {
                                      setAnchorRef(
                                        e.currentTarget as HTMLElement,
                                      );
                                    }
                                    setOpenMenu(tpl.id);
                                  }}
                                  sx={{ color: "text.secondary" }}
                                >
                                  <MoreVert fontSize="small" />
                                </IconButton>
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
                    flex: 1,
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
            maxWidth="xl"
            fullWidth
          >
            <DialogTitle
              sx={{
                fontWeight: 700,
                fontSize: "1.125rem",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              {editing ? "Editar Plantilla" : "Nueva Plantilla"}
            </DialogTitle>
            <DialogContent
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                p: 2,
                maxHeight: "85vh",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                  height: "100%",
                  minHeight: 0,
                }}
              >
                {/* ── Columna izquierda: Formulario ── */}
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                  }}
                >
                  {/* GENERAL */}
                  <Box
                    sx={{
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Box
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "action.hover",
                      }}
                    >
                      <Typography
                        variant="overline"
                        sx={{
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          fontSize: "0.6875rem",
                          color: "text.secondary",
                        }}
                      >
                        GENERAL
                      </Typography>
                    </Box>
                    <Box sx={{ p: 1.5 }}>
                      <TextField
                        fullWidth
                        label="Título *"
                        value={form.title}
                        onChange={handleChange("title")}
                        required
                        margin="dense"
                        size="small"
                      />
                      <TextField
                        fullWidth
                        label="Cuerpo (usa {{variable}} para variables dinámicas)"
                        multiline
                        rows={5}
                        value={form.body}
                        onChange={handleChange("body")}
                        required
                        margin="dense"
                        size="small"
                      />
                    </Box>
                  </Box>

                  {/* VISUAL */}
                  <Box
                    sx={{
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Box
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "action.hover",
                      }}
                    >
                      <Typography
                        variant="overline"
                        sx={{
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          fontSize: "0.6875rem",
                          color: "text.secondary",
                        }}
                      >
                        VISUAL
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 1.5,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 1.5,
                      }}
                    >
                      <Tooltip title="Define la familia de notificación: Social (match, like, message), Mensajes, CARE, Perfil, Premium, Sistema o Seguridad.">
                        <Box>
                          <TextField
                            fullWidth
                            label="Categoría"
                            select
                            value={form.category}
                            onChange={handleChange("category")}
                            margin="dense"
                            size="small"
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
                        </Box>
                      </Tooltip>
                      <Tooltip title="P0 Crítica: sobrepasa No Molestar. P1 Alta: prioritaria. P2 Normal: estándar. P3 Baja: informativa.">
                        <Box>
                          <TextField
                            fullWidth
                            label="Prioridad"
                            select
                            value={form.priority}
                            onChange={handleChange("priority")}
                            margin="dense"
                            size="small"
                            slotProps={{ select: {} }}
                          >
                            <MenuItem value="P0">P0 Crítica</MenuItem>
                            <MenuItem value="P1">P1 Alta</MenuItem>
                            <MenuItem value="P2">P2 Normal</MenuItem>
                            <MenuItem value="P3">P3 Baja</MenuItem>
                          </TextField>
                        </Box>
                      </Tooltip>
                      <Box
                        sx={{
                          gridColumn: "1 / -1",
                          mt: 0.5,
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              color: "text.secondary",
                              minWidth: 100,
                            }}
                          >
                            Origen visual
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Switch
                              checked={form.icon_type === "dynamic_avatar"}
                              onChange={(_e, v) =>
                                setForm((prev) => ({
                                  ...prev,
                                  icon_type: v
                                    ? "dynamic_avatar"
                                    : "system_icon",
                                }))
                              }
                              size="small"
                              sx={{
                                color:
                                  form.icon_type === "dynamic_avatar"
                                    ? "primary.main"
                                    : "text.secondary",
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600 }}
                            >
                              Avatar del usuario
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Switch
                              checked={form.icon_type === "system_icon"}
                              onChange={(_e, v) =>
                                setForm((prev) => ({
                                  ...prev,
                                  icon_type: v
                                    ? "system_icon"
                                    : "dynamic_avatar",
                                }))
                              }
                              size="small"
                              sx={{
                                color:
                                  form.icon_type === "system_icon"
                                    ? "primary.main"
                                    : "text.secondary",
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600 }}
                            >
                              Ícono del sistema
                            </Typography>
                          </Box>
                        </Box>
                        {form.icon_type === "system_icon" ? (
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(6, 36px)",
                              gap: 0.75,
                              mt: 0.5,
                            }}
                          >
                            {ICON_EMOJI_GRID.map((emoji) => (
                              <Box
                                key={emoji}
                                onClick={() =>
                                  setForm((prev) => ({ ...prev, icon: emoji }))
                                }
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 36,
                                  height: 36,
                                  borderRadius: "50%",
                                  cursor: "pointer",
                                  fontSize: 20,
                                  border: `1px solid ${
                                    form.icon === emoji
                                      ? "primary.main"
                                      : "divider"
                                  }`,
                                  bgcolor:
                                    form.icon === emoji
                                      ? "rgba(37,99,235,0.12)"
                                      : "background.paper",
                                  "&:hover": {
                                    borderColor: "primary.main",
                                  },
                                }}
                              >
                                <span role="img" aria-label={emoji}>
                                  {emoji}
                                </span>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mt: 0.5,
                              paddingLeft: 1,
                              color: "text.secondary",
                            }}
                          >
                            <span style={{ fontSize: 22 }}>👤</span>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600 }}
                            >
                              Usará la foto del usuario que originó la
                              interacción
                            </Typography>
                          </Box>
                        )}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mt: 0.5,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              color: "text.secondary",
                              minWidth: 80,
                            }}
                          >
                            Color
                          </Typography>
                          <TextField
                            fullWidth
                            label="Color hex"
                            value={form.color || "#3b82f6"}
                            onChange={handleChange("color")}
                            size="small"
                            margin="dense"
                            sx={{ flex: 1 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* COMPORTAMIENTO */}
                  <Box
                    sx={{
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Box
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "action.hover",
                      }}
                    >
                      <Typography
                        variant="overline"
                        sx={{
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          fontSize: "0.6875rem",
                          color: "text.secondary",
                        }}
                      >
                        COMPORTAMIENTO
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 1.5,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 1.5,
                      }}
                    >
                      <Box>
                        <TextField
                          fullWidth
                          label="Tipo de acción"
                          select
                          value={form.action_type}
                          onChange={handleChange("action_type")}
                          margin="dense"
                          size="small"
                          slotProps={{ select: {} }}
                        >
                          <MenuItem value="">Ninguna</MenuItem>
                          <MenuItem value="url">Abrir URL</MenuItem>
                          <MenuItem value="screen">
                            Abrir pantalla interna
                          </MenuItem>
                          <MenuItem value="chat">Abrir chat</MenuItem>
                          <MenuItem value="profile">Abrir perfil</MenuItem>
                          <MenuItem value="survey">Abrir encuesta</MenuItem>
                        </TextField>
                      </Box>
                      <Box>
                        <TextField
                          fullWidth
                          label="Destino"
                          value={form.action_destination}
                          onChange={handleChange("action_destination")}
                          placeholder="/profile/{id} o https://..."
                          margin="dense"
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Box>

                  {/* OPCIONES */}
                  <Box
                    sx={{
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Box
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "action.hover",
                      }}
                    >
                      <Typography
                        variant="overline"
                        sx={{
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          fontSize: "0.6875rem",
                          color: "text.secondary",
                        }}
                      >
                        OPCIONES
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 1.5,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <Tooltip title="La notificación permanecerá visible hasta que el usuario interactúe con ella.">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Switch
                            checked={form.required_action}
                            onChange={handleChangeCheckbox("required_action")}
                            size="small"
                          />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Requiere acción del usuario
                          </Typography>
                        </Box>
                      </Tooltip>
                      <Tooltip title="Ignora el modo No Molestar en dispositivos compatibles.">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Switch
                            checked={form.critical}
                            onChange={handleChangeCheckbox("critical")}
                            size="small"
                          />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Crítica (sobrepasa No Molestar)
                          </Typography>
                        </Box>
                      </Tooltip>
                      <Tooltip title="La notificación no desaparecerá automáticamente del panel.">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Switch
                            checked={form.persistent}
                            onChange={handleChangeCheckbox("persistent")}
                            size="small"
                          />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Persistente
                          </Typography>
                        </Box>
                      </Tooltip>
                      <Tooltip title="Permite programar el envío para una fecha y hora específicas.">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Switch
                            checked={form.programmable}
                            onChange={handleChangeCheckbox("programmable")}
                            size="small"
                          />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Programable
                          </Typography>
                        </Box>
                      </Tooltip>
                      <Tooltip title="El usuario puede silenciar este tipo de notificaciones.">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Switch
                            checked={form.silencable}
                            onChange={handleChangeCheckbox("silencable")}
                            size="small"
                          />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Silenciable
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* VARIABLES */}
                  <Box
                    sx={{
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Box
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "action.hover",
                      }}
                    >
                      <Typography
                        variant="overline"
                        sx={{
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          fontSize: "0.6875rem",
                          color: "text.secondary",
                        }}
                      >
                        VARIABLES
                      </Typography>
                    </Box>
                    <Box sx={{ p: 1.5 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        {VARIABLE_PRESETS.map((v) => (
                          <Button
                            key={v}
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                body: prev.body + `{{${v}}}`,
                              }))
                            }
                            sx={{
                              px: 0.75,
                              py: 0.375,
                              fontSize: "0.68rem",
                              borderRadius: 6,
                            }}
                          >{`{{${v}}`}</Button>
                        ))}
                      </Box>
                      <TextField
                        fullWidth
                        label="Variables actuales (separadas por coma)"
                        value={form.variables}
                        onChange={handleChange("variables")}
                        placeholder="Ej: first_name, matches_count, city"
                        margin="dense"
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>

                {/* ── Columna derecha: Vista previa ── */}
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      backgroundColor: "action.hover",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontSize: "0.6875rem",
                        color: "text.secondary",
                      }}
                    >
                      VISTA PREVIA
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.5,
                      }}
                    >
                      <Button
                        size="small"
                        onClick={() => setPreviewTheme("light")}
                        sx={{
                          fontSize: "0.68rem",
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 4,
                          border: `1px solid ${
                            previewTheme === "light"
                              ? "primary.main"
                              : "divider"
                          }`,
                          color:
                            previewTheme === "light"
                              ? "primary.main"
                              : "text.secondary",
                        }}
                      >
                        Claro
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setPreviewTheme("dark")}
                        sx={{
                          fontSize: "0.68rem",
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 4,
                          border: `1px solid ${
                            previewTheme === "dark" ? "primary.main" : "divider"
                          }`,
                          color:
                            previewTheme === "dark"
                              ? "primary.main"
                              : "text.secondary",
                        }}
                      >
                        Oscuro
                      </Button>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: "auto",
                      p: 1.5,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    {selectedTemplate ? (
                      <PushPreview
                        device="android"
                        title={resolvePreview(selectedTemplate.title)}
                        body={resolvePreview(selectedTemplate.body)}
                        icon={selectedTemplate.icon}
                        category={selectedTemplate.category}
                        priority={selectedTemplate.priority}
                        actionUrl={selectedTemplate.action_url}
                        theme={previewTheme}
                        animate={true}
                        animationClass={animStyles.slideIn}
                      />
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
                          sx={{ fontSize: 48, mb: 1, opacity: 0.3 }}
                        />
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          Selecciona una plantilla
                        </Typography>
                        <Typography variant="caption">
                          La vista previa se actualizará al editar.
                        </Typography>
                      </Box>
                    )}
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
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ pt: 0, px: 2, pb: 1, gap: 1 }}>
              <Button
                onClick={() => setOpen(false)}
                startIcon={<CancelIcon />}
                size="medium"
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                startIcon={<SaveIcon />}
                size="large"
                sx={{
                  px: 2,
                  fontWeight: 700,
                  minHeight: 44,
                }}
              >
                Guardar plantilla
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </AdminLayout>
  );
}

function TemplatePreviewCell({ tpl }: { tpl: Template }) {
  const iconType = getIconType(tpl.category);
  const isSocial = iconType === "dynamic_avatar";
  const style = getStyle(tpl.category);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: "50%",
        bgcolor: isSocial ? "rgba(236,72,153,0.12)" : `${style.color}12`,
        color: isSocial ? "#ec4899" : style.color,
        fontSize: 18,
        flexShrink: 0,
        border: `1px solid ${isSocial ? "#ec489933" : `${style.color}33`}`,
      }}
    >
      {isSocial ? (
        <span role="img" aria-label="avatar">
          👤
        </span>
      ) : (
        <span role="img" aria-label={tpl.icon}>
          {getEmoji(tpl.icon)}
        </span>
      )}
    </Box>
  );
}

function SortableHeader({
  label,
  sortKey,
  sortBy,
  sortDirection,
  setSortBy,
  setSortDirection,
  colWidth,
  colSticky,
}: {
  label: string;
  sortKey: string;
  sortBy: string | null;
  sortDirection: "asc" | "desc" | "none";
  setSortBy: React.Dispatch<React.SetStateAction<string | null>>;
  setSortDirection: React.Dispatch<
    React.SetStateAction<"asc" | "desc" | "none">
  >;
  colWidth?: string;
  colSticky?: boolean;
}) {
  const active = sortBy === sortKey;
  const cellWidth = colWidth;
  const isSticky = colSticky;

  const handleClick = () => {
    if (!active) {
      setSortBy(sortKey);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortBy(null);
      setSortDirection("none");
    }
  };

  let indicator = "";
  if (sortBy === null) {
    indicator = " ↕";
  } else if (active) {
    indicator = sortDirection === "asc" ? " ↑" : " ↓";
  }

  return (
    <TableCell
      sx={{
        fontWeight: 700,
        cursor: "pointer",
        userSelect: "none",
        width: cellWidth,
        "&:hover": {
          backgroundColor: "rgba(0,0,0,0.04)",
        },
        ...(isSticky
          ? {
              position: "sticky",
              left: 0,
              zIndex: 1,
              backgroundColor: "background.paper",
            }
          : {}),
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <Box
        component="span"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <Box
          component="span"
          sx={{
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Box>
        <Box
          component="span"
          sx={{
            fontWeight: 400,
            fontSize: "0.75rem",
            color: active ? "primary.main" : "text.secondary",
            whiteSpace: "nowrap",
          }}
        >
          {indicator}
        </Box>
      </Box>
    </TableCell>
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
