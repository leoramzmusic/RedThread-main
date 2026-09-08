import React from 'react';
import { Dialog, IconButton, Box, Fade } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ProfileCard, { Profile } from '../profile/ProfileCard';
import { InteractionMode } from './InteractionSettingsDialog';

interface ProfileDetailModalProps {
    open: boolean;
    profile: Profile | null;
    onClose: () => void;
    onLike: () => void;
    onPass: () => void;
    onSuperLike: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    isPremium: boolean;
    isBlind: boolean;
    isCurious: boolean;
    interactionMode: InteractionMode;
}

export default function ProfileDetailModal({
    open,
    profile,
    onClose,
    onLike,
    onPass,
    onSuperLike,
    onNext,
    onPrevious,
    isPremium,
    isBlind,
    isCurious,
    interactionMode
}: ProfileDetailModalProps) {
    if (!profile) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            TransitionComponent={Fade}
            PaperProps={{
                sx: {
                    bgcolor: 'background.default',
                    backgroundImage: 'none'
                }
            }}
        >
            {/* Close Button */}
            <IconButton
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1400,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                }}
            >
                <CloseIcon />
            </IconButton>

            {/* Previous Button */}
            {onPrevious && (
                <IconButton
                    onClick={onPrevious}
                    sx={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1400,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                    }}
                >
                    <ArrowBackIosNewIcon />
                </IconButton>
            )}

            {/* Next Button */}
            {onNext && (
                <IconButton
                    onClick={onNext}
                    sx={{
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1400,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                    }}
                >
                    <ArrowForwardIosIcon />
                </IconButton>
            )}

            {/* Profile Card */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    p: 2
                }}
            >
                <ProfileCard
                    profile={profile}
                    onLike={onLike}
                    onPass={onPass}
                    onSuperLike={onSuperLike}
                    isPremium={isPremium}
                    isBlind={isBlind}
                    isCurious={isCurious}
                    interactionMode={interactionMode}
                />
            </Box>
        </Dialog>
    );
}
