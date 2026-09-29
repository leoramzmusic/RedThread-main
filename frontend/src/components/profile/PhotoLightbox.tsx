import React, { useCallback, useEffect, useState } from 'react';
import { Box, Dialog, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface PhotoLightboxProps {
    open: boolean;
    photos: string[];
    initialIndex?: number;
    onClose: () => void;
}

/**
 * Fullscreen photo viewer: click any photo to open, swipe (touch), arrow
 * keys or side buttons to navigate, Esc to close.
 *
 * The content lives inside the Dialog so it unmounts on close — index state
 * resets to `initialIndex` on every open without needing an effect.
 */
function LightboxContent({
    photos,
    initialIndex,
    onClose
}: {
    photos: string[];
    initialIndex: number;
    onClose: () => void;
}) {
    const [index, setIndex] = useState(initialIndex);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);

    const prev = useCallback(
        () => setIndex((i) => (i - 1 + photos.length) % photos.length),
        [photos.length]
    );
    const next = useCallback(
        () => setIndex((i) => (i + 1) % photos.length),
        [photos.length]
    );

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, prev, next]);

    return (
        <>
            {/* Image + swipe area */}
            <Box
                onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                onTouchEnd={(e) => {
                    if (touchStartX === null) return;
                    const dx = e.changedTouches[0].clientX - touchStartX;
                    if (Math.abs(dx) > 40) {
                        if (dx > 0) prev();
                        else next();
                    }
                    setTouchStartX(null);
                }}
                sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: { xs: 1, sm: 4 }
                }}
            >
                <Box
                    component="img"
                    src={photos[index]}
                    alt=""
                    draggable={false}
                    sx={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        userSelect: 'none'
                    }}
                />
            </Box>

            {/* Close */}
            <IconButton
                onClick={onClose}
                aria-label="Cerrar"
                sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.4)',
                    zIndex: 2,
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
                }}
            >
                <CloseIcon />
            </IconButton>

            {/* Counter */}
            <Typography
                sx={{
                    position: 'absolute',
                    bottom: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '999px',
                    fontSize: 14,
                    zIndex: 2
                }}
            >
                {index + 1} / {photos.length}
            </Typography>

            {/* Prev / Next */}
            {photos.length > 1 && (
                <>
                    <IconButton
                        onClick={prev}
                        aria-label="Foto anterior"
                        sx={{
                            position: 'absolute',
                            left: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'white',
                            bgcolor: 'rgba(0,0,0,0.4)',
                            zIndex: 2,
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
                        }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                    <IconButton
                        onClick={next}
                        aria-label="Foto siguiente"
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'white',
                            bgcolor: 'rgba(0,0,0,0.4)',
                            zIndex: 2,
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
                        }}
                    >
                        <ChevronRightIcon />
                    </IconButton>
                </>
            )}
        </>
    );
}

export default function PhotoLightbox({
    open,
    photos,
    initialIndex = 0,
    onClose
}: PhotoLightboxProps) {
    if (!photos || photos.length === 0) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            PaperProps={{
                sx: {
                    bgcolor: 'rgba(0, 0, 0, 0.95)',
                    backgroundImage: 'none',
                    boxShadow: 'none'
                }
            }}
            slotProps={{
                backdrop: {
                    sx: {
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)'
                    }
                }
            }}
        >
            <LightboxContent
                photos={photos}
                initialIndex={initialIndex}
                onClose={onClose}
            />
        </Dialog>
    );
}
