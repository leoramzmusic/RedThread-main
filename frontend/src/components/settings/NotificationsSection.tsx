import {
    Box,
    Typography,
    FormControlLabel,
    Switch,
    Stack,
    Divider,
    TextField,
    Paper,
} from '@mui/material';
import {
    Campaign as CampaignIcon,
    Message as MessageIcon,
    Newspaper as NewsIcon,
    Favorite as FavoriteIcon,
    NightsStay as NightIcon,
    NotificationsOff as NotificationsOffIcon,
} from '@mui/icons-material';

interface NotificationsSectionProps {
    settings: any;
    onSettingsChange: (field: string, value: any) => void;
}

export default function NotificationsSection({ settings, onSettingsChange }: NotificationsSectionProps) {
    const notificationsEnabled = settings?.notifications_enabled ?? true;
    const dndEnabled = settings?.do_not_disturb?.enabled ?? false;

    return (
        <Stack spacing={3}>
            {/* Master Toggle */}
            <FormControlLabel
                control={
                    <Switch
                        checked={notificationsEnabled}
                        onChange={(e) => onSettingsChange('notifications_enabled', e.target.checked)}
                        color="primary"
                    />
                }
                label={
                    <Box>
                        <Typography variant="body1" fontWeight={600}>
                            Habilitar Notificaciones
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Activa o desactiva todas las notificaciones
                        </Typography>
                    </Box>
                }
            />

            <Divider />

            {/* Category-Specific Notifications */}
            <Box>
                <Typography variant="h6" gutterBottom fontWeight={600} mb={2}>
                    Frecuencia por Categoría
                </Typography>
                <Stack spacing={2}>
                    {/* Suggestions */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings?.notification_frequency?.suggestions ?? true}
                                onChange={(e) => onSettingsChange('notification_frequency', {
                                    ...settings?.notification_frequency,
                                    suggestions: e.target.checked
                                })}
                                disabled={!notificationsEnabled}
                            />
                        }
                        label={
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <CampaignIcon color="action" fontSize="small" />
                                <Box>
                                    <Typography variant="body2" fontWeight={500}>
                                        Sugerencias
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
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
                                onChange={(e) => onSettingsChange('notification_frequency', {
                                    ...settings?.notification_frequency,
                                    messages: e.target.checked
                                })}
                                disabled={!notificationsEnabled}
                            />
                        }
                        label={
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <MessageIcon color="action" fontSize="small" />
                                <Box>
                                    <Typography variant="body2" fontWeight={500}>
                                        Mensajes
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
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
                                onChange={(e) => onSettingsChange('notification_frequency', {
                                    ...settings?.notification_frequency,
                                    news: e.target.checked
                                })}
                                disabled={!notificationsEnabled}
                            />
                        }
                        label={
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <NewsIcon color="action" fontSize="small" />
                                <Box>
                                    <Typography variant="body2" fontWeight={500}>
                                        Novedades
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
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
                                onChange={(e) => onSettingsChange('notification_frequency', {
                                    ...settings?.notification_frequency,
                                    matches: e.target.checked
                                })}
                                disabled={!notificationsEnabled}
                            />
                        }
                        label={
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <FavoriteIcon color="action" fontSize="small" />
                                <Box>
                                    <Typography variant="body2" fontWeight={500}>
                                        Matches
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Nuevas conexiones
                                    </Typography>
                                </Box>
                            </Box>
                        }
                    />
                </Stack>
            </Box>

            <Divider />

            {/* Do Not Disturb */}
            <Box>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                    <NightIcon color="action" />
                    <Typography variant="h6" fontWeight={600}>
                        No Molestar
                    </Typography>
                </Box>

                <Stack spacing={2}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={dndEnabled}
                                onChange={(e) => onSettingsChange('do_not_disturb', {
                                    ...settings?.do_not_disturb,
                                    enabled: e.target.checked
                                })}
                                disabled={!notificationsEnabled}
                            />
                        }
                        label={
                            <Typography variant="body2" fontWeight={500}>
                                Activar Modo No Molestar
                            </Typography>
                        }
                    />

                    {dndEnabled && (
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                Horario
                            </Typography>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <TextField
                                    label="Desde"
                                    type="time"
                                    value={settings?.do_not_disturb?.start_time || '22:00'}
                                    onChange={(e) => onSettingsChange('do_not_disturb', {
                                        ...settings?.do_not_disturb,
                                        start_time: e.target.value
                                    })}
                                    InputLabelProps={{ shrink: true }}
                                    size="small"
                                    fullWidth
                                />
                                <Typography color="text.secondary">hasta</Typography>
                                <TextField
                                    label="Hasta"
                                    type="time"
                                    value={settings?.do_not_disturb?.end_time || '08:00'}
                                    onChange={(e) => onSettingsChange('do_not_disturb', {
                                        ...settings?.do_not_disturb,
                                        end_time: e.target.value
                                    })}
                                    InputLabelProps={{ shrink: true }}
                                    size="small"
                                    fullWidth
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
                        onChange={(e) => onSettingsChange('offline_notifications', e.target.checked)}
                        disabled={!notificationsEnabled}
                    />
                }
                label={
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <NotificationsOffIcon color="action" />
                        <Box>
                            <Typography variant="body2" fontWeight={500}>
                                Notificaciones Offline
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Recibe notificaciones cuando no estés en línea
                            </Typography>
                        </Box>
                    </Box>
                }
            />
        </Stack>
    );
}
