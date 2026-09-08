import {
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    Paper,
    Box,
    Chip
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import { AppearanceResource } from '../../types/appearance';
import { getMediaUrl } from '../../utils/media';

interface IconSchedulerProps {
    resources: AppearanceResource[];
}

export default function IconScheduler({ resources }: IconSchedulerProps) {
    // Show all items with a start date, sorted
    const scheduled = resources
        .filter(r => r.start_date)
        .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime());

    if (scheduled.length === 0) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary', bgcolor: 'background.paper', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                <EventIcon sx={{ fontSize: 40, mb: 1, color: 'action.disabled' }} />
                <Typography>No hay íconos con fecha de activación programada.</Typography>
            </Box>
        );
    }

    const now = new Date();

    return (
        <Paper elevation={0} sx={{ border: '1px solid #eee' }}>
            <List>
                {scheduled.map((resource) => {
                    const date = new Date(resource.start_date!);
                    const isPast = date < now;

                    return (
                        <ListItem key={resource._id} divider>
                            <ListItemAvatar>
                                <Avatar src={getMediaUrl(resource.url)} variant="rounded" sx={{ width: 48, height: 48, mr: 2 }} />
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="subtitle1" fontWeight="600">
                                            {resource.description || "Ícono Programado"}
                                        </Typography>
                                        <Chip
                                            label={isPast ? "Pasado" : "Próximo"}
                                            color={isPast ? "default" : "success"}
                                            size="small"
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                    </Box>
                                }
                                secondary={
                                    <Box mt={0.5}>
                                        <Typography component="span" variant="body2" color={isPast ? "text.secondary" : "primary"} fontWeight={isPast ? 400 : 600}>
                                            {date.toLocaleDateString()} a las {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                        <Typography component="span" variant="caption" sx={{ mx: 1, color: 'text.disabled' }}>|</Typography>
                                        <Typography component="span" variant="body2" color="text.secondary">
                                            {resource.resolution}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                    );
                })}
            </List>
        </Paper>
    );
}
