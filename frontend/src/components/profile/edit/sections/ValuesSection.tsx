import { Diamond, Favorite, Style, Weekend, ChatBubbleOutline, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Control } from 'react-hook-form';
import { useTranslation } from 'next-i18next';
import { Grid, Paper, Typography, Box, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import OptionSelector from './OptionSelector';
import MultiOptionSelector from './MultiOptionSelector';

interface ValuesSectionProps {
    control: Control<any>;
}

export default function ValuesSection({ control }: ValuesSectionProps) {
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
                        <Diamond color="action" />
                        <Typography variant="h6">{t('profile.values.title')}</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <MultiOptionSelector
                                control={control}
                                name="core_values"
                                label={t('profile.values.values')}
                                icon={<Favorite />}
                                color="#e91e63"
                                options={[
                                    { value: 'honesty', label: t('profile.values.values_honesty') },
                                    { value: 'loyalty', label: t('profile.values.values_loyalty') },
                                    { value: 'independence', label: t('profile.values.values_independence') },
                                    { value: 'spirituality', label: t('profile.values.values_spirituality') },
                                    { value: 'humor', label: t('profile.values.values_humor') },
                                ]}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <OptionSelector
                                control={control}
                                name="lifestyle_mode"
                                label={t('profile.values.mode')}
                                icon={<Style />}
                                color="#8bc34a"
                                options={[
                                    { value: 'minimalist', label: t('profile.values.mode_minimalist') },
                                    { value: 'maximalist', label: t('profile.values.mode_maximalist') },
                                    { value: 'eco', label: t('profile.values.mode_eco') },
                                    { value: 'techy', label: t('profile.values.mode_techy') },
                                ]}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <MultiOptionSelector
                                control={control}
                                name="leisure_relation"
                                label={t('profile.values.leisure')}
                                icon={<Weekend />}
                                color="#ffc107"
                                options={[
                                    { value: 'explorer', label: t('profile.values.leisure_explorer') },
                                    { value: 'homebody', label: t('profile.values.leisure_homebody') },
                                    { value: 'gamer', label: t('profile.values.leisure_gamer') },
                                    { value: 'traveler', label: t('profile.values.leisure_traveler') },
                                ]}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <OptionSelector
                                control={control}
                                name="communication_style_v2"
                                label={t('profile.values.communication')}
                                icon={<ChatBubbleOutline />}
                                color="#607d8b"
                                options={[
                                    { value: 'direct', label: t('profile.values.communication_direct') },
                                    { value: 'diplomatic', label: t('profile.values.communication_diplomatic') },
                                    { value: 'reflective', label: t('profile.values.communication_reflective') },
                                ]}
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </Grid>
    );
}
