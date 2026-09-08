import { Diversity3, Groups, Explore, Handshake, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Control } from 'react-hook-form';
import { useTranslation } from 'next-i18next';
import { Grid, Paper, Typography, Box, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import OptionSelector from './OptionSelector';

interface SocialDynamicsSectionProps {
    control: Control<any>;
}

export default function SocialDynamicsSection({ control }: SocialDynamicsSectionProps) {
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
                        <Diversity3 color="action" />
                        <Typography variant="h6">{t('profile.social.title')}</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <OptionSelector
                                control={control}
                                name="interaction_preference"
                                label={t('profile.social.interaction')}
                                icon={<Groups />}
                                color="#3f51b5"
                                options={[
                                    { value: 'groups', label: t('profile.social.interaction_groups') },
                                    { value: 'circles', label: t('profile.social.interaction_circles') },
                                    { value: 'oneOnOne', label: t('profile.social.interaction_oneOnOne') },
                                ]}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <OptionSelector
                                control={control}
                                name="openness_to_experience"
                                label={t('profile.social.openness')}
                                icon={<Explore />}
                                color="#ff5722"
                                options={[
                                    { value: 'low', label: t('profile.social.openness_low') },
                                    { value: 'medium', label: t('profile.social.openness_medium') },
                                    { value: 'high', label: t('profile.social.openness_high') },
                                ]}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <OptionSelector
                                control={control}
                                name="collaboration_style"
                                label={t('profile.social.collaboration')}
                                icon={<Handshake />}
                                color="#795548"
                                options={[
                                    { value: 'leader', label: t('profile.social.collaboration_leader') },
                                    { value: 'follower', label: t('profile.social.collaboration_follower') },
                                    { value: 'mediator', label: t('profile.social.collaboration_mediator') },
                                ]}
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </Grid>
    );
}
