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
    SvgIconProps
} from '@mui/material';
import {
    Check as CheckIcon,
    ExpandMore,
} from '@mui/icons-material';
import { Controller, Control } from 'react-hook-form';

interface Option {
    value: string;
    label: string;
}

interface MultiOptionSelectorProps {
    control: Control<any>;
    name: string;
    label: string;
    icon?: React.ReactElement<SvgIconProps>;
    options: Option[];
    defaultCollapsed?: boolean;
    color?: string;
}

const popIn = keyframes`
  0% { transform: scale(0.95); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export default function MultiOptionSelector({
    control,
    name,
    label,
    icon,
    options,
    defaultCollapsed = true,
    color
}: MultiOptionSelectorProps) {
    const theme = useTheme();
    const categoryColor = color || theme.palette.primary.main;
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    return (
        <Controller
            name={name}
            control={control}
            defaultValue={[]}
            render={({ field }) => {
                const currentValues = Array.isArray(field.value) ? field.value : [];

                const handleToggle = (value: string) => {
                    const newValues = currentValues.includes(value)
                        ? currentValues.filter((v: string) => v !== value)
                        : [...currentValues, value];
                    field.onChange(newValues);
                };

                return (
                    <Box sx={{ width: '100%' }}>
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
                                {icon && <Box sx={{ mr: 1.5, color: categoryColor, display: 'flex' }}>{icon}</Box>}
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                    {label}
                                </Typography>
                                {currentValues.length > 0 && (
                                    <Chip
                                        label={currentValues.length}
                                        size="small"
                                        sx={{ ml: 1, height: 20, bgcolor: categoryColor, color: '#fff', fontWeight: 700 }}
                                    />
                                )}
                            </Box>

                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    p: 1,
                                    borderRadius: '50%',
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
                                    {options.map((option) => {
                                        const isSelected = currentValues.includes(option.value);
                                        return (
                                            <Chip
                                                key={option.value}
                                                label={option.label}
                                                icon={isSelected ? <CheckIcon style={{ fontSize: 16 }} /> : undefined}
                                                onClick={() => handleToggle(option.value)}
                                                variant={isSelected ? "filled" : "outlined"}
                                                sx={{
                                                    cursor: 'pointer',
                                                    fontWeight: isSelected ? 600 : 500,
                                                    height: 32,
                                                    color: isSelected ? '#fff' : 'text.primary',
                                                    bgcolor: isSelected ? categoryColor : 'transparent',
                                                    borderColor: isSelected ? 'transparent' : alpha(theme.palette.divider, 0.5),
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    animation: isSelected ? `${popIn} 0.2s ease-out` : 'none',
                                                    '&:hover': {
                                                        bgcolor: isSelected ? categoryColor : alpha(categoryColor, 0.15),
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
