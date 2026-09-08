import React, { useState } from 'react';
import { Box, Button, Typography, Tooltip, Zoom, CircularProgress } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface BlindUnlockButtonProps {
    matchId: string;
    isReady: boolean; // Criteria met (msgs/time)
    unlockState: 'locked' | 'pending' | 'unlocked';
    onUnlock: () => Promise<void>;
}

export default function BlindUnlockButton({
    matchId,
    isReady,
    unlockState,
    onUnlock
}: BlindUnlockButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleUnlock = async () => {
        try {
            setLoading(true);
            await onUnlock();
        } finally {
            setLoading(false);
        }
    };

    if (unlockState === 'unlocked') {
        return null; // Don't show anything if already unlocked (or show a small "Unlocked" badge?)
        // Or we could show a "Profile Visible" indicator
    }

    return (
        <Box sx={{ width: '100%', px: 2, py: 1, bgcolor: 'rgba(0,0,0,0.2)' }}>
            {/* State: Locked but Ready */}
            {isReady && unlockState === 'locked' && (
                <Zoom in={true}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                            ¡Han conversado lo suficiente!
                        </Typography>
                        <Tooltip title="Revelar información pública y fotos. Requiere que ambos acepten.">
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<LockOpenIcon />}
                                onClick={handleUnlock}
                                disabled={loading}
                                sx={{
                                    background: 'linear-gradient(45deg, #9C27B0 30%, #E1BEE7 90%)',
                                    color: 'white',
                                    fontWeight: 700
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : "Mostrar mi Perfil"}
                            </Button>
                        </Tooltip>
                    </Box>
                </Zoom>
            )}

            {/* State: Pending (I clicked, waiting for them) */}
            {unlockState === 'pending' && (
                <Box display="flex" alignItems="center" justifyContent="center" gap={1} p={1} bgcolor="rgba(156, 39, 176, 0.1)" borderRadius={2}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="body2" fontWeight={600} color="secondary.main">
                        Esperando a tu match...
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        (Tu info se revelará cuando ell/el acepte)
                    </Typography>
                </Box>
            )}

            {/* State: Locked and NOT Ready */}
            {!isReady && unlockState === 'locked' && (
                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                    <LockIcon fontSize="small" color="disabled" />
                    <Typography variant="caption" color="text.disabled" fontStyle="italic">
                        Conversa más para desbloquear fotos...
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
