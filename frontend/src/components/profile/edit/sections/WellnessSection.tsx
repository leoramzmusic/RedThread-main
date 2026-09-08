import { HealthAndSafety, Accessible, MedicalServices, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Control, Controller, UseFormSetValue } from 'react-hook-form';
import { useTranslation } from 'next-i18next';
import { Grid, Paper, Typography, Box, TextField, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';

import EnergyLevelSelector from './EnergyLevelSelector';
import HealthConditionsSelector from './HealthConditionsSelector';
import DisabilitySelector from './DisabilitySelector';

interface WellnessSectionProps {
    control: Control<any>;
    setValue: UseFormSetValue<any>;
}

export default function WellnessSection({ control, setValue }: WellnessSectionProps) {
    const { t } = useTranslation('common');

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
                        <HealthAndSafety color="action" />
                        <Typography variant="h6">{t('profile.wellness.title')}</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <HealthConditionsSelector
                                control={control}
                                name="health_conditions"
                                statusName="health_status"
                                privacyName="show_health"
                                label={t('profile.wellness.health_title')}
                                color="#ef5350"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <DisabilitySelector
                                control={control}
                                setValue={setValue}
                                name="disabilities"
                                diagnosesName="disabilities_diagnoses"
                                privacyName="show_disabilities"
                                label={t('profile.wellness.disability')}
                                color="#9e9e9e"
                                options={[
                                    { value: 'visual', label: t('profile.wellness.disability_visual') },
                                    { value: 'auditory', label: t('profile.wellness.disability_auditory') },
                                    { value: 'motor', label: t('profile.wellness.disability_motor') },
                                    { value: 'cognitive', label: t('profile.wellness.disability_cognitive') },
                                    { value: 'psychosocial', label: t('profile.wellness.disability_psychosocial') },
                                    { value: 'neurological', label: t('profile.wellness.disability_neurological') },
                                    { value: 'intellectual', label: t('profile.wellness.disability_intellectual') },
                                ]}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <EnergyLevelSelector
                                control={control}
                                name="energy_level"
                                label={t('profile.cognitive.energy')}
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </Grid>
    );
}

// Helper needed because alpha is not imported from MUI normally in a file like this
import { alpha } from '@mui/material/styles';
