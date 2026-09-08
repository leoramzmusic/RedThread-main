import React from 'react';
import {
    Box,
    Typography,
    Button,
    LinearProgress,
    Stack,
    Paper
} from '@mui/material';
import {
    Edit as EditIcon
} from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { calculateProfileScore, calculateCompletionPercentage } from '../../utils/profileScoring';


interface DiscoverEmptyStateProps {
    profile: any;
    onRefresh: () => void;
    onExpandSearch: () => void;
    t: any;
}

export default function DiscoverEmptyState({
    profile,
    onRefresh,
    onExpandSearch,
    t
}: DiscoverEmptyStateProps) {
    const router = useRouter();

    const score = calculateProfileScore(profile);
    const percentage = calculateCompletionPercentage(score);



    return (
        <Box sx={{ textAlign: 'center', py: 4, px: 2, maxWidth: 900, mx: 'auto' }}>
            {/* Illustration */}
            <Box
                component="img"
                src="/images/discover-empty.svg"
                alt={t('emptyState.alt', 'No hay perfiles disponibles')}
                sx={{
                    width: '100%',
                    maxWidth: 300,
                    height: 'auto',
                    mx: 'auto',
                    mb: 3,
                    opacity: 0.8
                }}
                onError={(e: any) => {
                    e.target.style.display = 'none';
                }}
            />

            {/* Title */}
            <Typography variant="h5" fontWeight={700} gutterBottom>
                {t('emptyState.title', '¡Ups! No encontramos a nadie cerca')}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {t('emptyState.subtitle', 'Pero no te preocupes, aquí hay algunas sugerencias:')}
            </Typography>

            {/* Profile Completion */}
            {percentage < 80 && (
                <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'rgba(255, 107, 107, 0.1)', borderRadius: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        {t('emptyState.completeProfile', 'Completa tu perfil')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t('emptyState.profileDesc', 'Un perfil completo aumenta tus posibilidades de match')}
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            mb: 2,
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                                bgcolor: '#FF6B6B',
                                borderRadius: 4
                            }
                        }}
                    />
                    <Typography variant="caption" color="text.secondary">
                        {percentage}% {t('emptyState.complete', 'completado')}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => router.push('/profile/edit')}
                            sx={{
                                bgcolor: '#FF6B6B',
                                '&:hover': { bgcolor: '#FF5252' }
                            }}
                        >
                            {t('emptyState.editProfile', 'Editar Perfil')}
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Actions */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                <Button
                    variant="outlined"
                    onClick={onExpandSearch}
                    sx={{
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'text.primary',
                        '&:hover': {
                            borderColor: 'rgba(255, 255, 255, 0.4)',
                            bgcolor: 'rgba(255, 255, 255, 0.05)'
                        }
                    }}
                >
                    {t('emptyState.expandSearch', 'Ampliar búsqueda')}
                </Button>
                <Button
                    variant="contained"
                    onClick={onRefresh}
                    sx={{
                        bgcolor: '#FF6B6B',
                        '&:hover': { bgcolor: '#FF5252' }
                    }}
                >
                    {t('emptyState.refresh', 'Actualizar')}
                </Button>
            </Stack>
        </Box>
    );
}
