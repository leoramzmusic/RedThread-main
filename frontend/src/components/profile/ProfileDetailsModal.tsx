import React from 'react';
import {
    Box,
    Typography,
    Chip,
    Stack,
    CardMedia,
    IconButton,
    Dialog,
    DialogContent,
    Tooltip,
    Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedIcon from '@mui/icons-material/Verified';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import LanguageIcon from '@mui/icons-material/Language';
import HeightIcon from '@mui/icons-material/Height';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Profile } from './ProfileCard';
import PlanBadge from '../subscription/PlanBadge';
import { CompatibilityMeter } from '../discovery/CompatibilityMeter';
import { IDENTITY_COLORS } from '../../constants/profileOptions';
import { useTranslation } from 'next-i18next';

interface ProfileDetailsModalProps {
    open: boolean;
    onClose: () => void;
    profile: Profile;
    matchReason?: string;
    photos: string[];
    isOwnProfile?: boolean;
}

export default function ProfileDetailsModal({
    open,
    onClose,
    profile,
    matchReason,
    photos,
    isOwnProfile
}: ProfileDetailsModalProps) {
    const { t } = useTranslation(['discover', 'common']);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: { borderRadius: 3, overflow: 'hidden' }
            }}
        >
            <Box sx={{ position: 'relative' }}>
                <CardMedia
                    component="img"
                    height="400"
                    image={photos[0] || '/placeholder-profile.png'}
                    alt={profile.nickname || profile.display_name}
                />
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                    }}
                >
                    <CloseIcon />
                </IconButton>

                <Box sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 3,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    color: 'white'
                }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h4" fontWeight="bold">
                            {profile.nickname || profile.display_name}, {profile.age}
                        </Typography>
                        {profile.verified && <VerifiedIcon color="primary" />}
                        <PlanBadge tier={profile.plan || profile.subscription_tier || 'free'} />
                    </Stack>
                    <Stack direction="row" spacing={1} mt={1}>
                        <Chip
                            icon={<LocationOnIcon sx={{ color: 'white !important' }} />}
                            label={profile.location_name || t('card.locationNotAvailable', 'Ubicación no disponible')}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                        />
                    </Stack>
                </Box>
            </Box>

            <DialogContent sx={{ p: 4 }}>
                <Stack spacing={4}>
                    {/* Identidad y Orientación */}
                    <Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {profile.gender && (
                                <Tooltip title={profile.identity_context?.description || t('card.identityTooltipDefault', "Esta identidad forma parte de tu camino. CARE la usa para conectar con respeto y afinidad.")}>
                                    <Chip
                                        icon={<FingerprintIcon sx={{ color: 'white !important', fontSize: 18 }} />}
                                        label={profile.gender}
                                        sx={{
                                            bgcolor: IDENTITY_COLORS[profile.gender_category as keyof typeof IDENTITY_COLORS] || IDENTITY_COLORS.traditional,
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                </Tooltip>
                            )}
                            {profile.sexual_orientation && (
                                <Chip
                                    icon={<FavoriteIcon sx={{ fontSize: 16 }} />}
                                    label={profile.sexual_orientation}
                                    variant="outlined"
                                    sx={{ fontWeight: 'medium' }}
                                />
                            )}
                        </Stack>
                    </Box>

                    {/* Bio Section */}
                    <Box>
                        <Typography variant="overline" color="primary" fontWeight={800}>{t('common:profile.aboutMe', 'SOBRE MÍ')}</Typography>
                        <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.6, opacity: 0.9 }}>
                            {profile.bio || t('common:profile.noBio', 'Sin biografía disponible.')}
                        </Typography>
                    </Box>

                    {/* Lifestyle & Professional */}
                    <Grid container spacing={2}>
                        {profile.occupation && (
                            <Grid item xs={12} md={6}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <WorkIcon color="action" fontSize="small" />
                                    <Typography variant="body2">
                                        {profile.occupation} {profile.work_company ? `@ ${profile.work_company}` : ''}
                                    </Typography>
                                </Stack>
                            </Grid>
                        )}
                        {profile.education_center && (
                            <Grid item xs={12} md={6}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <SchoolIcon color="action" fontSize="small" />
                                    <Typography variant="body2">
                                        {profile.education_center}
                                    </Typography>
                                </Stack>
                            </Grid>
                        )}
                        {profile.height_cm && (
                            <Grid item xs={12} md={6}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <HeightIcon color="action" fontSize="small" />
                                    <Typography variant="body2">{profile.height_cm} cm</Typography>
                                </Stack>
                            </Grid>
                        )}
                    </Grid>

                    {/* Compatibility Match Reason (CARE) */}
                    {matchReason && (
                        <Box sx={{ bgcolor: 'rgba(255, 77, 79, 0.05)', p: 3, borderRadius: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                <CompatibilityMeter score={profile.compatibility_score || profile.affinity_score || 0} size={40} />
                                <Typography variant="subtitle1" fontWeight="bold">{t('card.careHarmony', 'Sintonía CARE')}</Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.8 }}>
                                "{matchReason}"
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
