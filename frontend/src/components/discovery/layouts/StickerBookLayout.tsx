import React, { useState } from 'react';
import { Box, Grid, Card, CardMedia, Typography, IconButton, Tooltip, Fade } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import { Profile } from '../../profile/ProfileCard';
import { InteractionMode } from '../InteractionSettingsDialog';
import ProfileDetailModal from '../ProfileDetailModal';

interface StickerBookLayoutProps {
    profiles: Profile[];
    onProfileAction: (profileId: string, action: 'like' | 'pass' | 'superlike') => void;
    isPremium: boolean;
    isBlind: boolean;
    isCurious: boolean;
    interactionMode: InteractionMode;
}

export default function StickerBookLayout({
    profiles,
    onProfileAction,
    isPremium,
    isBlind,
    isCurious,
    interactionMode
}: StickerBookLayoutProps) {
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    const handleOpenDetail = (profile: Profile, index: number) => {
        setSelectedProfile(profile);
        setSelectedIndex(index);
    };

    const handleCloseDetail = () => {
        setSelectedProfile(null);
    };

    const handleAction = (action: 'like' | 'pass' | 'superlike') => {
        if (selectedProfile) {
            onProfileAction(selectedProfile.user_id, action);
            handleCloseDetail();
        }
    };

    const handleNext = () => {
        if (selectedIndex < profiles.length - 1) {
            const nextIndex = selectedIndex + 1;
            setSelectedIndex(nextIndex);
            setSelectedProfile(profiles[nextIndex]);
        }
    };

    const handlePrevious = () => {
        if (selectedIndex > 0) {
            const prevIndex = selectedIndex - 1;
            setSelectedIndex(prevIndex);
            setSelectedProfile(profiles[prevIndex]);
        }
    };

    const getCompatibilityColor = (score: number) => {
        if (score > 70) return '#4CAF50';
        if (score > 30) return '#FF9800';
        return '#F44336';
    };

    return (
        <Box sx={{ width: '100%', px: 2 }}>
            <Grid container spacing={2}>
                {profiles.map((profile, index) => (
                    <Grid item xs={6} sm={4} key={profile.user_id}>
                        <Fade in timeout={300 + index * 50}>
                            <Card
                                onClick={() => handleOpenDetail(profile, index)}
                                sx={{
                                    position: 'relative',
                                    cursor: 'pointer',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    aspectRatio: '3/4',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-8px) scale(1.02)',
                                        boxShadow: '0 12px 24px rgba(0,0,0,0.4)',
                                        '& .quick-actions': {
                                            opacity: 1
                                        }
                                    }
                                }}
                            >
                                {/* Photo */}
                                <CardMedia
                                    component="img"
                                    image={profile.photos?.[0] || 'https://via.placeholder.com/300x400?text=No+Photo'}
                                    sx={{
                                        height: '100%',
                                        width: '100%',
                                        objectFit: 'cover'
                                    }}
                                />

                                {/* Gradient Overlay */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: '50%',
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
                                        pointerEvents: 'none'
                                    }}
                                />

                                {/* Compatibility Badge */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        bgcolor: 'rgba(0,0,0,0.7)',
                                        border: `2px solid ${getCompatibilityColor(profile.affinity_score || 0)}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        fontWeight={700}
                                        sx={{
                                            color: getCompatibilityColor(profile.affinity_score || 0),
                                            fontSize: '0.65rem'
                                        }}
                                    >
                                        {Math.round(profile.affinity_score || 0)}%
                                    </Typography>
                                </Box>

                                {/* Profile Info */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        p: 1.5,
                                        color: 'white',
                                        zIndex: 2
                                    }}
                                >
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                                        {profile.display_name}, {profile.age}
                                    </Typography>
                                    {profile.distance_km && (
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                            {Math.round(profile.distance_km)} km
                                        </Typography>
                                    )}
                                </Box>

                                {/* Quick Actions (on hover) */}
                                <Box
                                    className="quick-actions"
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        display: 'flex',
                                        gap: 1,
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        zIndex: 3
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Tooltip title="Pass">
                                        <IconButton
                                            onClick={() => onProfileAction(profile.user_id, 'pass')}
                                            sx={{
                                                bgcolor: 'rgba(244, 67, 54, 0.9)',
                                                color: 'white',
                                                '&:hover': { bgcolor: '#F44336' }
                                            }}
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Like">
                                        <IconButton
                                            onClick={() => onProfileAction(profile.user_id, 'like')}
                                            sx={{
                                                bgcolor: 'rgba(76, 175, 80, 0.9)',
                                                color: 'white',
                                                '&:hover': { bgcolor: '#4CAF50' }
                                            }}
                                        >
                                            <FavoriteIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Superlike">
                                        <IconButton
                                            onClick={() => onProfileAction(profile.user_id, 'superlike')}
                                            sx={{
                                                bgcolor: 'rgba(33, 150, 243, 0.9)',
                                                color: 'white',
                                                '&:hover': { bgcolor: '#2196F3' }
                                            }}
                                        >
                                            <StarIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Card>
                        </Fade>
                    </Grid>
                ))}
            </Grid>

            {/* Detail Modal */}
            <ProfileDetailModal
                open={!!selectedProfile}
                profile={selectedProfile}
                onClose={handleCloseDetail}
                onLike={() => handleAction('like')}
                onPass={() => handleAction('pass')}
                onSuperLike={() => handleAction('superlike')}
                onNext={selectedIndex < profiles.length - 1 ? handleNext : undefined}
                onPrevious={selectedIndex > 0 ? handlePrevious : undefined}
                isPremium={isPremium}
                isBlind={isBlind}
                isCurious={isCurious}
                interactionMode={interactionMode}
            />
        </Box>
    );
}
