import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    Chip,
    Divider,
    keyframes,
    IconButton,
    Collapse,
    ButtonBase,
    alpha,
    useTheme,
    Alert,
    AlertTitle
} from '@mui/material';
import {
    Search as SearchIcon,
    ExpandMore,
    Check as CheckIcon,
    Info as InfoIcon,
    Pets as PetsIcon
} from '@mui/icons-material';
import { Controller, Control } from 'react-hook-form';

interface PetsSelectorProps {
    control: Control<any>;
}

interface PetCategory {
    name: string;
    items: { value: string; label: string }[];
    color: string; // Base color for category
}

// Pet categories data with colors
const PET_CATEGORIES: Record<string, PetCategory> = {
    common_pets: {
        name: 'Mascotas comunes',
        color: '#FFB74D', // Orange
        items: [
            { value: 'dog', label: '🐶 Perro' },
            { value: 'cat', label: '🐱 Gato' }
        ]
    },
    birds: {
        name: 'Aves',
        color: '#FFF176', // Yellow
        items: [
            { value: 'parrot', label: '🦜 Perico' },
            { value: 'canary', label: '🐦 Canario' },
            { value: 'cockatiel', label: '🪶 Ninfa (Cockatiel)' },
            { value: 'lovebird', label: '💚 Agapornis (inseparables)' },
            { value: 'pigeon', label: '🕊️ Paloma doméstica' }
        ]
    },
    fish: {
        name: 'Peces',
        color: '#4FC3F7', // Cyan
        items: [
            { value: 'aquarium_fish', label: '🐠 Peces de acuario' },
            { value: 'tropical_fish', label: '🐡 Peces tropicales' },
            { value: 'saltwater_fish', label: '🐠 Peces de agua salada' },
            { value: 'goldfish', label: '🐟 Goldfish' },
            { value: 'betta', label: '🐟 Betta' },
            { value: 'guppy', label: '🐟 Guppy' },
            { value: 'cichlid', label: '🐟 Cíclidos' }

        ]
    },
    rodents: {
        name: 'Roedores',
        color: '#BCAAA4', // Brown
        items: [
            { value: 'hamster', label: '🐹 Hámster' },
            { value: 'guinea_pig', label: '🐭 Conejillo de indias' },
            { value: 'chinchilla', label: '🐿️ Chinchilla' },
            { value: 'mouse', label: '🐁 Ratón' },
            { value: 'gerbil', label: '🐭 Gerbo' },
            { value: 'rat', label: '🐀 Rata doméstica' },
            { value: 'degu', label: '🐭 Degú' }

        ]
    },
    reptiles: {
        name: 'Reptiles',
        color: '#81C784', // Green
        items: [
            { value: 'turtle', label: '🐢 Tortuga' },
            { value: 'lizard', label: '🦎 Lagarto' },
            { value: 'snake', label: '🐍 Serpiente' }
        ]
    },
    small_mammals: {
        name: 'Pequeños mamíferos',
        color: '#F48FB1', // Pink
        items: [
            { value: 'rabbit', label: '🐰 Conejo' },
            { value: 'ferret', label: '🦦 Hurón' },
            { value: 'squirrel', label: '🐿️ Ardilla doméstica' },

        ]
    },
    farm_animals: {
        name: 'Animales de granja',
        color: '#A1887F', // Earthy
        items: [
            { value: 'horse', label: '� Caballo' },
            { value: 'goat', label: '🐐 Cabra' },
            { value: 'pig', label: '🐖 Cerdo' },
            { value: 'cow', label: '🐄 Vaca' },
            { value: 'chicken', label: '🐓 Gallina' },
            { value: 'turkey', label: '🦃 Pavo' },
            { value: 'duck', label: '🦆 Pato' },
        ]
    },
    other_pets: {
        name: 'Otros',
        color: '#90CAF9', // Blue Grey
        items: [
            { value: 'hedgehog', label: '🦔 Erizo' },
            { value: 'spider', label: '🕷️ Araña' },
            { value: 'scorpion', label: '🦂 Escorpión' },
            { value: 'snail', label: '🐌 Caracol' },
            { value: 'frog', label: '🐸 Rana' },
            { value: 'salamander', label: '🦎 Salamandra / Ajolote' }

        ]
    },
    lifestyle: {
        name: 'Estilo de vida',
        color: '#9575CD', // Purple
        items: [
            { value: 'other_exotic', label: '🐾 Tengo otro tipo de mascotas' },
            { value: 'want_pet', label: '🐣 Quiero una mascota' },
            { value: 'allergic', label: '🤧 Me dan alergia las mascotas' },
            { value: 'dont_like', label: '❌ No me gustan las mascotas' }
        ]
    }
};

const popIn = keyframes`
  0% { transform: scale(0.95); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export default function PetsSelector({ control }: PetsSelectorProps) {
    const theme = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [prevCount, setPrevCount] = useState(0);

    return (
        <Controller
            name="pets"
            control={control}
            defaultValue={[] as string[]}
            render={({ field }) => {
                const currentValue = (field.value as string[]) || [];

                useEffect(() => {
                    if (currentValue.length !== prevCount) {
                        setPrevCount(currentValue.length);
                    }
                }, [currentValue.length]);

                const handleTogglePet = (petValue: string) => {
                    if (currentValue.includes(petValue)) {
                        field.onChange(currentValue.filter(v => v !== petValue));
                    } else {
                        field.onChange([...currentValue, petValue]);
                    }
                };

                const filteredCategories = Object.entries(PET_CATEGORIES).map(([key, category]) => {
                    const categoryMatches = category.name.toLowerCase().includes(searchTerm.toLowerCase());
                    let filteredItems = category.items;
                    if (!categoryMatches) {
                        filteredItems = category.items.filter(item =>
                            item.label.toLowerCase().includes(searchTerm.toLowerCase())
                        );
                    }
                    return { key, category, filteredItems };
                }).filter(({ filteredItems }) => filteredItems.length > 0);

                return (
                    <Box sx={{ width: '100%' }}>
                        <ButtonBase
                            component="div"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            sx={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                py: 1,
                                px: 1,
                                mb: 0.5,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                border: '1px solid',
                                borderColor: 'divider',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    borderColor: theme.palette.primary.main,
                                }
                            }}
                        >
                            <Box display="flex" alignItems="center">
                                <PetsIcon sx={{ color: '#4CAF50', mr: 1.5 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                    ¿Tienes Mascotas?
                                </Typography>
                                {currentValue.length > 0 && (
                                    <Chip
                                        size="small"
                                        label={`${currentValue.length} selec.`}
                                        color="primary"
                                        sx={{
                                            ml: 1.5,
                                            fontWeight: 600,
                                            height: 24,
                                            animation: `${popIn} 0.3s ease-out`
                                        }}
                                    />
                                )}
                            </Box>
                            <IconButton
                                size="small"
                                sx={{
                                    transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                                    transition: 'transform 0.3s',
                                    color: 'text.secondary'
                                }}
                            >
                                <ExpandMore />
                            </IconButton>
                        </ButtonBase>

                        <Collapse in={!isCollapsed}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="🔍 Buscar mascota, tipo o categoría..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: 'background.paper'
                                    }
                                }}
                            />

                            <Box sx={{
                                maxHeight: 450,
                                overflowY: 'auto',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 3,
                                bgcolor: 'background.paper'
                            }}>
                                {filteredCategories.map(({ key, category, filteredItems }, index) => (
                                    <Box
                                        key={key}
                                        sx={{
                                            p: 2,
                                            // Zebra striping
                                            bgcolor: index % 2 === 0 ? 'transparent' : alpha(theme.palette.action.hover, 0.3),
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                fontWeight: 700,
                                                mb: 1.5,
                                                color: category.color,
                                                filter: 'brightness(0.8)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                fontSize: '0.8rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px'
                                            }}
                                        >
                                            {category.name}
                                        </Typography>

                                        {/* Horizontal Flow Container */}
                                        <Box display="flex" flexWrap="wrap" gap={1}>
                                            {filteredItems.map((pet) => {
                                                const isSelected = currentValue.includes(pet.value);
                                                return (
                                                    <Chip
                                                        key={pet.value}
                                                        label={pet.label}
                                                        icon={isSelected ? <CheckIcon style={{ fontSize: 16 }} /> : undefined}
                                                        onClick={() => handleTogglePet(pet.value)}
                                                        variant={isSelected ? "filled" : "outlined"}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            fontWeight: isSelected ? 600 : 500,
                                                            color: isSelected ? 'white' : 'text.primary',
                                                            bgcolor: isSelected ? category.color : 'transparent',
                                                            borderColor: isSelected ? 'transparent' : alpha(theme.palette.divider, 0.5),
                                                            ...(isSelected && ['common_pets', 'birds', 'birds', 'rodents', 'small_mammals'].includes(key) && {
                                                                color: 'rgba(0,0,0,0.8)',
                                                                '& .MuiChip-icon': { color: 'rgba(0,0,0,0.6)' }
                                                            }),
                                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            animation: isSelected ? `${popIn} 0.2s ease-out` : 'none',
                                                            '&:hover': {
                                                                bgcolor: isSelected
                                                                    ? category.color
                                                                    : alpha(category.color, 0.15),
                                                                borderColor: isSelected ? 'transparent' : category.color,
                                                                transform: 'translateY(-1px)',
                                                            },
                                                        }}
                                                    />
                                                );
                                            })}
                                        </Box>

                                        {/* Warning Message outside flex-wrap container but inside category block */}
                                        {key === 'lifestyle' && currentValue.includes('other_exotic') && (
                                            <Alert
                                                severity="info"
                                                icon={<InfoIcon fontSize="small" />}
                                                sx={{
                                                    mt: 2,
                                                    borderRadius: 2,
                                                    bgcolor: alpha(theme.palette.info.main, 0.05),
                                                    '& .MuiAlert-message': { width: '100%' }
                                                }}
                                            >
                                                <AlertTitle sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Nota Importante</AlertTitle>
                                                <Typography variant="caption" display="block" sx={{ lineHeight: 1.5, color: 'text.primary' }}>
                                                    En RedThread no fomentamos la adquisición de animales exóticos o en riesgo.
                                                    Por respeto a la biodiversidad y las leyes locales, no solicitamos que especifiques qué tipo de mascota tienes si no aparece en la lista.
                                                </Typography>
                                            </Alert>
                                        )}
                                    </Box>
                                ))}

                                {filteredCategories.length === 0 && (
                                    <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                                        No se encontraron mascotas.
                                    </Typography>
                                )}
                            </Box>
                        </Collapse>
                    </Box>
                );
            }}
        />
    );
}
