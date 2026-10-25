import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
  Grid,
  Card,
  Stack,
  Alert,
  Chip,
} from "@mui/material";
import {
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Campaign as CampaignIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Work as WorkIcon,
  Event as EventIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import adminApiClient from "../../services/adminApi";
import { alpha, useTheme } from "@mui/material/styles";

interface NewNotificationWizardProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const steps = [
  "1. Destinatarios",
  "2. Categoría",
  "3. Audiencia",
  "4. Contenido & CTA",
  "5. Vista Previa & Acción",
];

export default function NewNotificationWizard({
  open,
  onClose,
  onCreated,
}: NewNotificationWizardProps) {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [targetRecipientType, setTargetRecipientType] =
    useState<string>("user");
  const [category, setCategory] = useState<string>("announcement");
  const [campaignType, setCampaignType] = useState<string>("push");
  const [audienceFilter, setAudienceFilter] = useState<string>("all");
  const [name, setName] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [priority, setPriority] = useState<string>("P2");
  const [actionUrl, setActionUrl] = useState<string>("");
  const [actionLabel, setActionLabel] = useState<string>("");
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<string>("");

  const handleNext = () => {
    if (activeStep === 3 && !content.trim()) {
      enqueueSnackbar("El mensaje o contenido es obligatorio", {
        variant: "warning",
      });
      return;
    }
    if (activeStep === 3 && !name.trim()) {
      setName(subject || "Notificación " + new Date().toLocaleDateString());
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async (
    actionType: "send_now" | "schedule" | "draft",
  ) => {
    try {
      setSubmitting(true);
      const payload = {
        name: name.trim() || subject || "Nueva Campaña",
        description: subject,
        type: campaignType,
        subject: subject || name,
        content,
        media_url: mediaUrl || null,
        action_url: actionUrl || null,
        action_label: actionLabel || null,
        target_recipient_type: targetRecipientType,
        category,
        audience_filter: { filter: audienceFilter },
        priority,
        status:
          actionType === "draft"
            ? "draft"
            : actionType === "schedule"
              ? "scheduled"
              : "active",
        scheduled_at:
          actionType === "schedule" && scheduledAt
            ? new Date(scheduledAt).toISOString()
            : null,
      };

      await adminApiClient.post("/portal-redthread/campanas/crear", payload);
      enqueueSnackbar(
        actionType === "draft"
          ? "Borrador guardado exitosamente"
          : actionType === "schedule"
            ? "Campaña programada exitosamente"
            : "¡Notificación enviada exitosamente!",
        { variant: "success" },
      );
      if (onCreated) onCreated();
      onClose();
    } catch (e: any) {
      enqueueSnackbar(
        e?.response?.data?.detail || "Error al crear la notificación",
        {
          variant: "error",
        },
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setActiveStep(0);
    setTargetRecipientType("user");
    setCategory("announcement");
    setCampaignType("push");
    setAudienceFilter("all");
    setName("");
    setSubject("");
    setContent("");
    setPriority("P2");
    setActionUrl("");
    setActionLabel("");
    setMediaUrl("");
    setScheduledAt("");
  };

  return (
    <Dialog
      open={open}
      onClose={
        submitting
          ? undefined
          : () => {
              onClose();
              resetForm();
            }
      }
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            p: 2,
            bgcolor: "background.paper",
            boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
            border: "1px solid",
            borderColor: "divider",
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: "50%",
              bgcolor: alpha(primary, 0.12),
              color: primary,
              display: "flex",
            }}
          >
            <CampaignIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Nueva Notificación / Campaña
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Asistente de comunicación multicanal y segmentación avanzada
            </Typography>
          </Box>
        </Box>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 3, mb: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2, minHeight: 340 }}>
        {/* Step 0: Recipient Selection */}
        {activeStep === 0 && (
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              Seleccione el dominio de destinatarios
            </Typography>
            <RadioGroup
              value={targetRecipientType}
              onChange={(e) => setTargetRecipientType(e.target.value)}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: "pointer",
                      borderColor:
                        targetRecipientType === "user" ? primary : "divider",
                      bgcolor:
                        targetRecipientType === "user"
                          ? alpha(primary, 0.04)
                          : "transparent",
                      borderRadius: 3,
                      p: 2,
                    }}
                    onClick={() => setTargetRecipientType("user")}
                  >
                    <FormControlLabel
                      value="user"
                      control={<Radio color="primary" />}
                      label={
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: "bold" }}
                          >
                            🔔 Usuarios (App Pública)
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Usuarios activos en la plataforma, clientes y
                            perfiles generales.
                          </Typography>
                        </Box>
                      }
                      sx={{ alignItems: "flex-start", m: 0 }}
                    />
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: "pointer",
                      borderColor:
                        targetRecipientType === "employee"
                          ? primary
                          : "divider",
                      bgcolor:
                        targetRecipientType === "employee"
                          ? alpha(primary, 0.04)
                          : "transparent",
                      borderRadius: 3,
                      p: 2,
                    }}
                    onClick={() => setTargetRecipientType("employee")}
                  >
                    <FormControlLabel
                      value="employee"
                      control={<Radio color="primary" />}
                      label={
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: "bold" }}
                          >
                            🛡️ Empleados (Staff Interno)
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Personal operativo, moderadores, analistas y
                            administradores.
                          </Typography>
                        </Box>
                      }
                      sx={{ alignItems: "flex-start", m: 0 }}
                    />
                  </Card>
                </Grid>
              </Grid>
            </RadioGroup>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Canal de Comunicación</InputLabel>
              <Select
                value={campaignType}
                label="Canal de Comunicación"
                onChange={(e) => setCampaignType(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="push">Notificación Push (Móvil/Web)</MenuItem>
                <MenuItem value="in_app">
                  Bandeja In-App (Centro de Notificaciones)
                </MenuItem>
                <MenuItem value="email">Correo Electrónico (Email)</MenuItem>
                <MenuItem value="broadcast">
                  Broadcast General (Todos los canales)
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
        )}

        {/* Step 1: Category & Type */}
        {activeStep === 1 && (
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              Seleccione la categoría de la notificación
            </Typography>
            <Grid container spacing={2}>
              {[
                {
                  id: "announcement",
                  label: "Anuncio General",
                  icon: <CampaignIcon />,
                  desc: "Novedades, actualizaciones y comunicados generales.",
                },
                {
                  id: "security",
                  label: "Seguridad & Alertas P0",
                  icon: <SecurityIcon />,
                  desc: "Avisos críticos de seguridad, verificación o incidentes.",
                },
                {
                  id: "onboarding",
                  label: "Onboarding & Guía",
                  icon: <PeopleIcon />,
                  desc: "Bienvenida, tutoriales y pasos iniciales.",
                },
                {
                  id: "operational",
                  label: "Operativo",
                  icon: <WorkIcon />,
                  desc: "Avisos internos, reportes o asignaciones de tareas.",
                },
                {
                  id: "event",
                  label: "Eventos & Convocatorias",
                  icon: <EventIcon />,
                  desc: "Reuniones, webinars o eventos especiales.",
                },
                {
                  id: "custom",
                  label: "Personalizado",
                  icon: <NotificationsIcon />,
                  desc: "Mensajes libres con configuración a la medida.",
                },
              ].map((cat) => (
                <Grid size={{ xs: 12, sm: 6 }} key={cat.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: "pointer",
                      borderColor: category === cat.id ? primary : "divider",
                      bgcolor:
                        category === cat.id
                          ? alpha(primary, 0.04)
                          : "transparent",
                      borderRadius: 3,
                      p: 2,
                      height: "100%",
                      transition: "all 0.2s",
                      "&:hover": { borderColor: primary },
                    }}
                    onClick={() => setCategory(cat.id)}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          color:
                            category === cat.id ? primary : "text.secondary",
                        }}
                      >
                        {cat.icon}
                      </Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: "bold" }}
                      >
                        {cat.label}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {cat.desc}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Stack>
        )}

        {/* Step 2: Audience */}
        {activeStep === 2 && (
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              Segmentación de Audiencia
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Filtro de Audiencia</InputLabel>
              <Select
                value={audienceFilter}
                label="Filtro de Audiencia"
                onChange={(e) => setAudienceFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">
                  Todos los{" "}
                  {targetRecipientType === "user" ? "usuarios" : "empleados"}{" "}
                  activos
                </MenuItem>
                <MenuItem value="active_7d">
                  Activos en los últimos 7 días
                </MenuItem>
                <MenuItem value="inactive">
                  Inactivos (&gt; 30 días sin actividad)
                </MenuItem>
                <MenuItem value="tier1">Usuarios VIP / Nivel Tier 1</MenuItem>
                <MenuItem value="custom">
                  Segmento Personalizado (Avanzado)
                </MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info" sx={{ borderRadius: 2 }}>
              {audienceFilter === "all" &&
                `Se enviará a aproximadamente 1,250 ${targetRecipientType === "user" ? "usuarios" : "empleados"}.`}
              {audienceFilter === "active_7d" &&
                "Se enviará únicamente a usuarios con actividad reciente en la plataforma."}
              {audienceFilter === "inactive" &&
                "Campaña de re-engagement para usuarios inactivos."}
              {audienceFilter === "tier1" &&
                "Segmento exclusivo para miembros de alto nivel."}
              {audienceFilter === "custom" &&
                "Se aplicarán reglas dinámicas basadas en metadatos y etiquetas."}
            </Alert>
          </Stack>
        )}

        {/* Step 3: Content & CTA */}
        {activeStep === 3 && (
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              Redacción de Contenido y Llamado a la Acción (CTA)
            </Typography>
            <TextField
              fullWidth
              label="Nombre interno de la Campaña / Notificación"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Lanzamiento Funcionalidad Q4"
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Asunto / Título de la Notificación"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej: ¡Ya está disponible la nueva actualización!"
              variant="outlined"
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Mensaje o Contenido Principal"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe el cuerpo del mensaje que verán los destinatarios..."
              variant="outlined"
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Prioridad</InputLabel>
                  <Select
                    value={priority}
                    label="Prioridad"
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <MenuItem value="P0">
                      P0 - Crítica / Alerta Inmediata
                    </MenuItem>
                    <MenuItem value="P1">P1 - Alta / Importante</MenuItem>
                    <MenuItem value="P2">P2 - Normal (Recomendada)</MenuItem>
                    <MenuItem value="P3">P3 - Baja / Informativa</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="URL de Imagen / Icono (Opcional)"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://..."
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Etiqueta del Botón CTA (Opcional)"
                  value={actionLabel}
                  onChange={(e) => setActionLabel(e.target.value)}
                  placeholder="Ej: Ver Novedades"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Enlace del Botón CTA URL (Opcional)"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="/portal-redthread/..."
                />
              </Grid>
            </Grid>
          </Stack>
        )}

        {/* Step 4: Preview & Action */}
        {activeStep === 4 && (
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              Vista Previa y Confirmación de Envío
            </Typography>

            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                p: 3,
                bgcolor: alpha(primary, 0.02),
                border: "1px dashed",
                borderColor: primary,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1.5,
                }}
              >
                <Chip
                  label={`Prioridad: ${priority}`}
                  color={
                    priority === "P0"
                      ? "error"
                      : priority === "P1"
                        ? "warning"
                        : "default"
                  }
                  size="small"
                />
                <Chip
                  label={
                    targetRecipientType === "user"
                      ? "Destinatarios: Usuarios"
                      : "Destinatarios: Empleados"
                  }
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                {subject || name || "Título de prueba"}
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", mb: 2, whiteSpace: "pre-wrap" }}
              >
                {content || "Contenido de la notificación de prueba..."}
              </Typography>
              {actionLabel && (
                <Button
                  variant="contained"
                  size="small"
                  sx={{ borderRadius: 50, textTransform: "none" }}
                >
                  {actionLabel}
                </Button>
              )}
            </Card>

            <TextField
              fullWidth
              type="datetime-local"
              label="Programar envío (Opcional - dejar en blanco para enviar inmediatamente)"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                input: { sx: { borderRadius: 2 } },
              }}
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{ px: 3, pb: 3, pt: 2, justifyContent: "space-between" }}
      >
        <Button
          disabled={activeStep === 0 || submitting}
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          sx={{ textTransform: "none" }}
        >
          Anterior
        </Button>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          {activeStep < 4 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowForwardIcon />}
              sx={{ borderRadius: 50, textTransform: "none", px: 3 }}
            >
              Siguiente
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                disabled={submitting}
                onClick={() => handleSubmit("draft")}
                startIcon={<SaveIcon />}
                sx={{ borderRadius: 50, textTransform: "none" }}
              >
                Guardar Borrador
              </Button>
              {scheduledAt ? (
                <Button
                  variant="contained"
                  color="secondary"
                  disabled={submitting}
                  onClick={() => handleSubmit("schedule")}
                  startIcon={<ScheduleIcon />}
                  sx={{ borderRadius: 50, textTransform: "none" }}
                >
                  Programar Campaña
                </Button>
              ) : (
                <Button
                  variant="contained"
                  disabled={submitting}
                  onClick={() => handleSubmit("send_now")}
                  startIcon={<SendIcon />}
                  sx={{ borderRadius: 50, textTransform: "none", px: 3 }}
                >
                  Enviar Ahora
                </Button>
              )}
            </>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
