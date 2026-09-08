import React, { useEffect, useRef, useState } from 'react';
import { Box, Portal, useTheme, keyframes, SxProps, Theme } from '@mui/material';

interface BottomSheetProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    sx?: SxProps<Theme>;
}

const slideUp = keyframes`
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const BottomSheet: React.FC<BottomSheetProps> = ({ open, onClose, children, sx }) => {
    const theme = useTheme();
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
        if (open) document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    // Reset offset when opening
    useEffect(() => {
        if (open) {
            setOffset(0);
            setIsDragging(false);
        }
    }, [open]);

    const onTouchStart = (e: React.TouchEvent) => {
        startY.current = e.touches[0].clientY;
        setIsDragging(true);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        const delta = currentY - startY.current;
        // Only allow dragging down
        if (delta > 0) {
            setOffset(delta);
        }
    };

    const onTouchEnd = () => {
        setIsDragging(false);
        if (offset > 100) {
            onClose();
        } else {
            setOffset(0);
        }
    };

    if (!open) return null;

    return (
        <Portal>
            <Box
                onClick={onClose}
                sx={{
                    position: 'fixed',
                    inset: 0,
                    bgcolor: 'rgba(0,0,0,0.35)',
                    zIndex: 1300,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    backdropFilter: 'blur(6px)',
                }}
            >
                <Box
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    sx={{
                        width: '100%',
                        maxWidth: '640px',
                        mx: 'auto',
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        p: 3,
                        pb: 4,
                        boxShadow: theme.palette.mode === 'dark'
                            ? '0 -8px 24px rgba(0,0,0,0.5)'
                            : '0 -8px 24px rgba(0,0,0,0.25)',
                        position: 'relative',
                        transform: `translateY(${offset}px)`,
                        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        cursor: isDragging ? 'grabbing' : 'auto',
                        touchAction: 'none', // Important for drag to work reliably
                        animation: !isDragging ? `${slideUp} 0.3s ease-out` : 'none',
                        ...sx
                    }}
                >
                    {/* Visual Handle - Draggable indicator */}
                    <Box
                        sx={{
                            width: 36,
                            height: 4,
                            borderRadius: 2,
                            bgcolor: 'action.disabled',
                            mx: 'auto',
                            mb: 3,
                            cursor: 'grab'
                        }}
                    />
                    {children}
                </Box>
            </Box>
        </Portal>
    );
};

export default BottomSheet;
