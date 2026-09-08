
import React, { useState } from 'react';
import { Box, Typography, Popover, List, ListItem, ListItemText, Chip, Divider, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface CompatibilityBreakdown {
    common_interests: string[];
    common_lifestyle: string[];
    common_intentions: string[];
    unique_interests: string[];
    unique_lifestyle: string[];
    mode?: string;
}

interface CompatibilityMeterProps {
    score: number;
    breakdown?: CompatibilityBreakdown;
    size?: number;
}

export const CompatibilityMeter: React.FC<CompatibilityMeterProps> = ({ score, breakdown, size = 60 }) => {
    const { t } = useTranslation('discover');
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    // Dynamic color based on score
    let color = '#ff4d4f'; // Red (low)
    if (score >= 70) color = '#52c41a'; // Green (high)
    else if (score >= 30) color = '#faad14'; // Yellow (medium)

    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;

    const isOpposites = breakdown?.mode === 'opposites';

    return (
        <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Circular Progress SVG */}
            <Box sx={{ position: 'relative', width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke="#1f1f1f"
                        strokeWidth={strokeWidth}
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - progress}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                    />
                </svg>
                <Typography
                    variant="caption"
                    component="div"
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: size * 0.3,
                        color: 'text.primary'
                    }}
                >
                    {score}%
                </Typography>
            </Box>

            {/* Info Icon / Trigger */}
            {breakdown && (
                <>
                    <IconButton
                        size="small"
                        onClick={handleClick}
                        sx={{
                            position: 'absolute',
                            bottom: -4,
                            right: -4,
                            bgcolor: 'background.paper',
                            p: 0.2,
                            '&:hover': { bgcolor: 'background.paper' }
                        }}
                    >
                        <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    </IconButton>

                    <Popover
                        open={open}
                        anchorEl={anchorEl}
                        onClose={handleClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                        PaperProps={{
                            sx: {
                                width: 280,
                                p: 2,
                                borderRadius: 2,
                                bgcolor: 'rgba(20, 20, 20, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid',
                                borderColor: 'divider',
                                mt: 1
                            }
                        }}
                    >
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                            {isOpposites ? t('compatibility.whyOpposites', 'Por qué se complementan') : t('compatibility.whyCompatible', 'Por qué son compatibles')}
                        </Typography>

                        {/* Interests */}
                        {breakdown.common_interests.length > 0 && (
                            <Box sx={{ mb: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                    {t('compatibility.interests', 'Intereses en común')}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {breakdown.common_interests.map(i => (
                                        <Chip key={i} label={i} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(255, 107, 107, 0.15)', color: '#FF6B6B' }} />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Unique Interests (Opposites) */}
                        {isOpposites && breakdown.unique_interests.length > 0 && (
                            <Box sx={{ mb: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                    {t('compatibility.uniqueInterests', 'Intereses que te aportará')}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {breakdown.unique_interests.slice(0, 5).map(i => (
                                        <Chip key={i} label={i} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(82, 196, 26, 0.15)', color: '#52c41a' }} />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Values / Lifestyle */}
                        {breakdown.common_lifestyle.length > 0 && (
                            <Box sx={{ mb: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                    {t('compatibility.values', 'Valores y Estilo de vida')}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {breakdown.common_lifestyle.map(i => (
                                        <Chip key={i} label={i} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Intentions */}
                        {breakdown.common_intentions.length > 0 && (
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                    {t('compatibility.intentions', 'Intenciones compartidas')}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {breakdown.common_intentions.map(i => (
                                        <Chip key={i} label={i} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(24, 144, 255, 0.15)', color: '#1890ff' }} />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {(breakdown.common_interests.length === 0 && breakdown.common_lifestyle.length === 0 && breakdown.common_intentions.length === 0) && (
                            <Typography variant="caption" color="text.disabled" fontStyle="italic">
                                {t('compatibility.basicsOnly', 'Compatibilidad basada en edad, ubicación y preferencias básicas.')}
                            </Typography>
                        )}

                    </Popover>
                </>
            )}
        </Box>
    );
};
