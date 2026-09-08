import React from 'react';
import { Box, Paper, Typography, Button, Container } from '@mui/material';

interface ConfirmationDrawerProps {
    open: boolean;
    onClose: () => void;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDragging?: boolean;
    dragOffsetY?: number;
    handleDragStart?: (e: React.MouseEvent | React.TouchEvent) => void;
}

export default function ConfirmationDrawer({
    open,
    onClose,
    title,
    message,
    onConfirm,
    confirmText = "Aceptar",
    cancelText = "Cancelar",
    isDragging = false,
    dragOffsetY = 0,
    handleDragStart = () => { }
}: ConfirmationDrawerProps) {
    if (!open) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1200,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                pointerEvents: 'auto',
            }}
            onClick={onClose}
        >
            <Box
                sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    pl: { md: '260px', xs: 0 },
                    boxSizing: 'border-box',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <Container maxWidth="md" sx={{ p: '0 !important', pointerEvents: 'auto' }}>
                    <Paper
                        elevation={24}
                        sx={{
                            position: 'relative',
                            width: '100%',
                            bgcolor: 'background.paper',
                            color: 'text.primary',
                            borderRadius: '16px 16px 0 0',
                            p: 0,
                            pb: 4,
                            backgroundImage: 'none',
                            borderTop: 1,
                            borderColor: 'divider',
                            transform: 'translateY(' + dragOffsetY + 'px)',
                            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                            overflow: 'hidden',
                            cursor: isDragging ? 'grabbing' : 'auto',
                            animation: 'slideUp 0.3s ease-out',
                            '@keyframes slideUp': {
                                from: { transform: 'translateY(100%)' },
                                to: { transform: 'translateY(0)' }
                            }
                        }}
                    >
                        {/* Visual Handle */}
                        <Box
                            onMouseDown={handleDragStart}
                            onTouchStart={handleDragStart}
                            sx={{
                                width: '100%',
                                height: 40,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: 'grab',
                                touchAction: 'none'
                            }}
                        >
                            <Box
                                sx={{
                                    width: 36,
                                    height: 4,
                                    bgcolor: 'action.disabled',
                                    borderRadius: 2
                                }}
                            />
                        </Box>

                        <Box px={3} textAlign="center">
                            <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'text.primary', mb: 2 }}>
                                {title}
                            </Typography>

                            <Box display="flex" gap={1} justifyContent="center" mb={3}>
                                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
                                    {message}
                                </Typography>
                            </Box>

                            <Box display="flex" gap={2} justifyContent="center">
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    onClick={onClose}
                                    sx={{
                                        fontWeight: 'bold',
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        py: 1.2,
                                        minWidth: 120
                                    }}
                                >
                                    {cancelText}
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    sx={{
                                        fontWeight: 'bold',
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        py: 1.2,
                                        minWidth: 120
                                    }}
                                >
                                    {confirmText}
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Container>
            </Box>
        </Box >
    );
}
