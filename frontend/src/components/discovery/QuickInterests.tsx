import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Chip,
    TextField,
    InputAdornment,
    IconButton,
    Collapse,
    Fade,
    Tooltip,
    CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/api';

interface Interest {
    name: string;
    icon: string;
    category: string;
}

interface CategorizedInterests {
    creative: Interest[];
    adventurous: Interest[];
    digital: Interest[];
    lifestyle: Interest[];
}

interface QuickInterestsProps {
    onInterestsUpdate?: (interests: string[], privateInterests: string[]) => void;
}

const CATEGORY_CONFIG = {
    creative: {
        title: 'Creativos',
        color: '#FF6B9D',
        bgColor: 'rgba(255, 107, 157, 0.1)'
    },
    adventurous: {
        title: 'Aventureros',
        color: '#4CAF50',
        bgColor: 'rgba(76, 175, 80, 0.1)'
    },
    digital: {
        title: 'Digitales',
        color: '#2196F3',
        bgColor: 'rgba(33, 150, 243, 0.1)'
    },
    lifestyle: {
        title: 'Lifestyle',
        color: '#FF9800',
        bgColor: 'rgba(255, 152, 0, 0.1)'
    }
};

export default function QuickInterests({ onInterestsUpdate }: QuickInterestsProps) {
    const { t } = useTranslation('discover');

    const [categorizedInterests, setCategorizedInterests] = useState<CategorizedInterests | null>(null);
    const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
    const [privateInterests, setPrivateInterests] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Interest[]>([]);
    const [suggestions, setSuggestions] = useState<Interest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategorizedInterests();
        fetchSuggestions();
    }, []);

    const fetchCategorizedInterests = async () => {
        try {
            const { data } = await apiClient.get('/api/interests/categories');
            setCategorizedInterests(data);
        } catch (error) {
            console.error('Error fetching interests:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuggestions = async () => {
        try {
            const { data } = await apiClient.get('/api/interests/suggestions');
            setSuggestions(data);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);

        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const { data } = await apiClient.get(`/api/interests/search?q=${encodeURIComponent(query)}`);
            setSearchResults(data);
        } catch (error) {
            console.error('Error searching interests:', error);
        }
    };

    const handleAddInterest = async (interestName: string, isPrivate: boolean = false) => {
        try {
            await apiClient.post('/api/interests/add', null, {
                params: { interest_name: interestName, is_private: isPrivate }
            });

            const newSelected = new Set(selectedInterests);
            newSelected.add(interestName);
            setSelectedInterests(newSelected);

            if (isPrivate) {
                const newPrivate = new Set(privateInterests);
                newPrivate.add(interestName);
                setPrivateInterests(newPrivate);
            }

            // Callback
            if (onInterestsUpdate) {
                const publicInterests = Array.from(newSelected).filter(i => !privateInterests.has(i));
                const privInterests = Array.from(isPrivate ? new Set([...privateInterests, interestName]) : privateInterests);
                onInterestsUpdate(publicInterests, privInterests);
            }
        } catch (error) {
            console.error('Error adding interest:', error);
        }
    };

    const handleRemoveInterest = async (interestName: string) => {
        try {
            await apiClient.delete('/api/interests/remove', {
                params: { interest_name: interestName }
            });

            const newSelected = new Set(selectedInterests);
            newSelected.delete(interestName);
            setSelectedInterests(newSelected);

            const newPrivate = new Set(privateInterests);
            newPrivate.delete(interestName);
            setPrivateInterests(newPrivate);

            // Callback
            if (onInterestsUpdate) {
                onInterestsUpdate(Array.from(newSelected), Array.from(newPrivate));
            }
        } catch (error) {
            console.error('Error removing interest:', error);
        }
    };

    const handleTogglePrivacy = async (interestName: string) => {
        const isCurrentlyPrivate = privateInterests.has(interestName);

        try {
            await apiClient.patch('/api/interests/toggle-privacy', null, {
                params: { interest_name: interestName, make_private: !isCurrentlyPrivate }
            });

            const newPrivate = new Set(privateInterests);
            if (isCurrentlyPrivate) {
                newPrivate.delete(interestName);
            } else {
                newPrivate.add(interestName);
            }
            setPrivateInterests(newPrivate);

            // Callback
            if (onInterestsUpdate) {
                const publicInterests = Array.from(selectedInterests).filter(i => !newPrivate.has(i));
                onInterestsUpdate(publicInterests, Array.from(newPrivate));
            }
        } catch (error) {
            console.error('Error toggling privacy:', error);
        }
    };

    const renderInterestChip = (interest: Interest, categoryColor: string) => {
        const isSelected = selectedInterests.has(interest.name);
        const isPrivate = privateInterests.has(interest.name);

        return (
            <Fade in key={interest.name} timeout={300}>
                <Chip
                    icon={<span style={{ fontSize: '1.2rem' }}>{interest.icon}</span>}
                    label={interest.name}
                    onClick={() => isSelected ? handleRemoveInterest(interest.name) : handleAddInterest(interest.name)}
                    onDelete={isSelected && isPrivate ? () => handleTogglePrivacy(interest.name) : undefined}
                    deleteIcon={
                        isPrivate ? (
                            <Tooltip title="Hacer público">
                                <LockIcon fontSize="small" />
                            </Tooltip>
                        ) : undefined
                    }
                    sx={{
                        bgcolor: isSelected ? categoryColor : 'rgba(255, 255, 255, 0.05)',
                        color: isSelected ? 'white' : 'text.primary',
                        border: `1px solid ${isSelected ? categoryColor : 'rgba(255, 255, 255, 0.1)'}`,
                        fontWeight: isSelected ? 600 : 400,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            bgcolor: isSelected ? categoryColor : 'rgba(255, 255, 255, 0.1)',
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${categoryColor}40`
                        }
                    }}
                />
            </Fade>
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto', p: 2 }}>
            {/* Title */}
            <Typography variant="h5" fontWeight={700} gutterBottom>
                {t('quickInterests.title', 'Agrega intereses rápidamente')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('quickInterests.subtitle', 'Ayúdanos a encontrar personas afines a ti')}
            </Typography>

            {/* Search Bar */}
            <TextField
                fullWidth
                placeholder={t('quickInterests.search', 'Buscar intereses...')}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                        <InputAdornment position="end">
                            <IconButton size="small" onClick={() => handleSearch('')}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </InputAdornment>
                    )
                }}
                sx={{ mb: 3 }}
            />

            {/* Search Results */}
            <Collapse in={searchResults.length > 0}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {t('quickInterests.searchResults', 'Resultados')}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {searchResults.map(interest => renderInterestChip(interest, '#9C27B0'))}
                    </Box>
                </Box>
            </Collapse>

            {/* Selected Interests */}
            <Collapse in={selectedInterests.size > 0}>
                <Box sx={{ mb: 4, p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        {t('quickInterests.yourInterests', 'Tus Intereses')} ({selectedInterests.size})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {Array.from(selectedInterests).map(name => {
                            const interest = suggestions.find(s => s.name === name) ||
                                Object.values(categorizedInterests || {}).flat().find((i: any) => i.name === name);
                            if (!interest) return null;
                            return renderInterestChip(interest as Interest, '#FF6B6B');
                        })}
                    </Box>
                </Box>
            </Collapse>

            {/* Suggestions */}
            {suggestions.length > 0 && !searchQuery && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        {t('quickInterests.suggested', '✨ Sugeridos para ti')}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {suggestions.map(interest => renderInterestChip(interest, '#9C27B0'))}
                    </Box>
                </Box>
            )}

            {/* Categorized Interests */}
            {!searchQuery && categorizedInterests && Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
                const interests = categorizedInterests[category as keyof CategorizedInterests] || [];

                return (
                    <Box key={category} sx={{ mb: 4 }}>
                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            sx={{ color: config.color, mb: 1.5 }}
                        >
                            {config.title}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {interests.map(interest => renderInterestChip(interest, config.color))}
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
}
