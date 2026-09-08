import React, { useState } from 'react';
import { Box, Typography, Button, TextField, Paper, Stack, IconButton, Chip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ExtensionIcon from '@mui/icons-material/Extension';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import apiClient from '../../services/api';
import { Message } from './ChatMessage';

interface GameSessionProps {
    message: Message;
    isOwn: boolean;
    user: any; // Current user
}

export default function GameSession({ message, isOwn, user }: GameSessionProps) {
    const session = message.game_session || {};
    const state = session.state; // 'INVITE', 'PLAYING', 'REVEAL_READY', 'REVEALED'
    const gameType = session.game_type;
    const promptText = session.prompt_text || "Juego Interactivo";
    const myResponse = session.responses?.[user?.user_id];
    const responses = session.responses || {};

    const [inputText, setInputText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAction = async (action: string, payload: any = {}) => {
        setIsSubmitting(true);
        try {
            await apiClient.post('/api/games/chat/action', {
                message_id: message.id,
                action: action,
                payload: payload
            });
            setInputText('');
        } catch (error) {
            console.error("Failed game action", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDER STATES ---

    // 1. INVITE STATE
    if (state === 'INVITE') {
        return (
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', border: '1px dashed grey', borderRadius: 2, maxWidth: 300 }}>
                <Stack spacing={1} alignItems="center">
                    <ExtensionIcon color="primary" />
                    <Typography variant="subtitle2" fontWeight="bold"> Invitación a {gameType} </Typography>
                    <Typography variant="body2" align="center"> {promptText} </Typography>

                    {!isOwn && (
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleAction('ACCEPT')}
                            sx={{ mt: 1 }}
                        >
                            Aceptar Reto
                        </Button>
                    )}
                    {isOwn && <Typography variant="caption" fontStyle="italic">Esperando aceptación...</Typography>}
                </Stack>
            </Paper>
        );
    }

    // 4. REVEALED STATE (Final)
    if (state === 'REVEALED') {
        return (
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(255, 107, 107, 0.1)', border: '1px solid #FF6B6B', borderRadius: 2 }}>
                <Stack spacing={1} alignItems="center">
                    <Typography variant="subtitle2" align="center" fontWeight="bold" color="error.main">
                        {gameType === 'icebreaker' ? '✨ Respuestas Reveladas ✨' : '🔥 Resultados 🔥'}
                    </Typography>
                    <Typography variant="body2" align="center" sx={{ fontStyle: 'italic', mb: 1 }}>
                        {promptText}
                    </Typography>

                    <Stack spacing={1} sx={{ width: '100%' }}>
                        {Object.entries(responses).map(([uid, ans]: [string, any]) => (
                            <Box key={uid} sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 2, position: 'relative' }}>
                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                    {uid === user?.user_id ? 'Tú' : 'Partner'}
                                </Typography>
                                <Typography variant="body1">{ans}</Typography>
                                {/* Placeholder for reactions */}
                                <Box sx={{ position: 'absolute', bottom: -10, right: 10 }}>
                                    {/* Render reactions from session.reactions */}
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </Stack>
            </Paper>
        );
    }

    // 2. PLAYING / INPUT STATE
    // If I haven't answered yet -> Show Input
    // If I HAVE answered -> Show "Waiting"
    const hasAnswered = !!myResponse;

    return (
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, maxWidth: 300 }}>
            <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={1}>
                    <ExtensionIcon color="action" fontSize="small" />
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">{gameType.toUpperCase()}</Typography>
                </Box>

                <Typography variant="body2" fontWeight="medium">
                    {promptText}
                </Typography>

                {hasAnswered ? (
                    <Box textAlign="center" py={1} bgcolor="action.hover" borderRadius={1}>
                        <LockIcon sx={{ color: 'text.secondary', fontSize: 32, mb: 1 }} />
                        <Typography variant="caption" display="block" fontWeight="bold">
                            Tu respuesta está guardada.
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Esperando a la otra persona para revelar...
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                            Tu turno de responder:
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Escribe aquí..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            multiline
                            maxRows={3}
                            disabled={isSubmitting}
                        />
                        <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            onClick={() => handleAction('ANSWER', { text: inputText })}
                            disabled={!inputText.trim() || isSubmitting}
                            sx={{ mt: 1 }}
                        >
                            Enviar y Esperar 🔒
                        </Button>
                    </Box>
                )}
            </Stack>
        </Paper>
    );
}
