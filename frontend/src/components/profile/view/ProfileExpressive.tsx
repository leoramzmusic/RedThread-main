import { Grid, Box, Typography, Chip, alpha, useTheme } from '@mui/material';
import {
    Psychology,
    WorkspacePremium,
    AutoFixHigh,
    HeartBroken,
    MusicNote,
    Favorite,
    HealthAndSafety,
    CheckCircle,
    Visibility,
    Hearing,
    FitnessCenter,
    MenuBook,
    AccountTree,
    Groups,
    Person,
    QuestionMark,
    InfoOutlined
} from '@mui/icons-material';
import { InfoSection } from './InfoSection';
import { useTranslation } from 'next-i18next';

interface ProfileExpressiveProps {
    profile: any;
}

export default function ProfileExpressive({ profile }: ProfileExpressiveProps) {
    const { t } = useTranslation('common');
    const theme = useTheme();

    const hasValue = (val: any) => {
        if (Array.isArray(val)) return val.length > 0;
        return val !== null && val !== undefined && val !== '';
    };

    const renderTrait = (label: string, value: string, category: string) => {
        if (!value) return null;
        return (
            <Chip
                label={`${label}: ${t(`profile.${category}.${value}`)}`}
                size="small"
                sx={{
                    m: 0.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2)
                }}
            />
        );
    };

    const hasPersonality = hasValue(profile.social_style) || hasValue(profile.processing_style);
    const hasExtras = hasValue(profile.superpower) || hasValue(profile.achilles_heel) || hasValue(profile.personal_soundtrack_text);
    const hasNeuro = profile.show_neurodiversity && (hasValue(profile.neurodiversity) || hasValue(profile.learning_preferences));
    const hasLifestyle = hasValue(profile.love_language) || hasValue(profile.family_plans) || hasValue(profile.communication_style);

    if (!hasPersonality && !hasExtras && !hasNeuro && !hasLifestyle) return null;

    return (
        <>
            {hasPersonality && (
                <InfoSection title={t('profile.personality.title')} icon={<Psychology />}>
                    <Box display="flex" flexWrap="wrap">
                        {renderTrait(t('profile.personality.socialStyle'), profile.social_style, 'personality.socialStyle')}
                        {renderTrait(t('profile.personality.processingStyle'), profile.processing_style, 'personality.processingStyle')}
                        {renderTrait(t('profile.personality.riskTolerance'), profile.risk_tolerance, 'personality.riskTolerance')}
                        {renderTrait(t('profile.personality.decisionMaking'), profile.decision_making, 'personality.decisionMaking')}
                    </Box>
                </InfoSection>
            )}

            {hasNeuro && (
                <InfoSection title={t('profile.cognitive.title')} icon={<Psychology />}>
                    <Box display="flex" flexWrap="wrap">
                        {profile.neurodiversity?.map((item: string) => {
                            const isDiagnosed = profile.neurodiversity_diagnoses?.includes(item);
                            return (
                                <Chip
                                    key={item}
                                    icon={isDiagnosed ? <CheckCircle style={{ fontSize: 16, color: 'inherit' }} /> : undefined}
                                    label={`${t(`profile.cognitive.neurodiversity_${item}`)}${isDiagnosed ? ` (${t('profile.cognitive.neurodiversity_diagnosed_badge')})` : ` (${t('profile.cognitive.neurodiversity_self_id_badge')})`}`}
                                    size="small"
                                    sx={{
                                        m: 0.5,
                                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                        color: theme.palette.secondary.main,
                                        fontWeight: isDiagnosed ? 700 : 500,
                                        '& .MuiChip-icon': {
                                            color: 'inherit'
                                        }
                                    }}
                                />
                            );
                        })}
                        {profile.learning_preferences?.map((item: string) => {
                            const getLearningIcon = (type: string) => {
                                switch (type) {
                                    case 'visual': return <Visibility style={{ fontSize: 16 }} />;
                                    case 'auditory': return <Hearing style={{ fontSize: 16 }} />;
                                    case 'kinesthetic': return <FitnessCenter style={{ fontSize: 16 }} />;
                                    case 'verbal': return <MenuBook style={{ fontSize: 16 }} />;
                                    case 'logical': return <AccountTree style={{ fontSize: 16 }} />;
                                    case 'social': return <Groups style={{ fontSize: 16 }} />;
                                    case 'solitary': return <Person style={{ fontSize: 16 }} />;
                                    case 'not_sure': return <QuestionMark style={{ fontSize: 16 }} />;
                                    case 'prefer_not_to_say': return <InfoOutlined style={{ fontSize: 16 }} />;
                                    default: return undefined;
                                }
                            };

                            return (
                                <Chip
                                    key={item}
                                    icon={getLearningIcon(item)}
                                    label={t(`profile.cognitive.learning_${item}`)}
                                    size="small"
                                    sx={{
                                        m: 0.5,
                                        bgcolor: alpha(theme.palette.info.main, 0.1),
                                        color: theme.palette.info.main,
                                        fontWeight: 600,
                                        '& .MuiChip-icon': { color: 'inherit' }
                                    }}
                                />
                            );
                        })}
                    </Box>
                </InfoSection>
            )}

            {hasExtras && (
                <InfoSection title={t('profile.extras.title')} icon={<WorkspacePremium />}>
                    <Grid container spacing={2}>
                        {profile.superpower && (
                            <Grid item xs={12}>
                                <Box display="flex" gap={1}>
                                    <AutoFixHigh color="primary" fontSize="small" />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">{t('profile.extras.superpower')}</Typography>
                                        <Typography variant="body2">{profile.superpower}</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}
                        {profile.achilles_heel && (
                            <Grid item xs={12}>
                                <Box display="flex" gap={1}>
                                    <HeartBroken color="error" fontSize="small" />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">{t('profile.extras.achillesHeel')}</Typography>
                                        <Typography variant="body2">{profile.achilles_heel}</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}
                        {profile.personal_soundtrack_text && (
                            <Grid item xs={12}>
                                <Box display="flex" gap={1}>
                                    <MusicNote color="secondary" fontSize="small" />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">{t('profile.extras.soundtrack')}</Typography>
                                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                            "{profile.personal_soundtrack_text}"
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </InfoSection>
            )}

            {hasLifestyle && (
                <InfoSection title={t('profile.lifestyle.title')} icon={<Favorite />}>
                    <Box display="flex" flexWrap="wrap">
                        {renderTrait(t('profile.lifestyle.love_language'), profile.love_language, 'lifestyle')}
                        {renderTrait(t('profile.lifestyle.communication_style'), profile.communication_style, 'lifestyle')}
                        {renderTrait(t('profile.lifestyle.family_plans'), profile.family_plans, 'lifestyle')}
                    </Box>
                </InfoSection>
            )}
        </>
    );
}
