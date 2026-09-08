import React, { useState } from 'react';
import {
    Box,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Typography,
    Badge
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/api';

interface IcebreakerButtonProps {
    matchId: string;
    otherUserId: string;
    onSend: (text: string) => void;
    color?: string;
}

export default function IcebreakerButton({ matchId, otherUserId, onSend, color }: IcebreakerButtonProps) {
    const { t } = useTranslation('common');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    // Mock level/progress for now - real app would fetch this from relationship/conversation data
    const level = 2; // Unlock up to interactions

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const sendSimpleMessage = (text: string) => {
        onSend(text);
        handleClose();
    };

    const send36QuestionInvite = async (questionId: string) => {
        try {
            await apiClient.post('/api/icebreaker/chat/invite', {
                match_id: matchId,
                other_user_id: otherUserId,
                question_id: questionId
            });
            // Allow Chat socket to handle the incoming message update
        } catch (error) {
            console.error("Failed to send invite", error);
        }
        handleClose();
    };

    // Mock fetching random question (in real app, hit API)
    const getRandomQuestion = () => {
        const questions = [
            { id: "q_1", text: "Given the choice of anyone in the world, whom would you want as a dinner guest?" },
            { id: "q_4", text: "What would constitute a “perfect” day for you?" },
            { id: "q_9", text: "For what in your life do you feel most grateful?" }
        ];
        return questions[Math.floor(Math.random() * questions.length)];
    };

    return (
        <>
            <Tooltip title={t('chat.icebreaker', 'Romper el hielo')}>
                <IconButton
                    onClick={handleClick}
                    sx={{ color: color || 'primary.main' }}
                >
                    <AutoAwesomeIcon />
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    elevation: 3,
                    sx: { borderRadius: 4, mt: 1, minWidth: 200 }
                }}
            >
                {/* Level 1: Basic Hello */}
                <MenuItem onClick={() => sendSimpleMessage("👋 Hola")}>
                    <ListItemIcon><WavingHandIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Saludar" secondary="Enviar un simple Hola" />
                </MenuItem>

                {/* Level 2: Random Question (Quick) */}
                <MenuItem
                    onClick={() => sendSimpleMessage("¿Cuál es tu comida favorita?")}
                    disabled={level < 1}
                >
                    <ListItemIcon><QuestionAnswerIcon fontSize="small" /></ListItemIcon>
                    <ListItemText
                        primary="Pregunta Rápida"
                        secondary={level < 1 ? "Desbloquea al chatear más" : "Comida, Viajes, etc."}
                    />
                </MenuItem>

                {/* Level 3: Mini Game (Mock) */}
                <MenuItem
                    onClick={() => sendSimpleMessage("🎲 Juguemos: ¿Playa o Montaña?")}
                    disabled={level < 2}
                >
                    <ListItemIcon><SportsEsportsIcon fontSize="small" /></ListItemIcon>
                    <ListItemText
                        primary="Mini Juego"
                        secondary={level < 2 ? "Desbloquea al chatear más" : "Esto o Aquello"}
                    />
                </MenuItem>

                {/* Level 4: 36 Questions (Deep) */}
                <MenuItem
                    onClick={() => {
                        const q = getRandomQuestion();
                        send36QuestionInvite(q.id);
                    }}
                    disabled={level < 2} // Should be higher in real app
                >
                    <ListItemIcon><FavoriteIcon fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText
                        primary="36 Preguntas"
                        secondary={level < 2 ? "Desbloquea al conectar más" : "Para enamorarse"}
                    />
                </MenuItem>
            </Menu>
        </>
    );
}
