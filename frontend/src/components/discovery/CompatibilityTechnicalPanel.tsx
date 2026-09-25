import React, { useState } from 'react';
import { Box, Typography, Stack, LinearProgress, Button, Fade, IconButton, Tooltip, ButtonBase } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BoltIcon from '@mui/icons-material/Bolt';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import BarChartIcon from '@mui/icons-material/BarChart';
import { Profile } from '../profile/ProfileCard';
import { useAppTheme } from '../../context/ThemeContext';
import { keyframes, styled } from '@mui/system';

interface CompatibilityTechnicalPanelProps {
    profile: Profile;
    isVisible: boolean;
    onViewProfile: (p: Profile) => void;
    mobileOpen?: boolean;
    standalone?: boolean;
}

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(255, 107, 107, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0); }
`;

const floatMessage = keyframes`
  0% { transform: translateY(0); opacity: 0; }
  20% { opacity: 0.9; }
  80% { opacity: 0.9; }
  100% { transform: translateY(-10px); opacity: 0; }
`;

const ToggleContainer = styled(ButtonBase)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    height: '48px',
    padding: '0 16px',
    borderRadius: '12px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    '&:hover': {
        animation: `${pulse} 1.5s infinite`,
        '& .care-tip': {
            display: 'block',
            animation: `${floatMessage} 2s forwards`
        }
    }
}));

export default function CompatibilityTechnicalPanel({ profile, isVisible, onViewProfile, mobileOpen = false, standalone = false }: CompatibilityTechnicalPanelProps) {
    const { mode } = useAppTheme();
    const isLight = mode === 'light';
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    if (!profile || !isVisible) return null;

    const breakdown = profile.affinity_breakdown || {
        interests: 85,
        lifestyle: 70,
        personality: 65,
        identity: 90
    };

    return (
        <Fade in={isVisible} timeout={800}>
            <Box sx={{
                ...(standalone ? {
                    width: '100%',
                    position: 'relative',
                    right: 'auto',
                    top: 'auto',
                    transform: 'none',
                    zIndex: 1,
                    display: 'block'
                } : {
                    width: (isExpanded || mobileOpen) ? 280 : 0,
                    position: 'fixed',
                    right: isExpanded ? 40 : 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    display: { xs: mobileOpen ? 'block' : 'none', lg: 'block' },
                    ...(mobileOpen && {
                        right: '50%',
                        transform: 'translate(50%, -50%)',
                        width: '90%',
                        maxWidth: 320,
                    }),
                }),
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
                {/* Toggle Button - Premium Design (Desktop Only) */}
                {!mobileOpen && !standalone && (
                    <Box sx={{
                        position: 'absolute',
                        right: isExpanded ? 260 : 0, // Positioned relative to the panel or screen edge
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 11,
                        transition: 'right 0.4s ease'
                    }}>
                        <ToggleContainer
                            onClick={() => setIsExpanded(!isExpanded)}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            sx={{
                                bgcolor: isExpanded ? 'primary.main' : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.6)'),
                                backdropFilter: 'blur(8px)',
                                color: isExpanded ? 'white' : (isLight ? 'rgba(0,0,0,0.6)' : 'white'),
                                border: '1px solid',
                                borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                                boxShadow: isExpanded ? '0 4px 20px rgba(255, 77, 79, 0.4)' : (isLight ? '0 4px 12px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.3)'),
                                minWidth: isExpanded ? '48px' : '200px',
                                justifyContent: isExpanded ? 'center' : 'flex-end',
                                flexDirection: 'row-reverse'
                            }}
                        >
                            <BarChartIcon fontSize="small" />

                            {!isExpanded && (
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '16px', mr: 1 }}>
                                    Compatibilidad
                                </Typography>
                            )}

                            {isExpanded && <ChevronRightIcon fontSize="small" />}

                            {/* Floating CARE phrase on hover */}
                            {isHovered && !isExpanded && (
                                <Typography
                                    className="care-tip"
                                    variant="caption"
                                    sx={{
                                        position: 'absolute',
                                        top: -30,
                                        right: 0,
                                        width: 'max-content',
                                        color: '#E1BEE7',
                                        fontWeight: 600,
                                        fontStyle: 'italic',
                                        pointerEvents: 'none',
                                        display: 'none'
                                    }}
                                >
                                    “¿Te interesa el desglose técnico del match?”
                                </Typography>
                            )}

                            {isHovered && isExpanded && (
                                <Typography
                                    className="care-tip"
                                    variant="caption"
                                    sx={{
                                        position: 'absolute',
                                        top: -30,
                                        left: 0,
                                        width: 'max-content',
                                        color: '#E1BEE7',
                                        fontWeight: 600,
                                        fontStyle: 'italic',
                                        pointerEvents: 'none',
                                        display: 'none'
                                    }}
                                >
                                    “Analizando compatibilidad profunda...”
                                </Typography>
                            )}
                        </ToggleContainer>
                    </Box>
                )}

                <Box sx={{
                    p: { xs: 2.5, sm: 3 },
                    borderRadius: { xs: '8px', sm: '12px' },
                    bgcolor: standalone ? '#121214' : (isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.4)'),
                    backdropFilter: 'blur(12px)',
                    border: '1px solid',
                    borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.06)' : '0 6px 20px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    opacity: (isExpanded || mobileOpen || standalone) ? 1 : 0,
                    visibility: (isExpanded || mobileOpen || standalone) ? 'visible' : 'hidden',
                    transform: (isExpanded || mobileOpen || standalone) ? 'translateX(0)' : 'translateX(20px)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    width: standalone ? '100%' : 280,
                    boxSizing: 'border-box',
                    color: isLight ? 'text.primary' : 'inherit'
                }}>
                    {/* Header Score */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight={900} sx={{ color: 'primary.main', textShadow: '0 0 20px rgba(255, 77, 79, 0.3)' }}>
                            {Math.round(profile.affinity_score || 0)}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>
                            Compatibilidad total
                        </Typography>
                    </Box>

                    {/* Technical Breakdown */}
                    <Box>
                        <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, mb: 1.5, display: 'block' }}>
                            Desglose Técnico
                        </Typography>
                        <Stack spacing={2}>
                            {[
                                { label: 'Música & Gustos', val: (breakdown as any).interests },
                                { label: 'Creatividad', val: 80 }, // Mock if not in breakdown
                                { label: 'Valores & Metas', val: (breakdown as any).intent || (breakdown as any).values || 75 },
                                { label: 'Estilo de Vida', val: (breakdown as any).lifestyle },
                            ].map((item, i) => (
                                <Box key={i}>
                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.8 }}>{item.label}</Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 800 }}>{item.val}%</Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={item.val}
                                        sx={{
                                            height: 4, borderRadius: 1,
                                            bgcolor: 'rgba(255,255,255,0.05)',
                                            '& .MuiLinearProgress-bar': { borderRadius: 1 }
                                        }}
                                    />
                                </Box>
                            ))}
                        </Stack>
                    </Box>

                    {/* Balance Emocional */}
                    <Box>
                        <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, mb: 1, display: 'block' }}>
                            Balance Emocional
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap gap={1}>
                            {['Vínculo narrativo', 'Ritmo compartido', 'Propósito'].map((tag, i) => (
                                <Box key={i} sx={{
                                    px: 1.5, py: 0.5, borderRadius: 10,
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    bgcolor: 'rgba(255,255,255,0.05)'
                                }}>
                                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700 }}>{tag}</Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Box>

                    {/* Action Buttons */}
                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<VisibilityIcon />}
                            onClick={() => onViewProfile(profile)}
                            className="profile-details-btn"
                            sx={{
                                borderRadius: '12px',
                                py: 1.5,
                                textTransform: 'none',
                                fontWeight: 700,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.16)', transform: 'translateY(-1px)' },
                                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                                '@media (max-width:375px)': {
                                    fontSize: '0.7rem !important',
                                    py: '0.3rem !important',
                                    px: '0.6rem !important',
                                    my: '0.4rem !important',
                                    display: 'block !important',
                                    mx: 'auto !important',
                                },
                            }}
                        >
                            Ver perfil completo
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<BoltIcon />}
                            sx={{ borderRadius: '12px', py: 1.5, textTransform: 'none', fontWeight: 700, borderColor: 'primary.main', color: 'primary.main', '&:hover': { bgcolor: 'rgba(230,57,70,0.06)' }, transition: 'background-color 0.2s ease' }}
                        >
                            Enviar Hilo
                        </Button>
                    </Stack>
                </Box>
            </Box>
        </Fade>
    );
}
