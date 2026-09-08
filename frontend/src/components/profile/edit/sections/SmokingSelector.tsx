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
    SmokingRooms as SmokingIcon
} from '@mui/icons-material';
import { Controller, Control } from 'react-hook-form';

interface SmokingSelectorProps {
    control: Control<any>;
}

const SMOKING_OPTIONS = [
    { value: 'no_smoke', label: '🚭 No fumo' },
    { value: 'exploring_quit', label: '🌱 Explorando dejarlo' },
    { value: 'occasionally', label: '🎉 Solo en ocasiones' },
    { value: 'socially', label: '🚬 Socialmente' },
    { value: 'sometimes', label: '⚠️ A veces' },
    { value: 'almost_daily', label: '⚠️ Casi diario' },
    { value: 'daily', label: '⚠️ Todos los días' }
];

const WARNING_VALUES = ['sometimes', 'almost_daily', 'daily'];

const popIn = keyframes`
  0% { transform: scale(0.95); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export default function SmokingSelector({ control }: SmokingSelectorProps) {
    const theme = useTheme();
    // Soft Orange as requested
    const categoryColor = '#FFAB91';

    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <Controller
            name="smoking"
            control={control}
            defaultValue=""
            render={({ field }) => {
                const currentValue = field.value || '';
                const selectedLabel = SMOKING_OPTIONS.find(opt => opt.value === currentValue)?.label;

                const handleSelect = (value: string) => {
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
                                <SmokingIcon sx={{ color: categoryColor, mr: 1.5 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                    ¿Cada cuánto fumas?
                                </Typography>


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
                            <Box sx={{
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 3,
                                bgcolor: 'background.paper'
                            }}>
                                <Box display="flex" flexWrap="wrap" gap={1}>
                                    {SMOKING_OPTIONS.map((option) => {
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
                                                    color: isSelected ? theme.palette.getContrastText(categoryColor) : 'text.primary',

                                                    // Dynamic styling based on selection
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

                                {/* Conditional Warning */}
                                {WARNING_VALUES.includes(currentValue) && (
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
                                            Fumar con frecuencia puede afectar tu salud y bienestar.
                                            Si lo deseas, explora opciones para reducir o dejar el hábito.
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
