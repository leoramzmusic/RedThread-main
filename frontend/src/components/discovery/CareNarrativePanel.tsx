import React, { useState } from 'react';
import { Box, Typography, Stack, IconButton, Fade, Tooltip, ButtonBase } from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Profile } from '../profile/ProfileCard';
import { useUI } from '../../context/UIContext';
import { useAppTheme } from '../../context/ThemeContext';
import { keyframes, styled } from '@mui/system';

interface CareNarrativePanelProps {
    profile: Profile;
    isVisible: boolean;
    mobileOpen?: boolean;
    standalone?: boolean;
}

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(225, 190, 231, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(225, 190, 231, 0); }
  100% { box-shadow: 0 0 0 0 rgba(225, 190, 231, 0); }
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

export default function CareNarrativePanel({ profile, isVisible, mobileOpen = false, standalone = false }: CareNarrativePanelProps) {
    const { mode } = useAppTheme();
    const isLight = mode === 'light';
    const { drawerWidth } = useUI();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    if (!profile || !isVisible) return null;

    const highlights = profile.match_highlights || [];

    return (
        <Fade in={isVisible} timeout={800}>
            <Box sx={{
                ...(standalone ? {
                    width: '100%',
                    position: 'relative',
                    left: 'auto',
                    top: 'auto',
                    transform: 'none',
                    zIndex: 1,
                    display: 'block'
                } : {
                    width: (isExpanded || mobileOpen) ? 280 : 0,
                    position: 'fixed',
                    left: drawerWidth + 24,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    display: { xs: mobileOpen ? 'block' : 'none', lg: 'block' },
                    ...(mobileOpen && {
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '90%',
                        maxWidth: 320,
                    }),
                }),
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
                {/* Toggle Button - Premium Design (Desktop Only) */}
                {!mobileOpen && (
                    <Box sx={{
                        position: 'absolute',
                        left: isExpanded ? 240 : 0, // Positioned relative to the panel or screen edge
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 11,
                        transition: 'left 0.4s ease'
                    }}>
                        <ToggleContainer
                            onClick={() => setIsExpanded(!isExpanded)}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            sx={{
                                bgcolor: isExpanded ? '#FF4081' : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.6)'),
                                backdropFilter: 'blur(8px)',
                                color: isExpanded ? 'white' : (isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)'),
                                border: '1px solid',
                                borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                                boxShadow: isExpanded ? '0 4px 20px rgba(255, 64, 129, 0.4)' : (isLight ? '0 4px 12px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.3)'),
                                minWidth: isExpanded ? '48px' : '180px',
                                justifyContent: isExpanded ? 'center' : 'flex-start'
                            }}
                        >
                            <PsychologyIcon fontSize="small" />

                            {!isExpanded && (
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '16px' }}>
                                    CARE Interpreta
                                </Typography>
                            )}

                            {isExpanded && <ChevronLeftIcon fontSize="small" />}

                            {/* Floating CARE phrase on hover */}
                            {isHovered && !isExpanded && (
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
                                    “¿Quieres entender la sintonía emocional?”
                                </Typography>
                            )}

                            {isHovered && isExpanded && (
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
                                    “Interpretando tu hilo actual...”
                                </Typography>
                            )}
                        </ToggleContainer>
                    </Box>
                )}

                <Box sx={{
                    p: 3,
                    borderRadius: 6,
                    bgcolor: (standalone || !isLight) ? 'rgba(18, 18, 20, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid',
                    borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255, 255, 255, 0.08)',
                    boxShadow: isLight ? '0 8px 32px rgba(0,0,0,0.08)' : '0 12px 40px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3.5,
                    opacity: (isExpanded || mobileOpen || standalone) ? 1 : 0,
                    visibility: (isExpanded || mobileOpen || standalone) ? 'visible' : 'hidden',
                    transform: (isExpanded || mobileOpen || standalone) ? 'translateX(0)' : 'translateX(-20px)',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    width: standalone ? '100%' : 280,
                    boxSizing: 'border-box',
                    color: isLight ? 'text.primary' : 'white'
                }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                            p: 1,
                            borderRadius: '12px',
                            bgcolor: 'rgba(171, 71, 188, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <PsychologyIcon sx={{ fontSize: 24, color: '#AB47BC' }} />
                        </Box>
                        <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: 0.5, fontSize: '1.1rem' }}>
                            CARE Interpreta
                        </Typography>
                    </Box>

                    {/* Narrative Fragments */}
                    <Box>
                        <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, mb: 1.5, display: 'block' }}>
                            NARRATIVA DEL MATCH
                        </Typography>
                        <Stack spacing={2.5}>
                            {highlights.map((text, i) => (
                                <Box key={i} sx={{ position: 'relative', pl: 2.5 }}>
                                    <Box sx={{
                                        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                                        bgcolor: '#AB47BC', borderRadius: 1, opacity: 0.8
                                    }} />
                                    <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.95, lineHeight: 1.6, fontSize: '0.9rem' }}>
                                        "{text}"
                                    </Typography>
                                </Box>
                            ))}
                            {highlights.length === 0 && (
                                <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.6 }}>
                                    Sincronizando hilos narrativos...
                                </Typography>
                            )}
                        </Stack>
                    </Box>

                    {/* Microcopy Emocional */}
                    <Box>
                        <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, mb: 1.5, display: 'block' }}>
                            SINTONÍA VISUAL
                        </Typography>
                        <Box sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: 'rgba(144, 202, 249, 0.05)',
                            border: '1px solid rgba(144, 202, 249, 0.1)'
                        }}>
                            <Typography variant="body2" sx={{ color: '#90CAF9', fontWeight: 600, lineHeight: 1.5 }}>
                                {profile.context_advice || "¿Quieres iniciar con una canción que te marcó?"}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Rituales Sugeridos */}
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                            <AutoAwesomeIcon sx={{ fontSize: 18, color: '#FFD700' }} />
                            <Typography variant="overline" fontWeight={800} sx={{ color: '#FFD700' }}>
                                RITUALES SUGERIDOS
                            </Typography>
                        </Stack>
                        <Stack spacing={1.5}>
                            {['Compartir playlist', 'Enviar escena favorita', 'Café simbólico'].map((ritual, i) => (
                                <Box key={i} sx={{
                                    p: 1.5, borderRadius: 2.5,
                                    bgcolor: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.08)',
                                        transform: 'translateX(6px)',
                                        borderColor: 'rgba(255,255,255,0.1)'
                                    }
                                }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#FFD700' }} />
                                    <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.75rem', letterSpacing: 0.5 }}>
                                        {ritual}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                </Box>
            </Box>
        </Fade>
    );
}
