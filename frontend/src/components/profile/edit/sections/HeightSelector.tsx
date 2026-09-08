import { useState, useEffect } from 'react';
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
    TextField,
    InputAdornment,
    Chip,
    Stack
} from '@mui/material';
import {
    Straighten,
    ExpandMore,
    InfoOutlined,
    LockOutlined
} from '@mui/icons-material';
import { Controller, Control, useWatch } from 'react-hook-form';
import apiClient from '../../../../services/api';
import { formatHeight } from '../../../../utils/formatters';

interface HeightPreferenceOption {
    value: string;
    label: string;
    icon: string;
}

const HEIGHT_PREFERENCES: HeightPreferenceOption[] = [
    { value: 'short', label: 'Bajitos/as', icon: '👟' },
    { value: 'average', label: 'Promedio', icon: '👞' },
    { value: 'tall', label: 'Altos/as', icon: '👠' },
    { value: 'giant', label: 'Muy altos/as', icon: '🗼' },
    { value: 'none', label: 'Todas las alturas', icon: '☑' },
];

interface HeightSelectorProps {
    control: Control<any>;
    defaultCollapsed?: boolean;
    isDiscovery?: boolean;
}

export default function HeightSelector({ control, defaultCollapsed = true, isDiscovery = false }: HeightSelectorProps) {
    const theme = useTheme();
    const [isCollapsed, setIsCollapsed] = useState(isDiscovery ? false : defaultCollapsed);
    const heightColor = "#546E7A";

    // Watch relevant fields for dynamic UI
    const formLabels = useWatch({
        control,
        name: 'height_range_labels',
        defaultValue: {}
    });

    const [localLabels, setLocalLabels] = useState<Record<string, string>>({});

    // Fetch labels if missing or if region changes (derived from profile/location)
    useEffect(() => {
        if (Object.keys(formLabels).length > 0) {
            setLocalLabels(formLabels);
            return;
        }

        // Fallback: Fetch labels from API if they aren't in form state
        const fetchLabels = async () => {
            try {
                // We don't have the region here, but the backend /options or /profiles/me 
                // might have them. If we can't get region, backend uses 'global'.
                const res = await apiClient.get('/profiles/me');
                if (res.data.height_range_labels) {
                    setLocalLabels(res.data.height_range_labels);
                }
            } catch (err) {
                console.error('Failed to fetch fallback height labels', err);
            }
        };

        if (isDiscovery) {
            fetchLabels();
        }
    }, [formLabels, isDiscovery]);

    const heightRangeLabels = Object.keys(localLabels).length > 0 ? localLabels : formLabels;

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
                        <Straighten sx={{ mr: 1.5, color: heightColor }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                            Tu Estatura
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
                <Box
                    sx={{
                        p: isDiscovery ? 0 : 2.5,
                        borderRadius: isDiscovery ? 0 : 3,
                        border: isDiscovery ? 'none' : '1px solid',
                        borderColor: 'divider',
                        bgcolor: isDiscovery ? 'transparent' : alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: isDiscovery ? 'none' : 'blur(8px)',
                        boxShadow: isDiscovery ? 'none' : '0 4px 20px rgba(0,0,0,0.05)'
                    }}
                >
                    {/* Height Input */}
                    <Box sx={{ mb: 4 }}>
                        <Controller
                            name="height_cm"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    fullWidth
                                    label="Tu Altura"
                                    type="number"
                                    autoComplete="off"
                                    placeholder="Ej: 170"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Straighten sx={{ color: isDiscovery ? 'white' : heightColor }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: <InputAdornment position="end" sx={{ color: isDiscovery ? 'white' : 'inherit' }}>cm</InputAdornment>
                                    }}
                                    helperText={field.value ? formatHeight(field.value) : 'Tu altura se mostrará en tu perfil si lo deseas.'}
                                    FormHelperTextProps={{
                                        sx: { fontWeight: 500, color: isDiscovery ? 'rgba(255,255,255,0.7)' : 'text.secondary', fontSize: '0.8rem', mt: 1 }
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': isDiscovery ? {
                                            color: 'white',
                                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                                            '&.Mui-focused fieldset': { borderColor: 'gold' },
                                        } : {},
                                        '& .MuiInputLabel-root': isDiscovery ? { color: 'rgba(255,255,255,0.7)' } : {}
                                    }}
                                />
                            )}
                        />
                    </Box>

                    {/* Compatibility Switch & Preferences */}
                    <Controller
                        name="height_relevant"
                        control={control}
                        defaultValue={true}
                        render={({ field: relevantField }) => {
                            const isRelevant = relevantField.value !== false;

                            return (
                                <Box>
                                    <Box sx={{
                                        mb: 3,
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: isRelevant ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.grey[500], 0.05),
                                        transition: 'background-color 0.3s',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 1
                                    }}>
                                        <FormControlLabel
                                            sx={{ flex: 1, mr: 0 }}
                                            control={
                                                <Switch
                                                    checked={isRelevant}
                                                    onChange={(e) => relevantField.onChange(e.target.checked)}
                                                    color="primary"
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: isDiscovery ? 'white' : 'inherit' }}>
                                                    ¿Quieres que la estatura influya en tu compatibilidad?
                                                </Typography>
                                            }
                                        />
                                        <Tooltip
                                            title="Los rangos se adaptan a tu país. Puedes elegir lo que te atrae sin preocuparte por etiquetas."
                                            arrow
                                            placement="top"
                                        >
                                            <InfoOutlined sx={{ fontSize: 20, color: isDiscovery ? 'gold' : 'primary.main', cursor: 'help', mt: 0.5 }} />
                                        </Tooltip>
                                    </Box>

                                    <Box sx={{
                                        position: 'relative',
                                        opacity: isRelevant ? 1 : 0.4,
                                        pointerEvents: isRelevant ? 'auto' : 'none',
                                        transition: 'all 0.4s ease'
                                    }}>
                                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, px: 0.5, color: isDiscovery ? 'white' : 'inherit' }}>
                                            ¿Qué estaturas te atraen?
                                        </Typography>

                                        <Controller
                                            name="height_preferences"
                                            control={control}
                                            defaultValue={[]}
                                            render={({ field: prefField }) => {
                                                const currentPrefs = prefField.value || [];

                                                const handleToggle = (val: string) => {
                                                    if (val === 'none') {
                                                        prefField.onChange(['none']);
                                                        return;
                                                    }

                                                    const filtered = currentPrefs.filter((p: string) => p !== 'none');
                                                    if (filtered.includes(val)) {
                                                        prefField.onChange(filtered.filter((p: string) => p !== val));
                                                    } else {
                                                        prefField.onChange([...filtered, val]);
                                                    }
                                                };

                                                return (
                                                    <Box>
                                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1.5, mb: 2 }}>
                                                            {HEIGHT_PREFERENCES.map((opt) => {
                                                                const isSelected = currentPrefs.includes(opt.value);
                                                                return (
                                                                    <Chip
                                                                        key={opt.value}
                                                                        label={`${opt.icon} ${opt.label}`}
                                                                        onClick={() => handleToggle(opt.value)}
                                                                        variant={isSelected ? 'filled' : 'outlined'}
                                                                        color={isSelected ? 'primary' : 'default'}
                                                                        sx={{
                                                                            height: 40,
                                                                            borderRadius: 2,
                                                                            px: 1,
                                                                            fontSize: '0.9rem',
                                                                            fontWeight: isSelected ? 700 : 500,
                                                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                            '&:hover': {
                                                                                bgcolor: isSelected ? 'primary.dark' : alpha(theme.palette.primary.main, 0.1),
                                                                                transform: 'translateY(-2px)'
                                                                            },
                                                                            '&:active': {
                                                                                transform: 'scale(0.95)'
                                                                            }
                                                                        }}
                                                                    />
                                                                );
                                                            })}
                                                        </Stack>

                                                        {/* Dynamic Range Display */}
                                                        {(() => {
                                                            const hasAnyLabel = currentPrefs.some((p: string) => heightRangeLabels[p]);
                                                            return (
                                                                <Collapse in={currentPrefs.length > 0 && !currentPrefs.includes('none') && hasAnyLabel}>
                                                                    <Box sx={{
                                                                        mt: 1,
                                                                        p: 1.5,
                                                                        borderRadius: 2,
                                                                        bgcolor: isDiscovery ? 'rgba(255,255,255,0.05)' : alpha(theme.palette.primary.main, 0.03),
                                                                        borderLeft: '4px solid',
                                                                        borderColor: isDiscovery ? 'gold' : 'primary.main',
                                                                        animation: 'fadeIn 0.5s ease',
                                                                        minHeight: '20px'
                                                                    }}>
                                                                        {currentPrefs.map((pref: string) => (
                                                                            heightRangeLabels[pref] && (
                                                                                <Typography key={pref} variant="caption" sx={{ display: 'block', color: isDiscovery ? 'rgba(255,255,255,0.7)' : 'text.secondary', fontWeight: 500 }}>
                                                                                    • {HEIGHT_PREFERENCES.find(o => o.value === pref)?.label}: {heightRangeLabels[pref]} en tu región.
                                                                                </Typography>
                                                                            )
                                                                        ))}
                                                                    </Box>
                                                                </Collapse>
                                                            );
                                                        })()}
                                                    </Box>
                                                );
                                            }}
                                        />

                                        {!isRelevant && (
                                            <Box sx={{
                                                position: 'absolute',
                                                top: 0, left: 0, right: 0, bottom: 0,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                zIndex: 10,
                                                bgcolor: alpha(theme.palette.background.paper, 0.65),
                                                backdropFilter: 'blur(3px)',
                                                borderRadius: 2
                                            }}>
                                                <LockOutlined sx={{ fontSize: 32, color: 'text.disabled', mb: 1, opacity: 0.8 }} />
                                                <Typography variant="body2" sx={{ color: 'text.disabled', fontWeight: 700 }}>
                                                    Preferencia desactivada
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    <Box sx={{ mt: 4, pt: 2, borderTop: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontStyle: 'italic',
                                                color: isRelevant ? (isDiscovery ? 'gold' : 'primary.main') : 'text.disabled',
                                                fontWeight: 500,
                                                fontSize: '0.9rem',
                                                transition: 'color 0.3s'
                                            }}
                                        >
                                            {isRelevant
                                                ? '“La estatura es solo un dato. Tu esencia es lo que buscamos.”'
                                                : '“La estatura no influirá en tu compatibilidad.”'}
                                        </Typography>
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
