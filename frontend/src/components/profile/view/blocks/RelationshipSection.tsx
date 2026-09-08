import { useState } from 'react';
import { Box, Typography, Chip, Collapse, Button, Stack } from '@mui/material';
import { FavoriteBorder, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ProfileSectionBlock from './ProfileSectionBlock';

interface RelationshipSectionProps {
    profile: any;
    onEdit?: () => void;
}

export default function RelationshipSection({ profile, onEdit }: RelationshipSectionProps) {
    const { t } = useTranslation('common');
    const [expandedInterests, setExpandedInterests] = useState(false);

    const goals = profile.relationship_goals || [];
    const interests = profile.interests || [];
    const hasData = goals.length > 0 || interests.length > 0;

    const visibleInterests = expandedInterests ? interests : interests.slice(0, 10);
    const hasMoreInterests = interests.length > 10;

    return (
        <ProfileSectionBlock
            title={t('profile.sections.relationship.title', 'Relación y compatibilidad')}
            icon={<FavoriteBorder />}
            onEdit={onEdit}
            isEmpty={!hasData}
        >
            <Stack spacing={3}>
                {goals.length > 0 && (
                    <Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                            {t('profile.fields.goals', 'Objetivos de relación')}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {goals.map((goal: string, i: number) => (
                                <Chip
                                    key={i}
                                    label={t(`goals.${goal}`, goal) as string}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />

                            ))}
                        </Stack>
                    </Box>
                )}

                {interests.length > 0 && (
                    <Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                            {t('profile.fields.interests', 'Intereses')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {visibleInterests.map((interest: string, i: number) => (
                                <Chip
                                    key={i}
                                    label={interest}
                                    size="small"
                                    sx={{ bgcolor: 'action.hover' }}
                                />
                            ))}
                        </Box>
                        {hasMoreInterests && (
                            <Button
                                size="small"
                                endIcon={expandedInterests ? <ExpandLess /> : <ExpandMore />}
                                onClick={() => setExpandedInterests(!expandedInterests)}
                                sx={{ mt: 1, textTransform: 'none' }}
                            >
                                {expandedInterests ? t('show_less', 'Ver menos') : t('show_more', 'Ver más')}
                            </Button>
                        )}
                    </Box>
                )}
            </Stack>
        </ProfileSectionBlock>
    );
}
