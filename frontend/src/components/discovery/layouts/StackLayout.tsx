import React from 'react';
import { Box } from '@mui/material';
import ProfileCard, { Profile } from '../../profile/ProfileCard';
import { InteractionMode } from '../InteractionSettingsDialog';

interface StackLayoutProps {
    profiles: Profile[];
    currentIndex: number;
    onLike: () => void;
    onPass: () => void;
    onSuperLike: () => void;
    onUndo?: () => void;
    onVIPMessage?: () => void;
    isPremium: boolean;
    isBlind: boolean;
    isCurious: boolean;
    interactionMode: InteractionMode;
}

export default function StackLayout({
    profiles,
    currentIndex,
    onLike,
    onPass,
    onSuperLike,
    onUndo,
    onVIPMessage,
    isPremium,
    isBlind,
    isCurious,
    interactionMode
}: StackLayoutProps) {
    if (profiles.length === 0 || currentIndex >= profiles.length) {
        return null;
    }

    const currentProfile = profiles[currentIndex];

    return (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ProfileCard
                profile={currentProfile}
                onLike={onLike}
                onPass={onPass}
                onSuperLike={onSuperLike}
                onUndo={onUndo}
                onVIPMessage={onVIPMessage}
                isPremium={isPremium}
                isBlind={isBlind}
                isCurious={isCurious}
                interactionMode={interactionMode}
            />
        </Box>
    );
}
