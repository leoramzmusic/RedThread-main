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
                className: 'modal-container',
                sx: {
                    borderRadius: '12px',
                    maxWidth: 600,
                    width: { xs: '92%', sm: '600px' },
                    mx: 'auto',
                    mt: { xs: 2, md: 4 },
                    bgcolor: 'rgba(15,15,15,0.92)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 0 16px rgba(255,0,0,0.25)',
                    overflow: 'hidden',
                    animation: 'liquidFade 0.4s ease',
                    '@keyframes liquidFade': {
                        from: { transform: 'scale(0.95)', opacity: 0 },
                        to: { transform: 'scale(1)', opacity: 1 },
                    },
                    '@media (max-width: 1024px)': {
                        transform: 'none !important',
                    },
                    '@media (min-width:768px) and (max-width:1366px) and (orientation: portrait)': {
                        width: '70% !important',
                        maxWidth: '70% !important',
                        mx: 'auto !important',
                        marginTop: '10rem !important',
                        transform: 'none !important',
                        pt: '0.75rem !important',
                        pb: '0.75rem !important',
                        maxHeight: '60vh !important',
                        height: 'auto !important',
                    },
                    '@media (min-width:768px) and (max-width:1366px) and (orientation: landscape)': {
                        width: '70% !important',
                        maxWidth: '70% !important',
                        mx: 'auto !important',
                        margin: 'auto !important',
                        transform: 'none !important',
                        pt: '1rem !important',
                        pb: '1rem !important',
                    },
                    '@media (max-width:767px) and (orientation: portrait)': {
                        width: '92% !important',
                        maxWidth: '92% !important',
                        mx: 'auto !important',
                        marginTop: '2rem !important',
                        transform: 'none !important',
                    },
                    '@media (max-width:767px) and (orientation: landscape)': {
                        width: '85% !important',
                        maxWidth: '85% !important',
                        mx: 'auto !important',
                        marginTop: '1rem !important',
                        transform: 'none !important',
                    },
                },
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="center" p={2} pb={1}>
                <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                        color: 'white',
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: 'clamp(1rem, 4vw, 1.2rem)',
                        textAlign: 'center',
                        flexGrow: 1,
                    }}
                >
                    {isRecharging ? '⚡ Recargar Batería' : '🔋 Tempotalizador'}
                </Typography>
                <IconButton onClick={onClose} sx={{ color: 'text.secondary', ml: 1 }}>
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
                        {/* Personality Tuner */}
                        <Box
                            sx={{
                                mb: 2,
                                p: 1.5,
                                bgcolor: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
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
                            size="large"
                            startIcon={<BatteryChargingFullIcon />}
                            onClick={() => {
                                onRecharge(maxBattery);
                                onClose();
                            }}
                            sx={{
                                py: 1,
                                px: 2,
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                background: 'linear-gradient(90deg, #AB47BC, #D32F2F)',
                                color: '#fff',
                                boxShadow: '0 2px 8px rgba(171,71,188,0.3)',
                                textTransform: 'none',
                                transition: 'box-shadow 0.3s ease',
                                '&:hover': {
                                    background: 'linear-gradient(90deg, #AB47BC, #D32F2F)',
                                    boxShadow: '0 0 8px rgba(171,71,188,0.6)',
                                },
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
                        <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            sx={{
                                color: 'white',
                                mb: 1.5,
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: 'clamp(0.9rem, 3vw, 1rem)',
                                textAlign: 'center',
                            }}
                        >
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
                                            gap: 0.8,
                                            py: 1,
                                            px: 1,
                                            borderRadius: '6px',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            color: 'text.primary',
                                            textTransform: 'none',
                                            fontSize: '0.85rem',
                                            transition: 'box-shadow 0.3s ease, border-color 0.2s ease, background-color 0.2s ease',
                                            '&:hover': {
                                                borderColor: '#AB47BC',
                                                bgcolor: 'rgba(171,71,188,0.08)',
                                                boxShadow: '0 0 8px rgba(171,71,188,0.6)',
                                            },
                                        }}
                                    >
                                        {option.icon}
                                        <Box textAlign="center">
                                            <Typography
                                                variant="body2"
                                                fontWeight={700}
                                                sx={{
                                                    fontFamily: "'Poppins', sans-serif",
                                                    fontSize: 'clamp(0.85rem, 3vw, 0.95rem)',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {option.label}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                {option.phrase}
                                            </Typography>
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
