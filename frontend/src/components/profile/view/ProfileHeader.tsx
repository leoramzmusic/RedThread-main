import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import {
    Box,
    Button,
    Avatar,
    Typography,
    Stack,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Container,
    useTheme
} from '@mui/material';
import {
    Edit as EditIcon,
    CameraAlt as CameraIcon,
    AddCircle as AddIcon,
    Image as ImageIcon,
    Close as CloseIcon,
    Verified as VerifiedIcon,
} from '@mui/icons-material';


import PlanBadge from '../../subscription/PlanBadge';

interface ProfileHeaderProps {
    profile: any;
    mainProfilePhoto?: string;
    onEdit?: () => void;
    readOnly?: boolean;
}

export default function ProfileHeader({ profile, mainProfilePhoto, onEdit, readOnly }: ProfileHeaderProps) {
    const { t } = useTranslation('common');
    const theme = useTheme();
    const [cameraMenuAnchor, setCameraMenuAnchor] = useState<null | HTMLElement>(null);
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const isMenuOpen = Boolean(cameraMenuAnchor);

    // Mock story state
    const hasNewStory = profile.has_new_story || false;
    const storyViewed = profile.story_viewed || false;

    const handleCameraClick = (event: React.MouseEvent<HTMLElement>) => {
        setCameraMenuAnchor(event.currentTarget);
    };

    const handleMenuClose = () => {
        setCameraMenuAnchor(null);
    };

    const handleAvatarClick = () => {
        if (hasNewStory) {
            console.log("Viewing story");
        } else {
            setIsPhotoModalOpen(true);
        }
    }

    const handleUploadStory = () => {
        console.log('Upload Story');
        handleMenuClose();
    };

    const handleUpdatePhoto = () => {
        if (onEdit) onEdit();
        handleMenuClose();
    };

    // Determine avatar border color
    let avatarBorderColor = theme.palette.background.paper; // Matches card background
    if (hasNewStory && !storyViewed) {
        avatarBorderColor = '#ff4f91';
    } else if (hasNewStory && storyViewed) {
        avatarBorderColor = '#888';
    }

    // Default banner image or texture
    const bannerUrl = profile.banner_url || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop';

    return (
        <Box mb={4}>
            {/* 1. Banner Section */}
            <Box
                sx={{
                    height: 200,
                    width: '100%',
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundImage: `url(${bannerUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to bottom, rgba(29,29,31,0.1) 0%, rgba(29,29,31,0.5) 100%)'
                    }
                }}
            >
                {/* Future: Banner Edit Button */}
            </Box>

            {/* 2. Overlapping Info Section */}
            <Container maxWidth="md" sx={{ px: { xs: 2, md: 4 } }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'center', sm: 'flex-end' },
                        mt: -6, // Overlap amount
                        position: 'relative',
                        zIndex: 2,
                        gap: 3
                    }}
                >
                    {/* Avatar Group */}
                    <Box position="relative">
                        <Box
                            sx={{
                                position: 'relative',
                                borderRadius: '50%',
                                p: 0.5,
                                background: hasNewStory && !storyViewed
                                    ? 'linear-gradient(135deg, #E63946, #FF6B6B, #E63946)'
                                    : 'transparent',
                                animation: hasNewStory && !storyViewed
                                    ? 'rtAvatarPulse 2s ease-in-out infinite'
                                    : 'none',
                                '@keyframes rtAvatarPulse': {
                                    '0%, 100%': { boxShadow: '0 0 0 2px rgba(230,57,70,0.4)' },
                                    '50%': { boxShadow: '0 0 0 6px rgba(230,57,70,0.15)' },
                                },
                            }}
                        >
                            <Avatar
                                src={mainProfilePhoto}
                                alt={profile.display_name}
                                onClick={handleAvatarClick}
                                sx={{
                                    width: 140,
                                    height: 140,
                                    border: `4px solid ${theme.palette.background.default}`,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'scale(1.02)',
                                        boxShadow: '0 0 20px rgba(230,57,70,0.3)',
                                    }
                                }}
                            />
                        </Box>

                        {/* Camera/Edit Icon for Owner */}
                        {!readOnly && (
                            <IconButton
                                onClick={handleCameraClick}
                                sx={{
                                    position: 'absolute',
                                    bottom: 10,
                                    right: 10,
                                    bgcolor: 'rgba(230,57,70,0.85)',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)',
                                    color: 'white',
                                    boxShadow: '0 2px 12px rgba(230,57,70,0.4)',
                                    '&:hover': {
                                        bgcolor: 'rgba(230,57,70,1)',
                                        transform: 'scale(1.1)',
                                    }
                                }}
                                size="small"
                            >
                                <CameraIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>

                    {/* User Info Group */}
                    <Box
                        sx={{
                            flexGrow: 1,
                            pb: 1,
                            textAlign: { xs: 'center', sm: 'left' },
                            width: '100%'
                        }}
                    >
                        {/* Name & Age Row */}
                        <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            justifyContent={{ xs: 'center', sm: 'flex-start' }}
                            flexWrap="wrap"
                        >
                            <Typography variant="h4" fontWeight={800} color="text.primary">
                                {profile.display_name}
                            </Typography>
                            <Typography variant="h5" color="text.secondary" fontWeight={500}>
                                {profile.age}
                            </Typography>
                            {profile.verified && <VerifiedIcon sx={{ color: '#E63946' }} />}
                        </Box>

                        {/* Handle */}
                        <Typography variant="subtitle1" color="text.disabled" fontWeight={500}>
                            @{profile.nickname}
                        </Typography>

                        {/* Badges */}
                        <Stack
                            direction="row"
                            spacing={1}
                            mt={1}
                            justifyContent={{ xs: 'center', sm: 'flex-start' }}
                        >
                            {profile.subscription_tier && profile.subscription_tier !== 'free' && (
                                <PlanBadge tier={profile.subscription_tier} size="small" />
                            )}
                        </Stack>
                    </Box>

                    {/* Action Buttons (Right Aligned on Desktop) */}
                    <Box sx={{ pb: 3 }}>
                        {!readOnly && onEdit ? (
                            <Button
                                variant="contained"
                                startIcon={<EditIcon sx={{ fontSize: 18 }} />}
                                onClick={onEdit}
                                sx={{
                                    fontSize: '0.85rem',
                                    py: 0.75,
                                    px: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap',
                                    bgcolor: 'rgba(230,57,70,0.9)',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    boxShadow: '0 4px 16px rgba(230,57,70,0.3)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        bgcolor: 'rgba(230,57,70,1)',
                                        boxShadow: '0 6px 20px rgba(230,57,70,0.4)',
                                        transform: 'translateY(-1px)',
                                    }
                                }}
                            >
                                {t('profile.edit', 'Editar perfil')}
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                sx={{
                                    fontSize: '0.85rem',
                                    py: 0.75,
                                    px: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap',
                                    boxShadow: 'none'
                                }}
                            >
                                {t('profile.follow', 'Seguir')}
                            </Button>
                        )}

                    </Box>
                </Box>

                {/* Bio & Socials (Below Avatar Row) */}
                <Box mt={3} sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                    {/* Links Placeholder */}
                    <Stack direction="row" spacing={2} mb={2} justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                        {/* Example Social Icons - in real app would verify existence */}
                        {/* <IconButton size="small"><InstagramIcon /></IconButton> */}
                    </Stack>

                    {/* Short Bio (if exists) */}
                    {profile.bio && (
                        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
                            {profile.bio}
                        </Typography>
                    )}
                </Box>
            </Container>

            {/* Menu for Camera */}
            <Menu
                anchorEl={cameraMenuAnchor}
                open={isMenuOpen}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        mt: 1,
                        minWidth: 180,
                        borderRadius: 2
                    }
                }}
            >
                <MenuItem onClick={handleUploadStory}>
                    <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary={t('profile.uploadStory', 'Subir historia')} />
                </MenuItem>
                <MenuItem onClick={handleUpdatePhoto}>
                    <ListItemIcon><ImageIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary={t('profile.viewEditPhoto', 'Ver/Editar foto')} />
                </MenuItem>
            </Menu>

            {/* Full Screen Photo View Modal */}
            {isPhotoModalOpen && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0,0,0,0.9)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column'
                    }}
                    onClick={() => setIsPhotoModalOpen(false)}
                >
                    <IconButton
                        sx={{ position: 'absolute', top: 20, right: 20, color: 'white' }}
                        onClick={() => setIsPhotoModalOpen(false)}
                    >
                        <CloseIcon fontSize="large" />
                    </IconButton>
                    <Box
                        component="img"
                        src={mainProfilePhoto}
                        sx={{
                            maxWidth: '90%',
                            maxHeight: '90vh',
                            borderRadius: 2,
                            boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                        }}
                    />
                </Box>
            )}
        </Box>
    );
}

