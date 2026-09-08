import React, { useState } from 'react';
import { Box, Typography, Button, TextField, Paper, Stack } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import FavoriteIcon from '@mui/icons-material/Favorite';
import apiClient from '../../services/api';
import { Message } from './ChatMessage'; // Ensure this import path is correct based on ChatMessage.tsx location

interface IcebreakerMessageProps {
    message: Message;
    isOwn: boolean;
    user: any; // Current user
}

export default function IcebreakerMessage({ message, isOwn, user }: IcebreakerMessageProps) {
    const data = message.icebreaker_data || {};
    const stage = data.stage; // 'invite' | 'answering' | 'revealed'
    const myAnswer = data.answers?.[user?.user_id];

    // Extract question text from content or data (depending on how we store it)
    // The 'content' field usually holds the fallback text: "Te invito a responder: [Question]"
    const questionText = message.content.replace('Te invito a responder: ', '').replace('Esperando la respuesta de la otra persona...', '').replace('✨ ¡Respuestas reveladas! ✨', '');

    const [answerInput, setAnswerInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAccept = () => {
        // Just moves UI to answering state locally? 
        // Or does it need backend trigger? 
        // Implementing simple "Accept" just focuses input for now, 
        // as backend tracks state by presence of answers.
    };

    const submitAnswer = async () => {
        if (!answerInput.trim()) return;
        setIsSubmitting(true);
        try {
            await apiClient.post('/api/icebreaker/chat/answer', {
                message_id: message.id,
                answer: answerInput
            });
            setAnswerInput('');
        } catch (error) {
            console.error("Failed to submit answer", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (stage === 'revealed') {
        return (
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(255, 107, 107, 0.1)', border: '1px solid #FF6B6B', borderRadius: 2 }}>
                <Stack spacing={1} alignItems="center">
                    <FavoriteIcon color="error" />
                    <Typography variant="subtitle2" align="center" fontWeight="bold">
                        36 Preguntas para Enamorarse
                    </Typography>
                    <Typography variant="body1" align="center" sx={{ fontStyle: 'italic', mb: 1 }}>
                        {/* We might need to fetch the original question text if it was lost in content update */}
                        {/* For now assuming we can extract or separate it */}
                        Pregunta desbloqueada
                    </Typography>

                    <Box sx={{ width: '100%', mt: 1 }}>
                        {Object.entries(data.answers || {}).map(([uid, ans]: [string, any]) => (
                            <Box key={uid} sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {uid === user?.user_id ? 'Tú' : 'Partner'}
                                </Typography>
                                <Typography variant="body2">{ans}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Stack>
            </Paper>
        );
    }

    // Pending / Answering Stage
    const hasAnswered = !!myAnswer;

    return (
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', border: '1px dashed grey', borderRadius: 2, maxWidth: 300 }}>
            <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={1}>
                    <FavoriteIcon color="disabled" fontSize="small" />
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">ICEBREAKER</Typography>
                </Box>

                <Typography variant="body2" fontWeight="medium">
                    {questionText || "Pregunta Misteriosa"}
                </Typography>

                {hasAnswered ? (
                    <Box textAlign="center" py={1}>
                        <LockIcon sx={{ color: 'text.secondary', fontSize: 40, mb: 1 }} />
                        <Typography variant="caption" display="block">
                            Tu respuesta está guardada y oculta.
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Esperando a la otra persona...
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        {isOwn && stage === 'invite' ? (
                            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                                Esperando que acepten tu invitación...
                            </Typography>
                        ) : (
                            <>
                                <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                                    Responde para revelar ambas respuestas:
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Escribe tu respuesta..."
                                    value={answerInput}
                                    onChange={(e) => setAnswerInput(e.target.value)}
                                    multiline
                                    maxRows={3}
                                    sx={{ mb: 1 }}
                                />
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="small"
                                    onClick={submitAnswer}
                                    disabled={isSubmitting || !answerInput}
                                >
                                    Enviar y Revelar 🔒
                                </Button>
                            </>
                        )}
                    </Box>
                )}
            </Stack>
        </Paper>
    );
}
