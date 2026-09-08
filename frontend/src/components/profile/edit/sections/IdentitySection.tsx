import React from 'react';
import { Grid, Typography, FormControl, InputLabel, Select, MenuItem, Box, Tooltip, Chip, OutlinedInput, Switch, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Favorite, Lock, Explore, Info, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Controller } from 'react-hook-form';
import { ListSubheader } from '@mui/material';
import { GENDER_CATEGORIES, GENDER_TO_CATEGORY_MAP, ATTRACTION_ORIENTATION_OPTIONS } from '../../../../constants/profileOptions';
import { SectionWithOptionsProps } from '../types';


const getFixedAttractions = (gender: string | null | undefined, orientation: string | null | undefined): string[] => {
    if (!gender || !orientation) return [];

    const g = gender.toLowerCase();
    const o = orientation.toLowerCase();

    // 1. Heterosexual: Opposite traditional gender
    if (o === 'heterosexual') {
        if (g === 'masculino') return ['Femenino'];
        if (g === 'femenino') return ['Masculino'];
    }

    // 2. Homosexual: Same traditional gender
    if (o === 'homosexual') {
        if (g === 'masculino') return ['Masculino'];
        if (g === 'femenino') return ['Femenino'];
    }

    // 3. Bisexual: Both Masculino and Femenino are base
    if (o === 'bisexual') {
        return ['Masculino', 'Femenino'];
    }

    // 4. Pansexual/Queer/Demisexual/Prefiero: Variable/Todos (no fixed locks)
    return [];
};

const checkIfExploratory = (gender: string | null | undefined, orientation: string | null | undefined, attractions: string[]): boolean => {
    if (!orientation || !attractions || attractions.length === 0) return false;

    const o = orientation.toLowerCase();
    const g = gender?.toLowerCase();

    // 1. Heterosexual: Any attraction outside opposite binary
    if (o === 'heterosexual') {
        if (g === 'masculino') return attractions.some(a => a.toLowerCase() !== 'femenino');
        if (g === 'femenino') return attractions.some(a => a.toLowerCase() !== 'masculino');
    }

    // 2. Homosexual: Any attraction outside same binary
    if (o === 'homosexual') {
        if (g === 'masculino') return attractions.some(a => a.toLowerCase() !== 'masculino');
        if (g === 'femenino') return attractions.some(a => a.toLowerCase() !== 'femenino');
    }

    // 3. Bisexual: Any attraction outside the binary Masculino/Femenino
    if (o === 'bisexual') {
        return attractions.some(a => {
            const low = a.toLowerCase();
            return low !== 'masculino' && low !== 'femenino';
        });
    }

    // 4. Pansexual, Queer, etc. are open/fluid, so nothing is strictly "exploratory"
    return false;
};

const getLockedOrientations = (sexualOrientationValue: string | null | undefined): string[] => {
    if (!sexualOrientationValue) return [];

    const labelMap: Record<string, string> = {
        'heterosexual': 'Heterosexual',
        'homosexual': 'Homosexual',
        'bisexual': 'Bisexual',
        'pansexual': 'Pansexual',
        'asexual': 'Asexual',
        'queer': 'Queer',
        'demisexual': 'Demisexual',
        'sapioerotico': 'Sapioerótico/Sapiosexual',
        'prefer_not_to_say': 'Prefiero no decir'
    };

    const o = sexualOrientationValue.toLowerCase();
    return labelMap[o] ? [labelMap[o]] : [];
};

const getSuggestedOrientations = (sexualOrientationValue: string | null | undefined): string[] => {
    return getLockedOrientations(sexualOrientationValue);
};

export default function IdentitySection({ control, options, setValue, watch, isDiscovery = false }: SectionWithOptionsProps & { isDiscovery?: boolean }) {
    const gender = watch('gender');
    const orientation = watch('sexual_orientation');
    const attractionPreferences = watch('attraction_preferences') || [];
    const orientationPreferences = watch('orientation_preferences') || [];
    const feelingCurious = watch('feeling_curious') || false;

    const isExploratory = feelingCurious || checkIfExploratory(gender, orientation, attractionPreferences);
    const fixedOptions = getFixedAttractions(gender, orientation);
    const lockedOrientations = getLockedOrientations(orientation);

    // Track previous values to detect changes
    const prevOrientationRef = React.useRef<string | null>(null);
    const prevGenderRef = React.useRef<string | null>(null);
    const prevOptionsLengthRef = React.useRef<number>(0);

    // Reactive auto-population and enforcement of fixed options
    React.useEffect(() => {
        if (!setValue || !gender || !orientation) return;

        const currentOptionsLength = options.sexual_orientation?.length || 0;
        const hasOrientationChanged = prevOrientationRef.current !== orientation;
        const hasGenderChanged = prevGenderRef.current !== gender;
        const hasOptionsLoaded = prevOptionsLengthRef.current === 0 && currentOptionsLength > 0;

        if (hasOrientationChanged || hasGenderChanged || hasOptionsLoaded) {
            const oldFixed = getFixedAttractions(prevGenderRef.current, prevOrientationRef.current);
            const newFixed = getFixedAttractions(gender, orientation);

            let currentAttractions = [...attractionPreferences];

            // 1. Remove old fixed options that are no longer fixed
            if (oldFixed.length > 0) {
                currentAttractions = currentAttractions.filter((attr: string) => !oldFixed.includes(attr) || newFixed.includes(attr));
            }

            // 2. Add new fixed options
            const missingAttractions = newFixed.filter((f: string) => !currentAttractions.includes(f));
            if (missingAttractions.length > 0 || hasOrientationChanged || hasGenderChanged || hasOptionsLoaded) {
                setValue('attraction_preferences', [...currentAttractions, ...missingAttractions]);
            }

            // --- Orientation Preferences Logic ---
            const newSuggestedOrient = getSuggestedOrientations(orientation);
            const newLockedOrient = getLockedOrientations(orientation);

            let currentOrients = [...orientationPreferences];

            if (hasOrientationChanged || hasOptionsLoaded) {
                const oldSuggestedOrient = getSuggestedOrientations(prevOrientationRef.current);

                // 1. Remove old suggested orientations
                if (oldSuggestedOrient.length > 0) {
                    currentOrients = currentOrients.filter((o: string) => !oldSuggestedOrient.includes(o) || newSuggestedOrient.includes(o));
                }

                // 2. Add new suggested orientations
                const missingOrients = newSuggestedOrient.filter((f: string) => !currentOrients.includes(f));
                if (missingOrients.length > 0) {
                    setValue('orientation_preferences', [...currentOrients, ...missingOrients]);
                }
            } else {
                // Not a change, but ensure any LOCKED (required) orientation is missing and re-add it
                const missingLocked = newLockedOrient.filter((f: string) => !currentOrients.includes(f));
                if (missingLocked.length > 0) {
                    setValue('orientation_preferences', [...currentOrients, ...missingLocked]);
                }
            }

            prevOrientationRef.current = orientation;
            prevGenderRef.current = gender;
            prevOptionsLengthRef.current = currentOptionsLength;
        }
    }, [gender, orientation, attractionPreferences, orientationPreferences, setValue, options.sexual_orientation]);

    return (
        <Grid item xs={12}>
            <Accordion
                defaultExpanded
                sx={{
                    position: 'relative',
                    border: isDiscovery ? 'none' : (theme) => '1px solid ' + theme.palette.divider,
                    boxShadow: isDiscovery ? 0 : 1,
                    backgroundImage: 'none',
                    bgcolor: isDiscovery ? 'transparent' : 'inherit',
                    borderRadius: '12px !important',
                    '&:before': { display: 'none' }
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: isDiscovery ? 'white' : 'inherit' }} />}
                    sx={{ px: isDiscovery ? 1 : 3, py: 1 }}
                >
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" pr={isDiscovery ? 0 : 2}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Favorite sx={{ color: isDiscovery ? 'white' : 'action.active' }} />
                            <Typography variant="h6" sx={{ color: isDiscovery ? 'white' : 'inherit' }}>
                                {isDiscovery ? 'Identidad' : 'Identidad y Atracción'}
                            </Typography>
                        </Box>
                        {isExploratory && (
                            <Tooltip title="Tu búsqueda actual explora más allá de tu orientación base.">
                                <Chip
                                    label="Modo Explorador"
                                    size="small"
                                    icon={<Explore sx={{ fontSize: 14, color: 'inherit !important' }} />}
                                    sx={{
                                        bgcolor: feelingCurious ? 'rgba(156, 39, 176, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                                        color: feelingCurious ? '#9c27b0' : '#2196f3',
                                        fontWeight: 'bold',
                                        border: '1px solid rgba(33, 150, 243, 0.3)'
                                    }}
                                />
                            </Tooltip>
                        )}
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: isDiscovery ? 1 : 3, pb: 3, pt: 0 }}>
                    <Grid container spacing={3}>
                        {/* Identidad Personal */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ color: isDiscovery ? 'rgba(255,255,255,0.7)' : 'text.secondary', mb: 2 }}>
                                Identidad Personal (Quién eres)
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="gender"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel>Género</InputLabel>
                                                <Select
                                                    {...field}
                                                    label="Género"
                                                    renderValue={(selected) => selected as string}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        const newGender = e.target.value as string;
                                                        const category = GENDER_TO_CATEGORY_MAP[newGender] || "microlabels";
                                                        if (setValue) {
                                                            setValue('gender_category', category);
                                                        }
                                                    }}
                                                >
                                                    {GENDER_CATEGORIES.flatMap((c) => [
                                                        <ListSubheader key={c.category}>{c.category}</ListSubheader>,
                                                        ...c.options.map((o) => (
                                                            <MenuItem key={o.label} value={o.label}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                                                    <Typography variant="body2" sx={{ fontWeight: 'medium', whiteSpace: 'nowrap' }}>{o.label}</Typography>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8, fontStyle: 'italic' }}>
                                                                        — {o.description}
                                                                    </Typography>
                                                                </Box>
                                                            </MenuItem>
                                                        ))
                                                    ])}
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="sexual_orientation"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel>Orientación sexual</InputLabel>
                                                <Select
                                                    {...field}
                                                    label="Orientación sexual"
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                    }}
                                                >
                                                    {options.sexual_orientation?.map((o: any) => (
                                                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Preferencias de Atracción */}
                        <Grid item xs={12}>
                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: isDiscovery ? 'rgba(255,255,255,0.1)' : 'divider' }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Favorite sx={{ color: isDiscovery ? 'white' : '#ff4d4f', fontSize: 20 }} />
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: isDiscovery ? 'white' : 'inherit' }}>
                                            Preferencias de Atracción (A quién buscas)
                                        </Typography>
                                    </Box>
                                    {attractionPreferences.length > 0 && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                            Tu orientación es un punto de partida, no una frontera. Puedes explorar sin necesidad de redefinirte.
                                        </Typography>
                                    )}
                                </Box>

                                <Controller
                                    name="attraction_preferences"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth>
                                            <InputLabel>Te atraen personas con género...</InputLabel>
                                            <Select
                                                {...field}
                                                multiple
                                                value={field.value || []}
                                                input={<OutlinedInput label="Te atraen personas con género..." />}
                                                onChange={(e) => {
                                                    const newValue = e.target.value as string[];
                                                    const fixed = getFixedAttractions(gender, orientation);
                                                    const missingFixed = fixed.filter(f => !newValue.includes(f));
                                                    if (missingFixed.length > 0) {
                                                        field.onChange([...newValue, ...missingFixed]);
                                                    } else {
                                                        field.onChange(newValue);
                                                    }
                                                }}
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {(selected as string[]).map((value) => {
                                                            const isFixed = fixedOptions.includes(value);
                                                            const chip = (
                                                                <Chip
                                                                    key={value}
                                                                    label={value}
                                                                    size="small"
                                                                    icon={isFixed ? <Lock sx={{ fontSize: 14, color: 'inherit !important' }} /> : undefined}
                                                                    onDelete={!isFixed ? (e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        const current = field.value || [];
                                                                        field.onChange(current.filter((v: string) => v !== value));
                                                                    } : undefined}
                                                                    onMouseDown={(e) => {
                                                                        if (!isFixed) e.stopPropagation();
                                                                    }}
                                                                    sx={{
                                                                        bgcolor: isFixed ? 'rgba(255, 77, 79, 0.2)' : 'rgba(255, 77, 79, 0.1)',
                                                                        color: '#ff4d4f',
                                                                        fontWeight: isFixed ? 'bold' : 'normal',
                                                                        '& .MuiChip-deleteIcon': {
                                                                            color: '#ff4d4f',
                                                                            opacity: 0.7,
                                                                            '&:hover': { opacity: 1 }
                                                                        }
                                                                    }}
                                                                />
                                                            );

                                                            return isFixed ? (
                                                                <Tooltip key={value} title="Esta preferencia se basa en tu orientación. Puedes explorar otras opciones sin redefinirte.">
                                                                    {chip}
                                                                </Tooltip>
                                                            ) : chip;
                                                        })}
                                                    </Box>
                                                )}
                                            >
                                                {GENDER_CATEGORIES.flatMap((c) => [
                                                    <ListSubheader key={c.category}>{c.category}</ListSubheader>,
                                                    ...c.options.map((o) => (
                                                        <MenuItem key={o.label} value={o.label}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                                                <Typography variant="body2" sx={{ fontWeight: 'medium', whiteSpace: 'nowrap' }}>{o.label}</Typography>
                                                                <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8, fontStyle: 'italic' }}>
                                                                    — {o.description}
                                                                </Typography>
                                                            </Box>
                                                        </MenuItem>
                                                    ))
                                                ])}
                                            </Select>
                                        </FormControl>
                                    )}
                                />

                                <Controller
                                    name="orientation_preferences"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth sx={{ mt: 3 }}>
                                            <InputLabel>¿Qué orientaciones te atraen en otras personas?</InputLabel>
                                            <Select
                                                {...field}
                                                multiple
                                                value={field.value || []}
                                                input={<OutlinedInput label="¿Qué orientaciones te atraen en otras personas?" />}
                                                onChange={(e) => {
                                                    const newValue = e.target.value as string[];
                                                    const missingFixed = lockedOrientations.filter((f: string) => !newValue.includes(f));
                                                    if (missingFixed.length > 0) {
                                                        field.onChange([...newValue, ...missingFixed]);
                                                    } else {
                                                        field.onChange(newValue);
                                                    }
                                                }}
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {(selected as string[]).map((value: string) => {
                                                            const isFixed = lockedOrientations.includes(value);
                                                            const chip = (
                                                                <Chip
                                                                    key={value}
                                                                    label={value}
                                                                    size="small"
                                                                    icon={isFixed ? <Lock sx={{ fontSize: 14, color: 'inherit !important' }} /> : undefined}
                                                                    onDelete={isFixed ? undefined : (e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        field.onChange((field.value as string[]).filter((v: string) => v !== value));
                                                                    }}
                                                                    onMouseDown={(e) => e.stopPropagation()}
                                                                    sx={{
                                                                        bgcolor: isFixed ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                                                                        color: '#2196f3',
                                                                        fontWeight: isFixed ? 'bold' : 'normal',
                                                                        '& .MuiChip-deleteIcon': {
                                                                            color: 'currentColor',
                                                                            opacity: 0.7
                                                                        }
                                                                    }}
                                                                />
                                                            );

                                                            return isFixed ? (
                                                                <Tooltip key={value} title="Esta preferencia es tu punto de partida lógico.">
                                                                    {chip}
                                                                </Tooltip>
                                                            ) : chip;
                                                        })}
                                                    </Box>
                                                )}
                                            >
                                                {ATTRACTION_ORIENTATION_OPTIONS.map((o) => (
                                                    <MenuItem key={o.label} value={o.label}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 'medium', whiteSpace: 'nowrap' }}>{o.label}</Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8, fontStyle: 'italic' }}>
                                                                — {o.description}
                                                            </Typography>
                                                        </Box>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                                    Puedes elegir más de una. Esto ayuda a encontrar conexiones más auténticas.
                                                </Typography>
                                                <Tooltip title="Tu orientación no limita tu búsqueda. Puedes explorar sin redefinirte.">
                                                    <Info sx={{ fontSize: 14, color: 'text.secondary', cursor: 'pointer' }} />
                                                </Tooltip>
                                            </Box>
                                        </FormControl>
                                    )}
                                />

                                {/* "Hoy me siento curioso" Switch */}
                                <Box
                                    sx={{
                                        mt: 2,
                                        p: 2,
                                        bgcolor: 'rgba(33, 150, 243, 0.05)',
                                        borderRadius: 2,
                                        border: '1px solid rgba(33, 150, 243, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Tooltip title="Estás explorando más allá de tus filtros habituales. CARE te acompaña con respeto.">
                                            <Explore sx={{ color: '#2196f3', fontSize: 24 }} />
                                        </Tooltip>
                                        <Box>
                                            <Typography variant="body2" fontWeight="bold" color="primary.main">
                                                Hoy me siento curioso
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                                                Amplía sugerencias con géneros diversos sin cambiar tus preferencias permanentes.
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Controller
                                        name="feeling_curious"
                                        control={control}
                                        render={({ field }) => (
                                            <Switch
                                                checked={field.value || false}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    field.onChange(checked);
                                                    if (!checked && setValue) {
                                                        // Clear curiosity genders when deactivating
                                                        setValue('curiosity_genders', []);
                                                    }
                                                }}
                                                color="primary"
                                            />
                                        )}
                                    />
                                </Box>

                                {/* Curiosity Exploration Input */}
                                <Controller
                                    name="curiosity_genders"
                                    control={control}
                                    render={({ field }) => (
                                        <Box sx={{
                                            mt: 1,
                                            display: feelingCurious ? 'block' : 'none',
                                            animation: feelingCurious ? 'fadeIn 0.3s ease-out' : 'none',
                                            '@keyframes fadeIn': {
                                                from: { opacity: 0, transform: 'translateY(-10px)' },
                                                to: { opacity: 1, transform: 'translateY(0)' }
                                            }
                                        }}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel sx={{ fontSize: '0.85rem' }}>¿Qué géneros te gustaría explorar hoy?</InputLabel>
                                                <Select
                                                    {...field}
                                                    multiple
                                                    label="¿Qué géneros te gustaría explorar hoy?"
                                                    value={field.value || []}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    renderValue={(selected) => (
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                            {(selected as string[]).map((value) => (
                                                                <Chip
                                                                    key={value}
                                                                    label={value}
                                                                    size="small"
                                                                    sx={{
                                                                        height: 20,
                                                                        fontSize: '0.75rem',
                                                                        bgcolor: 'rgba(156, 39, 176, 0.1)',
                                                                        color: '#9c27b0',
                                                                        border: '1px solid rgba(156, 39, 176, 0.2)'
                                                                    }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    )}
                                                    sx={{
                                                        borderRadius: 2,
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'rgba(156, 39, 176, 0.2)'
                                                        },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'rgba(156, 39, 176, 0.4)'
                                                        }
                                                    }}
                                                >
                                                    {GENDER_CATEGORIES.flatMap((c) => [
                                                        <ListSubheader key={c.category} sx={{ py: 0, lineHeight: '32px', fontSize: '0.75rem', fontWeight: 'bold', color: 'primary.main' }}>
                                                            {c.category}
                                                        </ListSubheader>,
                                                        ...c.options.map((o) => (
                                                            <MenuItem key={o.label} value={o.label} sx={{ py: 1 }}>
                                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{o.label}</Typography>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8, fontStyle: 'italic' }}>
                                                                        {o.description}
                                                                    </Typography>
                                                                </Box>
                                                            </MenuItem>
                                                        ))
                                                    ])}
                                                </Select>
                                                <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, fontStyle: 'italic', px: 1 }}>
                                                    <Explore sx={{ fontSize: 14 }} />
                                                    Explora sin etiquetas. Estas elecciones no cambian tu orientación.
                                                </Typography>
                                            </FormControl>
                                        </Box>
                                    )}
                                />

                                <Box mt={2} mb={2}>
                                    <Typography variant="caption" color="text.secondary">
                                        CARE usará estas preferencias para filtrar matches con atracción mutua.
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </Grid>
    );
}
