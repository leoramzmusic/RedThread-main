import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Fade
} from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface BoostActivationModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    careMessage: string;
    tier: 'free' | 'premium' | 'vip';
    availableBoosts: number;
}

export default function BoostActivationModal({
    open,
    onClose,
    onConfirm,
    careMessage,
    tier,
    availableBoosts
}: BoostActivationModalProps) {

    const getTierColor = () => {
        switch (tier) {
            case 'vip': return '#FFD700';
            case 'premium': return '#9C27B0';
            default: return '#69F0AE';
        }
    };

    const tierColor = getTierColor();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            TransitionComponent={Fade}
            PaperProps={{
                sx: {
                    bgcolor: 'background.paper',
                    borderRadius: 4,
                    border: `2px solid ${tierColor}40`,
                    boxShadow: `0 0 40px ${tierColor}30`
                }
            }}
        >
            <DialogTitle sx={{
                textAlign: 'center',
                pt: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
            }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: tierColor
                }}>
                    <BoltIcon sx={{ fontSize: '2rem' }} />
                    <Typography variant="h5" fontWeight={800}>
                        Activar Boost
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ textAlign: 'center', px: 4, py: 3 }}>
                {/* CARE Emotional Message */}
                <Box sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: 3,
                    bgcolor: `${tierColor}10`,
                    border: `1px solid ${tierColor}30`
                }}>
                    <AutoAwesomeIcon sx={{ color: tierColor, mb: 1, fontSize: '1.5rem' }} />
                    <Typography
                        variant="body1"
                        sx={{
                            fontStyle: 'italic',
                            color: 'text.primary',
                            lineHeight: 1.6
                        }}
                    >
                        "{careMessage}"
                    </Typography>
                </Box>

                {/* Boost Details */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Tu perfil será prioritario en Discover, Radar y Ruleta durante <strong>30 minutos</strong>.
                </Typography>

                <Typography variant="caption" color="text.disabled">
                    Boosts disponibles: <strong>{availableBoosts}</strong>
                </Typography>
            </DialogContent>

            <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 600
                    }}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    startIcon={<BoltIcon />}
                    sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: tierColor,
                        color: tier === 'vip' ? '#000' : '#fff',
                        '&:hover': {
                            bgcolor: tierColor,
                            filter: 'brightness(1.1)'
                        }
                    }}
                >
                    Activar Boost
                </Button>
            </DialogActions>
        </Dialog>
    );
}
