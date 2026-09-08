import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import CreativeGameCard from '../../creative/CreativeGameCard'; // Adjust path if needed
import GameEditorModal from '../../creative/GameEditorModal';
import apiClient from '../../../services/api';

interface ProfileIdentityViewProps {
    profile: any;
}

export default function ProfileIdentityView({ profile }: ProfileIdentityViewProps) {
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Editor Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await apiClient.get('/api/games/dashboard');
                setGames(response.data);
            } catch (err) {
                console.error("Failed to load dashboard", err);
                setError('No se pudo cargar el panel de juegos.');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const handlePlay = (gameType: string) => {
        setSelectedGame(gameType);
        setModalOpen(true);
    };

    if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                    Identidad Creativa
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Explora dinámicas para conectar y revelar tu identidad.
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {games.map((game) => (
                    <Grid item xs={12} sm={6} md={4} key={game.id}>
                        <CreativeGameCard game={game} onPlay={handlePlay} />
                    </Grid>
                ))}
            </Grid>

            <GameEditorModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                gameType={selectedGame}
            />
        </Box>
    );
}

