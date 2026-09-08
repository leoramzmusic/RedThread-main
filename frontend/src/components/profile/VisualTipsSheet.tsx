import React, { useRef, useState } from 'react';
import { Box, Button, Typography, useTheme, alpha } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import BottomSheet from '../shared/BottomSheet';

interface VisualTipsSheetProps {
    open: boolean;
    onClose: () => void;
}

const slides = [
    {
        title: "Usa fotos que muestren tu rostro",
        desc: "Los perfiles con fotos de cara suelen recibir más Likes.",
        ok: { src: "/tips/rostro-ok.jpg", label: "Cara OK" },
        ko: { src: "/tips/espalda-ko.jpg", label: "Espalda X" },
    },
    {
        title: "Bye bye a los filtros",
        desc: "Evita filtros exagerados. Usa fotos nítidas y recientes.",
        ok: { src: "/tips/natural-ok.jpg", label: "Natural OK" },
        ko: { src: "/tips/filtro-ko.jpg", label: "Filtro X" },
    },
    {
        title: "Muestra tus pasiones",
        desc: "Añade fotos que reflejen tus hobbies e intereses.",
        ok: { src: "/tips/hobby-ok.jpg", label: "Hobby OK" },
        ko: { src: "/tips/objeto-ko.jpg", label: "Objeto X" },
    },
];

const VisualTipsSheet: React.FC<VisualTipsSheetProps> = ({ open, onClose }) => {
    const theme = useTheme();
    const [index, setIndex] = useState(0);
    const startX = useRef(0);

    const goTo = (i: number) => setIndex(Math.max(0, Math.min(slides.length - 1, i)));
    const prev = () => goTo(index - 1);
    const next = () => goTo(index + 1);

    const onPointerDown = (e: React.TouchEvent | React.MouseEvent) => {
        startX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
    };

    const onPointerUp = (e: React.TouchEvent | React.MouseEvent) => {
        const endX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
        const deltaX = endX - startX.current;

        // Horizontal swipe navigation
        if (deltaX > 50) prev();
        else if (deltaX < -50) next();
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, isOk: boolean) => {
        // Fallback to a colored placeholder if image fails
        const target = e.currentTarget;
        target.style.display = 'none'; // Hide broken image
        target.parentElement!.style.backgroundColor = isOk
            ? alpha(theme.palette.success.main, 0.1)
            : alpha(theme.palette.error.main, 0.1);
    };

    return (
        <BottomSheet open={open} onClose={onClose} sx={{ transform: 'translateX(120px)' }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LightbulbIcon color="action" />
                <Typography variant="h6" fontWeight="bold">Tips para tus fotos</Typography>
            </Box>

            <Box
                sx={{
                    overflow: 'hidden',
                    width: '100%',
                    touchAction: 'none', // Allow parent handling of vertical drag
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' }
                }}
                onMouseDown={onPointerDown}
                onMouseUp={onPointerUp}
                onTouchStart={onPointerDown}
                onTouchEnd={onPointerUp}
            >
                <Box
                    sx={{
                        display: 'flex',
                        transition: 'transform 250ms ease-out',
                        transform: `translateX(-${index * 100}%)`,
                    }}
                >
                    {slides.map((s, i) => (
                        <Box
                            key={i}
                            sx={{
                                flex: '0 0 100%',
                                px: 0.5,
                                boxSizing: 'border-box'
                            }}
                        >
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>{s.title}</Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>{s.desc}</Typography>

                            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mb={1}>
                                {/* OK Example */}
                                <Box>
                                    <Box
                                        sx={{
                                            width: '100%',
                                            aspectRatio: '1/1',
                                            bgcolor: 'action.hover',
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            mb: 1,
                                            position: 'relative',
                                            border: '2px solid #ffffff',
                                        }}
                                    >
                                        <img
                                            src={s.ok.src}
                                            alt={s.ok.label}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => handleImageError(e, true)}
                                        />
                                    </Box>
                                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600, color: 'success.main' }}>
                                        ✓ {s.ok.label}
                                    </Typography>
                                </Box>

                                {/* KO Example */}
                                <Box>
                                    <Box
                                        sx={{
                                            width: '100%',
                                            aspectRatio: '1/1',
                                            bgcolor: 'action.hover',
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            mb: 1,
                                            position: 'relative',
                                            border: '2px solid #ffffff',
                                        }}
                                    >
                                        <img
                                            src={s.ko.src}
                                            alt={s.ko.label}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => handleImageError(e, false)}
                                        />
                                    </Box>
                                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600, color: 'error.main' }}>
                                        ✗ {s.ko.label}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Controls */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mt={3} mb={2}>
                <Button
                    onClick={prev}
                    disabled={index === 0}
                    variant="outlined"
                    size="small"
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        minWidth: 'auto',
                        px: 2,
                        color: 'text.primary',
                        borderColor: 'divider',
                        '&:hover': {
                            borderColor: 'text.primary',
                            bgcolor: 'action.hover'
                        }
                    }}
                >
                    Anterior
                </Button>

                <Box display="flex" gap={1}>
                    {slides.map((_, i) => (
                        <Box
                            key={i}
                            onClick={() => goTo(i)}
                            sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: i === index ? '#ff4d4f' : 'action.disabled',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                        />
                    ))}
                </Box>

                <Button
                    onClick={next}
                    disabled={index === slides.length - 1}
                    variant="outlined"
                    size="small"
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        minWidth: 'auto',
                        px: 2,
                        color: 'text.primary',
                        borderColor: 'divider',
                        '&:hover': {
                            borderColor: 'text.primary',
                            bgcolor: 'action.hover'
                        }
                    }}
                >
                    Siguiente
                </Button>
            </Box>

            <Button
                fullWidth
                variant="contained"
                onClick={onClose}
                sx={{
                    bgcolor: '#ff4d4f',
                    color: 'white',
                    borderRadius: 2,
                    py: 1.2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': {
                        bgcolor: '#d9363e',
                        boxShadow: 'none'
                    }
                }}
            >
                Entendido
            </Button>
        </BottomSheet>
    );
};

export default VisualTipsSheet;
