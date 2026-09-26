import { Grid, Paper, Typography, Box, IconButton, Tooltip, keyframes, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Info as InfoIcon, Search, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'next-i18next';
import { INTENTION_OPTIONS } from '../../../../constants/profileOptions';
import { BaseSectionProps } from '../types';

interface RelationshipGoalsSectionProps extends BaseSectionProps {
    setGoalsInfoOpen: (open: boolean) => void;
    isDiscovery?: boolean;
}

// Animations
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
`;

const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(-5deg); }
  75% { transform: translateY(-8px) rotate(5deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const sway = keyframes`
  0% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
  100% { transform: rotate(-3deg); }
`;

export default function RelationshipGoalsSection({
    control,
    setGoalsInfoOpen,
    isDiscovery = false
}: RelationshipGoalsSectionProps) {
    const { t } = useTranslation('common');

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
                {!isDiscovery && (
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ px: 3, py: 1 }}
                    >
                        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" pr={2}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Search color="action" fontSize="small" />
                                <Typography variant="h6">{t('profile.fields.goals', 'Objetivos de relación')}</Typography>
                            </Box>
                            <Tooltip title={t('common.moreInfo', 'Más información')}>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setGoalsInfoOpen(true);
                                    }}
                                >
                                    <InfoIcon fontSize="small" color="action" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </AccordionSummary>
                )}
                <AccordionDetails sx={{ px: isDiscovery ? 1 : 3, pb: 3, pt: 0 }}>
                    <Typography variant="body2" sx={{ color: isDiscovery ? 'rgba(255,255,255,0.7)' : 'text.secondary', mb: 2 }}>
                        {t('profile.goals_subtitle', 'Selecciona lo que buscas en este momento')}
                    </Typography>
                    <Controller
                        name="relationship_goals"
                        control={control}
                        render={({ field }) => (
                            <Grid container spacing={2}>
                                {INTENTION_OPTIONS.map((option) => {
                                    const isSelected = (field.value || []).includes(option.value);
                                    return (
                                        <Grid item xs={6} sm={4} md={3} key={option.value}>
                                            <Tooltip
                                                title={option.description || ""}
                                                arrow
                                                placement="top"
                                                enterDelay={500}
                                            >
                                                <Paper
                                                    elevation={0}
                                                    onClick={() => {
                                                        const currentValues = field.value || [];
                                                        if (isSelected) {
                                                            field.onChange(currentValues.filter((v: string) => v !== option.value));
                                                        } else {
                                                            field.onChange([...currentValues, option.value]);
                                                        }
                                                    }}
                                                    sx={{
                                                        p: 1.5,
                                                        cursor: 'pointer',
                                                        border: '2px solid',
                                                        borderColor: isSelected ? (isDiscovery ? 'gold' : '#3B82F6') : (isDiscovery ? 'rgba(255,255,255,0.1)' : 'divider'),
                                                        bgcolor: isSelected ? (isDiscovery ? 'rgba(255,215,0,0.1)' : 'rgba(59,130,246,0.1)') : (isDiscovery ? 'rgba(255,255,255,0.05)' : 'background.paper'),
                                                        transition: 'all 0.3s ease',
                                                        height: '100%',
                                                        minHeight: 140,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        textAlign: 'center',
                                                        position: 'relative',
                                                        overflow: 'visible',
                                                        '&:hover': {
                                                            borderColor: isSelected ? '#3B82F6' : 'text.secondary',
                                                            '& .emoji-icon': {
                                                                transform: 'scale(1.3) translateY(-10px)',
                                                                animation: `${float} 0.6s ease-in-out infinite`
                                                            }
                                                        },
                                                        '&:active': {
                                                            transform: 'scale(0.96)'
                                                        }
                                                    }}
                                                >
                                                    <Box
                                                        className="emoji-icon"
                                                        sx={{
                                                            fontSize: isDiscovery ? '60px !important' : '90px !important',
                                                            lineHeight: 1,
                                                            mb: 1,
                                                            transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                            animation: isSelected
                                                                ? `${pulse} 1.8s infinite ease-in-out`
                                                                : `${sway} ${2.5 + Math.random() * 2}s infinite ease-in-out`,
                                                            filter: isSelected ? 'drop-shadow(0 12px 24px rgba(59,130,246,0.5))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                                                            userSelect: 'none',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: 'auto',
                                                            height: 'auto'
                                                        }}
                                                    >
                                                        {option.emoji}
                                                    </Box>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={isSelected ? 700 : 400}
                                                        color={isSelected ? (isDiscovery ? 'gold' : '#3B82F6') : (isDiscovery ? 'white' : 'text.primary')}
                                                    >
                                                        {t(`profile.intentions_map.${option.value}`, option.label)}
                                                    </Typography>
                                                </Paper>
                                            </Tooltip>
                                        </Grid>
                                    );
                                })}
                            </Grid >
                        )}
                    />
                </AccordionDetails>
            </Accordion>
        </Grid >
    );
}
