import React, { useEffect, useRef, useState } from 'react';
import { Box, Portal, useTheme, SxProps, Theme } from '@mui/material';

interface BottomSheetProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    sx?: SxProps<Theme>;
}

const CLOSE_THRESHOLD_PX = 100;
const TRANSITION_MS = 300;

/**
 * Bottom sheet with animated entry AND exit, plus drag-to-close
 * via touch (mobile/tablet) and mouse (desktop pointer).
 * The parent keeps `open=true` during the exit animation; `onClose`
 * fires only after the sheet has slid away.
 */
const BottomSheet: React.FC<BottomSheetProps> = ({ open, onClose, children, sx }) => {
    const theme = useTheme();
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [visible, setVisible] = useState(false);
    const startY = useRef(0);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    // Entry: mount first, then slide up on the next frame
    useEffect(() => {
        if (open) {
            setOffset(0);
            setIsDragging(false);
            const frame = requestAnimationFrame(() =>
                requestAnimationFrame(() => setVisible(true)),
            );
            return () => cancelAnimationFrame(frame);
        }
        setVisible(false);
        return undefined;
    }, [open ]);

    // Cleanup pending close timer on unmount
    useEffect(() => {
        return () => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
        };
    }, []);

    const handleClose = () => {
        if (closeTimer.current) return; // already closing
        setIsDragging(false);
        setOffset(0);
        setVisible(false);
        closeTimer.current = setTimeout(() => {
            closeTimer.current = null;
            onCloseRef.current();
        }, TRANSITION_MS);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && handleClose();
        if (open) document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open ]);

    const dragTo = (clientY: number) => {
        const delta = clientY - startY.current;
        if (delta > 0) setOffset(delta);
    };

    const endDrag = () => {
        setIsDragging(false);
        if (offset > CLOSE_THRESHOLD_PX) {
            handleClose();
        } else {
            setOffset(0);
        }
    };

    // --- Touch (mobile / tablet) ---
    const onTouchStart = (e: React.TouchEvent) => {
        if (closeTimer.current) return;
        startY.current = e.touches[0].clientY;
        setIsDragging(true);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        dragTo(e.touches[0].clientY);
    };

    const onTouchEnd = () => {
        if (!isDragging) return;
        endDrag();
    };

    // --- Mouse (desktop pointer) ---
    const onMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0 || closeTimer.current) return;
        startY.current = e.clientY;
        setIsDragging(true);
    };

    useEffect(() => {
        if (!isDragging) return;
        const onMove = (e: MouseEvent) => dragTo(e.clientY);
        const onUp = () => endDrag();
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging, offset]);

    if (!open) return null;

    return (
        <Portal>
            <Box
                onClick={(e) => {
                    // Only backdrop taps close: taps inside stop below,
                    // and this guard survives propagation quirks on touch.
                    if (e.target === e.currentTarget) handleClose();
                }}
                sx={{
                    position: 'fixed',
                    inset: 0,
                    bgcolor: 'rgba(0,0,0,0.35)',
                    // Above the app bottom nav (z 2000) so the sheet is never covered
                    zIndex: 2100,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    backdropFilter: 'blur(6px)',
                    opacity: visible ? 1 : 0,
                    transition: `opacity ${TRANSITION_MS}ms ease`,
                }}
            >
                <Box
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    onMouseDown={onMouseDown}
                    sx={{
                        width: '100%',
                        maxWidth: '640px',
                        mx: 'auto',
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        p: 3,
                        pb: 'calc(24px + env(safe-area-inset-bottom, 0px))',
                        boxShadow: theme.palette.mode === 'dark'
                            ? '0 -8px 24px rgba(0,0,0,0.5)'
                            : '0 -8px 24px rgba(0,0,0,0.25)',
                        position: 'relative',
                        transform: visible ? `translateY(${offset}px)` : 'translateY(100%)',
                        transition: isDragging ? 'none' : `transform ${TRANSITION_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
                        cursor: isDragging ? 'grabbing' : 'auto',
                        touchAction: 'none', // Important for drag to work reliably
                        userSelect: 'none',
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
