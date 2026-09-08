import { Psychology, Groups, AutoGraph, WarningAmber, AccountTree, Favorite, HelpOutline, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Control, UseFormSetValue } from 'react-hook-form';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { Grid, Paper, Typography, Box, Button, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import OptionSelector from './OptionSelector';
import SocialStyleTest from '../SocialStyleTest';

interface PersonalitySectionProps {
    control: Control<any>;
    setValue: UseFormSetValue<any>;
}

export default function PersonalitySection({ control, setValue }: PersonalitySectionProps) {
    const { t } = useTranslation('common');
    const [testOpen, setTestOpen] = useState(false);

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
                        <Psychology color="action" />
                        <Typography variant="h6">{t('profile.personality.title')}</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {t('profile.personality.socialStyle')}
                                </Typography>
                                <Button
                                    size="small"
                                    color="info"
                                    startIcon={<HelpOutline />}
                                    onClick={() => setTestOpen(true)}
                                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                                >
                                    ¿No sabes cuál eres?
                                </Button>
                            </Box>
                            <OptionSelector
                                control={control}
                                name="social_style"
                                label={t('profile.personality.socialStyle')}
                                icon={<Groups />}
                                color="#3f51b5"
                                options={[
                                    {
                                        value: 'extrovert',
                                        label: "Extrovertido 🎉",
                                        description: "Full pila social, aguanto la fiesta."
                                    },
                                    {
                                        value: 'ambivert',
                                        label: "Ambientado 🌿",
                                        description: "Me adapto, pero también me engento."
                                    },
                                    {
                                        value: 'introvert',
                                        label: "Introvertido 📚",
                                        description: "Mi batería se acaba rápido, necesito mi mira."
                                    },
                                ]}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <OptionSelector
                                control={control}
                                name="processing_style"
                                label={t('profile.personality.processingStyle')}
                                icon={<AutoGraph />}
                                color="#9c27b0"
                                options={[
                                    { value: 'analytical', label: t('profile.personality.processingStyle_analytical'), description: t('profile.personality.processingStyle_analytical_desc') },
                                    { value: 'creative', label: t('profile.personality.processingStyle_creative'), description: t('profile.personality.processingStyle_creative_desc') },
                                    { value: 'practical', label: t('profile.personality.processingStyle_practical'), description: t('profile.personality.processingStyle_practical_desc') },
                                    { value: 'dreamer', label: t('profile.personality.processingStyle_dreamer'), description: t('profile.personality.processingStyle_dreamer_desc') },
                                    { value: 'intuitive', label: t('profile.personality.processingStyle_intuitive'), description: t('profile.personality.processingStyle_intuitive_desc') },
                                    { value: 'reflective', label: t('profile.personality.processingStyle_reflective'), description: t('profile.personality.processingStyle_reflective_desc') },
                                    { value: 'sequential', label: t('profile.personality.processingStyle_sequential'), description: t('profile.personality.processingStyle_sequential_desc') },
                                    { value: 'global', label: t('profile.personality.processingStyle_global'), description: t('profile.personality.processingStyle_global_desc') },
                                    { value: 'sensorial', label: t('profile.personality.processingStyle_sensorial'), description: t('profile.personality.processingStyle_sensorial_desc') },
                                    { value: 'verbal', label: t('profile.personality.processingStyle_verbal'), description: t('profile.personality.processingStyle_verbal_desc') },
                                    { value: 'visual', label: t('profile.personality.processingStyle_visual'), description: t('profile.personality.processingStyle_visual_desc') },
                                ]}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <OptionSelector
                                control={control}
                                name="risk_tolerance"
                                label={t('profile.personality.riskTolerance')}
                                icon={<WarningAmber />}
                                color="#ff9800"
                                options={[
                                    { value: 'conservative', label: t('profile.personality.riskTolerance_conservative'), description: t('profile.personality.riskTolerance_conservative_desc') },
                                    { value: 'balanced', label: t('profile.personality.riskTolerance_balanced'), description: t('profile.personality.riskTolerance_balanced_desc') },
                                    { value: 'risky', label: t('profile.personality.riskTolerance_risky'), description: t('profile.personality.riskTolerance_risky_desc') },
                                ]}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <OptionSelector
                                control={control}
                                name="decision_making"
                                label={t('profile.personality.decisionMaking')}
                                icon={<AccountTree />}
                                color="#4caf50"
                                options={[
                                    { value: 'rational', label: t('profile.personality.decisionMaking_rational'), description: t('profile.personality.decisionMaking_rational_desc') },
                                    { value: 'emotional', label: t('profile.personality.decisionMaking_emotional'), description: t('profile.personality.decisionMaking_emotional_desc') },
                                    { value: 'intuitive', label: t('profile.personality.decisionMaking_intuitive'), description: t('profile.personality.decisionMaking_intuitive_desc') },
                                ]}
                            />
                        </Grid>
                    </Grid>

                    <SocialStyleTest
                        open={testOpen}
                        onClose={() => setTestOpen(false)}
                        onResult={(result) => {
                            setValue('social_style', result, { shouldDirty: true, shouldValidate: true });
                            setTestOpen(false);
                        }}
                    />
                </AccordionDetails>
            </Accordion>
        </Grid >
    );
}
