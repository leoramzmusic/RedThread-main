import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Stack,
  Divider,
  TextField,
  Paper,
} from "@mui/material";
import { useTranslation } from "next-i18next/pages";
import {
  Campaign as CampaignIcon,
  Message as MessageIcon,
  Newspaper as NewsIcon,
  Favorite as FavoriteIcon,
  NightsStay as NightIcon,
  NotificationsOff as NotificationsOffIcon,
} from "@mui/icons-material";

interface NotificationsSectionProps {
  settings: any;
  onSettingsChange: (field: string, value: any) => void;
}

export default function NotificationsSection({
  settings,
  onSettingsChange,
}: NotificationsSectionProps) {
  const { t } = useTranslation("common");
  const notificationsEnabled = settings?.notifications_enabled ?? true;
  const dndEnabled = settings?.do_not_disturb?.enabled ?? false;
  const mutes = {
    social: false,
    messages: false,
    system: false,
    promos: false,
    ...(settings?.notification_mutes || {}),
  };
  const muteOptions = [
    { key: "social", checked: mutes.social },
    { key: "messages", checked: mutes.messages },
    { key: "system", checked: mutes.system },
    { key: "promos", checked: mutes.promos },
  ];

  return (
    <Stack spacing={3}>
      {/* Master Toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={notificationsEnabled}
            onChange={(e) =>
              onSettingsChange("notifications_enabled", e.target.checked)
            }
            color="primary"
          />
        }
        label={
          <Box>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
              }}
            >
              Habilitar Notificaciones
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
              }}
            >
              Activa o desactiva todas las notificaciones
            </Typography>
          </Box>
        }
      />

      <Divider />

      {/* Category-Specific Notifications */}
      <Box>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontWeight: 600,
            mb: 2,
          }}
        >
          Frecuencia por Categoría
        </Typography>
        <Stack spacing={2}>
          {/* Suggestions */}
          <FormControlLabel
            control={
              <Switch
                checked={settings?.notification_frequency?.suggestions ?? true}
                onChange={(e) =>
                  onSettingsChange("notification_frequency", {
                    ...settings?.notification_frequency,
                    suggestions: e.target.checked,
                  })
                }
                disabled={!notificationsEnabled}
              />
            }
            label={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <CampaignIcon color="action" fontSize="small" />
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                    }}
                  >
                    Sugerencias
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                    }}
                  >
                    Perfiles recomendados
                  </Typography>
                </Box>
              </Box>
            }
          />

          {/* Messages */}
          <FormControlLabel
            control={
              <Switch
                checked={settings?.notification_frequency?.messages ?? true}
                onChange={(e) =>
                  onSettingsChange("notification_frequency", {
                    ...settings?.notification_frequency,
                    messages: e.target.checked,
                  })
                }
                disabled={!notificationsEnabled}
              />
            }
            label={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <MessageIcon color="action" fontSize="small" />
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                    }}
                  >
                    Mensajes
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                    }}
                  >
                    Nuevos mensajes de chat
                  </Typography>
                </Box>
              </Box>
            }
          />

          {/* News */}
          <FormControlLabel
            control={
              <Switch
                checked={settings?.notification_frequency?.news ?? true}
                onChange={(e) =>
                  onSettingsChange("notification_frequency", {
                    ...settings?.notification_frequency,
                    news: e.target.checked,
                  })
                }
                disabled={!notificationsEnabled}
              />
            }
            label={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <NewsIcon color="action" fontSize="small" />
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                    }}
                  >
                    Novedades
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                    }}
                  >
                    Actualizaciones
                  </Typography>
                </Box>
              </Box>
            }
          />

          {/* Matches */}
          <FormControlLabel
            control={
              <Switch
                checked={settings?.notification_frequency?.matches ?? true}
                onChange={(e) =>
                  onSettingsChange("notification_frequency", {
                    ...settings?.notification_frequency,
                    matches: e.target.checked,
                  })
                }
                disabled={!notificationsEnabled}
              />
            }
            label={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <FavoriteIcon color="action" fontSize="small" />
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                    }}
                  >
                    Matches
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                    }}
                  >
                    Nuevas conexiones
                  </Typography>
                </Box>
              </Box>
            }
          />
        </Stack>
      </Box>

      <Divider />

      {/* Mute by Category */}
      <Box>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontWeight: 600,
            mb: 2,
          }}
        >
          {t("notifications.settings.title")}
        </Typography>
        <Stack spacing={1}>
          {muteOptions.map(({ key, checked }) => (
            <FormControlLabel
              key={key}
              control={
                <Switch
                  checked={checked}
                  onChange={(e) =>
                    onSettingsChange("notification_mutes", {
                      ...mutes,
                      [key]: e.target.checked,
                    })
                  }
                  data-testid={`mute-${key}`}
                  disabled={!notificationsEnabled}
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                  }}
                >
                  {t(`notifications.settings.mute.${key}`)}
                </Typography>
              }
            />
          ))}
        </Stack>
      </Box>

      <Divider />

      {/* Do Not Disturb */}
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
          }}
        >
          <NightIcon color="action" />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
            }}
          >
            No Molestar
          </Typography>
        </Box>

        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={dndEnabled}
                onChange={(e) =>
                  onSettingsChange("do_not_disturb", {
                    ...settings?.do_not_disturb,
                    enabled: e.target.checked,
                  })
                }
                disabled={!notificationsEnabled}
              />
            }
            label={
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                }}
              >
                Activar Modo No Molestar
              </Typography>
            }
          />

          {dndEnabled && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "action.hover" }}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  fontWeight: 600,
                }}
              >
                Horario
              </Typography>
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  alignItems: "center",
                }}
              >
                <TextField
                  label="Desde"
                  type="time"
                  value={settings?.do_not_disturb?.start_time || "22:00"}
                  onChange={(e) =>
                    onSettingsChange("do_not_disturb", {
                      ...settings?.do_not_disturb,
                      start_time: e.target.value,
                    })
                  }
                  size="small"
                  fullWidth
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                />
                <Typography
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  hasta
                </Typography>
                <TextField
                  label="Hasta"
                  type="time"
                  value={settings?.do_not_disturb?.end_time || "08:00"}
                  onChange={(e) =>
                    onSettingsChange("do_not_disturb", {
                      ...settings?.do_not_disturb,
                      end_time: e.target.value,
                    })
                  }
                  size="small"
                  fullWidth
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                />
              </Stack>
            </Paper>
          )}
        </Stack>
      </Box>

      <Divider />

      {/* Offline Notifications */}
      <FormControlLabel
        control={
          <Switch
            checked={settings?.offline_notifications ?? true}
            onChange={(e) =>
              onSettingsChange("offline_notifications", e.target.checked)
            }
            disabled={!notificationsEnabled}
          />
        }
        label={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <NotificationsOffIcon color="action" />
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                }}
              >
                Notificaciones Offline
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                Recibe notificaciones cuando no estés en línea
              </Typography>
            </Box>
          </Box>
        }
      />
    </Stack>
  );
}
