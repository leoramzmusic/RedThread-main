import { Grid, Box, Typography } from '@mui/material';
import {
    Verified as VerifiedIcon,
    Work as WorkIcon,
    School as SchoolIcon,
    LocationOn as LocationIcon,
    Translate as TranslateIcon,
    AutoAwesome as ZodiacIcon,
    Height as HeightIcon,
    School as EducationIcon
} from '@mui/icons-material';
import { InfoSection } from './InfoSection';

interface ProfileEssentialsProps {
    profile: any;
}

export default function ProfileEssentials({ profile }: ProfileEssentialsProps) {
    return (
        <>
            <InfoSection title="Esenciales" icon={<VerifiedIcon />}>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Box display="flex" gap={1} mb={1}>
                            <WorkIcon color="action" fontSize="small" />
                            <Box>
                                <Typography variant="caption" color="text.secondary">Ocupación</Typography>
                                <Typography variant="body2">{profile.occupation || '-'}</Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box display="flex" gap={1} mb={1}>
                            <SchoolIcon color="action" fontSize="small" />
                            <Box>
                                <Typography variant="caption" color="text.secondary">Estudios</Typography>
                                <Typography variant="body2">{profile.school || '-'}</Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box display="flex" gap={1} mb={1}>
                            <LocationIcon color="action" fontSize="small" />
                            <Box>
                                <Typography variant="caption" color="text.secondary">Ubicación</Typography>
                                <Typography variant="body2">{profile.city || '-'}</Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box display="flex" gap={1} mb={1}>
                            <TranslateIcon color="action" fontSize="small" />
                            <Box>
                                <Typography variant="caption" color="text.secondary">Idiomas</Typography>
                                <Typography variant="body2">{profile.languages?.join(', ') || '-'}</Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </InfoSection>

            <InfoSection title="Más sobre mí" icon={<ZodiacIcon />}>
                <Grid container spacing={2}>
                    <Grid item xs={4}>
                        <Box textAlign="center" p={1} bgcolor="action.hover" borderRadius={2}>
                            <ZodiacIcon color="primary" sx={{ mb: 0.5 }} />
                            <Typography variant="caption" display="block">Signo</Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                                {profile.zodiac || '-'}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={4}>
                        <Box textAlign="center" p={1} bgcolor="action.hover" borderRadius={2}>
                            <HeightIcon color="primary" sx={{ mb: 0.5 }} />
                            <Typography variant="caption" display="block">Altura</Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {profile.height_cm ? `${profile.height_cm} cm` : '-'}
                            </Typography>
                            {profile.height_relevant === false && (
                                <Typography variant="caption" sx={{ mt: 0.5, display: 'block', fontSize: '0.65rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                    La estatura no influye en tu compatibilidad.
                                </Typography>
                            )}
                            {profile.height_relevant !== false && profile.height_cm && (
                                <Typography variant="caption" sx={{ mt: 0.5, display: 'block', fontSize: '0.65rem', color: 'primary.main', fontWeight: 500 }}>
                                    Altura contextual activada.
                                </Typography>
                            )}
                        </Box>
                    </Grid>
                    <Grid item xs={4}>
                        <Box textAlign="center" p={1} bgcolor="action.hover" borderRadius={2}>
                            <EducationIcon color="primary" sx={{ mb: 0.5 }} />
                            <Typography variant="caption" display="block">Nivel</Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                                {profile.education_level?.replace('_', ' ') || '-'}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </InfoSection>
        </>
    );
}
