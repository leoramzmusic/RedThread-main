import React, { useState } from 'react';
import { Dialog, DialogContent, Box, Typography, Grid, Button, IconButton, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SnoozeIcon from '@mui/icons-material/Snooze';
import HotelIcon from '@mui/icons-material/Hotel';
import NoMeetingRoomIcon from '@mui/icons-material/NoMeetingRoom';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';

interface TimeOutModalProps {
    open: boolean;
    onClose: () => void;
    onSetTimeOut: (hours: number) => void;
    onRecharge: (amount: number) => void;
    currentBattery: number;
    userPersonality?: string;
}

export default function TimeOutModal({ open, onClose, onSetTimeOut, onRecharge, currentBattery, userPersonality }: TimeOutModalProps) {
    const [personalityType, setPersonalityType] = useState<'introvert' | 'ambivert' | 'extrovert'>(
        (userPersonality as 'introvert' | 'ambivert' | 'extrovert') || 'introvert'
    );

    // Personality Logic
    const getMaxBattery = (type: string) => {
        switch (type) {
            case 'introvert': return 80;
            case 'ambivert': return 90;
            case 'extrovert': return 100;
            default: return 100;
        }
    };

    const maxBattery = getMaxBattery(personalityType);

    // If battery is 0 (or very low), we assume user is "Coming Back"
    const isRecharging = currentBattery === 0;

    const timeoutOptions = [
        { label: "1h: Mini siesta", hours: 1, icon: <AccessTimeIcon />, phrase: "Ahorita regreso" },
        { label: "2h: Ya me engenté", hours: 2, icon: <SnoozeIcon />, phrase: "Necesito aire" },
        { label: "12h: Ansiedad on", hours: 12, icon: <HotelIcon />, phrase: "Nos vemos mañana" },
        { label: "24h: Voy a mimir", hours: 24, icon: <NoMeetingRoomIcon />, phrase: "Modo cueva activado" },
    ];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { borderRadius: 4, maxWidth: 400, width: '100%', bgcolor: '#1e1e1e' }
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="center" p={2} pb={0}>
                <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>
                    {isRecharging ? "⚡ Recargar Batería" : "🔋 Tempotalizador"}
                </Typography>
                <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent>
                <Box textAlign="center" mb={3}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {isRecharging ? "¡Bienvenido de vuelta!" : "Nivel actual de energía social:"}
                    </Typography>

                    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="h3" fontWeight={800} color={currentBattery < 30 ? '#FF5252' : '#4CAF50'}>
                            {currentBattery}%
                        </Typography>
                        {isRecharging && (
                            <Typography variant="h5" color="text.secondary" sx={{ ml: 1, opacity: 0.5 }}>
                                / {maxBattery}%
                            </Typography>
                        )}
                    </Box>

                    <Typography variant="caption" display="block" fontStyle="italic" color="text.disabled" mt={1}>
                        {currentBattery < 30
                            ? (isRecharging ? "¿Listo para socializar?" : "Ya anda medio Cheems...")
                            : "Andamos al 100"}
                    </Typography>
                </Box>

                {isRecharging ? (
                    <Box>
                        {/* Personality Tuner (Mock for Demo) */}
                        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                            <Typography variant="caption" color="text.secondary" gutterBottom>
                                Calibrando tu batería social:
                            </Typography>
                            <Box display="flex" justifyContent="center" gap={1} mt={1}>
                                {['introvert', 'ambivert', 'extrovert'].map((type) => (
                                    <Chip
                                        key={type}
                                        label={type === 'introvert' ? 'Introvertido' : type === 'ambivert' ? 'Ambivertido' : 'Extrovertido'}
                                        onClick={() => setPersonalityType(type as any)}
                                        color={personalityType === type ? 'primary' : 'default'}
                                        variant={personalityType === type ? 'filled' : 'outlined'}
                                        size="small"
                                        clickable
                                    />
                                ))}
                            </Box>
                            <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                                Límite Máximo: {getMaxBattery(personalityType)}%
                            </Typography>
                        </Box>

                        <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            size="large"
                            startIcon={<BatteryChargingFullIcon />}
                            onClick={() => {
                                onRecharge(maxBattery);
                                onClose();
                            }}
                            sx={{
                                py: 2,
                                borderRadius: 3,
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                boxShadow: '0 4px 14px rgba(76, 175, 80, 0.4)'
                            }}
                        >
                            ¡Ya regresé! (Recargar)
                        </Button>
                        <Button
                            fullWidth
                            variant="text"
                            color="inherit"
                            sx={{ mt: 1 }}
                            onClick={() => {
                                onRecharge(20); // Small boost
                                onClose();
                            }}
                        >
                            Solo un ratito (+20%)
                        </Button>
                    </Box>
                ) : (
                    <>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'white', mb: 2 }}>
                            ¿Cuánto tiempo necesitas?
                        </Typography>

                        <Grid container spacing={2}>
                            {timeoutOptions.map((option) => (
                                <Grid item xs={6} key={option.hours}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={() => {
                                            onSetTimeOut(option.hours);
                                            onClose();
                                        }}
                                        sx={{
                                            height: '100%',
                                            flexDirection: 'column',
                                            gap: 1,
                                            py: 2,
                                            borderRadius: 3,
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            color: 'text.primary',
                                            textTransform: 'none',
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                bgcolor: 'rgba(255,255,255,0.05)'
                                            }
                                        }}
                                    >
                                        {option.icon}
                                        <Box textAlign="center">
                                            <Typography variant="body2" fontWeight={700}>{option.label}</Typography>
                                            <Typography variant="caption" color="text.secondary">{option.phrase}</Typography>
                                        </Box>
                                    </Button>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
