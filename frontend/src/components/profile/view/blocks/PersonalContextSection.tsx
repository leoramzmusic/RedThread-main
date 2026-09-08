import { Box, Typography, Stack, Grid } from '@mui/material';
import { Public } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ProfileSectionBlock from './ProfileSectionBlock';

interface PersonalContextSectionProps {
    profile: any;
    onEdit?: () => void;
}

export default function PersonalContextSection({ profile, onEdit }: PersonalContextSectionProps) {
    const { t } = useTranslation('common');

    const languages = profile.languages || [];
    const locationDisplay = profile.city ?
        `${profile.city}${profile.location?.country ? `, ${profile.location.country}` : ''}` :
        profile.location?.country;

    const hasData = languages.length > 0 || locationDisplay || profile.occupation || profile.education_level;

    return (
        <ProfileSectionBlock
            title={t('profile.sections.context.title', 'Contexto personal')}
            icon={<Public />}
            onEdit={onEdit}
            isEmpty={!hasData}
        >
            <Stack spacing={2}>
                <Grid container spacing={2}>
                    {languages.length > 0 && (
                        <Grid item xs={12}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    {t('profile.fields.languages', 'Idiomas')}
                                </Typography>
                                <Typography variant="body2">
                                    {languages.map((lang: string) => t(`languages.${lang}`, lang)).join(', ')}
                                </Typography>
                            </Box>
                        </Grid>
                    )}

                    {locationDisplay && (
                        <Grid item xs={12}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    {t('profile.fields.location', 'Ubicación / Nacionalidad')}
                                </Typography>
                                <Typography variant="body2">
                                    {locationDisplay}
                                </Typography>
                            </Box>
                        </Grid>
                    )}

                    {(profile.occupation || profile.work_company) && (
                        <Grid item xs={6}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    {t('profile.fields.occupation', 'Profesional')}
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {profile.occupation || '-'}
                                </Typography>
                                {profile.work_company && (
                                    <Typography variant="body2" color="text.secondary">
                                        @ {profile.work_company}
                                    </Typography>
                                )}
                            </Box>
                        </Grid>
                    )}

                    {(profile.education_level || profile.school) && (
                        <Grid item xs={6}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    {t('profile.fields.education', 'Académico')}
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {profile.education_level ? t(`education.${profile.education_level}`, profile.education_level) as string : '-'}
                                </Typography>

                                {profile.school && (
                                    <Typography variant="body2" color="text.secondary">
                                        @ {profile.school}
                                    </Typography>
                                )}
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Stack>
        </ProfileSectionBlock>
    );
}
