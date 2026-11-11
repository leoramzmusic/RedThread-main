import React, { useState, useEffect } from "react";

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

  destinatarios?: string[];

  persistent?: boolean;

  programmable?: boolean;

  silencable?: boolean;

  evento_disparador?: string;

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

const AUTO_INDICATOR_BY_CATEGORY: Record<string, string> = {
  system: "⚙️",

  match: "❤️",

  like: "👍",

  message: "💬",

  survey: "📋",

  reminder: "⏰",

  promo: "🎁",

  security: "🔒",
};

const TYPE_EVENTS: Array<{ emoji: string; label: string; category: string }> = [
  { emoji: "❤️", label: "Match", category: "match" },

  { emoji: "👍", label: "Like", category: "like" },

  { emoji: "💬", label: "Mensaje", category: "message" },

  { emoji: "🔒", label: "Seguridad", category: "security" },

  { emoji: "💳", label: "Pago", category: "payment" },

  { emoji: "🎁", label: "Beneficio", category: "promo" },

  { emoji: "📋", label: "Encuesta", category: "survey" },

  { emoji: "🏢", label: "Marca", category: "brand" },

  { emoji: "⚙️", label: "Sistema", category: "system" },
];

const TRIGGER_EVENTS: Array<{ key: string; label: string; emoji: string }> = [
  { key: "match_created", label: "Nuevo Match", emoji: "💘" },

  { key: "like_received", label: "Nuevo Like", emoji: "👍" },

  { key: "new_message", label: "Nuevo Mensaje", emoji: "💬" },

  { key: "payment_successful", label: "Pago exitoso", emoji: "💳" },

  { key: "survey_completed", label: "Encuesta completada", emoji: "📋" },

  { key: "lead_received", label: "Lead recibido", emoji: "🏢" },

  { key: "profile_visit", label: "Visita de perfil", emoji: "👁" },
];

const INDICATOR_EMOJIS: string[] = TYPE_EVENTS.map((t) => t.emoji);

const getEffectiveIcon = (f: { icon: string; category: string }): string => {
  const manual = f.icon;

  if (manual && manual !== "automatic" && INDICATOR_EMOJIS.includes(manual)) {
    return manual;
  }

  return AUTO_INDICATOR_BY_CATEGORY[f.category] ?? "⚙️";
};

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

  last_name: "Apellido del usuario receptor",

  full_name: "Nombre completo del usuario",

  username: "Nombre de usuario",

  email: "Correo electrónico del usuario",

  city: "Ciudad del usuario",

  country: "País del usuario",

  language: "Idioma configurado por el usuario",

  age: "Edad actual del usuario",

  birth_date: "Fecha de nacimiento del usuario",

  nombre_match: "Usuario que realizó el match",

  usuario_match: "Usuario del match",

  match_count: "Número de coincidencias disponibles",

  like_count: "Número de likes recibidos",

  nombre_usuario: "Usuario que interactuó",

  perfil_visitado_por: "Usuario que visitó tu perfil",

  mensaje_remitente: "Remitente del mensaje",

  sender_name: "Nombre del remitente",

  message_preview: "Vista previa del mensaje",

  conversation_title: "Título de la conversación",

  unread_messages: "Mensajes no leídos",

  last_message_time: "Hora del último mensaje",

  cuestionarios_pendientes: "Preguntas restantes de tu encuesta CARE",

  encuestas_pendientes: "Encuestas pendientes por completar",

  ultima_puntuacion: "Última puntuación obtenida",

  nivel_riesgo: "Nivel de riesgo del usuario",

  fecha_siguiente_revision: "Fecha de la siguiente revisión",

  especialista_asignado: "Especialista asignado",

  plan_name: "Nombre del plan premium",

  days_remaining: "Días restantes del plan",

  renewal_date: "Fecha de renovación",

  benefit_name: "Nombre del beneficio",

  discount_percent: "Porcentaje de descuento",

  event_name: "Nombre del evento",

  event_date: "Fecha del evento",

  event_time: "Hora del evento",

  event_location: "Ubicación del evento",

  event_host: "Anfitrión del evento",

  brand_name: "Nombre de la marca",

  campaign_name: "Nombre de la campaña",

  campaign_id: "ID de la campaña",

  lead_name: "Nombre del lead",

  leads_count: "Cantidad de leads",

  budget_remaining: "Presupuesto restante",

  invoice_number: "Número de factura",

  employee_name: "Nombre del empleado",

  ticket_id: "ID del ticket",

  ticket_title: "Título del ticket",

  task_name: "Nombre de la tarea",

  department: "Departamento",

  assigned_by: "Asignado por",

  case_id: "ID del caso",

  current_date: "Fecha actual",

  current_time: "Hora actual",

  platform_name: "Nombre de la plataforma",

  app_version: "Versión de la aplicación",

  environment: "Entorno",

  days_since_last_login: "Días desde el último inicio de sesión",

  days_as_member: "Días como miembro",

  profile_completion_percent: "Porcentaje de completitud del perfil",

  compatibility_score: "Puntuación de compatibilidad",

  new_matches_today: "Nuevos matches hoy",
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

const TEMPLATE_TYPES: Array<{
  key: string;

  label: string;

  group: string;

  category: string;

  priority: string;

  icon_type: "dynamic_avatar" | "system_icon" | "brand_image";

  icon: string;

  action_type: string;

  action_destination: string;

  evento_disparador: string;

  destinatarios: string[];
}> = [
  // USUARIOS - SOCIAL

  {
    key: "nuevo_match",
    label: "Nuevo Match",
    group: "USUARIOS - SOCIAL",
    category: "match",
    priority: "P1",
    icon_type: "dynamic_avatar",
    icon: "❤️",
    action_type: "profile",
    action_destination: "profile",
    evento_disparador: "match_created",
    destinatarios: ["usuarios"],
  },

  {
    key: "nuevo_like",
    label: "Nuevo Like",
    group: "USUARIOS - SOCIAL",
    category: "like",
    priority: "P1",
    icon_type: "dynamic_avatar",
    icon: "👍",
    action_type: "profile",
    action_destination: "profile",
    evento_disparador: "like_received",
    destinatarios: ["usuarios"],
  },

  {
    key: "nueva_visita_perfil",
    label: "Nueva Visita de Perfil",
    group: "USUARIOS - SOCIAL",
    category: "match",
    priority: "P2",
    icon_type: "dynamic_avatar",
    icon: "👁",
    action_type: "profile",
    action_destination: "profile",
    evento_disparador: "profile_visit",
    destinatarios: ["usuarios"],
  },

  {
    key: "nuevo_seguidor",
    label: "Nuevo Seguidor",
    group: "USUARIOS - SOCIAL",
    category: "match",
    priority: "P2",
    icon_type: "dynamic_avatar",
    icon: "👤",
    action_type: "profile",
    action_destination: "profile",
    evento_disparador: "new_follower",
    destinatarios: ["usuarios"],
  },

  {
    key: "persona_compatible",
    label: "Persona Compatible Encontrada",
    group: "USUARIOS - SOCIAL",
    category: "match",
    priority: "P1",
    icon_type: "dynamic_avatar",
    icon: "✨",
    action_type: "profile",
    action_destination: "profile",
    evento_disparador: "compatible_person",
    destinatarios: ["usuarios"],
  },

  // USUARIOS - MENSAJES

  {
    key: "nuevo_mensaje",
    label: "Nuevo Mensaje",
    group: "USUARIOS - MENSAJES",
    category: "message",
    priority: "P1",
    icon_type: "dynamic_avatar",
    icon: "💬",
    action_type: "chat",
    action_destination: "chat",
    evento_disparador: "new_message",
    destinatarios: ["usuarios"],
  },

  {
    key: "mensaje_sin_leer",
    label: "Mensaje Sin Leer",
    group: "USUARIOS - MENSAJES",
    category: "message",
    priority: "P2",
    icon_type: "dynamic_avatar",
    icon: "💬",
    action_type: "chat",
    action_destination: "chat",
    evento_disparador: "unread_message",
    destinatarios: ["usuarios"],
  },

  {
    key: "respuesta_recibida",
    label: "Respuesta Recibida",
    group: "USUARIOS - MENSAJES",
    category: "message",
    priority: "P1",
    icon_type: "dynamic_avatar",
    icon: "💬",
    action_type: "chat",
    action_destination: "chat",
    evento_disparador: "message_reply",
    destinatarios: ["usuarios"],
  },

  // USUARIOS - CARE

  {
    key: "encuesta_pendiente",
    label: "Encuesta Pendiente",
    group: "USUARIOS - CARE",
    category: "survey",
    priority: "P2",
    icon_type: "system_icon",
    icon: "📋",
    action_type: "survey",
    action_destination: "survey",
    evento_disparador: "survey_pending",
    destinatarios: ["usuarios"],
  },

  {
    key: "encuesta_completada",
    label: "Encuesta Completada",
    group: "USUARIOS - CARE",
    category: "survey",
    priority: "P2",
    icon_type: "system_icon",
    icon: "📋",
    action_type: "survey",
    action_destination: "survey",
    evento_disparador: "survey_completed",
    destinatarios: ["usuarios"],
  },

  {
    key: "evaluacion_disponible",
    label: "Evaluación Disponible",
    group: "USUARIOS - CARE",
    category: "survey",
    priority: "P2",
    icon_type: "system_icon",
    icon: "📋",
    action_type: "survey",
    action_destination: "survey",
    evento_disparador: "evaluation_available",
    destinatarios: ["usuarios"],
  },

  {
    key: "seguimiento_requerido",
    label: "Seguimiento Requerido",
    group: "USUARIOS - CARE",
    category: "survey",
    priority: "P1",
    icon_type: "system_icon",
    icon: "📋",
    action_type: "survey",
    action_destination: "survey",
    evento_disparador: "followup_required",
    destinatarios: ["usuarios"],
  },

  // USUARIOS - PREMIUM

  {
    key: "suscripcion_venciendo",
    label: "Suscripción Próxima a Vencer",
    group: "USUARIOS - PREMIUM",
    category: "promo",
    priority: "P1",
    icon_type: "brand_image",
    icon: "💎",
    action_type: "screen",
    action_destination: "premium",
    evento_disparador: "subscription_expiring",
    destinatarios: ["usuarios"],
  },

  {
    key: "beneficio_disponible",
    label: "Beneficio Disponible",
    group: "USUARIOS - PREMIUM",
    category: "promo",
    priority: "P2",
    icon_type: "brand_image",
    icon: "🎁",
    action_type: "screen",
    action_destination: "benefits",
    evento_disparador: "benefit_available",
    destinatarios: ["usuarios"],
  },

  {
    key: "oferta_premium",
    label: "Oferta Premium",
    group: "USUARIOS - PREMIUM",
    category: "promo",
    priority: "P1",
    icon_type: "brand_image",
    icon: "💎",
    action_type: "screen",
    action_destination: "premium",
    evento_disparador: "premium_offer",
    destinatarios: ["usuarios"],
  },

  {
    key: "premium_activado",
    label: "Premium Activado",
    group: "USUARIOS - PREMIUM",
    category: "promo",
    priority: "P0",
    icon_type: "brand_image",
    icon: "💎",
    action_type: "screen",
    action_destination: "premium",
    evento_disparador: "premium_activated",
    destinatarios: ["usuarios"],
  },

  // EMPLEADOS

  {
    key: "nueva_tarea",
    label: "Nueva Tarea",
    group: "EMPLEADOS",
    category: "system",
    priority: "P1",
    icon_type: "system_icon",
    icon: "✅",
    action_type: "screen",
    action_destination: "tasks",
    evento_disparador: "new_task",
    destinatarios: ["empleados"],
  },

  {
    key: "tarea_vencida",
    label: "Tarea Vencida",
    group: "EMPLEADOS",
    category: "system",
    priority: "P0",
    icon_type: "system_icon",
    icon: "⏰",
    action_type: "screen",
    action_destination: "tasks",
    evento_disparador: "task_overdue",
    destinatarios: ["empleados"],
  },

  {
    key: "caso_care_asignado",
    label: "Caso CARE Asignado",
    group: "EMPLEADOS",
    category: "system",
    priority: "P1",
    icon_type: "system_icon",
    icon: "📋",
    action_type: "screen",
    action_destination: "care",
    evento_disparador: "care_case_assigned",
    destinatarios: ["empleados"],
  },

  {
    key: "nuevo_ticket",
    label: "Nuevo Ticket",
    group: "EMPLEADOS",
    category: "system",
    priority: "P1",
    icon_type: "system_icon",
    icon: "🎫",
    action_type: "screen",
    action_destination: "tickets",
    evento_disparador: "new_ticket",
    destinatarios: ["empleados"],
  },

  {
    key: "ticket_escalado",
    label: "Ticket Escalado",
    group: "EMPLEADOS",
    category: "system",
    priority: "P0",
    icon_type: "system_icon",
    icon: "🚨",
    action_type: "screen",
    action_destination: "tickets",
    evento_disparador: "ticket_escalated",
    destinatarios: ["empleados"],
  },

  {
    key: "perfil_reportado",
    label: "Perfil Reportado",
    group: "EMPLEADOS",
    category: "security",
    priority: "P0",
    icon_type: "system_icon",
    icon: "🚨",
    action_type: "screen",
    action_destination: "moderation",
    evento_disparador: "profile_reported",
    destinatarios: ["empleados"],
  },

  // MARCAS

  {
    key: "nuevo_lead",
    label: "Nuevo Lead",
    group: "MARCAS",
    category: "promo",
    priority: "P1",
    icon_type: "brand_image",
    icon: "🏢",
    action_type: "screen",
    action_destination: "leads",
    evento_disparador: "new_lead",
    destinatarios: ["marcas"],
  },

  {
    key: "campana_aprobada",
    label: "Campaña Aprobada",
    group: "MARCAS",
    category: "promo",
    priority: "P2",
    icon_type: "brand_image",
    icon: "✅",
    action_type: "screen",
    action_destination: "campaigns",
    evento_disparador: "campaign_approved",
    destinatarios: ["marcas"],
  },

  {
    key: "campana_rechazada",
    label: "Campaña Rechazada",
    group: "MARCAS",
    category: "promo",
    priority: "P1",
    icon_type: "brand_image",
    icon: "❌",
    action_type: "screen",
    action_destination: "campaigns",
    evento_disparador: "campaign_rejected",
    destinatarios: ["marcas"],
  },

  {
    key: "pago_recibido",
    label: "Pago Recibido",
    group: "MARCAS",
    category: "promo",
    priority: "P0",
    icon_type: "brand_image",
    icon: "💳",
    action_type: "screen",
    action_destination: "billing",
    evento_disparador: "payment_received",
    destinatarios: ["marcas"],
  },

  {
    key: "factura_disponible",
    label: "Factura Disponible",
    group: "MARCAS",
    category: "promo",
    priority: "P2",
    icon_type: "brand_image",
    icon: "📄",
    action_type: "screen",
    action_destination: "billing",
    evento_disparador: "invoice_available",
    destinatarios: ["marcas"],
  },

  {
    key: "presupuesto_bajo",
    label: "Presupuesto Bajo",
    group: "MARCAS",
    category: "system",
    priority: "P1",
    icon_type: "system_icon",
    icon: "⚠️",
    action_type: "screen",
    action_destination: "budget",
    evento_disparador: "budget_low",
    destinatarios: ["marcas"],
  },

  // SISTEMA

  {
    key: "mantenimiento_programado",
    label: "Mantenimiento Programado",
    group: "SISTEMA",
    category: "system",
    priority: "P0",
    icon_type: "system_icon",
    icon: "⚙️",
    action_type: "screen",
    action_destination: "system",
    evento_disparador: "maintenance_scheduled",
    destinatarios: ["usuarios", "empleados", "marcas"],
  },

  {
    key: "cambio_contraseña",
    label: "Cambio de Contraseña",
    group: "SISTEMA",
    category: "security",
    priority: "P1",
    icon_type: "system_icon",
    icon: "🔒",
    action_type: "screen",
    action_destination: "security",
    evento_disparador: "password_changed",
    destinatarios: ["usuarios"],
  },

  {
    key: "inicio_sesion_sospechoso",
    label: "Inicio de Sesión Sospechoso",
    group: "SISTEMA",
    category: "security",
    priority: "P0",
    icon_type: "system_icon",
    icon: "🚨",
    action_type: "screen",
    action_destination: "security",
    evento_disparador: "suspicious_login",
    destinatarios: ["usuarios"],
  },

  {
    key: "actualizacion_disponible",
    label: "Actualización Disponible",
    group: "SISTEMA",
    category: "system",
    priority: "P2",
    icon_type: "system_icon",
    icon: "📱",
    action_type: "screen",
    action_destination: "updates",
    evento_disparador: "update_available",
    destinatarios: ["usuarios", "empleados", "marcas"],
  },

  {
    key: "error_critico",
    label: "Error Crítico",
    group: "SISTEMA",
    category: "system",
    priority: "P0",
    icon_type: "system_icon",
    icon: "🚨",
    action_type: "screen",
    action_destination: "errors",
    evento_disparador: "critical_error",
    destinatarios: ["usuarios", "empleados", "marcas"],
  },
];

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
    label: "INTELIGENTES",
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

    icon: "automatic",

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

    baseLocale: "es",

    translations: {},

    internalName: "",

    slug: "",

    templateType: "",
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

  const [variableCategory, setVariableCategory] = useState<string>("USUARIO");

  const [sortBy, setSortBy] = useState<string | null>(null);

  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | "none">(
    "none",
  );

  const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  const totalLangs = () => Object.keys(LANGUAGE_NAMES).length;

  const completedCount = () => {
    let count = 0;

    for (const code of Object.keys(LANGUAGE_NAMES)) {
      const t = form.translations?.[code];

      if (Boolean(t?.title) && Boolean(t?.body)) count += 1;
    }

    return count;
  };

  const progressPercent = () => {
    const total = totalLangs();

    if (total === 0) return 0;

    return Math.round((completedCount() / total) * 100);
  };

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

      icon: "automatic",

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
      value?: any,
    ) => {
      const val = value !== undefined ? value : e?.target?.value;

      if (key === "templateType" && val) {
        const selected = TEMPLATE_TYPES.find((t) => t.key === val);

        if (selected) {
          setForm((prev) => ({
            ...prev,

            category: selected.category,

            priority: selected.priority,

            icon_type: selected.icon_type,

            icon: selected.icon,

            action_type: selected.action_type,

            action_destination: selected.action_destination,

            evento_disparador: selected.evento_disparador,

            destinatarios: selected.destinatarios,

            templateType: selected.key,
          }));

          return;
        }
      }

      setForm((prev) => ({ ...prev, [key]: val }));
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
                        {/* 1. Tipo de plantilla */}
                        <TextField
                          select

                          fullWidth

                          label="Tipo de plantilla"

                          value={form.templateType ?? ""}

                          onChange={handleChange("templateType")}

                          margin="dense"

                          variant="outlined"

                          slotProps={{ select: {} }}
                        >
                          <MenuItem value="">Seleccionar tipo...</MenuItem>

                          {[
                            ...new Set(TEMPLATE_TYPES.map((t) => t.group)),
                          ].flatMap((group) => [
                            <MenuItem
                              key={`${group}-header`}
                              value=""

                              disabled

                              sx={{ pt: 1, fontWeight: 700 }}
                            >
                              {group}
                            </MenuItem>,

                            ...TEMPLATE_TYPES.filter(
                              (t) => t.group === group,
                            ).map((t) => (
                              <MenuItem key={t.key} value={t.key}>
                                {t.label}
                              </MenuItem>
                            )),
                          ])}
                        </TextField>

                        {form.templateType && (
                          <>
                            <Typography
                              variant="caption"

                              sx={{
                                color: "text.secondary",

                                fontSize: "0.6875rem",

                                mt: 0.75,

                                mb: 0.5,
                              }}
                            >
                              {
                                TEMPLATE_TYPES.find(
                                  (t) => t.key === form.templateType,
                                )?.label
                              }
                            </Typography>

                            {/* Configuración generada automáticamente */}
                            <Box
                              sx={{
                                display: "flex",

                                flexWrap: "wrap",

                                gap: 0.75,

                                mt: 0.5,

                                p: 1,

                                borderRadius: 1,

                                border: "1px solid",

                                borderColor: "divider",

                                bgcolor: "background.paper",
                              }}
                            >
                              <Typography
                                variant="caption"

                                sx={{
                                  fontWeight: 700,

                                  color: "text.secondary",

                                  mb: 0.5,

                                  width: "100%",

                                  fontSize: "0.6875rem",

                                  textTransform: "uppercase",

                                  letterSpacing: "0.05em",
                                }}
                              >
                                Configuración generada automáticamente
                              </Typography>

                              <Box
                                sx={{
                                  display: "flex",

                                  alignItems: "center",

                                  gap: 0.5,

                                  mb: 0.25,

                                  flexWrap: "wrap",
                                }}
                              >
                                <Chip
                                  label={`✓ ${
                                    TEMPLATE_TYPES.find(
                                      (t) => t.key === form.templateType,
                                    )?.category
                                  }`}

                                  size="small"

                                  color="primary"

                                  variant="outlined"

                                  sx={{ fontSize: "0.65rem" }}
                                />

                                <Chip
                                  label={`✓ ${
                                    form.priority === "P0"
                                      ? "Crítica"
                                      : form.priority === "P1"
                                        ? "Alta"
                                        : form.priority === "P2"
                                          ? "Normal"
                                          : "Baja"
                                  }`}

                                  size="small"

                                  color="secondary"

                                  variant="outlined"

                                  sx={{ fontSize: "0.65rem" }}
                                />

                                <Chip
                                  label={`✓ ${
                                    form.icon_type === "dynamic_avatar"
                                      ? "Avatar de usuario"
                                      : form.icon_type === "system_icon"
                                        ? "Ícono del sistema"
                                        : "Imagen de marca"
                                  }`}

                                  size="small"

                                  color="info"

                                  variant="outlined"

                                  sx={{ fontSize: "0.65rem" }}
                                />

                                <Chip
                                  label={`✓ ${
                                    form.action_type === "profile"
                                      ? "Abrir perfil"
                                      : form.action_type === "chat"
                                        ? "Abrir chat"
                                        : form.action_type === "url"
                                          ? "Abrir URL"
                                          : form.action_type === "screen"
                                            ? "Abrir pantalla"
                                            : form.action_type === "survey"
                                              ? "Abrir encuesta"
                                              : "Sin acción adicional"
                                  }`}

                                  size="small"

                                  color="success"

                                  variant="outlined"

                                  sx={{ fontSize: "0.65rem" }}
                                />

                                <Chip
                                  label={`✓ ${
                                    TEMPLATE_TYPES.find(
                                      (t) => t.key === form.templateType,
                                    )?.icon
                                  }`}

                                  size="small"

                                  color="warning"

                                  variant="outlined"

                                  sx={{ fontSize: "0.65rem" }}
                                />
                              </Box>
                            </Box>
                          </>
                        )}

                        {/* 2. Título */}
                        <Box
                          sx={{
                            display: "flex",

                            alignItems: "center",

                            justifyContent: "space-between",

                            mb: 0.5,

                            mt: form.templateType ? 1 : 0,
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
                              const loc = editingLocale;

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

                        {/* 3. Cuerpo */}
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
                              const loc = editingLocale;

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

                        <TextField
                          select

                          value={variableCategory}

                          onChange={(e) =>
                            setVariableCategory(e.target.value || "USUARIO")
                          }

                          margin="dense"

                          size="small"

                          fullWidth

                          variant="outlined"

                          slotProps={{ select: {} }}
                          sx={{ mb: 1, minWidth: 240 }}
                        >
                          {Object.entries(VARIABLE_CATEGORIES).map(
                            ([catKey, cat]) => {
                              const count = cat.variables.length;

                              return (
                                <MenuItem key={catKey} value={catKey}>
                                  {cat.label} ({count})
                                </MenuItem>
                              );
                            },
                          )}
                        </TextField>

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
                                .filter((v) => variableCategory === catKey)
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

                          <Typography
                            variant="caption"

                            sx={{
                              color: "text.secondary",

                              fontSize: "0.62rem",

                              mt: 0.25,
                            }}
                          >
                            P0: siempre mostrar inmediatamente. P1: muy
                            importante. P2: normal. P3: informativa.
                          </Typography>
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
                              Tipo visual
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",

                              alignItems: "center",

                              gap: 0,

                              borderRadius: 1,

                              border: "1px solid",

                              borderColor: "divider",

                              p: 0.125,

                              width: "100%",
                            }}
                          >
                            {[
                              {
                                value: "dynamic_avatar",

                                label: "Avatar",

                                emoji: "👤",

                                hint: "Usará la foto del usuario que originó la interacción",
                              },

                              {
                                value: "system_icon",

                                label: "Sistema",

                                emoji: "🔒",

                                hint: "Usará el ícono del sistema definido por la categoría",
                              },

                              {
                                value: "brand_image",

                                label: "Marca",

                                emoji: "🏢",

                                hint: "Usará el logo de la marca o empresa",
                              },
                            ].map((opt) => (
                              <Button
                                key={opt.value}

                                size="small"

                                variant="outlined"

                                onClick={() =>
                                  setForm((prev) => ({
                                    ...prev,

                                    icon_type: opt.value,
                                  }))
                                }

                                sx={{
                                  width: "33.33%",

                                  borderRadius: 0,

                                  border: "none",

                                  py: 0.6,

                                  px: 0.75,

                                  textTransform: "none",

                                  fontSize: "0.65rem",

                                  fontWeight: 600,

                                  color:
                                    form.icon_type === opt.value
                                      ? "common.white"
                                      : "text.secondary",

                                  bgcolor:
                                    form.icon_type === opt.value
                                      ? "primary.main"
                                      : "transparent",

                                  "&:hover": {
                                    bgcolor:
                                      form.icon_type === opt.value
                                        ? "primary.main"
                                        : "action.hover",
                                  },
                                }}
                              >
                                <Box
                                  sx={{
                                    mr: 0.5,
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <span style={{ fontSize: 18 }}>
                                    {opt.emoji}
                                  </span>
                                </Box>

                                {opt.label}
                              </Button>
                            ))}
                          </Box>

                          <Typography
                            variant="caption"

                            sx={{
                              color: "text.secondary",

                              fontSize: "0.62rem",

                              mt: 0.25,
                            }}
                          >
                            {[
                              "Usará la foto del usuario que originó la interacción",
                              "Usará el ícono del sistema definido por la categoría",
                              "Usará el logo de la marca o empresa",
                            ][
                              [
                                "dynamic_avatar",
                                "system_icon",
                                "brand_image",
                              ].indexOf(form.icon_type)
                            ] ?? ""}
                          </Typography>

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
                              Tipo de evento
                            </Typography>
                          </Box>

                          <TextField
                            select

                            value={form.icon ?? "automatic"}

                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,

                                icon: e.target.value,
                              }))
                            }

                            margin="dense"

                            size="small"

                            fullWidth

                            variant="outlined"

                            slotProps={{ select: {} }}
                          >
                            <MenuItem value="automatic">Automático</MenuItem>

                            {TYPE_EVENTS.map((t) => (
                              <MenuItem key={t.emoji} value={t.emoji}>
                                {t.emoji} {t.label}
                              </MenuItem>
                            ))}
                          </TextField>
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

                          display: "flex",

                          flexDirection: "column",

                          gap: 1.5,
                        }}
                      >
                        {/* 1. SE GENERA CUANDO */}
                        <Box>
                          <Typography
                            variant="caption"

                            sx={{
                              fontWeight: 600,

                              color: "text.secondary",

                              mb: 0.75,

                              fontSize: "0.6875rem",
                            }}
                          >
                            SE GENERA CUANDO
                          </Typography>

                          <TextField
                            fullWidth

                            select

                            value={form.evento_disparador}

                            onChange={handleChange("evento_disparador")}

                            margin="dense"

                            size="small"

                            slotProps={{ select: {} }}
                          >
                            <MenuItem value="">Ninguno</MenuItem>

                            {TRIGGER_EVENTS.map((t) => (
                              <MenuItem key={t.key} value={t.key}>
                                {t.emoji} {t.label}
                              </MenuItem>
                            ))}
                          </TextField>

                          <Typography
                            variant="caption"

                            sx={{
                              color: "text.secondary",

                              fontSize: "0.62rem",

                              mt: 0.25,
                              fontStyle: "italic",
                            }}
                          >
                            Evento que activa la notificación.
                          </Typography>
                        </Box>

                        {/* DIVIDER */}
                        <Box
                          sx={{
                            borderBottom: "1px solid",

                            borderColor: "divider",

                            mx: -1.5,

                            mb: 0.5,
                          }}
                        />

                        {/* 2. AL PULSAR LA NOTIFICACIÓN */}
                        <Box>
                          <Typography
                            variant="caption"

                            sx={{
                              fontWeight: 600,

                              color: "text.secondary",

                              mb: 0.75,

                              fontSize: "0.6875rem",
                            }}
                          >
                            AL PULSAR LA NOTIFICACIÓN
                          </Typography>

                          <TextField
                            fullWidth

                            select

                            value={form.action_type}

                            onChange={handleChange("action_type")}

                            margin="dense"

                            size="small"

                            slotProps={{ select: {} }}
                          >
                            <MenuItem value="">No hacer nada</MenuItem>

                            <MenuItem value="url">Abrir URL</MenuItem>

                            <MenuItem value="screen">
                              Abrir pantalla interna
                            </MenuItem>

                            <MenuItem value="chat">Abrir chat</MenuItem>

                            <MenuItem value="profile">Abrir perfil</MenuItem>

                            <MenuItem value="survey">Abrir encuesta</MenuItem>
                          </TextField>

                          <Typography
                            variant="caption"

                            sx={{
                              color: "text.secondary",

                              fontSize: "0.62rem",

                              mt: 0.25,
                              fontStyle: "italic",
                            }}
                          >
                            Qué ocurre cuando el usuario toca la notificación.
                          </Typography>
                        </Box>

                        {/* 3. DESTINO (condicional) */}
                        {form.action_type && (
                          <Box>
                            <Typography
                              variant="caption"

                              sx={{
                                fontWeight: 600,

                                color: "text.secondary",

                                mb: 0.75,

                                fontSize: "0.6875rem",
                              }}
                            >
                              DESTINO
                            </Typography>

                            {form.action_type === "url" ? (
                              <TextField
                                fullWidth

                                label="URL de destino"

                                value={form.action_destination}

                                onChange={handleChange("action_destination")}

                                placeholder="https://..."

                                margin="dense"

                                size="small"
                              />
                            ) : form.action_type === "screen" ? (
                              <TextField
                                fullWidth

                                select

                                value={form.action_destination}

                                onChange={handleChange("action_destination")}

                                margin="dense"

                                size="small"

                                slotProps={{ select: {} }}
                              >
                                <MenuItem value="matches">Matches</MenuItem>

                                <MenuItem value="messages">Mensajes</MenuItem>

                                <MenuItem value="surveys">Encuestas</MenuItem>

                                <MenuItem value="premium">Premium</MenuItem>

                                <MenuItem value="settings">
                                  Configuración
                                </MenuItem>
                              </TextField>
                            ) : form.action_type === "profile" ? (
                              <TextField
                                fullWidth

                                select

                                value={form.action_destination}

                                onChange={handleChange("action_destination")}

                                margin="dense"

                                size="small"

                                slotProps={{ select: {} }}
                              >
                                <MenuItem value="profile">
                                  Perfil relacionado
                                </MenuItem>
                              </TextField>
                            ) : form.action_type === "chat" ? (
                              <Box
                                sx={{
                                  p: 1,

                                  borderRadius: 1,

                                  border: "1px solid",

                                  borderColor: "divider",

                                  bgcolor: "background.paper",

                                  display: "flex",

                                  alignItems: "center",

                                  gap: 1,
                                }}
                              >
                                <span style={{ fontSize: 24 }}>💬</span>

                                <Typography variant="body2">
                                  Ir al chat asociado
                                </Typography>
                              </Box>
                            ) : form.action_type === "survey" ? (
                              <TextField
                                fullWidth

                                select

                                value={form.action_destination}

                                onChange={handleChange("action_destination")}

                                margin="dense"

                                size="small"

                                slotProps={{ select: {} }}
                              >
                                <MenuItem value="survey">
                                  Encuesta relacionada
                                </MenuItem>
                              </TextField>
                            ) : null}
                          </Box>
                        )}
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

                          icon={getEffectiveIcon(form)}

                          category={form.category}

                          priority={form.priority}

                          actionUrl={form.action_url || undefined}

                          theme={previewTheme}

                          animate={true}

                          animationClass={animStyles.slideIn}
                        />
                      </Box>
                    </Box>

                    {/* IDIOMAS Y TRADUCCIONES */}

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
                          IDIOMAS
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          p: 1.5,
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                        }}
                      >
                        {/* Idioma base (solo lectura) */}
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
                            Idioma base
                          </Typography>

                          <Typography
                            variant="caption"

                            sx={{
                              fontWeight: 700,

                              color: "primary.main",
                            }}
                          >
                            {LANGUAGE_NAMES[form.baseLocale ?? "es"] ??
                              form.baseLocale ??
                              "es"}
                          </Typography>
                        </Box>

                        {/* Idioma actual */}
                        <TextField
                          select

                          size="small"

                          label="Idioma actual"

                          value={editingLocale}

                          onChange={(e) => setEditingLocale(e.target.value)}

                          margin="dense"

                          slotProps={{ select: {} }}
                        >
                          {Object.entries(LANGUAGE_NAMES).map(
                            ([code, name]) => (
                              <MenuItem key={code} value={code}>
                                {name}
                              </MenuItem>
                            ),
                          )}
                        </TextField>

                        {/* Estado del idioma actual */}
                        <Box
                          sx={{
                            display: "flex",

                            alignItems: "center",

                            gap: 1,

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
                            Estado
                          </Typography>

                          {(() => {
                            const t = form.translations?.[editingLocale];

                            const hasTitle = Boolean(t?.title);

                            const hasBody = Boolean(t?.body);

                            const isBase = editingLocale === form.baseLocale;

                            if (isBase) {
                              return (
                                <Typography
                                  variant="caption"

                                  sx={{
                                    fontWeight: 700,

                                    color: "primary.main",
                                  }}
                                >
                                  Base (no traducir)
                                </Typography>
                              );
                            }

                            if (hasTitle && hasBody) {
                              return (
                                <Typography
                                  variant="caption"

                                  sx={{
                                    fontWeight: 700,

                                    color: "success.main",
                                  }}
                                >
                                  ✅ Traducido
                                </Typography>
                              );
                            }

                            if (hasTitle || hasBody) {
                              return (
                                <Typography
                                  variant="caption"

                                  sx={{
                                    fontWeight: 700,

                                    color: "warning.main",
                                  }}
                                >
                                  🟡 En progreso
                                </Typography>
                              );
                            }

                            return (
                              <Typography
                                variant="caption"

                                sx={{
                                  fontWeight: 700,

                                  color: "text.secondary",
                                }}
                              >
                                ⚠ Sin traducir
                              </Typography>
                            );
                          })()}
                        </Box>

                        {/* Progreso global */}
                        <Box
                          sx={{
                            display: "flex",

                            flexDirection: "column",

                            gap: 0.5,
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
                              }}
                            >
                              Progreso de traducciones
                            </Typography>

                            <Typography
                              variant="caption"

                              sx={{
                                fontWeight: 700,

                                color: "primary.main",
                              }}
                            >
                              {completedCount()} / {totalLangs()} idiomas
                              completados
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              width: "100%",

                              height: 6,

                              borderRadius: 3,

                              bgcolor: "background.paper",

                              overflow: "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                height: "100%",

                                width: `${progressPercent()}%`,

                                bgcolor: "primary.main",
                              }}
                            />
                          </Box>
                        </Box>

                        {/* Idiomas pendientes */}
                        <Box
                          sx={{
                            display: "flex",

                            flexDirection: "column",

                            gap: 0.5,
                          }}
                        >
                          <Typography
                            variant="caption"

                            sx={{
                              fontWeight: 600,

                              color: "text.secondary",

                              mb: 0.5,
                              fontSize: "0.6875rem",
                            }}
                          >
                            Pendientes
                          </Typography>

                          {Object.keys(LANGUAGE_NAMES)
                            .filter((code) => code !== form.baseLocale)
                            .filter((code) => {
                              const t = form.translations?.[code];

                              return !Boolean(t?.title) || !Boolean(t?.body);
                            })
                            .map((code) => (
                              <Typography
                                key={code}

                                variant="caption"

                                sx={{
                                  color: "warning.main",

                                  fontSize: "0.6875rem",
                                }}
                              >
                                ⚠ {LANGUAGE_NAMES[code] ?? code}
                              </Typography>
                            ))}
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
