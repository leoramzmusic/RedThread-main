import { useState } from 'react';
import {
    Box,
    Typography,
    Chip,
    keyframes,
    Alert,
    AlertTitle,
    alpha,
    useTheme,
    ButtonBase,
    Collapse,
    IconButton
} from '@mui/material';
import {
    Check as CheckIcon,
    Info as InfoIcon,
    ExpandMore,
    LocalBar as BarIcon
} from '@mui/icons-material';
import { Controller, Control } from 'react-hook-form';

interface DrinkingSelectorProps {
    control: Control<any>;
}

const DRINKING_OPTIONS = [
    { value: 'not_my_thing', label: '🚫 No es lo mío' },
    { value: 'no_alcohol', label: '🥤 No bebo alcohol' },
    { value: 'exploring_sobriety', label: '🌱 Explorando la sobriedad' },
    { value: 'special_occasions', label: '🎉 En ocasiones especiales' },
    { value: 'socially', label: '🍻 Socialmente' },
    { value: 'weekends', label: '🍷 Los fines de semana' },
    { value: 'almost_daily', label: '⚠️ Casi diario' }
];

const popIn = keyframes`
  0% { transform: scale(0.95); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export default function DrinkingSelector({ control }: DrinkingSelectorProps) {
    const theme = useTheme();
    // Using custom color for "Drinking" section (Orange)
    const categoryColor = '#FF9800';

    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <Controller
            name="drinking"
            control={control}
            defaultValue=""
            render={({ field }) => {
                const currentValue = field.value || '';
                const selectedLabel = DRINKING_OPTIONS.find(opt => opt.value === currentValue)?.label;

                const handleSelect = (value: string) => {
                    // Allow toggling off if clicking the same value
                    if (currentValue === value) {
                        field.onChange('');
                    } else {
                        field.onChange(value);
                    }
                };

                return (
                    <Box sx={{ width: '100%' }}>
                        {/* Collapsible Header */}
                        <ButtonBase
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
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    borderColor: theme.palette.primary.main,
                                }
                            }}
                        >
                            <Box display="flex" alignItems="center">
                                <BarIcon sx={{ color: categoryColor, mr: 1.5 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                    ¿Cada cuánto bebes?
                                </Typography>


                            </Box>

                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    p: 1, // Simulate IconButton padding
                                    borderRadius: '50%', // Simulate IconButton shape
                                    transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                                    transition: 'transform 0.3s',
                                    color: 'text.secondary'
                                }}
                            >
                                <ExpandMore />
                            </Box>
                        </ButtonBase>

                        <Collapse in={!isCollapsed}>
                            <Box sx={{
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 3,
                                bgcolor: 'background.paper'
                            }}>
                                <Box display="flex" flexWrap="wrap" gap={1}>
                                    {DRINKING_OPTIONS.map((option) => {
                                        const isSelected = currentValue === option.value;
                                        return (
                                            <Chip
                                                key={option.value}
                                                label={option.label}
                                                icon={isSelected ? <CheckIcon style={{ fontSize: 16 }} /> : undefined}
                                                onClick={() => handleSelect(option.value)}
                                                variant={isSelected ? "filled" : "outlined"}
                                                sx={{
                                                    cursor: 'pointer',
                                                    fontWeight: isSelected ? 600 : 500,
                                                    height: 32,
                                                    color: isSelected ? theme.palette.primary.contrastText : 'text.primary',

                                                    // Dynamic styling based on selection, consistent with theme
                                                    bgcolor: isSelected ? categoryColor : 'transparent',
                                                    borderColor: isSelected ? 'transparent' : alpha(theme.palette.divider, 0.5),

                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    animation: isSelected ? `${popIn} 0.2s ease-out` : 'none',
                                                    '&:hover': {
                                                        bgcolor: isSelected
                                                            ? categoryColor
                                                            : alpha(categoryColor, 0.15),
                                                        borderColor: isSelected ? 'transparent' : categoryColor,
                                                        transform: 'translateY(-1px)',
                                                    },
                                                }}
                                            />
                                        );
                                    })}
                                </Box>

                                {/* Conditional Warning for "Almost Daily" */}
                                {currentValue === 'almost_daily' && (
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
                                        <AlertTitle sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Consumo Responsable</AlertTitle>
                                        <Typography variant="caption" display="block" sx={{ lineHeight: 1.5, color: 'text.primary' }}>
                                            Recuerda moderar tu consumo de alcohol. El consumo frecuente puede afectar tu salud y bienestar.
                                            Si lo deseas, explora opciones de sobriedad o hábitos más saludables.
                                        </Typography>
                                    </Alert>
                                )}
                            </Box>
                        </Collapse>
                    </Box>
                );
            }}
        />
    );
}
