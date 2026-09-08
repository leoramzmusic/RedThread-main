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
    Paper,
    InputAdornment
} from '@mui/material';
import {
    ExpandMore,
    HelpOutline,
    CheckCircle,
    Add,
    HealthAndSafety,
    InfoOutlined
} from '@mui/icons-material';
import { Controller, Control } from 'react-hook-form';
import { useTranslation } from 'next-i18next';

interface HealthConditionsSelectorProps {
    control: Control<any>;
    name: string; // 'health_conditions' (array of strings)
    statusName: string; // 'health_status' (string: 'good', 'prefer_not', 'custom')
    privacyName: string; // 'show_health'
    label: string;
    color?: string;
}

const popIn = keyframes`
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

export default function HealthConditionsSelector({
    control,
    name,
    statusName,
    privacyName,
    label,
    color
}: HealthConditionsSelectorProps) {
    const theme = useTheme();
    const { t } = useTranslation('common');
    const categoryColor = color || theme.palette.secondary.main;
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [inputValue, setInputValue] = useState('');

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
                        <HealthAndSafety />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                        {label}
                    </Typography>

                    <Controller
                        name={statusName}
                        control={control}
                        defaultValue="custom"
                        render={({ field: statusField }) => (
                            <Controller
                                name={name}
                                control={control}
                                defaultValue={[]}
                                render={({ field: conditionsField }) => {
                                    const status = statusField.value;
                                    const conditions = conditionsField.value || [];

                                    if (status === 'good' || status === 'prefer_not') {
                                        return <CheckCircle sx={{ ml: 1, fontSize: 16, color: theme.palette.success.main }} />;
                                    }
                                    if (conditions.length > 0) {
                                        return (
                                            <Chip
                                                label={conditions.length}
                                                size="small"
                                                sx={{ ml: 1, height: 20, bgcolor: categoryColor, color: '#fff', fontWeight: 700 }}
                                            />
                                        );
                                    }
                                    return <></>;
                                }}
                            />
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
                                            {t('profile.wellness.health_show')}
                                        </Typography>
                                    }
                                />
                            )}
                        />
                        <Tooltip title={t('profile.wellness.health_help_text')}>
                            <IconButton size="small">
                                <HelpOutline fontSize="small" sx={{ color: '#03a9f4' }} />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Controller
                        name={statusName}
                        control={control}
                        render={({ field: statusField }) => (
                            <Controller
                                name={name}
                                control={control}
                                render={({ field: conditionsField }) => {
                                    const status = statusField.value;
                                    const conditions = conditionsField.value || [];
                                    const isInputDisabled = status === 'good' || status === 'prefer_not';

                                    const handleAddCondition = () => {
                                        if (inputValue.trim() && !conditions.includes(inputValue.trim())) {
                                            conditionsField.onChange([...conditions, inputValue.trim()]);
                                            statusField.onChange('custom');
                                            setInputValue('');
                                        }
                                    };

                                    const handleRemoveCondition = (val: string) => {
                                        conditionsField.onChange(conditions.filter((c: string) => c !== val));
                                    };

                                    return (
                                        <Box>
                                            {/* Status Shortcuts */}
                                            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                                                <Chip
                                                    label={t('profile.wellness.health_good')}
                                                    onClick={() => {
                                                        if (status === 'good') {
                                                            statusField.onChange('custom');
                                                        } else {
                                                            statusField.onChange('good');
                                                            conditionsField.onChange([]);
                                                        }
                                                    }}
                                                    color={status === 'good' ? 'success' : 'default'}
                                                    variant={status === 'good' ? 'filled' : 'outlined'}
                                                    size="small"
                                                />
                                                <Chip
                                                    label={t('profile.wellness.health_prefer_not')}
                                                    onClick={() => {
                                                        if (status === 'prefer_not') {
                                                            statusField.onChange('custom');
                                                        } else {
                                                            statusField.onChange('prefer_not');
                                                            conditionsField.onChange([]);
                                                        }
                                                    }}
                                                    color={status === 'prefer_not' ? 'warning' : 'default'}
                                                    variant={status === 'prefer_not' ? 'filled' : 'outlined'}
                                                    size="small"
                                                />
                                            </Box>

                                            {/* Condition Input */}
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label={t('profile.wellness.health_add')}
                                                placeholder={t('profile.wellness.health_placeholder')}
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                disabled={isInputDisabled}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddCondition();
                                                    }
                                                }}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={handleAddCondition}
                                                                disabled={isInputDisabled || !inputValue.trim()}
                                                            >
                                                                <Add />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                                sx={{ mb: 2 }}
                                            />

                                            {/* Tag Cloud */}
                                            <Box display="flex" flexWrap="wrap" gap={1}>
                                                {conditions.map((c: string) => (
                                                    <Chip
                                                        key={c}
                                                        label={c}
                                                        onDelete={() => handleRemoveCondition(c)}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha(categoryColor, 0.1),
                                                            color: categoryColor,
                                                            fontWeight: 600,
                                                            animation: `${popIn} 0.2s ease-out`
                                                        }}
                                                    />
                                                ))}
                                            </Box>

                                            {/* Info Box */}
                                            <Box
                                                sx={{
                                                    mt: 3,
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    bgcolor: alpha(theme.palette.info.main, 0.05),
                                                    border: '1px dashed',
                                                    borderColor: alpha(theme.palette.info.main, 0.3)
                                                }}
                                            >
                                                <Box display="flex" gap={1}>
                                                    <InfoOutlined color="info" sx={{ fontSize: 18, mt: 0.2 }} />
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.4 }}>
                                                        {t('profile.wellness.health_privacy_note')}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    );
                                }}
                            />
                        )}
                    />
                </Paper>
            </Collapse>
        </Box>
    );
}
