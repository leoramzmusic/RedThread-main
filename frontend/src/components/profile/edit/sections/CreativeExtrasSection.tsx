import { Grid, Paper, Typography, Box, TextField, alpha, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import {
    AutoFixHigh,
    HeartBroken,
    MusicNote,
    WorkspacePremium,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { Control, Controller } from 'react-hook-form';
import { useTranslation } from 'next-i18next/pages';

interface CreativeExtrasSectionProps {
    control: Control<any>;
}

export default function CreativeExtrasSection({ control }: CreativeExtrasSectionProps) {
    const { t } = useTranslation('common');

    return (
        <Grid size={12}>
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
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1
                        }}>
                        <WorkspacePremium color="action" />
                        <Typography variant="h6">{t('profile.extras.title')}</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Grid container spacing={2}>
                        <Grid size={12}>
                            <Controller
                                name="superpower"
                                control={control}
                                render={({ field }) => (
                                    <TextField size="small"
                                        {...field}
                                        fullWidth
                                        label={t('profile.extras.superpower')}
                                        placeholder="Ej. escuchar bien, improvisar, resolver problemas..."
                                        variant="outlined"
                                        sx={{
                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                                            borderRadius: 2,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                            }
                                        }}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <AutoFixHigh color="primary" sx={{ mr: 1 }} />
                                                ),
                                            }
                                        }}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={12}>
                            <Controller
                                name="achilles_heel"
                                control={control}
                                render={({ field }) => (
                                    <TextField size="small"
                                        {...field}
                                        fullWidth
                                        label={t('profile.extras.achillesHeel')}
                                        placeholder="Una vulnerabilidad que reconozcas..."
                                        variant="outlined"
                                        sx={{
                                            bgcolor: (theme) => alpha(theme.palette.error.main, 0.05),
                                            borderRadius: 2,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                            }
                                        }}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <HeartBroken color="error" sx={{ mr: 1 }} />
                                                ),
                                            }
                                        }}
                                    />
                                )}
                            />
                        </Grid>
                        {/* For soundtrack, we'll use a simple multiline text for now 
                            Alternatively, we could link it to Spotify like Mi Himno, 
                            but the request implies a more "narrative" expression.
                        */}
                        <Grid size={12}>
                            <Controller
                                name="personal_soundtrack_text" // Using a text field for simplicity in this iteration
                                control={control}
                                render={({ field }) => (
                                    <TextField size="small"
                                        {...field}
                                        fullWidth
                                        multiline
                                        rows={2}
                                        label={t('profile.extras.soundtrack')}
                                        placeholder="Canciones que reflejen tu personalidad o tu mood actual..."
                                        variant="outlined"
                                        sx={{
                                            bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.05),
                                            borderRadius: 2,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                            }
                                        }}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <MusicNote color="secondary" sx={{ mr: 1, mt: -2 }} />
                                                ),
                                            }
                                        }}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </Grid>
    );
}
