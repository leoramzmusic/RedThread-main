import React, { useState } from 'react';
import { Box, Card, Typography, Fade } from '@mui/material';
import { Profile } from '../../profile/ProfileCard';
import { InteractionMode } from '../InteractionSettingsDialog';
import ProfileDetailModal from '../ProfileDetailModal';
import ParallaxImage from '../../motion/ParallaxImage';

interface GridLayoutProps {
    profiles: Profile[];
    onProfileAction: (profileId: string, action: 'like' | 'pass' | 'superlike') => void;
    isPremium: boolean;
    isBlind: boolean;
    isCurious: boolean;
    interactionMode: InteractionMode;
}

export default function GridLayout({
    profiles,
    onProfileAction,
    isPremium,
    isBlind,
    isCurious,
    interactionMode
}: GridLayoutProps) {
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
            {/* Masonry Grid */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: 'repeat(2, 1fr)',
                        sm: 'repeat(3, 1fr)',
                        md: 'repeat(4, 1fr)'
                    },
                    gap: 2,
                    gridAutoFlow: 'dense'
                }}
            >
                {profiles.map((profile, index) => {
                    // Vary card heights for masonry effect
                    const isLarge = index % 5 === 0;
                    const isMedium = index % 3 === 0;

                    return (
                        <Fade in timeout={300 + index * 30} key={profile.user_id}>
                            <Card
                                onClick={() => handleOpenDetail(profile, index)}
                                sx={{
                                    position: 'relative',
                                    cursor: 'pointer',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    gridRow: isLarge ? 'span 2' : isMedium ? 'span 1.5' : 'span 1',
                                    aspectRatio: isLarge ? '3/5' : isMedium ? '3/4.5' : '3/4',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'scale(1.03)',
                                        boxShadow: '0 12px 24px rgba(0,0,0,0.5)',
                                        zIndex: 10,
                                        '& .hover-overlay': {
                                            opacity: 1
                                        }
                                    }
                                }}
                            >
                                {/* Photo */}
                                <ParallaxImage
                                    src={profile.photos?.[0] || 'https://via.placeholder.com/300x400?text=No+Photo'}
                                    alt={profile.display_name || 'Profile'}
                                    intensity={0.08}
                                    drift={4}
                                    frameSx={{ height: '100%', width: '100%' }}
                                />

                                {/* Hover Overlay */}
                                <Box
                                    className="hover-overlay"
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)',
                                        opacity: 0,
                                        transition: 'opacity 0.3s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'flex-end',
                                        p: 2
                                    }}
                                >
                                    <Typography variant="h6" fontWeight={700} color="white" sx={{ lineHeight: 1.2 }}>
                                        {profile.display_name}, {profile.age}
                                    </Typography>
                                    {profile.bio && (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: 'rgba(255,255,255,0.9)',
                                                mt: 0.5,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical'
                                            }}
                                        >
                                            {profile.bio}
                                        </Typography>
                                    )}
                                    {profile.interests && profile.interests.length > 0 && (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                            {profile.interests.slice(0, 3).map((interest, idx) => (
                                                <Typography
                                                    key={idx}
                                                    variant="caption"
                                                    sx={{
                                                        bgcolor: 'rgba(255,255,255,0.2)',
                                                        px: 1,
                                                        py: 0.25,
                                                        borderRadius: 1,
                                                        color: 'white',
                                                        fontSize: '0.65rem'
                                                    }}
                                                >
                                                    {interest}
                                                </Typography>
                                            ))}
                                        </Box>
                                    )}
                                </Box>

                                {/* Compatibility Badge */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        bgcolor: 'rgba(0,0,0,0.8)',
                                        border: `2px solid ${getCompatibilityColor(profile.affinity_score || 0)}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 5
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        fontWeight={700}
                                        sx={{
                                            color: getCompatibilityColor(profile.affinity_score || 0),
                                            fontSize: '0.6rem'
                                        }}
                                    >
                                        {Math.round(profile.affinity_score || 0)}%
                                    </Typography>
                                </Box>

                                {/* Online Indicator */}
                                {profile.online_status && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            left: 8,
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            bgcolor: '#4CAF50',
                                            border: '2px solid white',
                                            boxShadow: '0 0 8px rgba(76, 175, 80, 0.8)',
                                            zIndex: 5
                                        }}
                                    />
                                )}

                                {/* Quick Info (always visible) */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        p: 1,
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                                        color: 'white'
                                    }}
                                >
                                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                                        {profile.display_name}, {profile.age}
                                    </Typography>
                                </Box>
                            </Card>
                        </Fade>
                    );
                })}
            </Box>

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
