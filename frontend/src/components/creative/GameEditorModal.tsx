import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, List, ListItem, ListItemText,
    Typography, Tab, Tabs, Box, Chip, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import apiClient from '../../services/api';

interface GameEditorModalProps {
    open: boolean;
    onClose: () => void;
    gameType: string;
}

export default function GameEditorModal({ open, onClose, gameType }: GameEditorModalProps) {
    const [tabValue, setTabValue] = useState(0); // 0 = Standard, 1 = Custom
    const [prompts, setPrompts] = useState<any[]>([]);
    const [customText, setCustomText] = useState('');

    useEffect(() => {
        if (open) {
            loadPrompts();
        }
    }, [open, gameType]);

    const loadPrompts = async () => {
        try {
            // Mock fetching prompts depending on implementation
            const res = await apiClient.get(`/api/games/prompts/${gameType.toUpperCase()}?intensity=5`);
            setPrompts(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveCustom = async () => {
        if (!customText.trim()) return;
        try {
            await apiClient.post('/api/games/custom-prompt', {
                text: customText,
                game_type: gameType.toUpperCase(),
                category: 'custom'
            });
            setCustomText('');
            alert('¡Script guardado en tu perfil!');
        } catch (e) {
            alert('Error al guardar');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                Editar: {gameType === 'icebreaker' ? 'Romper el Hielo' : 'Verdad o Reto'}
            </DialogTitle>

            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} centered>
                <Tab label="Sugerencias" />
                <Tab label="Mis Scripts" />
            </Tabs>

            <DialogContent dividers>
                {tabValue === 0 && (
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Estas son las preguntas estándar. Úsalas en el chat para romper el hielo.
                        </Typography>
                        <List>
                            {prompts.map((p) => (
                                <ListItem key={p.id} divider>
                                    <ListItemText primary={p.text} secondary={`Nivel ${p.intensity || 1}`} />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}

                {tabValue === 1 && (
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Agrega tus propias preguntas, retos o guiones para usar en tus conversaciones.
                        </Typography>

                        <Box display="flex" gap={1} mb={2}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder={gameType === 'truth_or_dare' ? "Escribe un reto personalizado..." : "Escribe una pregunta..."}
                                value={customText}
                                onChange={(e) => setCustomText(e.target.value)}
                            />
                            <IconButton color="primary" onClick={handleSaveCustom}>
                                <AddIcon />
                            </IconButton>
                        </Box>

                        {/* List of custom scripts would be fetched here if implemented fully */}
                        <Typography variant="caption" fontStyle="italic">
                            Tus scripts guardados aparecerán disponibles en el chat.
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
}
