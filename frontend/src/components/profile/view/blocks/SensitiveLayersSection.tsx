import { Box, Typography, Chip, Stack } from '@mui/material';
import { Psychology, Favorite } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ProfileSectionBlock from './ProfileSectionBlock';

interface SensitiveLayersSectionProps {
    profile: any;
    isOwnProfile?: boolean;
    onEdit?: () => void;
}

export default function SensitiveLayersSection({ profile, isOwnProfile, onEdit }: SensitiveLayersSectionProps) {
    const { t } = useTranslation('common');

    const showNeurodiversity = profile.show_neurodiversity;
    const showHealth = profile.show_health;

    // Data presence check
    const hasNeuro = profile.neurodiversity?.length > 0 || profile.neurodiversity_diagnoses?.length > 0;
    const hasHealth = profile.health_conditions?.length > 0 || profile.disabilities?.length > 0;

    // Visibility check
    // If it's own profile, we always show the block, but maybe with a "Hidden" state if settings are off.
    // However, the requirement says: "Si el usuario oculta... se muestra mensaje".
    // If not own profile, and hidden, we probably shouldn't render this block at all in the parent,
    // or render it as "Hidden".

    // Let's assume this component is rendered.
    // If both are hidden and hasData is true -> Section is "Hidden"
    const isHidden = (hasNeuro && !showNeurodiversity) && (hasHealth && !showHealth);

    // If no data at all
    const isEmpty = !hasNeuro && !hasHealth;

    // Condition to render specific subsections
    const renderNeuro = hasNeuro && (showNeurodiversity || isOwnProfile);
    const renderHealth = hasHealth && (showHealth || isOwnProfile);

    // If I am the owner and I have data but it is hidden, I want to see usage of "Hidden" prop in ProfileSectionBlock?
    // The ProfileSectionBlock `isHidden` prop displays the specific message.

    // Logic:
    // If isOwnProfile:
    //   If hasData:
    //      If all hidden -> Show block with isHidden=true (so owner knows it's hidden)
    //      If strictly partial visibility? We can just show what is visible or show warnings.
    // If !isOwnProfile:
    //   If all hidden -> Parent likely won't render, or we render null?
    //   For now, let's implement the internal rendering.

    return (
        <ProfileSectionBlock
            title={t('profile.sections.sensitive.title', 'Capas sensibles')}
            icon={<Psychology />}
            onEdit={onEdit}
            isEmpty={isEmpty}
            isHidden={isOwnProfile && isHidden}
        >
            <Stack spacing={3}>
                {renderNeuro && (
                    <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Psychology fontSize="small" color="action" />
                            <Typography variant="subtitle2">
                                {t('profile.fields.neurodiversity', 'Neurodiversidad')}
                            </Typography>
                            {isOwnProfile && !showNeurodiversity && (
                                <Chip label="Hidden" size="small" variant="outlined" color="warning" sx={{ height: 20 }} />
                            )}
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {/* Combine self-id and diagnoses? */}
                            {[...(profile.neurodiversity || []), ...(profile.neurodiversity_diagnoses || [])].map((item: string, i) => (
                                <Chip
                                    key={`neuro-${i}`}
                                    label={t(`neurodiversity.${item}`, item) as string}
                                    size="small"
                                />

                            ))}
                        </Stack>
                    </Box>
                )}

                {renderHealth && (
                    <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Favorite fontSize="small" color="action" />
                            <Typography variant="subtitle2">
                                {t('profile.fields.health', 'Salud y bienestar')}
                            </Typography>
                            {isOwnProfile && !showHealth && (
                                <Chip label="Hidden" size="small" variant="outlined" color="warning" sx={{ height: 20 }} />
                            )}
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {[...(profile.health_conditions || []), ...(profile.disabilities || [])].map((item: string, i) => (
                                <Chip
                                    key={`health-${i}`}
                                    label={t(`health.${item}`, item) as string}
                                    size="small"
                                />

                            ))}
                        </Stack>
                    </Box>
                )}
            </Stack>
        </ProfileSectionBlock>
    );
}
