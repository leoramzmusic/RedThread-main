import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    alpha,
    useTheme,
    ButtonBase,
    Tooltip,
    IconButton,
    Chip,
    Collapse
} from '@mui/material';
import {
    CheckCircle,
    HelpOutline,
    Visibility,
    Hearing,
    FitnessCenter,
    MenuBook,
    AccountTree,
    Groups,
    Person,
    QuestionMark,
    InfoOutlined,
    ExpandMore,
    AutoStories
} from '@mui/icons-material';
import { Controller, Control } from 'react-hook-form';
import { useTranslation } from 'next-i18next';

interface LearningStyleOption {
    value: string;
    label: string;
    description: string;
    icon: React.ReactElement;
}

interface LearningStyleSelectorProps {
    control: Control<any>;
    name: string;
    label: string;
    color?: string;
}

export default function LearningStyleSelector({
    control,
    name,
    label,
    color
}: LearningStyleSelectorProps) {
    const { t } = useTranslation('common');
    const theme = useTheme();
    const activeColor = color || theme.palette.primary.main;

    const options: LearningStyleOption[] = [
        { value: 'visual', label: t('profile.cognitive.learning_visual'), description: t('profile.cognitive.learning_visual_desc'), icon: <Visibility /> },
        { value: 'auditory', label: t('profile.cognitive.learning_auditory'), description: t('profile.cognitive.learning_auditory_desc'), icon: <Hearing /> },
        { value: 'kinesthetic', label: t('profile.cognitive.learning_kinesthetic'), description: t('profile.cognitive.learning_kinesthetic_desc'), icon: <FitnessCenter /> },
        { value: 'verbal', label: t('profile.cognitive.learning_verbal'), description: t('profile.cognitive.learning_verbal_desc'), icon: <MenuBook /> },
        { value: 'logical', label: t('profile.cognitive.learning_logical'), description: t('profile.cognitive.learning_logical_desc'), icon: <AccountTree /> },
        { value: 'social', label: t('profile.cognitive.learning_social'), description: t('profile.cognitive.learning_social_desc'), icon: <Groups /> },
        { value: 'solitary', label: t('profile.cognitive.learning_solitary'), description: t('profile.cognitive.learning_solitary_desc'), icon: <Person /> },
        { value: 'not_sure', label: t('profile.cognitive.learning_not_sure'), description: '', icon: <QuestionMark /> },
        { value: 'prefer_not_to_say', label: t('profile.cognitive.learning_prefer_not_to_say'), description: '', icon: <InfoOutlined /> },
    ];

    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <Controller
            name={name}
            control={control}
            defaultValue={[]}
            render={({ field }) => {
                const currentValues = Array.isArray(field.value) ? field.value : [];
                const maxReached = currentValues.length >= 3;

                const handleToggle = (value: string) => {
                    if (value === 'not_sure' || value === 'prefer_not_to_say') {
                        if (currentValues.includes(value)) {
                            field.onChange([]);
                        } else {
                            field.onChange([value]);
                        }
                        return;
                    }

                    let nextValues = currentValues.filter(v => v !== 'not_sure' && v !== 'prefer_not_to_say');

                    if (nextValues.includes(value)) {
                        nextValues = nextValues.filter(v => v !== value);
                    } else if (nextValues.length < 3) {
                        nextValues = [...nextValues, value];
                    }
                    field.onChange(nextValues);
                };

                return (
                    <Box sx={{ width: '100%' }}>
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
                                <Box sx={{ mr: 1.5, color: activeColor, display: 'flex' }}>
                                    <AutoStories />
                                </Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                    {label}
                                </Typography>
                                {currentValues.length > 0 && (
                                    <Chip
                                        label={currentValues.length}
                                        size="small"
                                        sx={{ ml: 1, height: 20, bgcolor: activeColor, color: '#fff', fontWeight: 700 }}
                                    />
                                )}
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

                        <Collapse in={!isCollapsed}>
                            <Box sx={{
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 3,
                                bgcolor: 'background.paper',
                                mt: 1
                            }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                            {t('profile.cognitive.learning_help_title', { defaultValue: 'Selecciona hasta 3 estilos' })}
                                        </Typography>
                                        <Tooltip title={t('profile.cognitive.learning_help')}>
                                            <IconButton size="small" color="info">
                                                <HelpOutline fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                    <Typography variant="caption" color={maxReached ? 'error' : 'text.secondary'}>
                                        {currentValues.length}/3 seleccionados
                                    </Typography>
                                </Box>

                                <Grid container spacing={1.5}>
                                    {options.map((option) => {
                                        const isSelected = currentValues.includes(option.value);
                                        const isDisabled = !isSelected && maxReached && option.value !== 'not_sure' && option.value !== 'prefer_not_to_say';

                                        return (
                                            <Grid item xs={12} sm={6} key={option.value}>
                                                <ButtonBase
                                                    onClick={() => handleToggle(option.value)}
                                                    disabled={isDisabled}
                                                    sx={{
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        borderRadius: 3,
                                                        overflow: 'hidden',
                                                        transition: 'all 0.2s',
                                                        opacity: isDisabled ? 0.5 : 1,
                                                    }}
                                                >
                                                    <Paper
                                                        elevation={isSelected ? 3 : 0}
                                                        sx={{
                                                            p: 2,
                                                            width: '100%',
                                                            display: 'flex',
                                                            gap: 2,
                                                            alignItems: 'center',
                                                            border: '2px solid',
                                                            borderColor: isSelected ? activeColor : 'divider',
                                                            bgcolor: isSelected ? alpha(activeColor, 0.05) : 'background.paper',
                                                            '&:hover': {
                                                                borderColor: isSelected ? activeColor : alpha(activeColor, 0.5),
                                                                bgcolor: isSelected ? alpha(activeColor, 0.08) : alpha(theme.palette.action.hover, 0.04),
                                                            }
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                width: 44,
                                                                height: 44,
                                                                borderRadius: 2,
                                                                bgcolor: isSelected ? activeColor : alpha(theme.palette.text.secondary, 0.1),
                                                                color: isSelected ? '#fff' : 'text.secondary',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            {option.icon}
                                                        </Box>

                                                        <Box flex={1}>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    color: isSelected ? activeColor : 'text.primary'
                                                                }}
                                                            >
                                                                {option.label}
                                                            </Typography>
                                                            {option.description && (
                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2, mt: 0.5 }}>
                                                                    {option.description}
                                                                </Typography>
                                                            )}
                                                        </Box>

                                                        {isSelected && (
                                                            <CheckCircle sx={{ color: activeColor, fontSize: 20 }} />
                                                        )}
                                                    </Paper>
                                                </ButtonBase>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Box>
                        </Collapse>
                    </Box>
                );
            }}
        />
    );
}
