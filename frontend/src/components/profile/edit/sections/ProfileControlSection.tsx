import { Grid, Paper, Typography, Box, Switch, FormControlLabel, Stack, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Settings, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Controller } from 'react-hook-form';
import { BaseSectionProps } from '../types';

interface ProfileControlSectionProps extends BaseSectionProps {
    watch: any;
}

export default function ProfileControlSection({
    control,
    watch
}: ProfileControlSectionProps) {
    const showAge = watch('show_age');
    const showLocation = watch('show_location');

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
                        <Settings color="action" />
                        <Typography variant="h6">Control de perfil</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Stack spacing={3}>
                        {/* Emotional Transparency & Narrative Control Info */}
                        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                                Tu privacidad, tu narrativa
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tú decides qué mostrar. CARE respeta tus decisiones y ajusta la forma en que te presenta a los demás.
                                Si ocultas información, CARE interpretará esto como una preferencia por la privacidad y modulará la conexión.
                            </Typography>
                        </Box>

                        {/* Show Age Toggle */}
                        <Controller
                            name="show_age"
                            control={control}
                            defaultValue={true}
                            render={({ field }) => (
                                <Box sx={{
                                    p: 2,
                                    border: '1px solid',
                                    borderColor: field.value ? 'primary.light' : 'divider',
                                    borderRadius: 2,
                                    bgcolor: field.value ? 'rgba(76, 175, 80, 0.04)' : 'transparent',
                                    transition: 'all 0.3s'
                                }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={600} display="flex" alignItems="center" gap={1}>
                                                {field.value ? '🎂 Edad visible' : '🎭 Edad oculta'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                {field.value
                                                    ? "Un tono ajustado a tu etapa de vida."
                                                    : "Foco en la afinidad mental, sin prejuicios de edad."}
                                            </Typography>
                                        </Box>
                                        <Switch
                                            checked={field.value ?? true}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                            color="primary"
                                        />
                                    </Box>

                                    {/* CARE Microcopy for Age */}
                                    <Box sx={{ mt: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                            CARE dice:
                                        </Typography>
                                        <Typography variant="caption" fontWeight={500} color="primary">
                                            {field.value
                                                ? "Se mostrará tu edad real."
                                                : "Se usará el símbolo 🎭 para indicar misterio."}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        />

                        {/* Show Location/Distance Toggle */}
                        <Controller
                            name="show_location" // Using backend field name
                            control={control}
                            defaultValue={true}
                            render={({ field }) => (
                                <Box sx={{
                                    p: 2,
                                    border: '1px solid',
                                    borderColor: field.value ? 'primary.light' : 'divider',
                                    borderRadius: 2,
                                    bgcolor: field.value ? 'rgba(33, 150, 243, 0.04)' : 'transparent',
                                    transition: 'all 0.3s'
                                }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={600} display="flex" alignItems="center" gap={1}>
                                                {field.value ? '📏 Distancia visible' : '🌐 Distancia oculta'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                {field.value
                                                    ? "Facilita encuentros cercanos."
                                                    : "Prioriza la conexión emocional sobre la física."}
                                            </Typography>
                                        </Box>
                                        <Switch
                                            checked={field.value ?? true}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                            color="primary"
                                        />
                                    </Box>

                                    {/* CARE Microcopy for Location */}
                                    <Box sx={{ mt: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                            CARE sugiere:
                                        </Typography>
                                        <Typography variant="caption" fontWeight={500} color="primary">
                                            {field.value
                                                ? "“¿Te gustaría iniciar una conversación cercana?”"
                                                : "“La distancia no importa cuando hay afinidad.”"}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        />
                    </Stack>
                </AccordionDetails>
            </Accordion>
        </Grid>
    );
}
