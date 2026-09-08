import { AutoStories, Psychology, Bolt, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Control, UseFormSetValue } from 'react-hook-form';
import { useTranslation } from 'next-i18next';
import { Grid, Paper, Typography, Box, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import OptionSelector from './OptionSelector';
import NeurodiversitySelector from './NeurodiversitySelector';
import LearningStyleSelector from './LearningStyleSelector';

interface CognitiveSectionProps {
    control: Control<any>;
    setValue: UseFormSetValue<any>;
}

export default function CognitiveSection({ control, setValue }: CognitiveSectionProps) {
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
                        <Psychology color="action" />
                        <Typography variant="h6">{t('profile.cognitive.title')}</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <NeurodiversitySelector
                                control={control}
                                setValue={setValue}
                                name="neurodiversity"
                                diagnosesName="neurodiversity_diagnoses"
                                privacyName="show_neurodiversity"
                                label={t('profile.cognitive.neurodiversity')}
                                icon={<Psychology />}
                                color="#e91e63"
                                options={[
                                    { value: 'tda', label: t('profile.cognitive.neurodiversity_tda') },
                                    { value: 'tdah', label: t('profile.cognitive.neurodiversity_tdah') },
                                    { value: 'dyslexia', label: t('profile.cognitive.neurodiversity_dyslexia') },
                                    { value: 'autism', label: t('profile.cognitive.neurodiversity_autism') },
                                    { value: 'discalculia', label: t('profile.cognitive.neurodiversity_discalculia') },
                                    { value: 'dispraxia', label: t('profile.cognitive.neurodiversity_dispraxia') },
                                    { value: 'tourette', label: t('profile.cognitive.neurodiversity_tourette') },
                                    { value: 'apd', label: t('profile.cognitive.neurodiversity_apd') },
                                    { value: 'nvld', label: t('profile.cognitive.neurodiversity_nvld') },
                                    { value: 'language', label: t('profile.cognitive.neurodiversity_language') },
                                    { value: 'pas', label: t('profile.cognitive.neurodiversity_pas') },
                                    { value: 'gifted', label: t('profile.cognitive.neurodiversity_gifted') },
                                    { value: 'asperger', label: t('profile.cognitive.neurodiversity_asperger') },
                                    { value: 'not_sure', label: t('profile.cognitive.neurodiversity_not_sure') },
                                    { value: 'prefer_not_to_say', label: t('profile.cognitive.neurodiversity_prefer_not_to_say') },
                                ]}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <LearningStyleSelector
                                control={control}
                                name="learning_preferences"
                                label={t('profile.cognitive.learning')}
                                color="#03a9f4"
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </Grid>
    );
}
