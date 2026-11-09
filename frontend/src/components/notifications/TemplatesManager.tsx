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
  InputAdornment,
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
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import AddIcon from "@mui/icons-material/Add";

import SearchIcon from "@mui/icons-material/Search";

import EditIcon from "@mui/icons-material/Edit";

import DeleteIcon from "@mui/icons-material/Delete";

import SaveIcon from "@mui/icons-material/Save";

import CancelIcon from "@mui/icons-material/Cancel";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

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

  destinatarios?: string[];

  evento_disparador?: string;

  uso_principal?: string; // portal_usuarios | portal_empleados | portal_marcas | global

  baseLocale?: string; // idioma base (es, en, fr, etc.)

  translations?: Record<string, { title: string; body: string }>; // traducciones por idioma

  internalName?: string; // nombre interno para el backend

  slug?: string; // clave única (new_match, campaign_rejected, etc.)

  templateType?: string; // sistema | evento_automatico | campaña_manual

  created_by: string;

  created_at: string;

  updated_at: string;

  deleted_at?: string;

  deleted_by?: string;
}

interface TemplateFormData {
  title: string;

  body: string;

  icon: string;

  icon_type: string;

  category: string;

  priority: string;

  action_url: string;

  required_action: boolean;

  critical: boolean;

  variables: string;

  color: string;

  channels: string[];

  action_type: string;

  action_destination: string;

  persistent: boolean;

  programmable: boolean;

  silencable: boolean;

  destinatarios: string[];

  evento_disparador: string;

  uso_principal: string;

  baseLocale: string;

  translations: Record<string, { title: string; body: string }>;

  internalName: string;

  slug: string;

  templateType: string;
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

const VARIABLE_DESCS: Record<string, string> = {
  first_name: "Primer nombre del usuario receptor",

  city: "Ciudad del usuario",

  nombre_match: "Usuario que realizó el match",

  nombre_usuario: "Usuario que interactuó",

  ciudad: "Ciudad donde ocurrió el evento",

  cuestionarios_pendientes: "Preguntas restantes de tu encuesta CARE",

  matches_count: "Número de coincidencias disponibles",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",

  es: "Español",

  pt: "Português",

  fr: "Français",

  de: "Deutsch",

  it: "Italiano",

  ru: "Русский",

  sv: "Svenska",

  nl: "Nederlands",

  zh: "中文 (Mandarín)",

  hi: "हिन्दी (Hindi)",

  bn: "বাংলা (Bengalí)",

  ja: "日本語 (Japanese)",

  ko: "한국어 (Korean)",

  ar: "العربية (Árabe)",

  sw: "Kiswahili (Swahili)",

  ha: "Hausa",

  am: "አማርኛ (Amhárico)",

  fil: "Filipino/Tagalog",

  ms: "Bahasa Melayu (Malay)",

  mi: "Māori",
};

const VARIABLE_SCOPE: Record<string, { title: boolean; body: boolean }> = {
  first_name: { title: true, body: true },

  city: { title: false, body: true },

  nombre_match: { title: true, body: true },

  nombre_usuario: { title: false, body: true },

  ciudad: { title: false, body: true },

  cuestionarios_pendientes: { title: false, body: true },

  matches_count: { title: true, body: true },
};

const VARIABLE_CATEGORIES: Record<
  string,
  { label: string; variables: string[] }
> = {
  USUARIO: {
    label: "USUARIO",
    variables: [
      "first_name",
      "last_name",
      "full_name",
      "username",
      "email",
      "city",
      "country",
      "language",
      "age",
      "birth_date",
    ],
  },
  SOCIAL: {
    label: "SOCIAL",
    variables: [
      "nombre_match",
      "usuario_match",
      "match_count",
      "like_count",
      "nombre_usuario",
      "perfil_visitado_por",
      "mensaje_remitente",
    ],
  },
  MENSAJES: {
    label: "MENSAJES",
    variables: [
      "sender_name",
      "message_preview",
      "conversation_title",
      "unread_messages",
      "last_message_time",
    ],
  },
  CARE: {
    label: "CARE",
    variables: [
      "cuestionarios_pendientes",
      "encuestas_pendientes",
      "ultima_puntuacion",
      "nivel_riesgo",
      "fecha_siguiente_revision",
      "especialista_asignado",
    ],
  },
  PREMIUM: {
    label: "PREMIUM",
    variables: [
      "plan_name",
      "days_remaining",
      "renewal_date",
      "benefit_name",
      "discount_percent",
    ],
  },
  EVENTOS: {
    label: "EVENTOS",
    variables: [
      "event_name",
      "event_date",
      "event_time",
      "event_location",
      "event_host",
    ],
  },
  MARCAS: {
    label: "MARCAS",
    variables: [
      "brand_name",
      "campaign_name",
      "campaign_id",
      "lead_name",
      "leads_count",
      "budget_remaining",
      "invoice_number",
    ],
  },
  EMPLEADOS: {
    label: "EMPLEADOS",
    variables: [
      "employee_name",
      "ticket_id",
      "ticket_title",
      "task_name",
      "department",
      "assigned_by",
      "case_id",
    ],
  },
  SISTEMA: {
    label: "SISTEMA",
    variables: [
      "current_date",
      "current_time",
      "platform_name",
      "app_version",
      "environment",
    ],
  },
  SMART: {
    label: "SMART",
    variables: [
      "days_since_last_login",
      "days_as_member",
      "profile_completion_percent",
      "compatibility_score",
      "new_matches_today",
    ],
  },
};

const VARIABLE_EXAMPLES: Record<string, string> = {
  first_name: "Juan Pérez",
  last_name: "García",
  full_name: "Juan Pérez García",
  username: "juanp2024",
  email: "juan.perez@email.com",
  city: "Madrid",
  country: "España",
  language: "Español",
  age: "28",
  birth_date: "15/03/1996",
  nombre_match: "María López",
  usuario_match: "mlp2024",
  match_count: "5",
  like_count: "12",
  nombre_usuario: "Lucía Martínez",
  perfil_visitado_por: "Carlos Ruiz",
  mensaje_remitente: "Laura Gómez",
  sender_name: "Lucía Gómez",
  message_preview: "Hola, tenemos una novedad para ti",
  conversation_title: "Conversación con Lucía",
  unread_messages: "3",
  last_message_time: "hace 2 min",
  cuestionarios_pendientes: "3",
  encuestas_pendientes: "2",
  ultima_puntuacion: "4.8",
  nivel_riesgo: "Bajo",
  fecha_siguiente_revision: "20/01/2025",
  especialista_asignado: "Dr. Rodríguez",
  plan_name: "Premium Anual",
  days_remaining: "15",
  renewal_date: "15/02/2025",
  benefit_name: "Envío gratuito",
  discount_percent: "20",
  event_name: "Webinar de Producto",
  event_date: "20/01/2025",
  event_time: "19:00",
  event_location: "Online",
  event_host: "Equipo RETH",
  brand_name: "RETH",
  campaign_name: "Campaña de Verano",
  campaign_id: "CMP-2025-001",
  lead_name: "Juan Pérez",
  leads_count: "45",
  budget_remaining: "$5.000",
  invoice_number: "FAC-2025-001",
  employee_name: "María López",
  ticket_id: "TK-1234",
  ticket_title: "Error de inicio de sesión",
  task_name: "Revisar reporte mensual",
  department: "Soporte Técnico",
  assigned_by: "Jefa de Equipo",
  case_id: "CASE-5678",
  current_date: "20/01/2025",
  current_time: "14:30",
  platform_name: "RETH",
  app_version: "2.1.0",
  environment: "Producción",
  days_since_last_login: "2",
  days_as_member: "365",
  profile_completion_percent: "85",
  compatibility_score: "92",
  new_matches_today: "3",
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

  const [form, setForm] = useState<TemplateFormData>({
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

    destinatarios: ["usuarios"],

    evento_disparador: "",

    uso_principal: "",

    baseLocale: "es",

    translations: {},

    internalName: "",

    slug: "",

    templateType: "sistema",
  });

  const [activeField, setActiveField] = useState<"title" | "body">("body");

  const [editingLocale, setEditingLocale] = useState<string>("es");

  const [seeding, setSeeding] = useState(false);

  const [previewMode, setPreviewMode] = useState<"push" | "panel">("push");

  const [pushDevice, setPushDevice] = useState<string>("android");

  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("dark");

  const [multiView, setMultiView] = useState(false);

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [anchorRef, setAnchorRef] = useState<HTMLElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);

  const [variableCategory, setVariableCategory] = useState<string>("");

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

      const matchesAudience =
        !selectedAudience ||
        (() => {
          const d = tpl.destinatarios ?? [];

          switch (selectedAudience) {
            case "usuarios":
              return d.includes("usuarios");

            case "empleados":
              return d.includes("empleados");

            case "marcas":
              return d.includes("marcas");

            case "global":
              return (
                d.includes("usuarios") &&
                d.includes("empleados") &&
                d.includes("marcas")
              );

            case "usuarios_empleados":
              return d.includes("usuarios") && d.includes("empleados");

            case "usuarios_marcas":
              return d.includes("usuarios") && d.includes("marcas");

            case "empleados_marcas":
              return d.includes("empleados") && d.includes("marcas");

            default:
              return true;
          }
        })();

      return matchesSearch && matchesCategory && matchesAudience;
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

    if (sortBy === "audience") {
      return list.sort((a, b) => {
        const aDest = (a.destinatarios ?? []).slice().sort().join(",") || "";

        const bDest = (b.destinatarios ?? []).slice().sort().join(",") || "";

        const cmp = aDest.localeCompare(bDest);

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

      destinatarios: ["usuarios"],

      evento_disparador: "",

      uso_principal: "",

      baseLocale: "es",

      translations: { es: { title: "", body: "" } },

      internalName: "",

      slug: "",

      templateType: "sistema",
    });

    setEditingLocale("es");

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

      destinatarios: tpl.destinatarios || ["usuarios"],

      evento_disparador: tpl.evento_disparador || "",

      uso_principal: tpl.uso_principal || "",

      baseLocale: tpl.baseLocale || "es",

      translations: tpl.translations || {
        [tpl.baseLocale || "es"]: { title: tpl.title, body: tpl.body },
      },

      internalName: tpl.internalName || "",

      slug: tpl.slug || "",

      templateType: tpl.templateType || "sistema",
    });

    setEditingLocale(tpl.baseLocale || "es");

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

  const toggleDestinatario = (destinatario: string) => {
    setForm((prev) => {
      const current = prev.destinatarios ?? [];

      if (current.includes(destinatario)) {
        return {
          ...prev,

          destinatarios: current.filter((d) => d !== destinatario),
        };
      }

      return { ...prev, destinatarios: [...current, destinatario] };
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
        title:
          form.translations?.[form.baseLocale ?? "es"]?.title ??
          form.title ??
          "",

        body:
          form.translations?.[form.baseLocale ?? "es"]?.body ?? form.body ?? "",

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

        destinatarios: form.destinatarios || ["usuarios"],

        evento_disparador: form.evento_disparador,

        uso_principal: form.uso_principal,

        baseLocale: form.baseLocale,

        translations: form.translations,

        internalName: form.internalName,

        slug: form.slug,

        templateType: form.templateType,
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

              gap: 1,
            }}
          >
            <Box sx={{ width: "100%" }}>
              <Box
                sx={{
                  display: "flex",

                  alignItems: "center",

                  gap: 1,

                  justifyContent: "space-between",

                  flexWrap: "wrap",

                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    display: "flex",

                    alignItems: "center",

                    gap: 1,

                    flexWrap: "wrap",
                  }}
                >
                  <IconButton
                    size="small"

                    onClick={() =>
                      backTo ? router.push(backTo) : router.back()
                    }

                    sx={{ color: "text.secondary" }}
                  >
                    <ArrowBackIcon />
                  </IconButton>

                  <Box>
                    <Typography
                      variant="h4"

                      sx={{ fontSize: "30px", fontWeight: 700, mb: 0.25 }}
                    >
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
                    textAlign: "right",

                    whiteSpace: "nowrap",
                  }}
                >
                  <Typography
                    variant="body2"

                    sx={{ color: "text.secondary", fontWeight: 600, mb: 0 }}
                  >
                    {templates.length} plantillas registradas
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 0.5 }} />
            </Box>

            <Box
              sx={{
                display: "flex",

                alignItems: "center",

                gap: 1,

                flexWrap: "wrap",

                width: "100%",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Box sx={{ width: 420, flexShrink: 0 }}>
                  <TextField
                    size="small"

                    placeholder="Buscar plantilla por nombre..."

                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),

                        sx: { px: 2 },
                      },
                    }}

                    sx={{
                      width: "100%",

                      height: 42,

                      borderRadius: 12,

                      fontSize: 16,

                      fontWeight: 400,

                      lineHeight: "normal",
                    }}

                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </Box>

                <Box sx={{ width: 200, flexShrink: 0 }}>
                  <TextField
                    select

                    size="small"

                    label="Ámbito"

                    value={selectedAudience ?? ""}

                    onChange={(e) =>
                      setSelectedAudience(e.target.value || null)
                    }

                    margin="dense"

                    sx={{
                      width: "100%",

                      height: 48,

                      borderRadius: 12,

                      fontSize: 16,

                      fontWeight: 400,

                      lineHeight: "normal",
                    }}

                    slotProps={{
                      select: { sx: { px: 2 } },
                    }}
                  >
                    <MenuItem value="">Todas</MenuItem>

                    <MenuItem value="usuarios">Usuarios</MenuItem>

                    <MenuItem value="empleados">Empleados</MenuItem>

                    <MenuItem value="marcas">Marcas</MenuItem>

                    <MenuItem value="global">Global</MenuItem>
                  </TextField>
                </Box>

                <Box sx={{ width: 200, flexShrink: 0 }}>
                  <TextField
                    select

                    size="small"

                    label="Categoría"

                    value={selectedCategory ?? ""}

                    onChange={(e) =>
                      setSelectedCategory(e.target.value || null)
                    }

                    margin="dense"

                    sx={{
                      width: "100%",

                      height: 48,

                      borderRadius: 12,

                      fontSize: 16,

                      fontWeight: 400,

                      lineHeight: "normal",
                    }}

                    slotProps={{
                      select: { sx: { px: 2 } },
                    }}
                  >
                    <MenuItem value="">Todas</MenuItem>

                    {Object.entries(CATEGORY_PRIORITY_STYLES).map(
                      ([key, style]) => (
                        <MenuItem key={key} value={key}>
                          {style.category}
                        </MenuItem>
                      ),
                    )}
                  </TextField>
                </Box>
              </Box>

              <Box sx={{ ml: "auto" }}>
                <Tooltip title="Crear una nueva plantilla reutilizable">
                  <Button
                    variant="contained"

                    startIcon={<AddIcon />}

                    sx={{
                      borderRadius: 12,

                      px: 2,

                      minHeight: 48,

                      height: 48,

                      fontSize: "0.875rem",

                      fontWeight: 600,
                    }}

                    onClick={handleOpenCreate}
                  >
                    Nueva Plantilla
                  </Button>
                </Tooltip>
              </Box>
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
                            label="Audiencia"

                            sortKey="audience"

                            sortBy={sortBy}

                            sortDirection={sortDirection}

                            setSortBy={setSortBy}

                            setSortDirection={setSortDirection}

                            colWidth="12%"
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

                              <TableCell sx={{ width: "12%" }}>
                                <Box
                                  sx={{
                                    display: "flex",

                                    flexWrap: "wrap",

                                    gap: 0.5,
                                  }}
                                >
                                  {(tpl.destinatarios ?? ["usuarios"])
                                    .length === 3 &&
                                  (tpl.destinatarios ?? []).includes(
                                    "usuarios",
                                  ) &&
                                  (tpl.destinatarios ?? []).includes(
                                    "empleados",
                                  ) &&
                                  (tpl.destinatarios ?? []).includes(
                                    "marcas",
                                  ) ? (
                                    <Chip
                                      key="global"

                                      label="🌐 Global"

                                      size="small"

                                      variant="outlined"

                                      sx={{
                                        fontSize: "0.62rem",

                                        fontWeight: 700,

                                        borderRadius: 6,

                                        color: "#6b7280",

                                        borderColor: "#6b728040",
                                      }}
                                    />
                                  ) : (
                                    (tpl.destinatarios ?? ["usuarios"]).map(
                                      (d) => (
                                        <Chip
                                          key={d}

                                          label={
                                            d === "usuarios"
                                              ? "👤 Usuarios"
                                              : d === "empleados"
                                                ? "👔 Empleados"
                                                : d === "marcas"
                                                  ? "🏢 Marcas"
                                                  : d
                                          }

                                          size="small"

                                          variant="outlined"

                                          sx={{
                                            fontSize: "0.62rem",

                                            fontWeight: 600,

                                            borderRadius: 6,

                                            color:
                                              d === "usuarios"
                                                ? "#3b82f6"
                                                : d === "empleados"
                                                  ? "#8b5cf6"
                                                  : "#f59e0b",

                                            borderColor:
                                              d === "usuarios"
                                                ? "#3b82f640"
                                                : d === "empleados"
                                                  ? "#8b5cf640"
                                                  : "#f59e0b40",
                                          }}
                                        />
                                      ),
                                    )
                                  )}
                                </Box>
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
                                ></Menu>

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

              {/* ── Columna derecha: Vista previa + Opciones + Variables (45%) ── */}

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
                        Vista múltiple: {multiView ? "Activada" : "Desactivada"}
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
                              bgcolor: active ? "transparent" : "action.hover",
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
                        previewMode === "panel" ? "#ef4444" : "text.secondary",

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

                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
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
                            {computeTemplateMetrics(selectedTemplate).titleLen}{" "}
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
                            {computeTemplateMetrics(selectedTemplate).bodyLen} /
                            120)
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}

          {/* Dialog crear/editar */}

          <Dialog
            open={open}

            onClose={() => setOpen(false)}

            maxWidth="xl"

            fullWidth

            slotProps={{
              paper: {
                sx: {
                  maxHeight: "90vh",

                  display: "flex",

                  flexDirection: "column",
                },
              },
            }}
          >
            <Box
              sx={(theme) => ({
                bgcolor: theme.palette.mode === "dark" ? "#232428" : "#FFFFFF",

                p: 0,

                width: "100%",

                height: "100%",

                display: "flex",

                flexDirection: "column",
              })}
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

                  flex: 1,

                  minHeight: 0,

                  overflowY: "auto",
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
                  {/* ── Columna izquierda: Formulario (55%) ── */}

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
                        <Box
                          sx={{
                            display: "flex",

                            alignItems: "center",

                            justifyContent: "space-between",

                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="caption"

                            sx={{
                              fontWeight: 600,

                              color: "text.secondary",

                              fontSize: "0.6875rem",
                            }}
                          >
                            Título
                          </Typography>

                          <Typography
                            variant="caption"

                            sx={{
                              fontWeight: 600,

                              color: "text.secondary",

                              fontSize: "0.6875rem",
                            }}
                          >
                            {
                              (
                                form.translations?.[form.baseLocale ?? "es"]
                                  ?.title ?? ""
                              ).length
                            }
                            /40
                          </Typography>
                        </Box>

                        <TextField
                          fullWidth

                          label="Título *"

                          value={
                            form.translations?.[form.baseLocale ?? "es"]
                              ?.title ?? ""
                          }

                          onChange={(e) =>
                            setForm((prev) => {
                              const loc = prev.baseLocale ?? "es";

                              const cur = prev.translations?.[loc] ?? {
                                title: "",

                                body: "",
                              };

                              return {
                                ...prev,

                                translations: {
                                  ...prev.translations,

                                  [loc]: { ...cur, title: e.target.value },
                                },
                              };
                            })
                          }

                          required

                          margin="dense"

                          size="small"

                          sx={{ mb: 1 }}

                          onFocus={() => setActiveField("title")}
                        />

                        <Box
                          sx={{
                            display: "flex",

                            alignItems: "center",

                            justifyContent: "space-between",

                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="caption"

                            sx={{
                              fontWeight: 600,

                              color: "text.secondary",

                              fontSize: "0.6875rem",
                            }}
                          >
                            Cuerpo
                          </Typography>

                          <Typography
                            variant="caption"

                            sx={{
                              fontWeight: 600,

                              color: "text.secondary",

                              fontSize: "0.6875rem",
                            }}
                          >
                            {
                              (
                                form.translations?.[form.baseLocale ?? "es"]
                                  ?.body ?? ""
                              ).length
                            }
                            /120
                          </Typography>
                        </Box>

                        <TextField
                          fullWidth

                          multiline

                          rows={5}

                          value={
                            form.translations?.[form.baseLocale ?? "es"]
                              ?.body ?? ""
                          }

                          onChange={(e) =>
                            setForm((prev) => {
                              const loc = prev.baseLocale ?? "es";

                              const cur = prev.translations?.[loc] ?? {
                                title: "",

                                body: "",
                              };

                              return {
                                ...prev,

                                translations: {
                                  ...prev.translations,

                                  [loc]: { ...cur, body: e.target.value },
                                },
                              };
                            })
                          }

                          required

                          margin="dense"

                          size="small"

                          sx={{ mb: 1 }}

                          label={
                            "Cuerpo (usa variable para variables dinámicas)"
                          }

                          onFocus={() => setActiveField("body")}
                        />
                      </Box>
                    </Box>

                    {/* VARIABLES DISPONIBLES */}

                    <Box
                      sx={{
                        borderRadius: 1,

                        border: "1px solid",

                        borderColor: "divider",

                        overflow: "hidden",

                        display: "flex",

                        flexDirection: "column",

                        mt: 1,
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
                          VARIABLES DISPONIBLES
                        </Typography>
                      </Box>

                      <Box sx={{ p: 1.5 }}>
                        <Typography
                          variant="caption"

                          sx={{
                            fontWeight: 600,

                            color: "text.secondary",

                            mb: 0.75,

                            fontSize: "0.6875rem",
                          }}
                        >
                          Categoría de variables
                        </Typography>

                        <Box
                          sx={{
                            display: "grid",

                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(200px, 1fr))",

                            gap: 1,

                            mb: 1.5,
                          }}
                        >
                          {Object.entries(VARIABLE_CATEGORIES).flatMap(
                            ([catKey, cat]) =>
                              cat.variables
                                .filter((v) => VARIABLE_PRESETS.includes(v))
                                .filter(
                                  (v) =>
                                    !variableCategory ||
                                    variableCategory === catKey,
                                )
                                .map((v) => {
                                  const desc = VARIABLE_DESCS[v] ?? "";
                                  return (
                                    <Box
                                      key={v}
                                      sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 0.25,
                                        mb: 0.75,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 0.5,
                                          mb: 0.25,
                                        }}
                                      >
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          onClick={() => {
                                            const field = activeField;
                                            const loc = form.baseLocale ?? "es";
                                            const current = form.translations?.[
                                              loc
                                            ] ?? {
                                              title: "",
                                              body: "",
                                            };
                                            setForm((prev) => ({
                                              ...prev,
                                              translations: {
                                                ...prev.translations,
                                                [loc]: {
                                                  ...current,
                                                  [field]:
                                                    current[field] + `{{${v}}}`,
                                                },
                                              },
                                            }));
                                          }}
                                          sx={{
                                            px: 0.5,
                                            py: 0.3,
                                            fontSize: "0.68rem",
                                            borderRadius: 6,
                                            textAlign: "left",
                                            justifyContent: "flex-start",
                                            width: "100%",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            borderColor: "divider",
                                            "&:hover": {
                                              borderColor: "primary.main",
                                            },
                                          }}
                                        >
                                          {`{{${v}}`}
                                        </Button>
                                      </Box>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: "text.secondary",
                                          fontSize: "0.62rem",
                                          fontStyle: "italic",
                                        }}
                                      >
                                        {desc}
                                      </Typography>
                                    </Box>
                                  );
                                }),
                          )}
                        </Box>
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
                                    setForm((prev) => ({
                                      ...prev,

                                      icon: emoji,
                                    }))
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

                        <Box>
                          <TextField
                            fullWidth

                            label="Evento disparador"

                            select

                            value={form.evento_disparador}

                            onChange={handleChange("evento_disparador")}

                            margin="dense"

                            size="small"

                            slotProps={{ select: {} }}
                          >
                            <MenuItem value="">Ninguno</MenuItem>

                            <MenuItem value="like_received">
                              like_received
                            </MenuItem>

                            <MenuItem value="match_created">
                              match_created
                            </MenuItem>

                            <MenuItem value="new_message">new_message</MenuItem>

                            <MenuItem value="payment_successful">
                              payment_successful
                            </MenuItem>

                            <MenuItem value="survey_completed">
                              survey_completed
                            </MenuItem>
                          </TextField>
                        </Box>

                        <Box sx={{ gridColumn: "1 / -1", mt: 0.5 }}>
                          <TextField
                            fullWidth

                            label="Uso principal"

                            select

                            value={form.uso_principal}

                            onChange={handleChange("uso_principal")}

                            margin="dense"

                            size="small"

                            slotProps={{ select: {} }}
                          >
                            <MenuItem value="portal_usuarios">
                              Portal Usuarios
                            </MenuItem>

                            <MenuItem value="portal_empleados">
                              Portal Empleados
                            </MenuItem>

                            <MenuItem value="portal_marcas">
                              Portal Marcas
                            </MenuItem>

                            <MenuItem value="global">Global</MenuItem>
                          </TextField>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* ── Columna derecha: Vista previa + Opciones + Variables (45%) ── */}

                  <Box
                    sx={{
                      flex: 1,

                      minWidth: 0,

                      display: "flex",

                      flexDirection: "column",

                      height: "100%",
                    }}
                  >
                    {/* VISTA PREVIA */}

                    <Box
                      sx={{
                        borderRadius: 1,

                        border: "1px solid",

                        borderColor: "divider",

                        overflow: "hidden",

                        display: "flex",

                        flexDirection: "column",

                        minHeight: 300,
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
                                previewTheme === "dark"
                                  ? "primary.main"
                                  : "divider"
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

                          p: 1,

                          display: "flex",

                          flexDirection: "column",

                          gap: 1,

                          justifyContent: "center",
                        }}
                      >
                        <PushPreview
                          device="android"

                          title={resolvePreview(
                            form.translations?.[form.baseLocale ?? "es"]
                              ?.title ?? "",
                          )}

                          body={resolvePreview(
                            form.translations?.[form.baseLocale ?? "es"]
                              ?.body ?? "",
                          )}

                          icon={form.icon}

                          category={form.category}

                          priority={form.priority}

                          actionUrl={form.action_url || undefined}

                          theme={previewTheme}

                          animate={true}

                          animationClass={animStyles.slideIn}
                        />
                      </Box>
                    </Box>

                    {/* LOCALIZACIÓN */}

                    <Box
                      sx={{
                        borderRadius: 1,

                        border: "1px solid",

                        borderColor: "divider",

                        overflow: "hidden",

                        display: "flex",

                        flexDirection: "column",

                        mb: 1,
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

                            color: "text.secondary",

                            textTransform: "uppercase",

                            fontSize: "0.6875rem",
                          }}
                        >
                          LOCALIZACIÓN
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
                        <TextField
                          select

                          size="small"

                          label="Idioma base"

                          value={form.baseLocale ?? "es"}

                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,

                              baseLocale: e.target.value,
                            }))
                          }

                          margin="dense"

                          slotProps={{ select: {} }}
                        >
                          <MenuItem value="en">English</MenuItem>

                          <MenuItem value="es">Español</MenuItem>

                          <MenuItem value="pt">Português</MenuItem>

                          <MenuItem value="fr">Français</MenuItem>

                          <MenuItem value="de">Deutsch</MenuItem>

                          <MenuItem value="it">Italiano</MenuItem>

                          <MenuItem value="ru">Русский</MenuItem>

                          <MenuItem value="sv">Svenska</MenuItem>

                          <MenuItem value="nl">Nederlands</MenuItem>

                          <MenuItem value="zh">中文 (Mandarín)</MenuItem>

                          <MenuItem value="hi">हिन्दी (Hindi)</MenuItem>

                          <MenuItem value="bn">বাংলা (Bengalí)</MenuItem>

                          <MenuItem value="ja">日本語 (Japanese)</MenuItem>

                          <MenuItem value="ko">한국어 (Korean)</MenuItem>

                          <MenuItem value="ar">العربية (Árabe)</MenuItem>

                          <MenuItem value="sw">Kiswahili (Swahili)</MenuItem>

                          <MenuItem value="ha">Hausa</MenuItem>

                          <MenuItem value="am">አማርኛ (Amhárico)</MenuItem>

                          <MenuItem value="fil">Filipino/Tagalog</MenuItem>

                          <MenuItem value="ms">Bahasa Melayu (Malay)</MenuItem>

                          <MenuItem value="mi">Māori</MenuItem>
                        </TextField>

                        <TextField
                          select

                          size="small"

                          label="Tipo de plantilla"

                          value={form.templateType ?? "sistema"}

                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,

                              templateType: e.target.value,
                            }))
                          }

                          margin="dense"

                          slotProps={{ select: {} }}
                        >
                          <MenuItem value="sistema">Sistema</MenuItem>

                          <MenuItem value="evento_automatico">
                            Evento automático
                          </MenuItem>

                          <MenuItem value="campaña_manual">
                            Campaña manual
                          </MenuItem>
                        </TextField>
                      </Box>
                    </Box>

                    {/* TRADUCCIONES */}

                    <Box
                      sx={{
                        borderRadius: 1,

                        border: "1px solid",

                        borderColor: "divider",

                        overflow: "hidden",

                        display: "flex",

                        flexDirection: "column",

                        mb: 1,
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

                            color: "text.secondary",

                            textTransform: "uppercase",

                            fontSize: "0.6875rem",
                          }}
                        >
                          TRADUCCIONES
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          p: 1.5,

                          display: "flex",

                          flexDirection: "column",

                          gap: 0.75,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",

                            alignItems: "center",

                            justifyContent: "space-between",
                          }}
                        >
                          <Typography
                            variant="caption"

                            sx={{ color: "text.secondary" }}
                          >
                            Idioma base:{" "}
                            <Typography
                              variant="caption"

                              sx={{ fontWeight: 700, color: "primary.main" }}
                            >
                              {LANGUAGE_NAMES[form.baseLocale] ??
                                form.baseLocale}
                            </Typography>
                          </Typography>

                          <Button
                            size="small"

                            variant="outlined"

                            onClick={() => {
                              const loc = form.baseLocale ?? "es";

                              setForm((prev) => ({
                                ...prev,

                                translations: {
                                  ...prev.translations,

                                  [loc]: {
                                    ...(prev.translations?.[loc] ?? {
                                      title: "",

                                      body: "",
                                    }),
                                  },
                                },
                              }));
                            }}
                          >
                            + Agregar traducción
                          </Button>
                        </Box>

                        {["es", "en", "fr", "de", "it", "pt"].map((loc) => {
                          const t = form.translations?.[loc];

                          const hasTranslation = Boolean(t?.title || t?.body);

                          const isBase = loc === form.baseLocale;

                          return (
                            <Box
                              key={loc}

                              sx={{
                                display: "flex",

                                alignItems: "center",

                                justifyContent: "space-between",

                                px: 0.5,

                                py: 0.5,

                                borderRadius: 4,

                                bgcolor: isBase
                                  ? "action.hover"
                                  : "transparent",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",

                                  alignItems: "center",

                                  gap: 0.75,
                                }}
                              >
                                <Typography
                                  variant="body2"

                                  sx={{ fontWeight: 600, minWidth: 100 }}
                                >
                                  {LANGUAGE_NAMES[loc] ?? loc}
                                </Typography>

                                {isBase && (
                                  <Typography
                                    variant="caption"

                                    sx={{
                                      color: "primary.main",

                                      fontSize: "0.65rem",
                                    }}
                                  >
                                    Base
                                  </Typography>
                                )}

                                {hasTranslation ? (
                                  <Typography
                                    variant="caption"

                                    sx={{
                                      color: "success.main",

                                      fontWeight: 700,
                                    }}
                                  >
                                    ✅
                                  </Typography>
                                ) : (
                                  <Typography
                                    variant="caption"

                                    sx={{
                                      color: "warning.main",

                                      fontWeight: 700,
                                    }}
                                  >
                                    ⚠ Pendiente
                                  </Typography>
                                )}
                              </Box>

                              <Button
                                size="small"

                                variant="text"

                                onClick={() => setEditingLocale(loc)}

                                sx={{
                                  color:
                                    editingLocale === loc
                                      ? "primary.main"
                                      : "text.secondary",
                                }}
                              >
                                Editar
                              </Button>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>

                    {/* DESTINATARIOS */}

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
                          DESTINATARIOS
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          p: 1.5,

                          display: "flex",

                          flexDirection: "column",

                          gap: 0.75,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",

                            alignItems: "center",

                            gap: 1,
                          }}
                        >
                          <CheckboxIcon
                            checked={(form.destinatarios ?? []).includes(
                              "usuarios",
                            )}

                            onChange={() => toggleDestinatario("usuarios")}

                            sx={{
                              color: (form.destinatarios ?? []).includes(
                                "usuarios",
                              )
                                ? "primary.main"
                                : "text.secondary",
                            }}
                          />

                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Usuarios
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",

                            alignItems: "center",

                            gap: 1,
                          }}
                        >
                          <CheckboxIcon
                            checked={(form.destinatarios ?? []).includes(
                              "empleados",
                            )}

                            onChange={() => toggleDestinatario("empleados")}

                            sx={{
                              color: (form.destinatarios ?? []).includes(
                                "empleados",
                              )
                                ? "primary.main"
                                : "text.secondary",
                            }}
                          />

                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Empleados
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",

                            alignItems: "center",

                            gap: 1,
                          }}
                        >
                          <CheckboxIcon
                            checked={(form.destinatarios ?? []).includes(
                              "marcas",
                            )}

                            onChange={() => toggleDestinatario("marcas")}

                            sx={{
                              color: (form.destinatarios ?? []).includes(
                                "marcas",
                              )
                                ? "primary.main"
                                : "text.secondary",
                            }}
                          />

                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Marcas
                          </Typography>
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
                          OPCIONES
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          p: 1.5,

                          display: "flex",

                          flexDirection: "column",

                          gap: 0.75,
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

                            <Typography
                              variant="body2"

                              sx={{ fontWeight: 600 }}
                            >
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

                            <Typography
                              variant="body2"

                              sx={{ fontWeight: 600 }}
                            >
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

                            <Typography
                              variant="body2"

                              sx={{ fontWeight: 600 }}
                            >
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

                            <Typography
                              variant="body2"

                              sx={{ fontWeight: 600 }}
                            >
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

                            <Typography
                              variant="body2"

                              sx={{ fontWeight: 600 }}
                            >
                              Silenciable
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* METADATOS */}

                    <Box
                      sx={{
                        borderRadius: 1,

                        border: "1px solid",

                        borderColor: "divider",

                        overflow: "hidden",

                        display: "flex",

                        flexDirection: "column",

                        mb: 1,
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

                            color: "text.secondary",

                            textTransform: "uppercase",

                            fontSize: "0.6875rem",
                          }}
                        >
                          METADATOS
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
                        <Box
                          sx={{
                            display: "flex",

                            alignItems: "center",

                            justifyContent: "space-between",

                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="caption"

                            sx={{
                              fontWeight: 600,

                              color: "text.secondary",

                              fontSize: "0.6875rem",
                            }}
                          >
                            Nombre interno
                          </Typography>

                          <Typography
                            variant="caption"

                            sx={{
                              fontWeight: 600,

                              color: "text.secondary",

                              fontSize: "0.6875rem",
                            }}
                          >
                            {form.internalName?.length ?? 0}/100
                          </Typography>
                        </Box>

                        <TextField
                          fullWidth

                          label="Nombre interno"

                          value={form.internalName}

                          onChange={handleChange("internalName")}

                          margin="dense"

                          size="small"

                          sx={{ mb: 1 }}

                          placeholder="Ej: Nuevo Match"
                        />

                        <Box
                          sx={{
                            display: "flex",

                            alignItems: "center",

                            justifyContent: "space-between",

                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="caption"

                            sx={{
                              fontWeight: 600,

                              color: "text.secondary",

                              fontSize: "0.6875rem",
                            }}
                          >
                            Clave única (slug)
                          </Typography>

                          <Typography
                            variant="caption"

                            sx={{
                              fontWeight: 600,

                              color: "text.secondary",

                              fontSize: "0.6875rem",
                            }}
                          >
                            {form.slug?.length ?? 0}/100
                          </Typography>
                        </Box>

                        <TextField
                          fullWidth

                          label="Clave única (slug)"

                          value={form.slug}

                          onChange={handleChange("slug")}

                          margin="dense"

                          size="small"

                          sx={{ mb: 1 }}

                          placeholder="Ej: new_match"
                        />
                      </Box>
                    </Box>

                    {editing && (
                      <Box
                        sx={{
                          borderRadius: 1,

                          border: "1px solid",

                          borderColor: "divider",

                          overflow: "hidden",

                          display: "flex",

                          flexDirection: "column",

                          mb: 1,

                          mt: 1,
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

                              color: "text.secondary",

                              textTransform: "uppercase",

                              fontSize: "0.6875rem",
                            }}
                          >
                            AUDITORÍA
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            p: 1.5,

                            display: "flex",

                            flexDirection: "column",

                            gap: 0.75,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",

                              alignItems: "center",

                              justifyContent: "space-between",
                            }}
                          >
                            <Typography
                              variant="caption"

                              sx={{
                                color: "text.secondary",

                                fontSize: "0.6875rem",
                              }}
                            >
                              Creado por
                            </Typography>

                            <Typography
                              variant="body2"

                              sx={{ fontWeight: 600 }}
                            >
                              {editing.created_by}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",

                              alignItems: "center",

                              justifyContent: "space-between",
                            }}
                          >
                            <Typography
                              variant="caption"

                              sx={{
                                color: "text.secondary",

                                fontSize: "0.6875rem",
                              }}
                            >
                              Fecha creación
                            </Typography>

                            <Typography
                              variant="body2"

                              sx={{ fontWeight: 600 }}
                            >
                              {editing.created_at}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",

                              alignItems: "center",

                              justifyContent: "space-between",
                            }}
                          >
                            <Typography
                              variant="caption"

                              sx={{
                                color: "text.secondary",

                                fontSize: "0.6875rem",
                              }}
                            >
                              Última modificación
                            </Typography>

                            <Typography
                              variant="body2"

                              sx={{ fontWeight: 600 }}
                            >
                              {editing.updated_at}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}
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
            </Box>
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
