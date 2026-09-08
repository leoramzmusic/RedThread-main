import React, { useState, useRef } from 'react';
import { Box, IconButton, Card, CardMedia, Typography, Tooltip } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Profile } from '../../profile/ProfileCard';
import { InteractionMode } from '../InteractionSettingsDialog';
import ProfileDetailModal from '../ProfileDetailModal';

interface CarouselLayoutProps {
    profiles: Profile[];
    onProfileAction: (profileId: string, action: 'like' | 'pass' | 'superlike') => void;
    isPremium: boolean;
    isBlind: boolean;
    isCurious: boolean;
    interactionMode: InteractionMode;
}

export default function CarouselLayout({
    profiles,
    onProfileAction,
    isPremium,
    isBlind,
    isCurious,
    interactionMode
}: CarouselLayoutProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleNext = () => {
        if (currentIndex < profiles.length - 1) {
            setCurrentIndex(currentIndex + 1);
            scrollToIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            scrollToIndex(currentIndex - 1);
        }
    };

    const scrollToIndex = (index: number) => {
        if (scrollContainerRef.current) {
            const cardWidth = 320; // Card width + gap
            scrollContainerRef.current.scrollTo({
                left: index * cardWidth,
                behavior: 'smooth'
            });
        }
    };

    const handleOpenDetail = (profile: Profile, index: number) => {
        setSelectedProfile(profile);
        setCurrentIndex(index);
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

    const handleModalNext = () => {
        if (currentIndex < profiles.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            setSelectedProfile(profiles[nextIndex]);
        }
    };

    const handleModalPrevious = () => {
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            setSelectedProfile(profiles[prevIndex]);
        }
    };

    const getCompatibilityColor = (score: number) => {
        if (score > 70) return '#4CAF50';
        if (score > 30) return '#FF9800';
        return '#F44336';
    };

    return (
        <Box sx={{ width: '100%', position: 'relative' }}>
            {/* Navigation Buttons */}
            <IconButton
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                sx={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                    '&:disabled': { opacity: 0.3 }
                }}
            >
                <ArrowBackIosNewIcon />
            </IconButton>

            <IconButton
                onClick={handleNext}
                disabled={currentIndex === profiles.length - 1}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                    '&:disabled': { opacity: 0.3 }
                }}
            >
                <ArrowForwardIosIcon />
            </IconButton>

            {/* Carousel Container */}
            <Box
                ref={scrollContainerRef}
                sx={{
                    display: 'flex',
                    gap: 2,
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    scrollBehavior: 'smooth',
                    py: 2,
                    px: 6,
                    '&::-webkit-scrollbar': {
                        height: 8
                    },
                    '&::-webkit-scrollbar-track': {
                        bgcolor: 'rgba(255,255,255,0.05)',
                        borderRadius: 4
                    },
                    '&::-webkit-scrollbar-thumb': {
                        bgcolor: 'rgba(255,255,255,0.2)',
                        borderRadius: 4,
                        '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.3)'
                        }
                    }
                }}
            >
                {profiles.map((profile, index) => (
                    <Card
                        key={profile.user_id}
                        onClick={() => handleOpenDetail(profile, index)}
                        sx={{
                            minWidth: 300,
                            maxWidth: 300,
                            height: 450,
                            scrollSnapAlign: 'center',
                            cursor: 'pointer',
                            borderRadius: 4,
                            overflow: 'hidden',
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            transform: currentIndex === index ? 'scale(1.05)' : 'scale(0.95)',
                            opacity: currentIndex === index ? 1 : 0.6,
                            border: currentIndex === index ? '3px solid' : '1px solid',
                            borderColor: currentIndex === index ? 'primary.main' : 'rgba(255,255,255,0.1)',
                            '&:hover': {
                                transform: 'scale(1.05)',
                                opacity: 1,
                                boxShadow: '0 12px 24px rgba(0,0,0,0.4)'
                            }
                        }}
                    >
                        {/* Photo */}
                        <CardMedia
                            component="img"
                            image={profile.photos?.[0] || 'https://via.placeholder.com/300x450?text=No+Photo'}
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
                                height: '40%',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0) 100%)',
                                pointerEvents: 'none'
                            }}
                        />

                        {/* Compatibility Badge */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: 'rgba(0,0,0,0.7)',
                                border: `3px solid ${getCompatibilityColor(profile.affinity_score || 0)}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Typography
                                variant="caption"
                                fontWeight={800}
                                sx={{
                                    color: getCompatibilityColor(profile.affinity_score || 0),
                                    fontSize: '0.7rem'
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
                                p: 2,
                                color: 'white',
                                zIndex: 2
                            }}
                        >
                            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                                {profile.display_name}, {profile.age}
                            </Typography>
                            {profile.bio && (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: 'rgba(255,255,255,0.8)',
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
                            {profile.distance_km && (
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5, display: 'block' }}>
                                    📍 {Math.round(profile.distance_km)} km
                                </Typography>
                            )}
                        </Box>
                    </Card>
                ))}
            </Box>

            {/* Progress Indicator */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                {profiles.map((_, index) => (
                    <Box
                        key={index}
                        onClick={() => {
                            setCurrentIndex(index);
                            scrollToIndex(index);
                        }}
                        sx={{
                            width: currentIndex === index ? 24 : 8,
                            height: 8,
                            borderRadius: 4,
                            bgcolor: currentIndex === index ? 'primary.main' : 'rgba(255,255,255,0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                bgcolor: currentIndex === index ? 'primary.dark' : 'rgba(255,255,255,0.4)'
                            }
                        }}
                    />
                ))}
            </Box>

            {/* Detail Modal */}
            <ProfileDetailModal
                open={!!selectedProfile}
                profile={selectedProfile}
                onClose={handleCloseDetail}
                onLike={() => handleAction('like')}
                onPass={() => handleAction('pass')}
                onSuperLike={() => handleAction('superlike')}
                onNext={currentIndex < profiles.length - 1 ? handleModalNext : undefined}
                onPrevious={currentIndex > 0 ? handleModalPrevious : undefined}
                isPremium={isPremium}
                isBlind={isBlind}
                isCurious={isCurious}
                interactionMode={interactionMode}
            />
        </Box>
    );
}
