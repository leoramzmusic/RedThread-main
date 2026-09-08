import { useState } from 'react';
import {
    Box,
    Typography,
    Chip,
    keyframes,
    alpha,
    useTheme,
    ButtonBase,
    Collapse,
    IconButton
} from '@mui/material';
import {
    Check as CheckIcon,
    ExpandMore,
    FitnessCenter as ExerciseIcon
} from '@mui/icons-material';
import { Controller, Control } from 'react-hook-form';

interface ExerciseSelectorProps {
    control: Control<any>;
}

const EXERCISE_OPTIONS = [
    { value: 'no_exercise', label: '🛋️ No hago ejercicio' },
    { value: 'walks', label: '🚶 Camino ocasionalmente' },
    { value: 'yoga', label: '🧘 Practico yoga o meditación' },
    { value: 'sometimes', label: '🏃‍♂️ A veces' },
    { value: 'active', label: '🏋️ Activo regularmente' },
    { value: 'daily', label: '💪 Todos los días' }
];

const popIn = keyframes`
  0% { transform: scale(0.95); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export default function ExerciseSelector({ control }: ExerciseSelectorProps) {
    const theme = useTheme();
    // Light Green as requested
    const categoryColor = '#AED581';

    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <Controller
            name="exercise"
            control={control}
            defaultValue=""
            render={({ field }) => {
                const currentValue = field.value || '';

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
                                <ExerciseIcon sx={{ color: categoryColor, mr: 1.5 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                    ¿Haces ejercicio?
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
                                    {EXERCISE_OPTIONS.map((option) => {
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
                            </Box>
                        </Collapse>
                    </Box>
                );
            }}
        />
    );
}
