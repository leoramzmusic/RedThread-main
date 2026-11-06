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
  IconButton,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import BugIcon from "@mui/icons-material/BugReport";
import DescriptionIcon from "@mui/icons-material/Description";
import PeopleIcon from "@mui/icons-material/People";
import CampaignIcon from "@mui/icons-material/Campaign";
import HistoryIcon from "@mui/icons-material/History";
import BarChartIcon from "@mui/icons-material/BarChart";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import AdminLayout from "../../../components/layout/AdminLayout";

interface ManagerStat {
  label: string;
  value: number;
  color: string;
}

interface SectionCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactElement;
  stat?: ManagerStat;
  path?: string;
  color?: string;
}

interface Section {
  area: string;
  color: string;
  cards: SectionCard[];
}

export default function UsersNotificationDashboard() {
  const router = useRouter();

  const sectionColors: Record<string, string> = {
    comunicacion: "#3b82f6",
    diseno: "#8b5cf6",
    segmentacion: "#f59e0b",
    automatizacion: "#10b981",
    monitoreo: "#06b6d4",
  };

  const kpiColors: Record<string, string> = {
    plantillas: "#3b82f6",
    audiencias: "#8b5cf6",
    campanas: "#10b981",
    programaciones: "#f59e0b",
    push_fallidas: "#ef4444",
  };

  const sections: Section[] = [
    {
      area: "Comunicación",
      color: sectionColors.comunicacion,
      cards: [
        {
          id: "centro-pruebas",
          title: "Centro de Pruebas",
          subtitle: "Probar notificaciones antes de enviarlas masivamente.",
          icon: <BugIcon sx={{ fontSize: 24 }} />,
          stat: {
            label: "Pruebas",
            value: 0,
            color: sectionColors.comunicacion,
          },
          path: "/portal-redthread/notifications/users/test-center",
        },
        {
          id: "crear-notificacion",
          title: "Crear Notificación",
          subtitle: "Envío individual a un usuario específico.",
          icon: <SendIcon sx={{ fontSize: 24 }} />,
          stat: {
            label: "Borradores",
            value: 0,
            color: sectionColors.comunicacion,
          },
          path: "/portal-redthread/notifications/users/create",
        },
        {
          id: "entregas",
          title: "Entregas",
          subtitle: "Estado de envíos y errores de cada notificación.",
          icon: <SendOutlinedIcon sx={{ fontSize: 24 }} />,
          stat: {
            label: "Fallidas",
            value: 0,
            color: sectionColors.comunicacion,
          },
          path: "/portal-redthread/notifications/users/activity",
        },
      ],
    },
    {
      area: "Diseño",
      color: sectionColors.diseno,
      cards: [
        {
          id: "plantillas",
          title: "Plantillas",
          subtitle: "Biblioteca maestra reutilizable con variables dinámicas.",
          icon: <DescriptionIcon sx={{ fontSize: 24 }} />,
          stat: { label: "Disponibles", value: 0, color: sectionColors.diseno },
          path: "/portal-redthread/notifications/users/templates",
        },
      ],
    },
    {
      area: "Segmentación",
      color: sectionColors.segmentacion,
      cards: [
        {
          id: "audiencias",
          title: "Audiencias",
          subtitle: "Crear grupos y filtros dinámicos de usuarios.",
          icon: <PeopleIcon sx={{ fontSize: 24 }} />,
          stat: {
            label: "Activas",
            value: 0,
            color: sectionColors.segmentacion,
          },
          path: "/portal-redthread/notifications/users/audiences",
        },
      ],
    },
    {
      area: "Automatización",
      color: sectionColors.automatizacion,
      cards: [
        {
          id: "campanas",
          title: "Campañas",
          subtitle: "Envíos masivos por audiencia con plantilla asociada.",
          icon: <CampaignIcon sx={{ fontSize: 24 }} />,
          stat: {
            label: "Activas",
            value: 0,
            color: sectionColors.automatizacion,
          },
          path: "/portal-redthread/notifications/users/campaigns",
        },
        {
          id: "programaciones",
          title: "Programaciones",
          subtitle: "Ejecutar campañas en fechas futuras o recurrentes.",
          icon: <ScheduleOutlinedIcon sx={{ fontSize: 24 }} />,
          stat: {
            label: "Próximas",
            value: 0,
            color: sectionColors.automatizacion,
          },
          path: "/portal-redthread/notifications/users/schedules",
        },
      ],
    },
    {
      area: "Monitoreo",
      color: sectionColors.monitoreo,
      cards: [
        {
          id: "historial",
          title: "Historial",
          subtitle: "Auditoría completa de actividad y envíos realizados.",
          icon: <HistoryIcon sx={{ fontSize: 24 }} />,
          stat: {
            label: "Registros",
            value: 0,
            color: sectionColors.monitoreo,
          },
          path: "/portal-redthread/notifications/users/history",
        },
        {
          id: "metricas",
          title: "Métricas",
          subtitle: "Aperturas, CTR y conversiones de campañas.",
          icon: <BarChartIcon sx={{ fontSize: 24 }} />,
          stat: {
            label: "Indicadores",
            value: 0,
            color: sectionColors.monitoreo,
          },
          path: "/portal-redthread/notifications/users/metrics",
        },
      ],
    },
  ];

  const flowSteps = [
    "Diseño",
    "Pruebas",
    "Audiencias",
    "Campañas",
    "Programaciones",
    "Entregas",
    "Métricas",
  ];

  const kpis = [
    { label: "Plantillas", value: 0, color: kpiColors.plantillas },
    { label: "Audiencias", value: 0, color: kpiColors.audiencias },
    { label: "Campañas", value: 0, color: kpiColors.campanas },
    { label: "Programaciones", value: 0, color: kpiColors.programaciones },
    { label: "Push Fallidas", value: 0, color: kpiColors.push_fallidas },
  ];

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
              mb: 4,
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <IconButton
                  size="small"
                  onClick={() => router.push("/portal-redthread")}
                  sx={{ color: "text.secondary" }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Centro de Comunicaciones
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Diseña, prueba, segmenta y automatiza las comunicaciones para
                usuarios, empleados y marcas de la plataforma.
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                mt: 2,
              }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<SendIcon />}
                sx={{ borderRadius: 0.5, px: 3, minHeight: 44 }}
                onClick={() =>
                  router.push("/portal-redthread/notifications/templates")
                }
              >
                + Nueva Notificación
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<CampaignIcon />}
                sx={{ borderRadius: 0.5, px: 3, minHeight: 44 }}
                onClick={() =>
                  router.push("/portal-redthread/notifications/users/campaigns")
                }
              >
                + Nueva Campaña
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<DescriptionIcon />}
                sx={{ borderRadius: 0.5, px: 3, minHeight: 44 }}
                onClick={() =>
                  router.push("/portal-redthread/notifications/users/templates")
                }
              >
                + Nueva Plantilla
              </Button>
            </Box>
          </Paper>

          {/* Barra de flujo de trabajo tipo timeline */}
          <Paper
            sx={{
              p: 2,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              mb: 4,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1px",
                mb: 2,
                color: "text.primary",
              }}
            >
              Flujo de trabajo
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                flexWrap: "wrap",
              }}
            >
              {flowSteps.map((step, i) => (
                <Box
                  key={step}
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: "text.secondary",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {step}
                  </Typography>
                  {i < flowSteps.length - 1 && (
                    <Box
                      sx={{
                        width: 14,
                        height: 2,
                        bgcolor: "divider",
                        borderRadius: 0.5,
                        mx: 0.5,
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          </Paper>

          {/* KPIs del gestor con colores */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {kpis.map((item, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: 0.5,
                          bgcolor: item.color,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          opacity: 0.7,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          fontSize: "0.75rem",
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, mb: 0, color: item.color }}
                    >
                      {item.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Plantillas por audiencia */}
          <Paper
            sx={{
              p: 2,
              borderRadius: 1,
              border: `1px solid`,
              borderColor: "divider",
              mb: 4,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2,
                borderBottom: "1px solid",
                borderColor: "divider",
                pb: 2,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: 0.5,
                  bgcolor: "#3b82f6",
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "#3b82f6",
                }}
              >
                Plantillas por audiencia
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: 0.5,
                          bgcolor: "#3b82f6",
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          opacity: 0.7,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          fontSize: "0.75rem",
                        }}
                      >
                        Usuarios
                      </Typography>
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#3b82f6" }}
                    >
                      124 plantillas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: 0.5,
                          bgcolor: "#8b5cf6",
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          opacity: 0.7,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          fontSize: "0.75rem",
                        }}
                      >
                        Empleados
                      </Typography>
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#8b5cf6" }}
                    >
                      38 plantillas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: 0.5,
                          bgcolor: "#f59e0b",
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          opacity: 0.7,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          fontSize: "0.75rem",
                        }}
                      >
                        Marcas
                      </Typography>
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#f59e0b" }}
                    >
                      21 plantillas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Áreas funcionales */}
          {sections.map((section) => (
            <Paper
              key={section.area}
              sx={{
                p: 2,
                borderRadius: 1,
                border: `1px solid`,
                borderColor: "divider",
                mb: 4,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  pb: 2,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: 0.5,
                    bgcolor: section.color,
                  }}
                />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    color: section.color,
                  }}
                >
                  {section.area}
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {section.cards.map((card) => (
                  <Grid key={card.id} size={{ xs: 12, md: 6 }}>
                    <Card
                      sx={{
                        height: "100%",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        transition: "all 0.2s",
                        "&:hover": {
                          borderColor: card.color,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          transform: "translateY(-1px)",
                        },
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        if (card.path) {
                          router.push(card.path);
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 1,
                                bgcolor: `${section.color}12`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: section.color,
                              }}
                            >
                              {card.icon}
                            </Box>
                            {card.stat && (
                              <Chip
                                label={card.stat.label}
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  ml: 1,
                                  borderColor: "divider",
                                  borderRadius: 0.5,
                                }}
                              />
                            )}
                          </Box>
                          {card.stat && (
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: "text.primary",
                                fontSize: 1.5,
                              }}
                            >
                              {card.stat.value}
                            </Typography>
                          )}
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, mb: 1 }}
                        >
                          {card.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary", mb: 0 }}
                        >
                          {card.subtitle}
                        </Typography>
                      </CardContent>
                      <Box
                        sx={{
                          p: 2,
                          borderTop: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{
                            borderRadius: 0.5,
                            color: section.color,
                            borderColor: section.color,
                            width: "100%",
                            "&:hover": { bgcolor: `${section.color}08` },
                          }}
                        >
                          Abrir{" "}
                          <ArrowBackIcon fontSize="small" sx={{ ml: 1 }} />
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          ))}
        </Box>
      </Container>
    </AdminLayout>
  );
}
