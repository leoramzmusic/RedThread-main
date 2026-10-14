import { Grid, Box, Typography, Chip } from '@mui/material';
import { useTranslation } from 'next-i18next/pages';
import {
    SportsBar as DrinkIcon,
    Pets as PetsIcon,
    SmokeFree as SmokeIcon,
    FitnessCenter as ExerciseIcon
} from '@mui/icons-material';
import { InfoSection } from './InfoSection';

interface ProfileLifestyleProps {
    profile: any;
}

export default function ProfileLifestyle({ profile }: ProfileLifestyleProps) {
    const { t } = useTranslation('common');

    return (
        <InfoSection title={t('profile.lifestyle', 'Estilo de vida')} icon={<DrinkIcon />}>
            <Grid container spacing={2}>
                <Grid
                    size={{
                        xs: 6,
                        sm: 3
                    }}>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 0.5
                        }}>
                        <PetsIcon color="action" />
                        <Typography variant="caption">{t('profile.lifestyle_tags.pets', 'Mascotas')}</Typography>
                        <Typography variant="body2" sx={{
                            fontWeight: 500
                        }}>-</Typography>
                    </Box>
                </Grid>
                <Grid
                    size={{
                        xs: 6,
                        sm: 3
                    }}>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 0.5
                        }}>
                        <DrinkIcon color="action" />
                        <Typography variant="caption">{t('profile.lifestyle_tags.drinking', 'Beber')}</Typography>
                        <Typography variant="body2" sx={{
                            fontWeight: 500
                        }}>-</Typography>
                    </Box>
                </Grid>
                <Grid
                    size={{
                        xs: 6,
                        sm: 3
                    }}>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 0.5
                        }}>
                        <SmokeIcon color="action" />
                        <Typography variant="caption">{t('profile.lifestyle_tags.smoking', 'Fumar')}</Typography>
                        <Typography variant="body2" sx={{
                            fontWeight: 500
                        }}>-</Typography>
                    </Box>
                </Grid>
                <Grid
                    size={{
                        xs: 6,
                        sm: 3
                    }}>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 0.5
                        }}>
                        <ExerciseIcon color="action" />
                        <Typography variant="caption">{t('profile.lifestyle_tags.exercise', 'Ejercicio')}</Typography>
                        <Typography variant="body2" sx={{
                            fontWeight: 500
                        }}>-</Typography>
                    </Box>
                </Grid>
            </Grid>
            {profile.lifestyle_interests?.length > 0 && (
                <Box className="profile-tags" sx={{
                    mt: 2
                }}>
                    <Typography variant="subtitle2" gutterBottom>{t('profile.lifestyle_tags.interests', 'Intereses')}</Typography>
                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1
                        }}>
                        {profile.lifestyle_interests.map((interest: string) => (
                            <Chip key={interest} label={interest} size="small" />
                        ))}
                    </Box>
                </Box>
            )}
        </InfoSection>
    );
}
