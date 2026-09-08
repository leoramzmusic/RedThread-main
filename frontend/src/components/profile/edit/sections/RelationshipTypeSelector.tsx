import { Grid, Paper, Typography, Box, Tooltip, keyframes, Divider, Collapse, IconButton, useTheme, alpha, ButtonBase } from '@mui/material';
import { FavoriteBorder, ExpandMore as ExpandMoreIcon, ExpandMore, } from '@mui/icons-material';
import { Controller, Control, useWatch } from 'react-hook-form';
import { useState } from 'react';
import { RELATIONSHIP_TYPE_OPTIONS } from '../../../../constants/profileOptions';

interface RelationshipTypeSelectorProps {
    control: Control<any>;
    isDiscovery?: boolean;
}

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
`;

const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-6px) rotate(-3deg); }
  75% { transform: translateY(-6px) rotate(3deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

export default function RelationshipTypeSelector({ control, isDiscovery = false }: RelationshipTypeSelectorProps) {
    const theme = useTheme();
    const [isCollapsed, setIsCollapsed] = useState(!isDiscovery); // Open by default in discovery
    const relationshipColor = "#E91E63";

    // Group options by exclusivity level
    const exclusiveOptions = RELATIONSHIP_TYPE_OPTIONS.filter(opt => opt.group === 'exclusive');
    const openOptions = RELATIONSHIP_TYPE_OPTIONS.filter(opt => opt.group === 'open');

    return (
        <Box sx={{ width: '100%' }}>
            {/* Header - Hidden in Discovery */}
            {!isDiscovery && (
                <ButtonBase
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1.5,
                        px: 1.5,
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
                        <FavoriteBorder sx={{ mr: 1.5, color: relationshipColor }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                            Tipo de relación
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
                            color: 'text.secondary'
                        }}
                    >
                        <ExpandMore />
                    </Box>
                </ButtonBase>
            )}

            <Collapse in={!isCollapsed || isDiscovery}>
                <Box sx={{
                    p: isDiscovery ? 0 : 2.5,
                    borderRadius: isDiscovery ? 0 : 3,
                    border: isDiscovery ? 'none' : '1px solid',
                    borderColor: 'divider',
                    bgcolor: isDiscovery ? 'transparent' : alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: isDiscovery ? 'none' : 'blur(8px)',
                    boxShadow: isDiscovery ? 'none' : '0 4px 20px rgba(0,0,0,0.05)'
                }}>
                    <Typography variant="body2" color={isDiscovery ? 'rgba(255,255,255,0.7)' : "text.secondary"} paragraph sx={{ mb: 2 }}>
                        ¿Cómo te vinculas emocional y sexualmente?
                    </Typography>

                    <Box
                        sx={{
                            p: 2,
                            mb: 3,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: isDiscovery ? 'rgba(255,255,255,0.1)' : 'divider',
                            bgcolor: isDiscovery ? 'rgba(255,255,255,0.05)' : alpha(theme.palette.background.paper, 0.8),
                            backdropFilter: isDiscovery ? 'none' : 'blur(8px)',
                        }}
                    >
                        <Typography variant="caption" color={isDiscovery ? "white" : "text.secondary"} sx={{ fontStyle: 'italic', opacity: 0.8 }}>
                            💡 <strong>Tu tipo de relación</strong> define cómo te vinculas. <strong>Tu objetivo</strong> define qué buscas ahora.
                        </Typography>
                    </Box>

                    {/* Height Input */}
                    <Box sx={{ mb: 4 }}></Box>
                    <Controller
                        name="relationship_type"
                        control={control}
                        render={({ field }) => (
                            <Box>
                                {/* Exclusive Group */}
                                <Box sx={{ mb: 3 }}>
                                    <Typography
                                        variant="overline"
                                        sx={{
                                            color: isDiscovery ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            letterSpacing: 1,
                                            mb: 1.5,
                                            display: 'block'
                                        }}
                                    >
                                        Exclusividad
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {exclusiveOptions.map((option, index) => {
                                            const isSelected = field.value === option.value;
                                            return (
                                                <Grid item xs={12} sm={6} key={option.value}>
                                                    <Tooltip
                                                        title={option.description}
                                                        arrow
                                                        placement="top"
                                                        enterDelay={500}
                                                    >
                                                        <Paper
                                                            elevation={0}
                                                            onClick={() => field.onChange(option.value)}
                                                            sx={{
                                                                p: 2,
                                                                cursor: 'pointer',
                                                                border: '2px solid',
                                                                borderColor: isSelected ? '#E91E63' : 'divider',
                                                                bgcolor: isSelected ? 'rgba(233, 30, 99, 0.08)' : 'background.paper',
                                                                transition: 'all 0.3s ease',
                                                                height: '100%',
                                                                minHeight: 100,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                textAlign: 'center',
                                                                position: 'relative',
                                                                overflow: 'visible',
                                                                animation: `${fadeInUp} 0.5s ease-out ${index * 0.15}s both`,
                                                                '&:hover': {
                                                                    borderColor: isSelected ? '#E91E63' : 'text.secondary',
                                                                    transform: 'translateY(-4px)',
                                                                    boxShadow: isSelected
                                                                        ? '0 8px 24px rgba(233, 30, 99, 0.3)'
                                                                        : '0 4px 12px rgba(0,0,0,0.1)',
                                                                    '& .emoji-icon': {
                                                                        animation: `${float} 0.6s ease-in-out infinite`
                                                                    }
                                                                },
                                                                '&:active': {
                                                                    transform: 'scale(0.98)'
                                                                }
                                                            }}
                                                        >
                                                            <Box
                                                                className="emoji-icon"
                                                                sx={{
                                                                    fontSize: '40px !important',
                                                                    lineHeight: 1,
                                                                    mb: 1.5,
                                                                    transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                                    animation: isSelected
                                                                        ? `${pulse} 1.5s infinite ease-in-out`
                                                                        : 'none',
                                                                    filter: isSelected
                                                                        ? 'drop-shadow(0 8px 16px rgba(233, 30, 99, 0.4))'
                                                                        : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                                                                    userSelect: 'none'
                                                                }}
                                                            >
                                                                {option.emoji}
                                                            </Box>
                                                            <Typography
                                                                variant="body1"
                                                                fontWeight={isSelected ? 700 : 500}
                                                                color={isSelected ? '#E91E63' : 'text.primary'}
                                                            >
                                                                {option.label}
                                                            </Typography>
                                                        </Paper>
                                                    </Tooltip>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Box>

                                <Divider sx={{ my: 3, opacity: 0.3 }} />

                                {/* Open/Flexible Group */}
                                <Box>
                                    <Typography
                                        variant="overline"
                                        sx={{
                                            color: isDiscovery ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            letterSpacing: 1,
                                            mb: 1.5,
                                            display: 'block'
                                        }}
                                    >
                                        Apertura y Flexibilidad
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {openOptions.map((option, index) => {
                                            const isSelected = field.value === option.value;
                                            const adjustedIndex = exclusiveOptions.length + index;
                                            return (
                                                <Grid item xs={12} sm={6} md={4} key={option.value}>
                                                    <Tooltip
                                                        title={option.description}
                                                        arrow
                                                        placement="top"
                                                        enterDelay={500}
                                                    >
                                                        <Paper
                                                            elevation={0}
                                                            onClick={() => field.onChange(option.value)}
                                                            sx={{
                                                                p: 2,
                                                                cursor: 'pointer',
                                                                border: '2px solid',
                                                                borderColor: isSelected ? '#9C27B0' : 'divider',
                                                                bgcolor: isSelected ? 'rgba(156, 39, 176, 0.08)' : 'background.paper',
                                                                transition: 'all 0.3s ease',
                                                                height: '100%',
                                                                minHeight: 100,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                textAlign: 'center',
                                                                position: 'relative',
                                                                overflow: 'visible',
                                                                animation: `${fadeInUp} 0.5s ease-out ${adjustedIndex * 0.15}s both`,
                                                                '&:hover': {
                                                                    borderColor: isSelected ? '#9C27B0' : 'text.secondary',
                                                                    transform: 'translateY(-4px)',
                                                                    boxShadow: isSelected
                                                                        ? '0 8px 24px rgba(156, 39, 176, 0.3)'
                                                                        : '0 4px 12px rgba(0,0,0,0.1)',
                                                                    '& .emoji-icon': {
                                                                        animation: `${float} 0.6s ease-in-out infinite`
                                                                    }
                                                                },
                                                                '&:active': {
                                                                    transform: 'scale(0.98)'
                                                                }
                                                            }}
                                                        >
                                                            <Box
                                                                className="emoji-icon"
                                                                sx={{
                                                                    fontSize: '40px !important',
                                                                    lineHeight: 1,
                                                                    mb: 1.5,
                                                                    transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                                    animation: isSelected
                                                                        ? `${pulse} 1.5s infinite ease-in-out`
                                                                        : 'none',
                                                                    filter: isSelected
                                                                        ? 'drop-shadow(0 8px 16px rgba(156, 39, 176, 0.4))'
                                                                        : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                                                                    userSelect: 'none'
                                                                }}
                                                            >
                                                                {option.emoji}
                                                            </Box>
                                                            <Typography
                                                                variant="body1"
                                                                fontWeight={isSelected ? 700 : 500}
                                                                color={isSelected ? '#9C27B0' : 'text.primary'}
                                                            >
                                                                {option.label}
                                                            </Typography>
                                                        </Paper>
                                                    </Tooltip>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Box>
                            </Box>
                        )}
                    />
                </Box>
            </Collapse>
        </Box>
    );

}
