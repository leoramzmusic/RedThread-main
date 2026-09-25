import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import StarIcon from '@mui/icons-material/Star';
import UndoIcon from '@mui/icons-material/Undo';
import TelegramIcon from '@mui/icons-material/Telegram';
import { useAppTheme } from '../../context/ThemeContext';

interface ProfileActionsProps {
    onLike?: () => void;
    onPass?: () => void;
    onSuperLike?: () => void;
    onUndo?: () => void;
    onVIPMessage?: () => void;
    isPremium?: boolean;
}

export default function ProfileActions({
    onLike,
    onPass,
    onSuperLike,
    onUndo,
    onVIPMessage,
    isPremium
}: ProfileActionsProps) {
    const { mode } = useAppTheme();
    const isLight = mode === 'light';
    return (
        <Box
            className="card-actions"
            sx={{
                position: { xs: 'absolute', sm: 'absolute' },
                bottom: { xs: 0, sm: 0 },
                left: 0,
                right: 0,
                height: 80,
                bgcolor: 'transparent',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: { xs: 2.5, sm: 3 },
                zIndex: 10,
                pointerEvents: 'auto',
                px: 1,
                '@media (max-width:375px)': {
                    gap: '0.3rem !important',
                    height: '52px !important',
                    px: '0.2rem !important',
                    justifyContent: 'center !important',
                },
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
        >
            {/* 1. Rewind Button */}
            <Tooltip title="Retroceder">
                <span>
                    <IconButton
                        onClick={(e) => { e.stopPropagation(); onUndo && onUndo(); }}
                        disabled={!onUndo}
                        sx={{
                            bgcolor: 'rgba(20, 20, 20, 0.4)',
                            backdropFilter: 'blur(20px)',
                            color: '#B0BEC5',
                            opacity: onUndo ? 1 : 0.4,
                            width: 52,
                            height: 52,
                            border: '1.5px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)', color: 'white' },
                            transition: 'all 0.2s',
                            '@media (max-width:375px)': { width: '34px !important', height: '34px !important' },
                        }}
                    >
                        <UndoIcon sx={{ fontSize: '1.6rem', '@media (max-width:375px)': { fontSize: '0.8rem !important' } }} />
                    </IconButton>
                </span>
            </Tooltip>

            {/* 2. Dislike Button */}
            <Tooltip title="No me interesa">
                <IconButton
                    onClick={(e) => { e.stopPropagation(); onPass && onPass(); }}
                    sx={{
                        bgcolor: 'rgba(20, 20, 20, 0.6)',
                        backdropFilter: 'blur(25px)',
                        color: '#FF5252',
                        width: 78,
                        height: 78,
                        border: '3px solid rgba(255, 82, 82, 0.3)',
                        boxShadow: '0 8px 32px rgba(255, 82, 82, 0.15)',
                        '&:hover': {
                            transform: 'scale(1.15) rotate(-5deg)',
                            borderColor: '#FF5252',
                            boxShadow: '0 12px 40px rgba(255, 82, 82, 0.3)',
                            bgcolor: 'rgba(255, 82, 82, 0.05)',
                        },
                        '&:active': { transform: 'scale(0.95)' },
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        '@media (max-width:375px)': { width: '34px !important', height: '34px !important', borderWidth: '1.5px !important' },
                    }}
                >
                    <CloseIcon
                        sx={{
                            fontSize: '3.2rem',
                            stroke: 'currentColor',
                            strokeWidth: 1,
                            '@media (max-width:375px)': { fontSize: '0.8rem !important' },
                        }}
                    />
                </IconButton>
            </Tooltip>

            {/* 3. Superlike Button - Center Axis */}
            <Tooltip title="Superlike">
                <IconButton
                    onClick={(e) => { e.stopPropagation(); onSuperLike && onSuperLike(); }}
                    sx={{
                        bgcolor: 'rgba(20, 20, 20, 0.6)',
                        backdropFilter: 'blur(25px)',
                        color: '#448AFF',
                        width: 58,
                        height: 58,
                        border: '2px solid rgba(68, 138, 255, 0.3)',
                        boxShadow: '0 6px 20px rgba(68, 138, 255, 0.2)',
                        '&:hover': {
                            transform: 'scale(1.2) translateY(-5px)',
                            borderColor: '#448AFF',
                            boxShadow: '0 10px 30px rgba(68, 138, 255, 0.4)',
                            bgcolor: 'rgba(68, 138, 255, 0.1)',
                        },
                        '&:active': { transform: 'scale(0.9)' },
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        '@media (max-width:375px)': { width: '34px !important', height: '34px !important' },
                    }}
                >
                    <StarIcon sx={{ fontSize: '2.4rem', '@media (max-width:375px)': { fontSize: '0.8rem !important' } }} />
                </IconButton>
            </Tooltip>

            {/* 4. Like Button */}
            <Tooltip title="Me gusta">
                <IconButton
                    onClick={(e) => { e.stopPropagation(); onLike && onLike(); }}
                    sx={{
                        bgcolor: 'rgba(20, 20, 20, 0.6)',
                        backdropFilter: 'blur(25px)',
                        color: '#69F0AE',
                        width: 78,
                        height: 78,
                        border: '3px solid rgba(105, 240, 174, 0.3)',
                        boxShadow: '0 8px 32px rgba(105, 240, 174, 0.15)',
                        '&:hover': {
                            transform: 'scale(1.15) rotate(5deg)',
                            borderColor: '#69F0AE',
                            boxShadow: '0 12px 40px rgba(105, 240, 174, 0.3)',
                            bgcolor: 'rgba(105, 240, 174, 0.05)',
                        },
                        '&:active': { transform: 'scale(0.95)' },
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        '@media (max-width:375px)': { width: '34px !important', height: '34px !important', borderWidth: '1.5px !important' },
                    }}
                >
                    <FavoriteIcon
                        sx={{
                            fontSize: '3rem',
                            '@media (max-width:375px)': { fontSize: '0.8rem !important' },
                        }}
                    />
                </IconButton>
            </Tooltip>

            {/* 5. Enviar Hilo (Thread) Button */}
            <Tooltip title={isPremium ? 'Enviar hilo' : 'Requiere Premium'}>
                <IconButton
                    onClick={(e) => { e.stopPropagation(); onVIPMessage && onVIPMessage(); }}
                    sx={{
                        bgcolor: 'rgba(20, 20, 20, 0.4)',
                        backdropFilter: 'blur(20px)',
                        color: '#2979FF',
                        width: 52,
                        height: 52,
                        border: '1.5px solid rgba(41, 121, 255, 0.2)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                        '&:hover': {
                            bgcolor: 'rgba(41, 121, 255, 0.1)',
                            borderColor: '#2979FF',
                            color: 'white',
                        },
                        transition: 'all 0.2s',
                        '@media (max-width:375px)': { width: '34px !important', height: '34px !important' },
                    }}
                >
                    <TelegramIcon sx={{ fontSize: '2.4rem', '@media (max-width:375px)': { fontSize: '0.8rem !important' } }} />
                </IconButton>
            </Tooltip>
        </Box>
    );
}
