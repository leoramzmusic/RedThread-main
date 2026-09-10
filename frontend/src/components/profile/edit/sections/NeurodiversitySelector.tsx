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
    Switch,
    FormControlLabel,
    IconButton,
    Tooltip,
    TextField,
    Autocomplete,
    Paper,
    Checkbox,
    SvgIconProps
} from '@mui/material';
import {
    ExpandMore,
    HelpOutline,
    CheckCircle,
    InfoOutlined,
    Add
} from '@mui/icons-material';
import { Controller, Control, UseFormSetValue } from 'react-hook-form';
import { useTranslation } from 'next-i18next';

interface Option {
    value: string;
    label: string;
}

interface NeurodiversitySelectorProps {
    control: Control<any>;
    setValue: UseFormSetValue<any>;
    name: string; // 'neurodiversity'
    diagnosesName: string; // 'neurodiversity_diagnoses'
    privacyName: string; // 'show_neurodiversity'
    label: string;
    icon?: React.ReactElement<SvgIconProps>;
    options: Option[];
    color?: string;
}

const popIn = keyframes`
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

export default function NeurodiversitySelector({
    control,
    setValue,
    name,
    diagnosesName,
    privacyName,
    label,
    icon,
    options,
    color
}: NeurodiversitySelectorProps) {
    const theme = useTheme();
    const { t } = useTranslation('common');
    const categoryColor = color || theme.palette.primary.main;
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [customCondition, setCustomCondition] = useState('');
    const [showOtherInput, setShowOtherInput] = useState(false);

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
                    py: 1,
                    px: 1,
                    mb: 0.5,
                    borderRadius: 2,
                    bgcolor: alpha(categoryColor, 0.05),
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                        bgcolor: alpha(categoryColor, 0.1),
                        borderColor: categoryColor,
                    }
                }}
            >
                <Box display="flex" alignItems="center">
                    {icon && <Box sx={{ mr: 1.5, color: categoryColor, display: 'flex' }}>{icon}</Box>}
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                        {label}
                    </Typography>

                    <Controller
                        name={name}
                        control={control}
                        defaultValue={[]}
                        render={({ field }) => (
                            field.value?.length > 0 ? (
                                <Chip
                                    label={field.value.length}
                                    size="small"
                                    sx={{ ml: 1, height: 20, bgcolor: categoryColor, color: '#fff', fontWeight: 700 }}
                                />
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
                        p: 2,
                        mt: 0.5,
                        borderRadius: 3,
                        bgcolor: 'background.paper',
                        borderColor: 'divider'
                    }}
                >
                    {/* Top Bar: Privacy & Help */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Controller
                            name={privacyName}
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={field.value}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                            size="small"
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Typography variant="caption" color="text.secondary">
                                            {t('profile.cognitive.neurodiversity_show')}
                                        </Typography>
                                    }
                                />
                            )}
                        />
                        <Tooltip title={t('profile.cognitive.neurodiversity_help_text')}>
                            <IconButton size="small">
                                <HelpOutline fontSize="small" sx={{ color: '#03a9f4' }} />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Autocomplete Selector */}
                    <Controller
                        name={name}
                        control={control}
                        defaultValue={[]}
                        render={({ field: neuroField }) => {
                            const currentValues = (neuroField.value || []).map((v: any) =>
                                v !== null && typeof v === 'object'
                                    ? String((v as any)?.value ?? (v as any)?.label ?? '')
                                    : String(v ?? '')
                            );
                            const isSpecialSelected = currentValues.some((v: string) => v === 'not_sure' || v === 'prefer_not_to_say');

                            // Find valid options for autocomplete (including custom conditions already in field.value)
                            const extendedOptions = [...options];
                            currentValues.forEach((val: string) => {
                                if (!extendedOptions.find(opt => opt.value === val)) {
                                    extendedOptions.push({ value: val, label: val });
                                }
                            });

                            // Add "Other" if not there
                            if (!extendedOptions.find(opt => opt.value === 'other')) {
                                extendedOptions.push({ value: 'other', label: t('profile.cognitive.neurodiversity_other') });
                            }

                            const handleSelect = (_: any, newValue: Option[]) => {
                                let values = newValue.map(v => v.value);

                                // Logic: If special option selected, clear others
                                const lastSelected = values[values.length - 1];
                                if (lastSelected === 'not_sure' || lastSelected === 'prefer_not_to_say') {
                                    values = [lastSelected];
                                } else if (isSpecialSelected) {
                                    // If we were in special mode and pick something else, clear special
                                    values = values.filter(v => v !== 'not_sure' && v !== 'prefer_not_to_say');
                                }

                                if (values.includes('other')) {
                                    setShowOtherInput(true);
                                } else {
                                    setShowOtherInput(false);
                                }

                                neuroField.onChange(values);
                            };

                            return (
                                <Box>
                                    <Autocomplete
                                        multiple
                                        disabled={isSpecialSelected && currentValues[0] !== 'other'}
                                        options={extendedOptions.filter(opt => opt.value !== 'other' && opt.value !== 'not_sure' && opt.value !== 'prefer_not_to_say')}
                                        getOptionLabel={(option) => option.label}
                                        value={extendedOptions.filter(opt => currentValues.includes(opt.value))}
                                        onChange={handleSelect}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="outlined"
                                                label={t('profile.cognitive.neurodiversity_search')}
                                                size="small"
                                            />
                                        )}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => {
                                                const raw = (option as any)?.label ?? (option as any)?.value ?? option ?? '';
                                                const label = typeof raw === 'string' || typeof raw === 'number' ? String(raw) : '';
                                                return (
                                                    <Chip
                                                        label={label}
                                                        {...getTagProps({ index })}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha(categoryColor, 0.1),
                                                            color: categoryColor,
                                                            fontWeight: 600,
                                                            animation: `${popIn} 0.2s ease-out`
                                                        }}
                                                    />
                                                );
                                            })
                                        }
                                        sx={{ mb: 2 }}
                                    />

                                    {/* Add special options as quick chips below */}
                                    <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                                        {['other', 'not_sure', 'prefer_not_to_say'].map(val => {
                                            const isSelected = currentValues.includes(val);
                                            return (
                                                <Chip
                                                    key={val}
                                                    label={val === 'other' ? t('profile.cognitive.neurodiversity_other') : t(`profile.cognitive.neurodiversity_${val}`)}
                                                    onClick={() => {
                                                        const newValue = isSelected ? currentValues.filter((v: string) => v !== val) : [val];
                                                        handleSelect(null, newValue.map((v: string) => ({ value: v, label: v })));
                                                    }}
                                                    color={isSelected ? 'primary' : 'default'}
                                                    variant={isSelected ? 'filled' : 'outlined'}
                                                    size="small"
                                                />
                                            );
                                        })}
                                    </Box>

                                    {/* Custom Input for "Other" */}
                                    <Collapse in={showOtherInput}>
                                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label={t('profile.cognitive.neurodiversity_add_custom')}
                                                value={customCondition}
                                                onChange={(e) => setCustomCondition(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (customCondition.trim()) {
                                                            const newValue = [...currentValues, customCondition.trim()].filter(v => v !== 'other');
                                                            neuroField.onChange(newValue);
                                                            setCustomCondition('');
                                                            setShowOtherInput(false);
                                                        }
                                                    }
                                                }}
                                            />
                                            <IconButton
                                                color="primary"
                                                disabled={!customCondition.trim()}
                                                onClick={() => {
                                                    const newValue = [...currentValues, customCondition.trim()].filter(v => v !== 'other');
                                                    neuroField.onChange(newValue);
                                                    setCustomCondition('');
                                                    setShowOtherInput(false);
                                                }}
                                            >
                                                <Add />
                                            </IconButton>
                                        </Box>
                                    </Collapse>

                                    {/* List of Selected Conditions with Individual Diagnosis */}
                                    <Controller
                                        name={diagnosesName}
                                        control={control}
                                        defaultValue={[]}
                                        render={({ field: diagField }) => {
                                            const currentDiags = diagField.value || [];
                                            const filteredValues = currentValues.filter((v: string) => v !== 'other' && v !== 'not_sure' && v !== 'prefer_not_to_say');

                                            return (
                                                <Box display="flex" flexDirection="column" gap={1.5}>
                                                    {filteredValues.map((val: string) => {
                                                        const isDiagnosed = currentDiags.includes(val);
                                                        const option = options.find(o => o.value === val);
                                                        const labelText = option ? option.label : val;

                                                        return (
                                                            <Paper
                                                                key={val}
                                                                variant="outlined"
                                                                sx={{
                                                                    p: 1.5,
                                                                    borderRadius: 2,
                                                                    bgcolor: alpha(categoryColor, 0.02),
                                                                    borderColor: isDiagnosed ? alpha(categoryColor, 0.3) : 'divider',
                                                                    animation: `${popIn} 0.2s ease-out`
                                                                }}
                                                            >
                                                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                                        {labelText}
                                                                    </Typography>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => neuroField.onChange(currentValues.filter((v: string) => v !== val))}
                                                                    >
                                                                        <Typography variant="caption">×</Typography>
                                                                    </IconButton>
                                                                </Box>

                                                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                                                    <FormControlLabel
                                                                        control={
                                                                            <Checkbox
                                                                                checked={isDiagnosed}
                                                                                onChange={(e) => {
                                                                                    if (e.target.checked) {
                                                                                        diagField.onChange([...currentDiags, val]);
                                                                                    } else {
                                                                                        diagField.onChange(currentDiags.filter((d: string) => d !== val));
                                                                                    }
                                                                                }}
                                                                                size="small"
                                                                                color="primary"
                                                                            />
                                                                        }
                                                                        label={
                                                                            <Typography variant="caption" sx={{ fontWeight: 500, color: isDiagnosed ? categoryColor : 'text.secondary' }}>
                                                                                {t('profile.cognitive.neurodiversity_diagnosed')}
                                                                            </Typography>
                                                                        }
                                                                    />
                                                                    <Tooltip title={t('profile.cognitive.neurodiversity_diagnosed_help')}>
                                                                        <InfoOutlined sx={{ fontSize: 16, color: '#03a9f4', cursor: 'pointer' }} />
                                                                    </Tooltip>
                                                                </Box>
                                                            </Paper>
                                                        );
                                                    })}
                                                </Box>
                                            );
                                        }}
                                    />
                                </Box>
                            );
                        }}
                    />

                    {/* Footer Guide Message */}
                    <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.05), border: '1px dashed', borderColor: alpha(theme.palette.info.main, 0.3) }}>
                        <Box display="flex" gap={1.5}>
                            <InfoOutlined color="info" sx={{ fontSize: 20, mt: 0.2 }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.4 }}>
                                {t('profile.cognitive.neurodiversity_self_id_help')}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Collapse>
        </Box>
    );
}
