import { Grid, Paper, Typography, Box, Button, Switch, Stack, Tooltip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Edit as EditIcon, PhotoLibrary, AutoAwesome, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import MediaManager from '../../MediaManager';


interface PhotosSectionProps {
    profile: any;
    smartPhotos: boolean;
    setSmartPhotos: (value: boolean) => void;
}

export default function PhotosSection({ profile, smartPhotos, setSmartPhotos }: PhotosSectionProps) {
    return (
        <Grid item xs={12}>
            <Accordion
                defaultExpanded
                sx={{
                    position: 'relative',
                    border: (theme) => '1px solid ' + theme.palette.divider,
                    boxShadow: 1,
                    backgroundImage: 'none',
                    borderRadius: '12px !important',
                    '&:before': { display: 'none' }
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ px: 3, py: 1 }}
                >
                    <Box display="flex" alignItems="center" gap={1}>
                        <PhotoLibrary color="action" />
                        <Typography variant="h6">Fotos</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2.5, pb: 2, pt: 0 }}>
                    <MediaManager userId={profile.user_id} />

                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mt={1.5}
                        p={1.5}
                        bgcolor="action.hover"
                        borderRadius="12px"
                        border="1px solid"
                        borderColor="divider"
                    >
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                <Typography variant="subtitle2" fontWeight="600">Smart Photos</Typography>
                                <Tooltip title="Activa para mostrar automáticamente tu foto más popular">
                                    <AutoAwesome sx={{ fontSize: 16, color: 'warning.main' }} />
                                </Tooltip>
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                                Selecciona automáticamente la mejor foto según interacción
                            </Typography>
                        </Box>
                        <Switch
                            checked={smartPhotos}
                            onChange={(e) => setSmartPhotos(e.target.checked)}
                            inputProps={{ 'aria-label': 'Smart Photos Toggle' }}
                        />
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Grid>
    );
}
