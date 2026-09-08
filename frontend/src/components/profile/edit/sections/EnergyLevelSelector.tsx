import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    useTheme,
    alpha,
    ButtonBase,
    Collapse,
    Grid,
    Tooltip,
    IconButton,
    keyframes
} from '@mui/material';
import {
    WbSunny,
    NightsStay,
    Sync,
    HelpOutline,
    InfoOutlined,
    CheckCircle,
    ExpandMore
} from '@mui/icons-material';
import { Controller, Control } from 'react-hook-form';
import { useTranslation } from 'next-i18next';

interface EnergyLevelSelectorProps {
    control: Control<any>;
    name: string; // 'energy_level'
    label: string;
}

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.1); }
  50% { transform: scale(1.02); box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.1); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.1); }
`;

export default function EnergyLevelSelector({ control, name, label }: EnergyLevelSelectorProps) {
    const theme = useTheme();
    const { t } = useTranslation('common');
    const [isCollapsed, setIsCollapsed] = useState(true);

    const energyOptions = [
        {
            value: 'morning',
            label: t('profile.cognitive.energy_morning'),
            desc: t('profile.cognitive.energy_morning_desc'),
            icon: <WbSunny />,
            color: '#FFB300' // Gold/Sun
        },
        {
            value: 'night',
            label: t('profile.cognitive.energy_night'),
            desc: t('profile.cognitive.energy_night_desc'),
            icon: <NightsStay />,
            color: '#5C6BC0' // Indigo/Night
        },
        {
            value: 'adaptable',
            label: t('profile.cognitive.energy_adaptable'),
            desc: t('profile.cognitive.energy_adaptable_desc'),
            icon: <Sync />,
            color: '#4DB6AC' // Teal/Adaptable
        }
    ];

    return (
        <Box sx={{ width: '100%' }}>
            {/* Header / Collapse Trigger */}
            <ButtonBase
                onClick={() => setIsCollapsed(!isCollapsed)}
                sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    px: 2,
                    mb: 1,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        borderColor: theme.palette.primary.main,
                        transform: 'translateY(-1px)'
                    }
                }}
            >
                <Box display="flex" alignItems="center">
                    <Box sx={{ mr: 1.5, color: theme.palette.primary.main, display: 'flex' }}>
                        <WbSunny sx={{ fontSize: 22 }} />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                        {label}
                    </Typography>

                    <Controller
                        name={name}
                        control={control}
                        render={({ field }) => (
                            field.value ? (
                                <Box sx={{ ml: 1.5, display: 'flex', alignItems: 'center' }}>
                                    <CheckCircle sx={{ fontSize: 16, color: theme.palette.success.main }} />
                                </Box>
                            ) : <></>
                        )}
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                        sx={{
                            p: 0.5,
                            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                            transition: 'transform 0.3s',
                            color: 'text.secondary',
                            display: 'flex'
                        }}
                    >
                        <ExpandMore />
                    </Box>
                </Box>
            </ButtonBase>

            <Collapse in={!isCollapsed}>
                <Paper
                    variant="outlined"
                    sx={{
                        p: 2.5,
                        mt: 0.5,
                        borderRadius: 3,
                        bgcolor: 'background.paper',
                        borderColor: 'divider',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                    }}
                >
                    {/* Intro with Help */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                        <Typography variant="caption" color="text.secondary" sx={{ maxWidth: '85%', lineHeight: 1.5 }}>
                            {t('profile.cognitive.energy_help_text')}
                        </Typography>
                        <Tooltip title={t('profile.cognitive.energy_matching_note')}>
                            <IconButton size="small">
                                <HelpOutline fontSize="small" sx={{ color: theme.palette.info.main }} />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Card Options */}
                    <Controller
                        name={name}
                        control={control}
                        render={({ field }) => (
                            <Grid container spacing={2}>
                                {energyOptions.map((opt) => {
                                    const isSelected = field.value === opt.value;
                                    return (
                                        <Grid item xs={12} sm={4} key={opt.value}>
                                            <ButtonBase
                                                onClick={() => field.onChange(isSelected ? '' : opt.value)}
                                                sx={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    p: 2,
                                                    borderRadius: 3,
                                                    border: '2px solid',
                                                    borderColor: isSelected ? opt.color : 'divider',
                                                    bgcolor: isSelected ? alpha(opt.color, 0.08) : 'transparent',
                                                    transition: 'all 0.2s ease-in-out',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    '&:hover': {
                                                        borderColor: opt.color,
                                                        bgcolor: alpha(opt.color, 0.05),
                                                        transform: 'scale(1.02)'
                                                    },
                                                    animation: isSelected ? `${pulse} 2s infinite` : 'none'
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: '50%',
                                                        bgcolor: isSelected ? opt.color : alpha(opt.color, 0.1),
                                                        color: isSelected ? '#fff' : opt.color,
                                                        mb: 1.5,
                                                        display: 'flex',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {opt.icon}
                                                </Box>
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: isSelected ? opt.color : 'text.primary',
                                                        mb: 0.5
                                                    }}
                                                >
                                                    {opt.label}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    align="center"
                                                    sx={{ fontSize: '0.7rem' }}
                                                >
                                                    {opt.desc}
                                                </Typography>

                                                {isSelected && (
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 8,
                                                            right: 8,
                                                            color: opt.color,
                                                            display: 'flex'
                                                        }}
                                                    >
                                                        <CheckCircle sx={{ fontSize: 18 }} />
                                                    </Box>
                                                )}
                                            </ButtonBase>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        )}
                    />

                    {/* Footer Extra Match Info */}
                    <Box
                        sx={{
                            mt: 3,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.info.main, 0.05),
                            border: '1px dashed',
                            borderColor: alpha(theme.palette.info.main, 0.3)
                        }}
                    >
                        <Box display="flex" gap={1.5}>
                            <InfoOutlined color="info" sx={{ fontSize: 20, mt: 0.2 }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.4 }}>
                                {t('profile.cognitive.energy_matching_note')}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Collapse>
        </Box>
    );
}
