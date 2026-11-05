import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Divider,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SendIcon from "@mui/icons-material/Send";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AndroidIcon from "@mui/icons-material/Android";
import AppleIcon from "@mui/icons-material/Apple";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import AdminLayout from "../../../../components/layout/AdminLayout";
import adminApiClient from "../../../../services/adminApi";
import { useSnackbar } from "notistack";

interface Template {
  id: string;
  title: string;
  body: string;
  icon: string;
  category: string;
  priority: string;
  variables: Array<{ name: string; type: string }>;
}

interface UserOption {
  id: string;
  name: string;
}

interface AudienceOption {
  id: string;
  name: string;
  estimated_count?: number;
}

const PRIORITIES = [
  { value: "P0", label: "P0 Crítica", desc: "No puede ser silenciada" },
  { value: "P1", label: "P1 Alta", desc: "Importante" },
  { value: "P2", label: "P2 Normal", desc: "Común" },
  { value: "P3", label: "P3 Baja", desc: "Informativa" },
];

const SEGMENT_FILTERS = {
  pais: ["México", "España", "Colombia", "Argentina", "Chile"],
  estado: ["Jalisco", "CDMX", "Nuevo León", "Puebla", "Yucatán"],
  plan: ["Gratuito", "Premium", "VIP"],
  actividad: ["Activos", "Inactivos", "Nuevos"],
  perfil: ["Completo", "Incompleto"],
};

interface SegmentForm {
  pais: string;
  estado: string;
  ciudad: string;
  edadMin: number;
  edadMax: number;
  plan: string;
  actividad: string;
  perfil: string;
}

const STEPS = [
  "Modo",
  "Destinatarios",
  "Tipo",
  "Plantilla",
  "Contenido",
  "Programación",
  "Vista previa",
  "Resumen",
];

export default function CreateNotificationPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [previewTab, setPreviewTab] = useState(0);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [audiences, setAudiences] = useState<AudienceOption[]>([]);

  // Modo de envío (Bloque 0)
  const [mode, setMode] = useState<"test" | "production">("test");

  // Destinatarios
  const [recipientType, setRecipientType] = useState<
    "user" | "audience" | "segment" | "all"
  >("user");
  const [userId, setUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [audienceId, setAudienceId] = useState("");
  const [segment, setSegment] = useState<SegmentForm>({
    pais: "",
    estado: "",
    ciudad: "",
    edadMin: 18,
    edadMax: 65,
    plan: "",
    actividad: "",
    perfil: "",
  });

  // Tipo
  const [channel, setChannel] = useState<"push" | "internal" | "both">("push");

  // Plantilla
  const [templateId, setTemplateId] = useState("");

  // Contenido
  const [content, setContent] = useState({
    title: "",
    body: "",
    image: "",
    icon: "notifications",
    color: "#3b82f6",
    category: "system",
    actionUrl: "",
    actionLabel: "",
  });

  // Prioridad
  const [priority, setPriority] = useState("P2");

  // Programación
  const [delivery, setDelivery] = useState<"now" | "scheduled">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [timezone, setTimezone] = useState("America/Mexico_City");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tplRes, userRes, audRes] = await Promise.allSettled([
        adminApiClient.get("/notifications/users/templates"),
        adminApiClient.get("/portal-redthread/usuarios/listado"),
        adminApiClient.get("/notifications/users/audiences"),
      ]);
      if (tplRes.status === "fulfilled") setTemplates(tplRes.value.data || []);
      if (userRes.status === "fulfilled") {
        const d = userRes.value.data;
        setUsers(Array.isArray(d) ? d : d?.users || d?.items || []);
      }
      if (audRes.status === "fulfilled") {
        const d = audRes.value.data;
        const list = Array.isArray(d) ? d : d?.audiences || d?.items || [];
        setAudiences(list);
      }
    } catch (error) {
      console.error("Failed to load create form data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users.slice(0, 8);
    return users
      .filter((u) =>
        (u.name || "").toLowerCase().includes(userSearch.toLowerCase()),
      )
      .slice(0, 8);
  }, [users, userSearch]);

  const estimatedReach = useMemo(() => {
    if (recipientType === "all") return 128540;
    if (recipientType === "audience") {
      const a = audiences.find((x) => x.id === audienceId);
      return a?.estimated_count ?? 3458;
    }
    if (recipientType === "segment") {
      let base = 128540;
      const active = Object.values(segment).filter(
        (v) => v !== "" && v !== 0,
      ).length;
      base = Math.max(120, Math.round(base / Math.pow(3, active)));
      return base;
    }
    return userId ? 1 : 0;
  }, [recipientType, audienceId, audiences, segment, userId]);

  const impact = useMemo(() => {
    const total = estimatedReach;
    const android = Math.round(total * 0.6);
    const ios = total - android;
    const invalid = Math.round(total * 0.003);
    return { total, android, ios, invalid };
  }, [estimatedReach]);

  const handleApplyTemplate = (tpl: Template) => {
    setTemplateId(tpl.id);
    setContent((prev) => ({
      ...prev,
      title: tpl.title,
      body: tpl.body,
      icon: tpl.icon || prev.icon,
      category: tpl.category || prev.category,
    }));
    setPriority(tpl.priority || priority);
  };

  const resolvedPreview = (text: string) => {
    const vars: Record<string, string> = {
      first_name: "María",
      matches_count: "3",
      care_remaining: "5",
      city: "Guadalajara",
      user_name: "María",
      nombre_match: "Carlos",
      nombre_usuario: "Carlos",
    };
    return text.replace(
      /\{\{?\s*(\w+)\s*\}?\}/g,
      (_, name) => vars[name] ?? `[${name}]`,
    );
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return true;
      case 1:
        if (recipientType === "user") return !!userId || mode === "test";
        if (recipientType === "audience") return !!audienceId;
        return true;
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return !!content.title && !!content.body;
      case 5:
        if (delivery === "scheduled") return !!scheduleDate && !!scheduleTime;
        return true;
      case 6:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!canProceed()) {
      enqueueSnackbar("Completa los campos requeridos antes de continuar", {
        variant: "warning",
      });
      return;
    }
    setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setSending(true);
    try {
      await adminApiClient.post("/notifications/users/send", {
        mode,
        recipient_type: recipientType,
        user_id: recipientType === "user" ? userId : undefined,
        audience_id: recipientType === "audience" ? audienceId : undefined,
        segment: recipientType === "segment" ? segment : undefined,
        channel,
        template_id: templateId || undefined,
        title: content.title,
        content: content.body,
        image: content.image || undefined,
        icon: content.icon,
        color: content.color,
        category: content.category,
        action_url: content.actionUrl || undefined,
        action_label: content.actionLabel || undefined,
        priority,
        delivery,
        scheduled_at:
          delivery === "scheduled"
            ? `${scheduleDate}T${scheduleTime}`
            : undefined,
        timezone: delivery === "scheduled" ? timezone : undefined,
      });
      enqueueSnackbar("Notificación enviada correctamente", {
        variant: "success",
      });
      router.push("/portal-redthread/notifications/users");
    } catch (error) {
      console.error("Send notification failed:", error);
      enqueueSnackbar("Error al enviar la notificación", { variant: "error" });
    } finally {
      setSending(false);
    }
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <FormControl>
            <FormLabel sx={{ fontWeight: 700, mb: 1 }}>Modo de envío</FormLabel>
            <RadioGroup
              value={mode}
              onChange={(e) => setMode(e.target.value as "test" | "production")}
            >
              <FormControlLabel
                value="test"
                control={<Radio />}
                label="Prueba — enviar a un usuario específico para validar"
              />
              <FormControlLabel
                value="production"
                control={<Radio />}
                label="Producción — enviar a audiencias, segmentos o todos"
              />
            </RadioGroup>
          </FormControl>
        );
      case 1:
        return (
          <Box>
            <FormLabel sx={{ fontWeight: 700, mb: 1, display: "block" }}>
              Destinatarios
            </FormLabel>
            <RadioGroup
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value as any)}
              sx={{ mb: 2 }}
            >
              <FormControlLabel
                value="user"
                control={<Radio />}
                label="Usuario específico"
              />
              <FormControlLabel
                value="audience"
                control={<Radio />}
                label="Audiencia guardada"
              />
              <FormControlLabel
                value="segment"
                control={<Radio />}
                label="Segmentación avanzada"
              />
              <FormControlLabel
                value="all"
                control={<Radio />}
                label="Todos los usuarios"
              />
            </RadioGroup>

            {recipientType === "user" && (
              <Box>
                <TextField
                  fullWidth
                  label="Buscar usuario"
                  placeholder="Escribe un nombre..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                {filteredUsers.length > 0 && (
                  <Paper
                    sx={{
                      mt: 1,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    {filteredUsers.map((u) => (
                      <Box
                        key={u.id}
                        onClick={() => {
                          setUserId(u.id);
                          setUserSearch(u.name);
                        }}
                        sx={{
                          px: 2,
                          py: 1,
                          cursor: "pointer",
                          "&:hover": { bgcolor: "action.hover" },
                          borderBottom: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="body2">{u.name}</Typography>
                      </Box>
                    ))}
                  </Paper>
                )}
              </Box>
            )}

            {recipientType === "audience" && (
              <TextField
                fullWidth
                select
                label="Audiencia"
                value={audienceId}
                onChange={(e) => setAudienceId(e.target.value)}
                slotProps={{ select: {} }}
              >
                {audiences.length === 0 && (
                  <MenuItem value="" disabled>
                    No hay audiencias guardadas
                  </MenuItem>
                )}
                {audiences.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {recipientType === "segment" && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    fullWidth
                    select
                    label="País"
                    value={segment.pais}
                    onChange={(e) =>
                      setSegment((s) => ({ ...s, pais: e.target.value }))
                    }
                    slotProps={{ select: {} }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {SEGMENT_FILTERS.pais.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    fullWidth
                    select
                    label="Estado"
                    value={segment.estado}
                    onChange={(e) =>
                      setSegment((s) => ({ ...s, estado: e.target.value }))
                    }
                    slotProps={{ select: {} }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {SEGMENT_FILTERS.estado.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Ciudad"
                    value={segment.ciudad}
                    onChange={(e) =>
                      setSegment((s) => ({ ...s, ciudad: e.target.value }))
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Edad mínima"
                    value={segment.edadMin}
                    onChange={(e) =>
                      setSegment((s) => ({
                        ...s,
                        edadMin: Number(e.target.value),
                      }))
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Edad máxima"
                    value={segment.edadMax}
                    onChange={(e) =>
                      setSegment((s) => ({
                        ...s,
                        edadMax: Number(e.target.value),
                      }))
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    fullWidth
                    select
                    label="Plan"
                    value={segment.plan}
                    onChange={(e) =>
                      setSegment((s) => ({ ...s, plan: e.target.value }))
                    }
                    slotProps={{ select: {} }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {SEGMENT_FILTERS.plan.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    fullWidth
                    select
                    label="Actividad"
                    value={segment.actividad}
                    onChange={(e) =>
                      setSegment((s) => ({ ...s, actividad: e.target.value }))
                    }
                    slotProps={{ select: {} }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {SEGMENT_FILTERS.actividad.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    fullWidth
                    select
                    label="Perfil"
                    value={segment.perfil}
                    onChange={(e) =>
                      setSegment((s) => ({ ...s, perfil: e.target.value }))
                    }
                    slotProps={{ select: {} }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {SEGMENT_FILTERS.perfil.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            )}

            <Paper
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 1,
                border: "1px solid",
                borderColor: "primary.main",
                bgcolor: "primary.main",
                color: "white",
              }}
            >
              <Typography
                variant="body2"
                sx={{ opacity: 0.9, fontWeight: 600 }}
              >
                USUARIOS ENCONTRADOS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {estimatedReach.toLocaleString()}
              </Typography>
            </Paper>
          </Box>
        );
      case 2:
        return (
          <FormControl>
            <FormLabel sx={{ fontWeight: 700, mb: 1 }}>
              Tipo de notificación
            </FormLabel>
            <RadioGroup
              value={channel}
              onChange={(e) => setChannel(e.target.value as any)}
            >
              <FormControlLabel value="push" control={<Radio />} label="Push" />
              <FormControlLabel
                value="internal"
                control={<Radio />}
                label="Notificación interna"
              />
              <FormControlLabel
                value="both"
                control={<Radio />}
                label="Push + Interna"
              />
            </RadioGroup>
          </FormControl>
        );
      case 3:
        return (
          <Box>
            <FormLabel sx={{ fontWeight: 700, mb: 2, display: "block" }}>
              Plantilla
            </FormLabel>
            <Grid container spacing={2}>
              {templates.map((tpl) => (
                <Grid key={tpl.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper
                    onClick={() => handleApplyTemplate(tpl)}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      border: "2px solid",
                      borderColor:
                        templateId === tpl.id ? "primary.main" : "divider",
                      cursor: "pointer",
                      height: "100%",
                      "&:hover": { borderColor: "primary.main" },
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, mb: 0.5 }}
                    >
                      {tpl.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {tpl.body}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
              {templates.length === 0 && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    No hay plantillas. Continúa con contenido personalizado.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        );
      case 4:
        return (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Título *"
                value={content.title}
                onChange={(e) =>
                  setContent((c) => ({ ...c, title: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Icono (material)"
                value={content.icon}
                onChange={(e) =>
                  setContent((c) => ({ ...c, icon: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Mensaje * (usa {{variable}})"
                multiline
                rows={4}
                value={content.body}
                onChange={(e) =>
                  setContent((c) => ({ ...c, body: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Imagen (URL, opcional)"
                value={content.image}
                onChange={(e) =>
                  setContent((c) => ({ ...c, image: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Color"
                type="color"
                value={content.color}
                onChange={(e) =>
                  setContent((c) => ({ ...c, color: e.target.value }))
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Categoría"
                value={content.category}
                onChange={(e) =>
                  setContent((c) => ({ ...c, category: e.target.value }))
                }
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="URL de acción"
                value={content.actionUrl}
                onChange={(e) =>
                  setContent((c) => ({ ...c, actionUrl: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Etiqueta del botón"
                value={content.actionLabel}
                onChange={(e) =>
                  setContent((c) => ({ ...c, actionLabel: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormLabel sx={{ fontWeight: 700, mb: 1, display: "block" }}>
                Prioridad
              </FormLabel>
              <Grid container spacing={1}>
                {PRIORITIES.map((p) => (
                  <Grid key={p.value} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper
                      onClick={() => setPriority(p.value)}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        border: "2px solid",
                        borderColor:
                          priority === p.value ? "primary.main" : "divider",
                        cursor: "pointer",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {p.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {p.desc}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        );
      case 5:
        return (
          <Box>
            <FormControl>
              <FormLabel sx={{ fontWeight: 700, mb: 1 }}>Entrega</FormLabel>
              <RadioGroup
                value={delivery}
                onChange={(e) => setDelivery(e.target.value as any)}
              >
                <FormControlLabel
                  value="now"
                  control={<Radio />}
                  label="Enviar ahora"
                />
                <FormControlLabel
                  value="scheduled"
                  control={<Radio />}
                  label="Programar"
                />
              </RadioGroup>
            </FormControl>
            {delivery === "scheduled" && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Hora"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    select
                    label="Zona horaria"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    slotProps={{ select: {} }}
                  >
                    <MenuItem value="America/Mexico_City">
                      Ciudad de México
                    </MenuItem>
                    <MenuItem value="America/Bogota">Bogotá</MenuItem>
                    <MenuItem value="America/Argentina/Buenos_Aires">
                      Buenos Aires
                    </MenuItem>
                    <MenuItem value="Europe/Madrid">Madrid</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            )}
          </Box>
        );
      case 6:
        return (
          <Box>
            <Tabs
              value={previewTab}
              onChange={(_e, v) => setPreviewTab(v)}
              sx={{ mb: 2 }}
            >
              <Tab
                icon={<AndroidIcon />}
                iconPosition="start"
                label="Android"
              />
              <Tab icon={<AppleIcon />} iconPosition="start" label="iOS" />
              <Tab
                icon={<NotificationsActiveIcon />}
                iconPosition="start"
                label="Interna"
              />
            </Tabs>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Paper
                sx={{
                  width: 340,
                  p: 2,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: 3,
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 0.5,
                      bgcolor: `${content.color}20`,
                      color: content.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    R
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    RETH
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", ml: "auto" }}
                  >
                    ahora
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {resolvedPreview(content.title) || "Título"}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {resolvedPreview(content.body) || "Mensaje"}
                </Typography>
                {content.actionLabel && (
                  <Button size="small" sx={{ mt: 1, color: content.color }}>
                    {content.actionLabel}
                  </Button>
                )}
              </Paper>
            </Box>
          </Box>
        );
      case 7:
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 2 }}
                  >
                    Resumen
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Modo</TableCell>
                        <TableCell>
                          {mode === "test" ? "Prueba" : "Producción"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                        <TableCell>
                          {channel === "push"
                            ? "Push"
                            : channel === "internal"
                              ? "Interna"
                              : "Push + Interna"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Destinatarios
                        </TableCell>
                        <TableCell>
                          {recipientType === "user"
                            ? `Usuario: ${userSearch || "—"}`
                            : recipientType === "audience"
                              ? "Audiencia guardada"
                              : recipientType === "segment"
                                ? "Segmentación avanzada"
                                : "Todos los usuarios"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Plantilla
                        </TableCell>
                        <TableCell>
                          {templates.find((t) => t.id === templateId)?.title ||
                            "Personalizada"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Título</TableCell>
                        <TableCell>{resolvedPreview(content.title)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Prioridad
                        </TableCell>
                        <TableCell>{priority}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Entrega</TableCell>
                        <TableCell>
                          {delivery === "now"
                            ? "Inmediata"
                            : `${scheduleDate} ${scheduleTime} (${timezone})`}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 2 }}
                  >
                    Estimación de impacto
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                  >
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Usuarios afectados
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {impact.total.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Dispositivos Android
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {impact.android.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Dispositivos iOS
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {impact.ios.toLocaleString()}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "warning.main",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <WarningAmberIcon fontSize="small" /> Tokens inválidos
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: "warning.main" }}
                      >
                        {impact.invalid.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return null;
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
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <IconButton
              onClick={() =>
                router.push("/portal-redthread/notifications/users")
              }
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Nueva Notificación
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Flujo guiado: destinatarios, tipo, contenido, programación y
                resumen.
              </Typography>
            </Box>
          </Box>

          <Paper
            sx={{
              p: 3,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ minHeight: 280, mb: 3 }}>{renderStep()}</Box>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                startIcon={<ArrowBackIcon />}
                sx={{ borderRadius: 0.5 }}
              >
                Atrás
              </Button>
              {activeStep < STEPS.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForwardIcon />}
                  sx={{ borderRadius: 0.5 }}
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSubmit}
                  disabled={sending}
                  startIcon={<SendIcon />}
                  sx={{ borderRadius: 0.5 }}
                >
                  {sending ? "Enviando..." : "Enviar / Programar"}
                </Button>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>
    </AdminLayout>
  );
}
