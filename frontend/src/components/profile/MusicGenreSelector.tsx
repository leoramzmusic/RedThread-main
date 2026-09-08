import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    TextField,
    InputAdornment,
    keyframes,
    useTheme,
    alpha
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Search as SearchIcon,
    Check as CheckIcon,
    MusicNote as MusicIcon,
    Album as AlbumIcon,
    GraphicEq as ElectronicIcon,
    Public as WorldIcon,
    Piano as JazzIcon
} from '@mui/icons-material';

interface MusicGenreSelectorProps {
    selectedGenres: string[];
    onGenresChange: (genres: string[]) => void;
    editable?: boolean;
    showTitle?: boolean;
}

const GENRE_CATEGORIES = {
    pop_rock: {
        name: "Pop / Rock",
        color: '#E91E63', // Pink
        icon: <MusicIcon />,
        items: [
            "pop", "rock", "indie", "alternative", "punk", "hardcore", "emo", "grunge"
        ]
    },
    rock_subgenres: {
        name: "Rock Subgéneros",
        color: '#9C27B0', // Purple
        icon: <AlbumIcon />,
        items: [
            "classic_rock", "hard_rock", "heavy_metal", "death_metal", "black_metal", "progressive", "metal"
        ]
    },
    electronic: {
        name: "Electrónica",
        color: '#00BCD4', // Cyan
        icon: <ElectronicIcon />,
        items: [
            "edm", "techno", "house", "trance", "dubstep", "drum_and_bass", "ambient"
        ]
    },
    hip_hop_urban: {
        name: "Hip Hop / Urbano",
        color: '#FF9800', // Orange
        icon: <MusicIcon />,
        items: [
            "hip_hop", "rap", "trap", "r_and_b"
        ]
    },
    latin: {
        name: "Latino",
        color: '#F44336', // Red
        icon: <WorldIcon />,
        items: [
            "salsa", "bachata", "merengue", "cumbia", "ranchera", "mariachi", "banda", "reggaeton", "corridos"
        ]
    },
    jazz_blues: {
        name: "Jazz / Blues",
        color: '#3F51B5', // Indigo
        icon: <JazzIcon />,
        items: [
            "jazz", "blues", "country", "folk"
        ]
    },
    world: {
        name: "Mundial",
        color: '#4CAF50', // Green
        icon: <WorldIcon />,
        items: [
            "kpop", "jpop", "afrobeat", "flamenco", "bossa_nova", "samba", "tango"
        ]
    },
    other: {
        name: "Otros",
        color: '#607D8B', // Blue Grey
        icon: <MusicIcon />,
        items: [
            "classical", "opera", "soul", "funk", "disco", "reggae"
        ]
    }
};

const formatGenreLabel = (genre: string): string => {
    return genre
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const popIn = keyframes`
    0% {transform: scale(0.95); opacity: 0; }
    60% {transform: scale(1.05); opacity: 1; }
    100% {transform: scale(1); opacity: 1; }
`;

export default function MusicGenreSelector({
    selectedGenres,
    onGenresChange,
    editable = false,
    showTitle = true
}: MusicGenreSelectorProps) {
    const theme = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string | false>(false);

    // Auto-expand categories when searching
    useEffect(() => {
        if (searchTerm) {
            setExpandedCategory(false);
        }
    }, [searchTerm]);

    const handleToggleGenre = (genre: string) => {
        if (!editable) return;

        if (selectedGenres.includes(genre)) {
            onGenresChange(selectedGenres.filter(g => g !== genre));
        } else {
            // Limit to 25 genres max
            if (selectedGenres.length >= 25) return;
            onGenresChange([...selectedGenres, genre]);
        }
    };

    const handleCategoryChange = (category: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpandedCategory(isExpanded ? category : false);
    };

    // Filter categories and items based on search
    const filteredCategories = Object.entries(GENRE_CATEGORIES).map(([key, category]) => {
        const filteredItems = category.items.filter(item =>
            formatGenreLabel(item).toLowerCase().includes(searchTerm.toLowerCase())
        );
        return { key, category, filteredItems };
    }).filter(({ filteredItems }) => filteredItems.length > 0 || searchTerm === '');

    const isSearching = searchTerm.length > 0;

    return (
        <Box>
            {showTitle && (
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Géneros Musicales ({selectedGenres.length}/25 seleccionados)
                    </Typography>
                </Box>
            )}

            {editable && (
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar géneros..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ mb: 2 }}
                />
            )}

            <Box sx={{ maxHeight: editable ? 500 : 'auto', overflowY: 'auto', pr: 0.5 }}>
                {filteredCategories.map(({ key, category, filteredItems }) => {
                    const selectedCount = selectedGenres.filter(g => category.items.includes(g)).length;
                    const isExpanded = isSearching ? true : expandedCategory === key;

                    return (
                        <Accordion
                            key={key}
                            expanded={isExpanded}
                            onChange={!isSearching ? handleCategoryChange(key) : undefined}
                            disableGutters
                            elevation={0}
                            sx={{
                                mb: 1.5,
                                border: '1px solid',
                                borderColor: isExpanded ? alpha(category.color, 0.5) : 'divider',
                                borderRadius: 2,
                                '&:before': { display: 'none' },
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                boxShadow: isExpanded ? `0 4px 12px ${alpha(category.color, 0.15)}` : 'none',
                            }}
                        >
                            <AccordionSummary
                                expandIcon={!isSearching && <ExpandMoreIcon />}
                                sx={{
                                    bgcolor: isExpanded ? alpha(category.color, 0.08) : 'background.paper',
                                    minHeight: 56,
                                    '&.Mui-expanded': { minHeight: 56 },
                                    '&:hover': {
                                        bgcolor: isExpanded ? alpha(category.color, 0.12) : 'action.hover'
                                    }
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={1.5} width="100%">
                                    <Box
                                        sx={{
                                            color: isExpanded ? category.color : 'text.secondary',
                                            display: 'flex',
                                            transition: 'color 0.3s'
                                        }}
                                    >
                                        {category.icon}
                                    </Box>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontWeight: 600,
                                            color: isExpanded ? category.color : 'text.primary',
                                            flexGrow: 1
                                        }}
                                    >
                                        {category.name}
                                    </Typography>

                                    {selectedCount > 0 && (
                                        <Chip
                                            label={selectedCount}
                                            size="small"
                                            sx={{
                                                height: 24,
                                                minWidth: 24,
                                                bgcolor: category.color,
                                                color: 'white',
                                                fontWeight: 700,
                                                fontSize: '0.75rem',
                                                mr: 1,
                                                animation: `${popIn} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)`
                                            }}
                                        />
                                    )}
                                </Box>
                            </AccordionSummary>

                            <AccordionDetails sx={{ bgcolor: 'background.default', p: 2 }}>
                                <Box display="flex" flexWrap="wrap" gap={1}>
                                    {filteredItems.map((genre) => {
                                        const isSelected = selectedGenres.includes(genre);
                                        return (
                                            <Chip
                                                key={genre}
                                                label={formatGenreLabel(genre)}
                                                icon={isSelected ? <CheckIcon style={{ fontSize: 16 }} /> : undefined}
                                                onClick={() => handleToggleGenre(genre)}
                                                component="div"
                                                role="button"
                                                aria-pressed={isSelected}
                                                variant={isSelected ? "filled" : "outlined"}
                                                sx={{
                                                    cursor: editable ? 'pointer' : 'default',
                                                    fontWeight: isSelected ? 600 : 400,
                                                    color: isSelected ? 'white' : 'text.primary',
                                                    bgcolor: isSelected ? category.color : 'transparent',
                                                    borderColor: isSelected ? 'transparent' : alpha(theme.palette.divider, 0.5),
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    animation: isSelected ? `${popIn} 0.3s ease-out` : 'none',
                                                    '&:hover': {
                                                        bgcolor: isSelected
                                                            ? category.color
                                                            : alpha(category.color, 0.15),
                                                        borderColor: isSelected ? 'transparent' : category.color,
                                                        transform: editable ? 'translateY(-2px)' : 'none',
                                                        boxShadow: editable ? `0 4px 8px ${alpha(category.color, 0.2)}` : 'none'
                                                    }
                                                }}
                                            />
                                        );
                                    })}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    );
                })}
                {filteredCategories.length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                        No se encontraron géneros.
                    </Typography>
                )}
            </Box>

            {!editable && selectedGenres.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                    No hay géneros seleccionados
                </Typography>
            )}
        </Box>
    );
}
