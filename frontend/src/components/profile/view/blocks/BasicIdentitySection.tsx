import { Box, Typography, Chip, Stack } from '@mui/material';
import { Person } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ProfileSectionBlock from './ProfileSectionBlock';

interface BasicIdentitySectionProps {
    profile: any;
    onEdit?: () => void;
}

export default function BasicIdentitySection({ profile, onEdit }: BasicIdentitySectionProps) {
    const { t } = useTranslation('common');

    const hasData = profile.pronouns || profile.gender || profile.sexual_orientation || profile.relationship_status;

    return (
        <ProfileSectionBlock
            title={t('profile.sections.identity.title', 'Identidad básica')}
            icon={<Person />}
            onEdit={onEdit}
            isEmpty={!hasData}
        >
            <Stack spacing={2}>
                {profile.pronouns && (
                    <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                            {t('profile.fields.pronouns', 'Pronombres')}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Chip
                                label={profile.pronouns}
                                size="small"
                                sx={{ bgcolor: 'action.selected', color: 'text.primary', fontWeight: 500 }}
                            />
                            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                Tu pronombre es parte de tu identidad. La compatibilidad se basa en la orientación sexual y otros factores.
                            </Typography>
                        </Stack>
                    </Box>
                )}

                <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                        {t('profile.sections.identity.title', 'Identidad')}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                        {profile.gender && (
                            <Chip
                                label={t(`gender.${profile.gender}`, profile.gender) as string}
                                variant="outlined"
                                size="small"
                            />

                        )}
                        {profile.sexual_orientation && (
                            <Chip
                                label={t(`orientation.${profile.sexual_orientation}`, profile.sexual_orientation) as string}
                                variant="outlined"
                                size="small"
                            />

                        )}
                    </Stack>
                </Box>

                {profile.relationship_status && (
                    <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                            {t('profile.fields.relationship_status', 'Estado civil')}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {t(`relationship_status.${profile.relationship_status}`, profile.relationship_status) as string}
                        </Typography>

                    </Box>
                )}
            </Stack>
        </ProfileSectionBlock>
    );
}
