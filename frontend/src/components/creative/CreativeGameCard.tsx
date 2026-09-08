import React from 'react';
import { Paper, Box, Typography, Button, Chip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface CreativeGameCardProps {
    game: {
        id: string;
        title: string;
        description: string;
        icon: string;
        type: string;
        status: string; // 'available', 'locked', 'completed'
        level_required: number;
    };
    onPlay: (gameType: string) => void;
}

export default function CreativeGameCard({ game, onPlay }: CreativeGameCardProps) {
    const isLocked = game.status === 'locked';

    return (
        <Paper
            elevation={2}
            sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                opacity: isLocked ? 0.7 : 1,
                transition: 'transform 0.2s',
                '&:hover': {
                    transform: !isLocked ? 'translateY(-4px)' : 'none',
                    boxShadow: !isLocked ? 6 : 2
                }
            }}
        >
            {isLocked && (
                <Chip
                    icon={<LockIcon sx={{ fontSize: 16 }} />}
                    label={`Nivel ${game.level_required}`}
                    size="small"
                    sx={{ position: 'absolute', top: 12, right: 12 }}
                />
            )}

            <Typography variant="h2" sx={{ mb: 2 }}>
                {game.icon}
            </Typography>

            <Typography variant="h6" align="center" gutterBottom>
                {game.title}
            </Typography>

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                {game.description}
            </Typography>

            <Button
                variant={isLocked ? "outlined" : "contained"}
                color="primary"
                fullWidth
                startIcon={isLocked ? <LockIcon /> : <PlayArrowIcon />}
                disabled={isLocked}
                onClick={() => onPlay(game.type)}
            >
                {isLocked ? 'Bloqueado' : 'Jugar'}
            </Button>
        </Paper>
    );
}
