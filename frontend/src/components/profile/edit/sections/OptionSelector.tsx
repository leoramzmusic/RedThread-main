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
    description?: string;
}

interface OptionSelectorProps {
    control: Control<any>;
    name: string;
    label: string;
    icon?: React.ReactElement<SvgIconProps>;
    options: Option[];
    defaultCollapsed?: boolean;
    color?: string;
    isDiscovery?: boolean;
}

const popIn = keyframes`
  0% { transform: scale(0.95); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export default function OptionSelector({
    control,
    name,
    label,
    icon,
    options,
    defaultCollapsed = true,
    color,
    isDiscovery = false
}: OptionSelectorProps) {
    const theme = useTheme();
    // Use custom color if provided, otherwise default to primary
    const categoryColor = color || theme.palette.primary.main;

    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    return (
        <Controller
            name={name}
            control={control}
            defaultValue=""
            render={({ field }) => {
                const currentValue = field.value || '';

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
                                py: isDiscovery ? 0.8 : 1,
                                px: isDiscovery ? 0 : 1,
                                mb: 0.5,
                                borderRadius: 2,
                                bgcolor: isDiscovery ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
                                border: isDiscovery ? 'none' : '1px solid',
                                borderBottom: isDiscovery && !isCollapsed ? '1px solid rgba(255,255,255,0.1)' : (isDiscovery ? 'none' : '1px solid'),
                                borderColor: 'divider',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: isDiscovery ? 'rgba(255,255,255,0.05)' : alpha(theme.palette.primary.main, 0.1),
                                    borderColor: isDiscovery ? 'rgba(255,255,255,0.2)' : theme.palette.primary.main,
                                }
                            }}
                        >
                            <Box display="flex" alignItems="center">
                                {icon && <Box sx={{ mr: 1.5, color: isDiscovery ? 'gold' : categoryColor, display: 'flex' }}>{icon}</Box>}
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: isDiscovery ? '0.9rem' : '1rem', color: isDiscovery ? 'white' : 'text.primary' }}>
                                    {label}
                                </Typography>
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
                                    color: isDiscovery ? 'white' : 'text.secondary'
                                }}
                            >
                                <ExpandMore />
                            </Box>
                        </ButtonBase>

                        <Collapse in={isDiscovery || !isCollapsed}>
                            <Box sx={{
                                p: isDiscovery ? 0.5 : 2,
                                border: isDiscovery ? 'none' : '1px solid',
                                borderColor: 'divider',
                                borderRadius: 3,
                                bgcolor: isDiscovery ? 'transparent' : 'background.paper'
                            }}>
                                <Box display="flex" flexWrap="wrap" gap={1} sx={{ flexDirection: options.some(o => o.description) ? 'column' : 'row' }}>
                                    {options.map((option) => {
                                        const isSelected = currentValue === option.value;
                                        const hasDescription = !!option.description;

                                        if (hasDescription) {
                                            return (
                                                <ButtonBase
                                                    key={option.value}
                                                    onClick={() => handleSelect(option.value)}
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-start',
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        bgcolor: isSelected ? (isDiscovery ? 'rgba(255,215,0,0.15)' : alpha(categoryColor, 0.1)) : 'transparent',
                                                        border: '1px solid',
                                                        borderColor: isSelected ? (isDiscovery ? 'gold' : categoryColor) : (isDiscovery ? 'rgba(255,255,255,0.1)' : 'divider'),
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            bgcolor: isDiscovery ? 'rgba(255,255,255,0.05)' : alpha(categoryColor, 0.05),
                                                            borderColor: isDiscovery ? 'rgba(255,255,255,0.3)' : categoryColor,
                                                        }
                                                    }}
                                                >
                                                    <Box display="flex" alignItems="center" width="100%">
                                                        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, color: isSelected ? (isDiscovery ? 'gold' : categoryColor) : (isDiscovery ? 'white' : 'text.primary') }}>
                                                            {option.label}
                                                        </Typography>
                                                        {isSelected && <CheckIcon sx={{ color: isDiscovery ? 'gold' : categoryColor, fontSize: 18 }} />}
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: isDiscovery ? 'rgba(255,255,255,0.6)' : 'text.secondary', mt: 0.5 }}>
                                                        {option.description}
                                                    </Typography>
                                                </ButtonBase>
                                            );
                                        }

                                        return (
                                            <Chip
                                                key={option.value}
                                                label={option.label}
                                                icon={isSelected ? <CheckIcon style={{ fontSize: 16, color: isDiscovery ? 'gold' : 'inherit' }} /> : undefined}
                                                onClick={() => handleSelect(option.value)}
                                                variant={isSelected ? "filled" : "outlined"}
                                                sx={{
                                                    cursor: 'pointer',
                                                    fontWeight: isSelected ? 600 : 500,
                                                    height: 32,
                                                    color: isSelected ? (isDiscovery ? 'black' : theme.palette.primary.contrastText) : (isDiscovery ? 'white' : 'text.primary'),

                                                    // Dynamic styling based on selection, consistent with theme
                                                    bgcolor: isSelected ? (isDiscovery ? 'gold' : categoryColor) : 'transparent',
                                                    borderColor: isSelected ? 'transparent' : (isDiscovery ? 'rgba(255,255,255,0.2)' : alpha(theme.palette.divider, 0.5)),

                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    animation: isSelected ? `${popIn} 0.2s ease-out` : 'none',
                                                    '&:hover': {
                                                        bgcolor: isSelected
                                                            ? (isDiscovery ? alpha('#FFD700', 0.9) : categoryColor)
                                                            : (isDiscovery ? 'rgba(255,255,255,0.1)' : alpha(categoryColor, 0.15)),
                                                        borderColor: isSelected ? 'transparent' : (isDiscovery ? 'rgba(255,255,255,0.5)' : categoryColor),
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
