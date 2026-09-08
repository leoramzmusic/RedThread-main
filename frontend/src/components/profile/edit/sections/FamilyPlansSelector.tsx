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
    Chip,
    Stack,
    keyframes
} from '@mui/material';
import {
    ChildCare,
    ExpandMore,
    InfoOutlined,
    LockOutlined
} from '@mui/icons-material';
import { Controller, Control, useWatch } from 'react-hook-form';
import { FAMILY_PLAN_OPTIONS, CHILD_ACCEPTANCE_OPTIONS } from '../../../../constants/profileOptions';

interface FamilyPlansSelectorProps {
    control: Control<any>;
    defaultCollapsed?: boolean;
}

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export default function FamilyPlansSelector({ control, defaultCollapsed = true }: FamilyPlansSelectorProps) {
    const theme = useTheme();
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const familyColor = "#FF9800";

    // Watch relevant fields for dynamic UI
    const familyPlansRelevant = useWatch({
        control,
        name: 'family_plans_relevant',
        defaultValue: true
    });

    const currentFamilyPlan = useWatch({
        control,
        name: 'family_plans',
        defaultValue: null
    });

    const isRelevant = familyPlansRelevant !== false;

    return (
        <Box sx={{ width: '100%' }}>
            {/* Header */}
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
                    <ChildCare sx={{ mr: 1.5, color: familyColor }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                        Planes de familia
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

            <Collapse in={!isCollapsed}>
                <Box
                    sx={{
                        p: 2.5,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                    }}
                >
                    {/* Subtitle */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                        ¿Cuál es tu postura actual sobre tener hijos?
                    </Typography>

                    {/* Emotional Microcopy */}
                    <Box
                        sx={{
                            p: 2,
                            mb: 3,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: alpha(theme.palette.background.paper, 0.8),
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            💡 Tu decisión sobre tener hijos es parte de tu camino. Aquí puedes expresarla con libertad.
                        </Typography>
                    </Box>

                    {/* Family Plan Options */}
                    <Box sx={{ mb: 4 }}>
                        <Controller
                            name="family_plans"
                            control={control}
                            render={({ field }) => (
                                <Grid container spacing={2}>
                                    {FAMILY_PLAN_OPTIONS.map((option, index) => {
                                        const isSelected = field.value === option.value;
                                        return (
                                            <Grid item xs={12} sm={6} key={option.value}>
                                                <Tooltip
                                                    title={option.description}
                                                    arrow
                                                    placement="top"
                                                    enterDelay={500}
                                                >
                                                    <Paper
                                                        elevation={0}
                                                        onClick={() => field.onChange(option.value)}
                                                        sx={{
                                                            p: 2,
                                                            cursor: 'pointer',
                                                            border: '2px solid',
                                                            borderColor: isSelected ? familyColor : 'divider',
                                                            bgcolor: isSelected ? alpha(familyColor, 0.08) : 'background.paper',
                                                            transition: 'all 0.3s ease',
                                                            height: '100%',
                                                            minHeight: 100,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            textAlign: 'center',
                                                            position: 'relative',
                                                            overflow: 'visible',
                                                            animation: `${fadeInUp} 0.5s ease-out ${index * 0.1}s both`,
                                                            '&:hover': {
                                                                borderColor: isSelected ? familyColor : 'text.secondary',
                                                                transform: 'translateY(-4px)',
                                                                boxShadow: isSelected
                                                                    ? `0 8px 24px ${alpha(familyColor, 0.3)}`
                                                                    : '0 4px 12px rgba(0,0,0,0.1)',
                                                            },
                                                            '&:active': {
                                                                transform: 'scale(0.98)'
                                                            }
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                fontSize: '40px !important',
                                                                lineHeight: 1,
                                                                mb: 1.5,
                                                                transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                                animation: isSelected
                                                                    ? `${pulse} 1.5s infinite ease-in-out`
                                                                    : 'none',
                                                                filter: isSelected
                                                                    ? `drop-shadow(0 8px 16px ${alpha(familyColor, 0.4)})`
                                                                    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                                                                userSelect: 'none'
                                                            }}
                                                        >
                                                            {option.emoji}
                                                        </Box>
                                                        <Typography
                                                            variant="body1"
                                                            fontWeight={isSelected ? 700 : 500}
                                                            color={isSelected ? familyColor : 'text.primary'}
                                                        >
                                                            {option.label}
                                                        </Typography>
                                                    </Paper>
                                                </Tooltip>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            )}
                        />
                    </Box>

                    {/* Compatibility Switch */}
                    <Controller
                        name="family_plans_relevant"
                        control={control}
                        defaultValue={true}
                        render={({ field: relevantField }) => (
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
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                ¿Te gustaría que esta información influya en tu compatibilidad?
                                            </Typography>
                                        }
                                    />
                                    <Tooltip
                                        title="Tu plan familiar puede influir en tu compatibilidad. Tú decides si lo activas."
                                        arrow
                                        placement="top"
                                    >
                                        <InfoOutlined sx={{ fontSize: 20, color: 'primary.main', cursor: 'help', mt: 0.5 }} />
                                    </Tooltip>
                                </Box>

                                {/* Child Acceptance Section */}
                                <Box sx={{
                                    position: 'relative',
                                    opacity: isRelevant ? 1 : 0.4,
                                    pointerEvents: isRelevant ? 'auto' : 'none',
                                    transition: 'all 0.4s ease'
                                }}>
                                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, px: 0.5 }}>
                                        🧠 ¿Estás abierto/a a conectar con alguien que ya tenga hijos?
                                    </Typography>

                                    <Controller
                                        name="child_acceptance"
                                        control={control}
                                        defaultValue={null}
                                        render={({ field: acceptanceField }) => (
                                            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ gap: 1.5 }}>
                                                {CHILD_ACCEPTANCE_OPTIONS.map((option) => {
                                                    const isSelected = acceptanceField.value === option.value;
                                                    return (
                                                        <Tooltip
                                                            key={option.value}
                                                            title={option.description}
                                                            arrow
                                                            placement="top"
                                                        >
                                                            <Chip
                                                                label={`${option.emoji} ${option.label}`}
                                                                onClick={() => acceptanceField.onChange(option.value)}
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
                                                        </Tooltip>
                                                    );
                                                })}
                                            </Stack>
                                        )}
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

                                {/* Example Case Display */}
                                <Collapse in={isRelevant && currentFamilyPlan && currentFamilyPlan !== 'undecided'}>
                                    <Box sx={{
                                        mt: 3,
                                        pt: 2,
                                        borderTop: '1px dashed',
                                        borderColor: 'divider',
                                        textAlign: 'center'
                                    }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontStyle: 'italic',
                                                color: 'primary.main',
                                                fontWeight: 500,
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            "Tu plan familiar es parte de tu esencia. CARE lo usará para encontrar conexiones más profundas."
                                        </Typography>
                                    </Box>
                                </Collapse>
                            </Box>
                        )}
                    />
                </Box>
            </Collapse>
        </Box>
    );
}
