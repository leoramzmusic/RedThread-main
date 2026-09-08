import { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Switch,
    FormControlLabel,
    Tooltip,
    alpha,
    useTheme,
    ButtonBase,
    Collapse,
    Fade
} from '@mui/material';
import {
    AutoAwesome,
    ExpandMore,
    InfoOutlined,
    LockOutlined
} from '@mui/icons-material';
import { Controller, Control } from 'react-hook-form';

interface ZodiacOption {
    value: string;
    label: string;
    symbol: string;
}

const ZODIAC_SIGNS: ZodiacOption[] = [
    { value: 'aries', label: 'Aries', symbol: '♈︎' },
    { value: 'tauro', label: 'Tauro', symbol: '♉︎' },
    { value: 'geminis', label: 'Géminis', symbol: '♊︎' },
    { value: 'cancer', label: 'Cáncer', symbol: '♋︎' },
    { value: 'leo', label: 'Leo', symbol: '♌︎' },
    { value: 'virgo', label: 'Virgo', symbol: '♍︎' },
    { value: 'libra', label: 'Libra', symbol: '♎︎' },
    { value: 'escorpio', label: 'Escorpio', symbol: '♏︎' },
    { value: 'sagitario', label: 'Sagitario', symbol: '♐︎' },
    { value: 'capricornio', label: 'Capricornio', symbol: '♑︎' },
    { value: 'acuario', label: 'Acuario', symbol: '♒︎' },
    { value: 'piscis', label: 'Piscis', symbol: '♓︎' },
];

interface ZodiacSelectorProps {
    control: Control<any>;
    defaultCollapsed?: boolean;
    isDiscovery?: boolean;
}

export default function ZodiacSelector({ control, defaultCollapsed = true, isDiscovery = false }: ZodiacSelectorProps) {
    const theme = useTheme();
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const zodiacColor = "#673AB7";

    return (
        <Box sx={{ width: '100%' }}>
            {/* Header - Hidden in Discovery mode as the card provides context */}
            {!isDiscovery && (
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
                        <AutoAwesome sx={{ mr: 1.5, color: zodiacColor }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                            Signo Zodiacal
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

            <Collapse in={isDiscovery || !isCollapsed}>
                <Box
                    sx={{
                        p: isDiscovery ? 1 : 2,
                        borderRadius: isDiscovery ? 0 : 3,
                        border: isDiscovery ? 'none' : '1px solid',
                        borderColor: 'divider',
                        bgcolor: isDiscovery ? 'transparent' : 'background.paper',
                    }}
                >
                    <Controller
                        name="zodiac_relevant"
                        control={control}
                        defaultValue={true}
                        render={({ field: relevantField }) => {
                            const isRelevant = relevantField.value !== false;

                            return (
                                <Box>
                                    <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: isDiscovery ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
                                        ¿Quieres que influya en tu compatibilidad?
                                    </Typography>

                                    <Controller
                                        name="zodiac"
                                        control={control}
                                        defaultValue=""
                                        render={({ field: zodiacField }) => (
                                            <Box sx={{ position: 'relative' }}>
                                                <Grid container spacing={1} sx={{
                                                    opacity: isRelevant ? 1 : 0.4,
                                                    pointerEvents: isRelevant ? 'auto' : 'none',
                                                    transition: 'all 0.4s ease'
                                                }}>
                                                    {ZODIAC_SIGNS.map((sign) => {
                                                        const isSelected = zodiacField.value === sign.value;
                                                        const selectionColor = isDiscovery ? '#FFD700' : zodiacColor;
                                                        return (
                                                            <Grid item xs={isDiscovery ? 4 : 4} sm={isDiscovery ? 4 : 2} key={sign.value}>
                                                                <ButtonBase
                                                                    onClick={() => zodiacField.onChange(isSelected ? "" : sign.value)}
                                                                    sx={{
                                                                        width: '100%',
                                                                        py: 1.5,
                                                                        borderRadius: 2,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'center',
                                                                        gap: 0.5,
                                                                        border: '2px solid',
                                                                        borderColor: isSelected ? selectionColor : (isDiscovery ? 'rgba(255,255,255,0.1)' : 'divider'),
                                                                        bgcolor: isSelected ? alpha(selectionColor, 0.15) : 'transparent',
                                                                        boxShadow: isSelected && isDiscovery ? `0 0 15px ${alpha(selectionColor, 0.3)}` : 'none',
                                                                        transition: 'all 0.2s',
                                                                        '&:hover': {
                                                                            bgcolor: isSelected ? alpha(selectionColor, 0.2) : (isDiscovery ? 'rgba(255,255,255,0.05)' : alpha(zodiacColor, 0.05)),
                                                                            borderColor: isSelected ? selectionColor : (isDiscovery ? 'rgba(255,255,255,0.3)' : zodiacColor)
                                                                        }
                                                                    }}
                                                                >
                                                                    <Typography sx={{
                                                                        fontSize: isDiscovery ? '0.9rem' : '1.2rem',
                                                                        color: isSelected ? (isDiscovery ? '#FFD700' : zodiacColor) : (isDiscovery ? 'white' : 'text.primary'),
                                                                        lineHeight: 1,
                                                                        fontWeight: isSelected ? 800 : 400
                                                                    }}>
                                                                        {sign.symbol}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{
                                                                        fontWeight: isSelected ? 800 : 500,
                                                                        fontSize: isDiscovery ? '0.65rem' : '0.75rem',
                                                                        color: isDiscovery ? (isSelected ? '#FFD700' : 'rgba(255,255,255,0.7)') : 'inherit'
                                                                    }}>
                                                                        {sign.label}
                                                                    </Typography>
                                                                </ButtonBase>
                                                            </Grid>
                                                        );
                                                    })}
                                                </Grid>

                                                {!isRelevant && (
                                                    <Box sx={{
                                                        position: 'absolute',
                                                        top: 0, left: 0, right: 0, bottom: 0,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        zIndex: 2,
                                                        backdropFilter: 'blur(1px)'
                                                    }}>
                                                        <LockOutlined sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                                                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                                                            Selección desactivada
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        )}
                                    />

                                    {/* Switch Section */}
                                    <Box sx={{
                                        mt: 2,
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: isRelevant ? alpha(theme.palette.grey[500], 0.05) : alpha(zodiacColor, 0.05),
                                        transition: 'background-color 0.3s'
                                    }}>
                                        <Tooltip
                                            title="No todos creen en la astrología. Tú decides si tu signo debe influir en tus conexiones."
                                            placement="top"
                                        >
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={!isRelevant}
                                                        onChange={(e) => relevantField.onChange(!e.target.checked)}
                                                        color="secondary"
                                                        size="small"
                                                    />
                                                }
                                                label={
                                                    <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, color: isDiscovery ? 'white' : 'inherit' }}>
                                                        No me interesa responder
                                                        <InfoOutlined sx={{ fontSize: 16, color: isDiscovery ? 'rgba(255,255,255,0.7)' : 'text.secondary' }} />
                                                    </Typography>
                                                }
                                            />
                                        </Tooltip>

                                        <Fade in={true} key={isRelevant ? 'rel' : 'not-rel'}>
                                            <Typography variant="caption" sx={{
                                                display: 'block',
                                                mt: 0.5,
                                                color: isRelevant ? 'success.main' : 'text.disabled',
                                                fontWeight: 600,
                                                fontStyle: 'italic'
                                            }}>
                                                {isRelevant
                                                    ? '✅ Tu signo está visible. Influye en tus matches.'
                                                    : '🚫 Tu signo está oculto. No influye en la compatibilidad.'
                                                }
                                            </Typography>
                                        </Fade>

                                        {!isRelevant && (
                                            <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center', color: zodiacColor, fontWeight: 500 }}>
                                                “Tu compatibilidad será guiada por lo que realmente te importa.”
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            );
                        }}
                    />
                </Box>
            </Collapse>
        </Box>
    );
}
