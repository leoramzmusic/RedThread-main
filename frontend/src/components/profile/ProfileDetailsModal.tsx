import React, { useRef, useState } from 'react';
import {
    Box,
    Typography,
    Chip,
    Stack,
    IconButton,
    Button,
    Dialog,
    DialogContent,
    Tooltip,
    Grid,
    useTheme,
    useMediaQuery,
    alpha,
    darken
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ScreenRotationIcon from '@mui/icons-material/ScreenRotation';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import VerifiedIcon from '@mui/icons-material/Verified';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import HeightIcon from '@mui/icons-material/Height';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Profile } from './ProfileCard';
import PlanBadge from '../subscription/PlanBadge';
import PresenceIndicator from './PresenceIndicator';
import PhotoLightbox from './PhotoLightbox';
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
    /** Extra footer buttons (e.g. "Responder", "Eliminar like") */
    footerActions?: React.ReactNode;
}

export default function ProfileDetailsModal({
    open,
    onClose,
    profile,
    matchReason,
    photos,
    isOwnProfile,
    footerActions
}: ProfileDetailsModalProps) {
    const { t } = useTranslation(['discover', 'common']);
    const theme = useTheme();

    /* Breakpoints: desktop >=1024, tablet 768-1023, mobile <=767 (JS-driven so
       sizes change deterministically on every device, no reliance on sx queries) */
    const isDesktop = useMediaQuery('(min-width: 1024px)');
    const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
    const isMobile = useMediaQuery('(max-width: 767px)');
    // Phone in landscape: short + wide viewport (e.g. 956×440)
    const isLandscapePhone = useMediaQuery(
        '(orientation: landscape) and (max-height: 500px) and (max-width: 1100px)'
    );

    const modalWidth = isLandscapePhone
        ? '100vw'
        : isMobile
          ? '95%'
          : isTablet
            ? '600px'
            : '800px';
    const modalMaxHeight = isLandscapePhone
        ? '100vh'
        : isMobile
          ? '90vh'
          : isTablet
            ? '75vh'
            : '80vh';

    /* Colorful interest chips, theme-aware */
    const interestColors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.info.main
    ];

    /* Category colors + icons for interests (art→blue, videogames→green,
       technology→purple, music→orange, photography→yellow) */
    const INTEREST_META: Array<{ keys: string[]; color: string; icon: string }> = [
        { keys: ['art', 'arte', 'draw', 'dibujo', 'paint', 'ilustr', 'design', 'diseño'], color: '#2196F3', icon: '🎨' },
        { keys: ['videojuego', 'videogame', 'gaming', 'game', 'juegos', 'nintendo'], color: '#4CAF50', icon: '🎮' },
        { keys: ['tech', 'tecnolog', 'program', 'coding', 'software', 'data', ' ai'], color: '#AB47BC', icon: '💻' },
        { keys: ['music', 'música', 'musica', 'band', 'guitar', 'song', 'cancion', 'concert'], color: '#FF9800', icon: '🎵' },
        { keys: ['photo', 'foto', 'camera', 'cámara', 'camara', 'cinemat'], color: '#FFC107', icon: '📸' }
    ];
    const isDark = theme.palette.mode === 'dark';
    const interestMeta = (tag: string) => {
        const low = tag.toLowerCase();
        return INTEREST_META.find((m) => m.keys.some((k) => low.includes(k)));
    };

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    /* Hero carousel: current photo + swipe state */
    const [photoIndex, setPhotoIndex] = useState(0);
    const heroTouchX = useRef<number | null>(null);
    const didSwipeRef = useRef(false);
    const prevPhoto = () =>
        setPhotoIndex((i) => (i - 1 + (photos?.length || 1)) % (photos?.length || 1));
    const nextPhoto = () =>
        setPhotoIndex((i) => (i + 1) % (photos?.length || 1));

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            slotProps={{
                backdrop: {
                    sx: {
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        /* Backdrop sits above page content (modal root z-index) but below the paper */
                        zIndex: 0
                    }
                },
                paper: {
                    className: 'profile-details-modal',
                    sx: {
                        /* Absolute center on screen (top-level paper, no wrapper) */
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        margin: 0,
                        /* Adaptive dimensions via useMediaQuery */
                        width: modalWidth,
                        maxHeight: modalMaxHeight,
                        /* Solid background + soft shadow for hierarchy */
                        backgroundColor: 'background.paper',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                        borderRadius: isLandscapePhone ? '0 !important' : '12px !important',
                        zIndex: 1,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        /* Smooth entrance: fade (MUI Fade) + scale */
                        '@keyframes profileModalIn': {
                            from: { transform: 'translate(-50%, -50%) scale(0.95)' },
                            to: { transform: 'translate(-50%, -50%) scale(1)' }
                        },
                        animation: 'profileModalIn 0.3s ease'
                    }
                }
            }}
        >
            {/* ===== FIXED HEADER: name+age+badge+close line; on mobile the
                 connection status moves to a compact second row ===== */}
            <Box
                sx={{
                    px: isLandscapePhone ? '12px' : { xs: 2, sm: 3 },
                    pt: { xs: 0.75, sm: isLandscapePhone ? 0.5 : 1.5 },
                    pb: { xs: 0.75, sm: isLandscapePhone ? 0.5 : 1.5 },
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    flexShrink: 0
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        overflow: 'hidden'
                    }}
                >
                    <Typography
                        variant="h6"
                        fontWeight={800}
                        noWrap
                        sx={{
                            flexShrink: 1,
                            minWidth: 0,
                            fontSize: isLandscapePhone
                                ? '1.15rem'
                                : { xs: '1.25rem', sm: '1.5rem' },
                            lineHeight: 1.2
                        }}
                    >
                        {profile.nickname || profile.display_name}
                        {profile.age ? `, ${profile.age}` : ''}
                    </Typography>
                    {profile.verified && (
                        <VerifiedIcon color="primary" sx={{ fontSize: 20, flexShrink: 0 }} />
                    )}
                    <Box sx={{ flexShrink: 0 }}>
                        <PlanBadge tier={profile.plan || profile.subscription_tier || 'free'} />
                    </Box>
                    {!isMobile && (
                        <Box sx={{ ml: 'auto', flexShrink: 0 }}>
                            <PresenceIndicator
                                status={isOwnProfile ? 'online' : profile.connection_status}
                                lastSeen={profile.last_seen}
                                size={8}
                                showText
                                textColor={theme.palette.text.secondary}
                            />
                        </Box>
                    )}
                    <IconButton
                        onClick={onClose}
                        edge={isMobile ? undefined : 'end'}
                        aria-label={t('common:actions.close', 'Cerrar')}
                        size={isMobile ? 'small' : 'medium'}
                        sx={{ flexShrink: 0, ml: isMobile ? 'auto' : 0 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
                {isMobile && (
                    <Box sx={{ mt: 0.5 }}>
                        <PresenceIndicator
                            status={isOwnProfile ? 'online' : profile.connection_status}
                            lastSeen={profile.last_seen}
                            size={8}
                            showText
                            textColor={theme.palette.text.secondary}
                        />
                    </Box>
                )}
            </Box>

            {/* ===== SCROLLABLE BODY ===== */}
            <DialogContent
                sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    p: isLandscapePhone ? '12px' : { xs: 2, sm: 3 }
                }}
            >
                {/* Landscape phone: soft, non-blocking hint (layout already adapts) */}
                {isLandscapePhone && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            mb: 2,
                            px: 1.5,
                            py: 0.75,
                            bgcolor: 'action.hover',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '8px',
                            color: 'text.secondary',
                            fontSize: '0.8rem',
                            flexShrink: 0
                        }}
                    >
                        <ScreenRotationIcon sx={{ fontSize: 16 }} />
                        {t('common:profile.rotateHint', 'Gira tu dispositivo a vertical para una mejor experiencia')}
                    </Box>
                )}
                <Stack spacing={3}>
                    {/* Photos: hero carousel with blur backdrop + thumbnail strip */}
                    {(photos || []).length > 0 && (
                        <Box>
                            <Box
                                onClick={() => {
                                    if (!didSwipeRef.current) setLightboxIndex(photoIndex);
                                    didSwipeRef.current = false;
                                }}
                                onTouchStart={(e) => {
                                    heroTouchX.current = e.touches[0].clientX;
                                    didSwipeRef.current = false;
                                }}
                                onTouchEnd={(e) => {
                                    if (heroTouchX.current === null) return;
                                    const dx =
                                        e.changedTouches[0].clientX - heroTouchX.current;
                                    if (Math.abs(dx) > 40) {
                                        didSwipeRef.current = true;
                                        if (dx > 0) prevPhoto();
                                        else nextPhoto();
                                    }
                                    heroTouchX.current = null;
                                }}
                                sx={{
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: '8px',
                                    cursor: 'zoom-in',
                                    height: isLandscapePhone ? 170 : isMobile ? 220 : 'auto',
                                    aspectRatio:
                                        isMobile || isLandscapePhone ? undefined : '16 / 9',
                                    maxHeight: isLandscapePhone
                                        ? undefined
                                        : isDesktop
                                          ? 420
                                          : isTablet
                                            ? 300
                                            : undefined
                                }}
                            >
                                {/* Blurred backdrop of the current photo */}
                                <Box
                                    component="img"
                                    src={photos[photoIndex] || '/placeholder-profile.png'}
                                    aria-hidden
                                    draggable={false}
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        filter: 'blur(28px)',
                                        transform: 'scale(1.15)'
                                    }}
                                />
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        bgcolor: 'rgba(0, 0, 0, 0.25)'
                                    }}
                                />
                                {/* Current photo contained over the blur — never cropped */}
                                <Box
                                    component="img"
                                    src={photos[photoIndex] || '/placeholder-profile.png'}
                                    alt={profile.nickname || profile.display_name}
                                    draggable={false}
                                    sx={{
                                        position: 'relative',
                                        display: 'block',
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain'
                                    }}
                                />
                                {/* Side arrows */}
                                {(photos || []).length > 1 && (
                                    <>
                                        <IconButton
                                            aria-label="Foto anterior"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                prevPhoto();
                                            }}
                                            sx={{
                                                position: 'absolute',
                                                left: 8,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: 'white',
                                                bgcolor: 'rgba(0,0,0,0.45)',
                                                zIndex: 2,
                                                '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' }
                                            }}
                                        >
                                            <ChevronLeftIcon />
                                        </IconButton>
                                        <IconButton
                                            aria-label="Foto siguiente"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                nextPhoto();
                                            }}
                                            sx={{
                                                position: 'absolute',
                                                right: 8,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: 'white',
                                                bgcolor: 'rgba(0,0,0,0.45)',
                                                zIndex: 2,
                                                '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' }
                                            }}
                                        >
                                            <ChevronRightIcon />
                                        </IconButton>
                                    </>
                                )}
                                {/* Counter pill */}
                                <Typography
                                    sx={{
                                        position: 'absolute',
                                        bottom: 8,
                                        right: 10,
                                        color: 'white',
                                        bgcolor: 'rgba(0,0,0,0.5)',
                                        px: 1.25,
                                        py: 0.25,
                                        borderRadius: '999px',
                                        fontSize: 13,
                                        zIndex: 2,
                                        pointerEvents: 'none'
                                    }}
                                >
                                    {photoIndex + 1} / {(photos || []).length}
                                </Typography>
                            </Box>
                            {/* Thumbnail strip — hidden on mobile & landscape phone (swipe-only) */}
                            {!isMobile && !isLandscapePhone && (photos || []).length > 1 && (
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    mt={1}
                                    sx={{ overflowX: 'auto', pb: 0.5 }}
                                >
                                    {(photos || []).slice(0, 5).map((photo, idx) => (
                                        <Box
                                            key={idx}
                                            component="img"
                                            src={photo}
                                            alt=""
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPhotoIndex(idx);
                                            }}
                                            sx={{
                                                width: { xs: 56, sm: 64 },
                                                height: { xs: 56, sm: 64 },
                                                objectFit: 'cover',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                                opacity:
                                                    idx === photoIndex ? 1 : 0.55,
                                                border: '2px solid',
                                                borderColor:
                                                    idx === photoIndex
                                                        ? 'primary.main'
                                                        : 'transparent',
                                                transition: 'opacity 0.15s',
                                                '&:hover': { opacity: 1 }
                                            }}
                                        />
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    )}

                    {/* Location + identity */}
                    <Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip
                                icon={<LocationOnIcon />}
                                label={
                                    profile.location_name ||
                                    t('card.locationNotAvailable', 'Ubicación no disponible')
                                }
                                size="small"
                                variant="outlined"
                            />
                            {profile.gender && (
                                <Tooltip
                                    title={
                                        profile.identity_context?.description ||
                                        t(
                                            'card.identityTooltipDefault',
                                            'Esta identidad forma parte de tu camino. CARE la usa para conectar con respeto y afinidad.'
                                        )
                                    }
                                >
                                    <Chip
                                        icon={<FingerprintIcon sx={{ color: 'white !important', fontSize: 18 }} />}
                                        label={profile.gender}
                                        sx={{
                                            bgcolor:
                                                IDENTITY_COLORS[
                                                    profile.gender_category as keyof typeof IDENTITY_COLORS
                                                ] || IDENTITY_COLORS.traditional,
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

                    {/* Interests */}
                    {(profile.interests || []).length > 0 && (
                        <Box>
                            <Typography
                                variant="overline"
                                color="primary"
                                fontWeight={800}
                                sx={{
                                    display: 'block',
                                    fontSize: isLandscapePhone
                                        ? '0.85rem'
                                        : { xs: '0.85rem', sm: '0.75rem' }
                                }}
                            >
                                {t('common:profile.interests', 'Intereses')}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                                {(profile.interests || []).map((tag, idx) => {
                                    const meta = interestMeta(tag);
                                    const color = meta ? meta.color : interestColors[idx % interestColors.length];
                                    const fg = isDark ? color : darken(color, 0.35);
                                    return (
                                        <Chip
                                            key={tag}
                                            label={meta ? `${meta.icon} ${tag}` : tag}
                                            sx={{
                                                bgcolor: alpha(color, isDark ? 0.2 : 0.15),
                                                color: fg,
                                                fontWeight: 700,
                                                fontSize: '0.875rem',
                                                border: `1.5px solid ${alpha(color, isDark ? 0.55 : 0.45)}`,
                                                '&:hover': { bgcolor: alpha(color, isDark ? 0.32 : 0.25) }
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        </Box>
                    )}

                    {/* About me — light box, consistent with the edit view */}
                    <Box>
                        <Typography
                            variant="overline"
                            color="primary"
                            fontWeight={800}
                            sx={{
                                display: 'block',
                                fontSize: isLandscapePhone
                                    ? '0.85rem'
                                    : { xs: '0.85rem', sm: '0.75rem' }
                            }}
                        >
                            {t('common:profile.aboutMe', 'SOBRE MÍ')}
                        </Typography>
                        <Box
                            sx={{
                                mt: 1,
                                bgcolor: 'action.hover',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: '8px',
                                p: 2
                            }}
                        >
                            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                                {profile.bio || t('common:profile.noBio', 'Sin biografía disponible.')}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Lifestyle & Professional */}
                    {(profile.occupation || profile.education_center || profile.height_cm) && (
                        <Grid container spacing={2}>
                            {profile.occupation && (
                                <Grid item xs={12} md={6}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <WorkIcon color="action" fontSize="small" />
                                        <Typography variant="body2">
                                            {profile.occupation}{' '}
                                            {profile.work_company ? `@ ${profile.work_company}` : ''}
                                        </Typography>
                                    </Stack>
                                </Grid>
                            )}
                            {profile.education_center && (
                                <Grid item xs={12} md={6}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <SchoolIcon color="action" fontSize="small" />
                                        <Typography variant="body2">{profile.education_center}</Typography>
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
                    )}

                    {/* Compatibility Match Reason (CARE) */}
                    {matchReason && (
                        <Box
                            sx={{
                                bgcolor: 'rgba(255, 77, 79, 0.05)',
                                p: 3,
                                borderRadius: 2,
                                borderLeft: '4px solid',
                                borderColor: 'primary.main'
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                <CompatibilityMeter
                                    score={profile.compatibility_score || profile.affinity_score || 0}
                                    size={40}
                                />
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {t('card.careHarmony', 'Sintonía CARE')}
                                </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.8 }}>
                                &quot;{matchReason}&quot;
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </DialogContent>

            {/* ===== FIXED FOOTER: full-width stacked on mobile, row on tablet/desktop ===== */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'flex-end',
                    gap: 1.5,
                    px: isLandscapePhone ? '12px' : { xs: 2, sm: 3 },
                    py: isLandscapePhone ? 1 : 1.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.12)',
                    flexShrink: 0
                }}
            >
                {footerActions !== undefined && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 1.5,
                            width: { xs: '100%', sm: 'auto' }
                        }}
                    >
                        {footerActions}
                    </Box>
                )}
                <Button
                    variant="outlined"
                    color="inherit"
                    onClick={onClose}
                    fullWidth={isMobile}
                >
                    {t('common:actions.close', 'Cerrar')}
                </Button>
            </Box>

            {/* Fullscreen lightbox for photos */}
            <PhotoLightbox
                open={lightboxIndex !== null}
                photos={photos || []}
                initialIndex={lightboxIndex ?? 0}
                onClose={() => setLightboxIndex(null)}
            />
        </Dialog>
    );
}
