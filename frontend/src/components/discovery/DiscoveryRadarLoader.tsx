import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { keyframes } from '@emotion/react';

// Keyframes for the pulsing radar effect
const pulse = keyframes`
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 64, 129, 0.7);
    opacity: 1;
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 60px rgba(255, 64, 129, 0);
    opacity: 0;
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 64, 129, 0);
    opacity: 1;
  }
`;

const ripple = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.8;
    border-width: 4px;
  }
  100% {
    transform: scale(4);
    opacity: 0;
    border-width: 0px;
  }
`;

interface DiscoveryRadarLoaderProps {
    userImage?: string;
    message?: string;
}

export default function DiscoveryRadarLoader({
    userImage,
    message = "Encontrando personas cerca de ti..."
}: DiscoveryRadarLoaderProps) {

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh', // Takes up significant vertical space
                width: '100%',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                {/* Animated Rings */}
                {[0, 1, 2].map((i) => (
                    <Box
                        key={i}
                        sx={{
                            position: 'absolute',
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            border: '2px solid rgba(255, 64, 129, 0.5)',
                            animation: `${ripple} 3s infinite cubic-bezier(0, 0.2, 0.8, 1)`,
                            animationDelay: `${i * 1}s`,
                            opacity: 0,
                        }}
                    />
                ))}

                {/* Central Profile Image with Glow */}
                <Box
                    sx={{
                        position: 'relative',
                        zIndex: 10,
                        borderRadius: '50%',
                        padding: '4px',
                        background: 'linear-gradient(45deg, #FF4081 30%, #FF80AB 90%)',
                        boxShadow: '0 0 20px rgba(255, 64, 129, 0.6)',
                    }}
                >
                    <Avatar
                        src={userImage}
                        alt="My Profile"
                        sx={{
                            width: 96,
                            height: 96,
                            border: '4px solid #1a1a1a', // Match dark background
                        }}
                    />
                </Box>
            </Box>

            <Typography
                variant="body1"
                sx={{
                    mt: 8,
                    color: 'text.secondary',
                    fontWeight: 500,
                    animation: `${pulse} 2s infinite ease-in-out`,
                    opacity: 0.8,
                    textAlign: 'center'
                }}
            >
                {message}
            </Typography>
        </Box>
    );
}
