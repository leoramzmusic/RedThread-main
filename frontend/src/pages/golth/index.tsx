import React, { useState } from 'react';
import { Box, Typography, Button, Container, Grid, Paper, Chip, Tooltip, IconButton, Fade } from '@mui/material';
import { Hub, Explore, Security, Group, Stars, InfoOutlined, Lock } from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import { THREAD_CONFIGS } from '../../config/threadConfig';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useRouter } from 'next/router';

const GOLTH_COLOR = THREAD_CONFIGS.goldth.color;

const ABSTRACT_CATEGORIES = [
    { name: 'Exploración', description: 'Intereses poco comunes y nuevas fronteras.', icon: <Explore /> },
    { name: 'Juego', description: 'Dinámicas lúdicas y experiencias divertidas.', icon: <Stars /> },
    { name: 'Conexión múltiple', description: 'Afinidades grupales y círculos sociales.', icon: <Group /> },
    { name: 'Rituales', description: 'Experiencias compartidas con significado profundo.', icon: <Hub /> },
];

export default function GolthPage() {
    const [isActive, setIsActive] = useState(false);
    const { user } = useSelector((state: RootState) => state.auth);
    const router = useRouter();

    const isPremiumOrVip = user?.subscription_tier === 'premium' || user?.subscription_tier === 'vip';

    if (!isPremiumOrVip) {
        return (
            <Layout>
                <Box
                    sx={{
                        minHeight: '100vh',
                        bgcolor: '#0a0a0a',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        p: 3
                    }}
                >
                    <Container maxWidth="sm">
                        <Lock sx={{ fontSize: 60, color: GOLTH_COLOR, mb: 3 }} />
                        <Typography variant="h4" fontWeight="bold" gutterBottom>Acceso Restringido</Typography>
                        <Typography color="text.secondary" sx={{ mb: 4 }}>
                            Golth es un espacio exclusivo para miembros Premium y VIP. Suscríbete para explorar afinidades doradas.
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => router.push('/suscripcion')}
                            sx={{ bgcolor: GOLTH_COLOR, color: '#000', fontWeight: 'bold' }}
                        >
                            Ver Planes Premium
                        </Button>
                    </Container>
                </Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Box
                sx={{
                    minHeight: '100vh',
                    bgcolor: '#0a0a0a',
                    color: '#fff',
                    pt: 4,
                    pb: 8,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background Decoration */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -100,
                        right: -100,
                        width: 400,
                        height: 400,
                        background: `radial-gradient(circle, ${GOLTH_COLOR}22 0%, transparent 70%)`,
                        filter: 'blur(50px)',
                    }}
                />

                <Container maxWidth="lg">
                    {!isActive ? (
                        <Fade in={true} timeout={1000}>
                            <Box textAlign="center" sx={{ mt: 8 }}>
                                <Hub sx={{ fontSize: 80, color: GOLTH_COLOR, mb: 3 }} />
                                <Typography variant="h2" fontWeight="800" gutterBottom sx={{
                                    background: `linear-gradient(45deg, ${GOLTH_COLOR}, #fff)`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    Bienvenido a Golth
                                </Typography>
                                <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                                    Explora afinidades doradas en un espacio diseñado para la curiosidad y el respeto.
                                </Typography>

                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 4,
                                        bgcolor: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(245, 158, 11, 0.2)',
                                        borderRadius: 4,
                                        maxWidth: 500,
                                        mx: 'auto',
                                        mb: 6
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                                        <Security sx={{ color: GOLTH_COLOR }} />
                                        <Typography variant="body1" textAlign="left">
                                            Este espacio es para explorar afinidades de manera respetuosa. Tu consentimiento es nuestra prioridad.
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        onClick={() => setIsActive(true)}
                                        sx={{
                                            bgcolor: GOLTH_COLOR,
                                            color: '#000',
                                            fontWeight: 'bold',
                                            py: 1.5,
                                            '&:hover': {
                                                bgcolor: '#fbbf24',
                                                boxShadow: `0 0 20px ${GOLTH_COLOR}66`
                                            }
                                        }}
                                    >
                                        Activar Golth
                                    </Button>
                                </Paper>
                            </Box>
                        </Fade>
                    ) : (
                        <Fade in={true}>
                            <Box>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={6}>
                                    <Box>
                                        <Typography variant="h3" fontWeight="bold">Explora Afinidades</Typography>
                                        <Typography color="text.secondary">Selecciona los hilos que deseas seguir hoy.</Typography>
                                    </Box>
                                    <Chip
                                        label="Modo Gold"
                                        sx={{
                                            bgcolor: `${GOLTH_COLOR}22`,
                                            color: GOLTH_COLOR,
                                            fontWeight: 'bold',
                                            border: `1px solid ${GOLTH_COLOR}44`
                                        }}
                                    />
                                </Box>

                                <Grid container spacing={4}>
                                    {ABSTRACT_CATEGORIES.map((cat) => (
                                        <Grid item xs={12} sm={6} md={3} key={cat.name}>
                                            <Paper
                                                sx={{
                                                    p: 3,
                                                    height: '100%',
                                                    bgcolor: 'rgba(255,255,255,0.02)',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    borderRadius: 3,
                                                    transition: 'all 0.3s ease',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        transform: 'translateY(-8px)',
                                                        bgcolor: 'rgba(255,255,255,0.05)',
                                                        borderColor: GOLTH_COLOR,
                                                        boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 10px ${GOLTH_COLOR}22`
                                                    }
                                                }}
                                            >
                                                <Box sx={{ color: GOLTH_COLOR, mb: 2 }}>
                                                    {cat.icon}
                                                </Box>
                                                <Typography variant="h6" fontWeight="bold" gutterBottom>{cat.name}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {cat.description}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Box sx={{ mt: 8, textAlign: 'center' }}>
                                    <Typography variant="h5" gutterBottom>Tu Constelación de Afinidades</Typography>
                                    <Paper
                                        sx={{
                                            mt: 3,
                                            height: 300,
                                            bgcolor: '#000',
                                            borderRadius: 4,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px dashed rgba(255,255,255,0.1)',
                                            position: 'relative'
                                        }}
                                    >
                                        {/* Abstract Constellation visual placeholder */}
                                        <Box sx={{ position: 'relative', width: '100%', height: '100%', opacity: 0.4 }}>
                                            {[...Array(20)].map((_, i) => (
                                                <Box
                                                    key={i}
                                                    sx={{
                                                        position: 'absolute',
                                                        width: 4,
                                                        height: 4,
                                                        bgcolor: GOLTH_COLOR,
                                                        borderRadius: '50%',
                                                        top: `${Math.random() * 100}%`,
                                                        left: `${Math.random() * 100}%`,
                                                        boxShadow: `0 0 10px ${GOLTH_COLOR}`
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                        <Typography variant="body1" color="text.secondary">
                                            Próximamente: Visualización de Constelación
                                        </Typography>
                                    </Paper>
                                </Box>

                                <Box sx={{ mt: 6, display: 'flex', gap: 2, justifyContent: 'center' }}>
                                    <Button variant="outlined" startIcon={<Hub />} sx={{ color: GOLTH_COLOR, borderColor: GOLTH_COLOR }}>
                                        Gestionar Pareja
                                    </Button>
                                    <Button variant="outlined" startIcon={<InfoOutlined />} sx={{ color: 'text.secondary', borderColor: 'rgba(255,255,255,0.2)' }}>
                                        Ver Historial
                                    </Button>
                                </Box>
                            </Box>
                        </Fade>
                    )}
                </Container>
            </Box>
        </Layout>
    );
}
