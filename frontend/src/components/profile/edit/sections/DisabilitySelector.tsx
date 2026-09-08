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
    Accessible
} from '@mui/icons-material';
import { Controller, Control, UseFormSetValue } from 'react-hook-form';
import { useTranslation } from 'next-i18next';

interface Option {
    value: string;
    label: string;
}

interface DisabilitySelectorProps {
    control: Control<any>;
    setValue: UseFormSetValue<any>;
    name: string; // 'disabilities'
    diagnosesName: string; // 'disabilities_diagnoses'
    privacyName: string; // 'show_disabilities'
    label: string;
    options: Option[];
    color?: string;
}

const popIn = keyframes`
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

export default function DisabilitySelector({
    control,
    setValue,
    name,
    diagnosesName,
    privacyName,
    label,
    options,
    color
}: DisabilitySelectorProps) {
    const theme = useTheme();
    const { t } = useTranslation('common');
    const categoryColor = color || theme.palette.primary.main;
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [customCondition, setCustomCondition] = useState('');

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
                    <Box sx={{ mr: 1.5, color: categoryColor, display: 'flex' }}>
                        <Accessible />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                        {label}
                    </Typography>

                    <Controller
                        name={name}
                        control={control}
                        defaultValue={[]}
                        render={({ field }) => (
                            field.value?.length > 0 && !field.value.includes('none') ? (
                                <Chip
                                    label={field.value.length}
                                    size="small"
                                    sx={{ ml: 1, height: 20, bgcolor: categoryColor, color: '#fff', fontWeight: 700 }}
                                />
                            ) : field.value?.includes('none') ? (
                                <CheckCircle sx={{ ml: 1, fontSize: 16, color: theme.palette.success.main }} />
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
                                            {t('profile.wellness.disability_show')}
                                        </Typography>
                                    }
                                />
                            )}
                        />
                        <Tooltip title={t('profile.wellness.health_privacy_note')}>
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
                        render={({ field: disField }) => {
                            const currentValues = disField.value || [];
                            const isNoneSelected = currentValues.includes('none');
                            const isOtherSelected = currentValues.includes('other');

                            // Options including "Other" and "None" if not already in options prop
                            const extendedOptions = [...options];
                            if (!extendedOptions.find(opt => opt.value === 'none')) {
                                extendedOptions.push({ value: 'none', label: t('profile.wellness.disability_none') });
                            }
                            if (!extendedOptions.find(opt => opt.value === 'other')) {
                                extendedOptions.push({ value: 'other', label: t('profile.wellness.disability_other') });
                            }

                            const handleSelect = (_: any, newValue: any[]) => {
                                let values = newValue.map((v: any) => (typeof v === 'object' && v ? v.value : v));
                                const lastSelected = values[values.length - 1];

                                if (lastSelected === 'none') {
                                    values = ['none'];
                                    setCustomCondition(''); // Clear custom input if None selected
                                } else if (lastSelected === 'other') {
                                    // Keep other selected to show input
                                    values = values.filter(v => v !== 'none');
                                } else {
                                    // Regular selection
                                    values = values.filter(v => v !== 'none');
                                }
                                disField.onChange(values);
                            };

                            const handleAddCustom = () => {
                                if (customCondition.trim()) {
                                    // Remove 'other' and add the custom text
                                    const newValues = currentValues.filter((v: string) => v !== 'other');
                                    newValues.push(customCondition.trim());
                                    disField.onChange(newValues);
                                    setCustomCondition('');
                                }
                            };

                            return (
                                <Box>
                                    <Autocomplete
                                        multiple
                                        options={extendedOptions.filter(opt => opt.value !== 'none')}
                                        getOptionLabel={(option) => {
                                            const found = extendedOptions.find(o => o.value === option.value);
                                            return found ? found.label : option.value || option;
                                        }}
                                        // Handle free solo values (strings not in options)
                                        freeSolo
                                        value={currentValues.filter((v: string) => v !== 'none' && v !== 'other').map((v: string) => {
                                            const opt = extendedOptions.find(o => o.value === v);
                                            return opt || { value: v, label: v };
                                        })}


                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="outlined"
                                                label={t('profile.wellness.disability_search')}
                                                size="small"
                                            />
                                        )}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option: any, index: number) => (
                                                <Chip
                                                    label={option.label || option}
                                                    {...getTagProps({ index })}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: alpha(categoryColor, 0.1),
                                                        color: categoryColor,
                                                        fontWeight: 600,
                                                        animation: `${popIn} 0.2s ease-out`
                                                    }}
                                                />
                                            ))
                                        }
                                        sx={{ mb: 2 }}
                                        // Override onChange to use our logic
                                        onChange={(_e, newValue) => handleSelect(_e, newValue)}
                                        disabled={isNoneSelected}
                                    />

                                    {/* Custom Input for "Other" */}
                                    <Collapse in={isOtherSelected}>
                                        <Box display="flex" gap={1} mb={2}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={customCondition}
                                                onChange={(e) => setCustomCondition(e.target.value)}
                                                placeholder={t('profile.wellness.disability_search')}
                                                // Note: reusing translation or add new key 'disability_specify'
                                                label="Especificar"
                                            />
                                            <ButtonBase
                                                onClick={handleAddCustom}
                                                disabled={!customCondition.trim()}
                                                sx={{
                                                    bgcolor: categoryColor,
                                                    color: '#fff',
                                                    px: 2,
                                                    borderRadius: 1,
                                                    opacity: !customCondition.trim() ? 0.5 : 1
                                                }}
                                            >
                                                {t('profile.wellness.add')}
                                            </ButtonBase>
                                        </Box>
                                    </Collapse>


                                    {/* Quick Chip for "Ninguna" */}
                                    <Box display="flex" gap={1} mb={2}>
                                        <Chip
                                            label={t('profile.wellness.disability_none')}
                                            onClick={() => {
                                                if (isNoneSelected) {
                                                    disField.onChange([]);
                                                } else {
                                                    disField.onChange(['none']);
                                                    setValue(diagnosesName, []);
                                                }
                                            }}
                                            color={isNoneSelected ? 'success' : 'default'}
                                            variant={isNoneSelected ? 'filled' : 'outlined'}
                                            size="small"
                                            icon={isNoneSelected ? <CheckCircle style={{ color: '#fff' }} /> : undefined}
                                        />
                                    </Box>

                                    {/* List of Selected Disabilities with Individual Diagnosis */}
                                    <Controller
                                        name={diagnosesName}
                                        control={control}
                                        defaultValue={[]}
                                        render={({ field: diagField }) => {
                                            const currentDiags = diagField.value || [];
                                            const filteredValues = currentValues.filter((v: string) => v !== 'none' && v !== 'other');

                                            if (filteredValues.length === 0) return <></>;

                                            return (
                                                <Box display="flex" flexDirection="column" gap={1.5}>
                                                    {filteredValues.map((val: string) => {
                                                        const isDiagnosed = currentDiags.includes(val);
                                                        const option = extendedOptions.find(o => o.value === val);
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
                                                                        onClick={() => {
                                                                            const newVals = currentValues.filter((v: string) => v !== val);
                                                                            disField.onChange(newVals);
                                                                            diagField.onChange(currentDiags.filter((d: string) => d !== val));
                                                                        }}
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
                                                                                {t('profile.wellness.disability_diagnosed')}
                                                                            </Typography>
                                                                        }
                                                                    />
                                                                    <Tooltip title={t('profile.wellness.disability_diagnosed_help')}>
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
                </Paper>
            </Collapse>
        </Box>
    );
}

