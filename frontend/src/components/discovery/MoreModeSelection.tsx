import React from 'react';
import { Box, Typography, Grid, Paper, Card, CardContent, CardActionArea, Chip } from '@mui/material';
import { Person as PersonIcon, Favorite as FavoriteIcon, EmojiEvents as TrophyIcon } from '@mui/icons-material';
import { useAppTheme } from '../../context/ThemeContext';
import { useTranslation } from 'next-i18next';

export interface MoreCategory {
    id: string;
    label: string;
    type: 'relationship' | 'status' | 'interest';
    color: string;
    count?: number; // Mock count for visual fidelity
    gradient?: string;
}

const CATEGORIES: MoreCategory[] = [
    // FEATURED / RELATIONSHIP GOALS
    { id: 'stable_partner', label: 'Pareja estable', type: 'relationship', color: '#E91E63', count: 54, gradient: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)' }, // Pinkish
    { id: 'serious_rel', label: 'Relación seria', type: 'relationship', color: '#9C27B0', count: 36, gradient: 'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)' },
    { id: 'free_today', label: 'Estoy libre hoy', type: 'relationship', color: '#673AB7', count: 26, gradient: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)' },
    { id: 'nothing_serious', label: 'Nada serio', type: 'relationship', color: '#3F51B5', count: 18 },
    { id: 'friends', label: 'Hacer amigos', type: 'relationship', color: '#2196F3', count: 42 },
    { id: 'non_monogamy', label: 'Relación No monogama', type: 'relationship', color: '#03A9F4', count: 12 },

    // STATUS
    { id: 'verified', label: 'Verificados', type: 'status', color: '#00BCD4', count: 120, gradient: 'linear-gradient(to top, #0ba360 0%, #3cba92 100%)' },
    { id: 'wants_kids', label: 'Quiere hijxs', type: 'status', color: '#009688', count: 8 },
    { id: 'no_kids', label: 'No quiere hijxs', type: 'status', color: '#4CAF50', count: 15 },

    // INTERESTS
    { id: 'hobbies', label: 'Hobbies', type: 'interest', color: '#FFC107', count: 32 },
    { id: 'music', label: 'Música', type: 'interest', color: '#FF9800', count: 65, gradient: 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)' }, // Silvery
    { id: 'foodies', label: 'Foodies', type: 'interest', color: '#FF5722', count: 48 },
    { id: 'travel', label: 'Viajes', type: 'interest', color: '#795548', count: 29 },
    { id: 'sports', label: 'Deportistas', type: 'interest', color: '#607D8B', count: 44 },
    { id: 'coffee', label: 'Café', type: 'interest', color: '#795548', count: 21 },
    { id: 'dates', label: 'Citas', type: 'interest', color: '#E91E63', count: 55 },
    { id: 'extreme', label: 'Extremos', type: 'interest', color: '#f44336', count: 7 },
    { id: 'nature', label: 'Naturaleza', type: 'interest', color: '#4CAF50', count: 62 },
    { id: 'photography', label: 'Fotógrafos', type: 'interest', color: '#9E9E9E', count: 14 },
    { id: 'pets', label: 'Con mascotas', type: 'interest', color: '#795548', count: 88, gradient: 'linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)' },
    { id: 'gaming', label: 'Gamers', type: 'interest', color: '#673AB7', count: 95 }
];

interface MoreModeSelectionProps {
    onSelectCategory: (category: MoreCategory) => void;
}

export default function MoreModeSelection({ onSelectCategory }: MoreModeSelectionProps) {
    const { t } = useTranslation('discover');
    const { mode } = useAppTheme();
    const isLight = mode === 'light';

    // Helper to render a card
    const renderCard = (cat: MoreCategory, height = 160, fontSize = '1.5rem') => (
        <Card
            key={cat.id}
            sx={{
                height,
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer',
                border: 'none',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.4)',
                }
            }}
            onClick={() => onSelectCategory(cat)}
        >
            {/* Background Gradient */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: cat.gradient || `linear-gradient(135deg, ${cat.color}aa 0%, ${cat.color}66 100%)`,
                    opacity: 0.8,
                    zIndex: 1
                }}
            />

            {/* Dark Overlay for Text Readability */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)',
                    zIndex: 2
                }}
            />

            {/* Content */}
            <CardActionArea sx={{ height: '100%', zIndex: 3 }}>
                <CardContent sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    p: 2,
                    boxSizing: 'border-box'
                }}>
                    {cat.count && (
                        <Box sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            bgcolor: 'rgba(0,0,0,0.6)',
                            borderRadius: 2,
                            px: 1,
                            py: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                        }}>
                            <PersonIcon sx={{ fontSize: 12, color: 'white' }} />
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, lineHeight: 1 }}>
                                {cat.count}
                            </Typography>
                        </Box>
                    )}

                    <Typography
                        variant="h6"
                        sx={{
                            color: 'white',
                            fontWeight: 800,
                            fontSize: fontSize,
                            lineHeight: 1.1,
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                    >
                        {t(`moreMode.cat.${cat.id}`, cat.label)}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );

    return (
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 2 } }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary', fontSize: '1rem' }}>
                {t('moreMode.title', '¿Qué estás buscando?')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.disabled' }}>
                {t('moreMode.subtitle', 'Encuentra personas que buscan lo mismo que tú.')}
            </Typography>

            <Grid container spacing={2}>
                {/* Row 1: Large Featured Item (Pareja Estable) */}
                <Grid item xs={12} sm={8}>
                    {renderCard(CATEGORIES[0], 240, '2rem')}
                </Grid>

                {/* Row 1 Col 2: Stacked smaller items */}
                <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                        <Box sx={{ flex: 1 }}>
                            {renderCard(CATEGORIES[1], 112, '1.2rem')}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            {renderCard(CATEGORIES[2], 112, '1.2rem')}
                        </Box>
                    </Box>
                </Grid>

                {/* Row 2: Grid of remaining items */}
                {CATEGORIES.slice(3).map((cat) => (
                    <Grid item xs={6} sm={4} md={3} key={cat.id}>
                        {renderCard(cat, 160, '1.25rem')}
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
