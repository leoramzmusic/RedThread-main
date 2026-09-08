import { Box, Typography, Stack, Card, CardContent, Avatar } from '@mui/material';
import { MusicNote, QuestionAnswer } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ProfileSectionBlock from './ProfileSectionBlock';

interface EmotionalExpressionSectionProps {
    profile: any;
    onEdit?: () => void;
}

export default function EmotionalExpressionSection({ profile, onEdit }: EmotionalExpressionSectionProps) {
    const { t } = useTranslation('common');

    const miHimno = profile.mi_himno;
    const featuredSong = miHimno?.featured_songs?.[0]; // Taking the first one as "Anthem" for now
    const prompts = profile.prompts || [];

    const hasData = featuredSong || prompts.length > 0;

    return (
        <ProfileSectionBlock
            title={t('profile.sections.emotional.title', 'Expresión emocional')}
            icon={<MusicNote />}
            onEdit={onEdit}
            isEmpty={!hasData}
        >
            <Stack spacing={3}>
                {/* Mi Himno */}
                <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        {t('profile.fields.anthem', 'Mi Himno')}
                    </Typography>

                    {featuredSong ? (
                        <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1, bgcolor: 'background.default' }}>
                            <Avatar
                                variant="rounded"
                                src={featuredSong.image}
                                sx={{ width: 48, height: 48, mr: 2 }}
                            >
                                <MusicNote />
                            </Avatar>
                            <Box sx={{ overflow: 'hidden' }}>
                                <Typography variant="subtitle2" noWrap>
                                    {featuredSong.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                    {featuredSong.artist}
                                </Typography>
                            </Box>
                        </Card>
                    ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            {t('profile.no_anthem', 'No has seleccionado un himno aún.')}
                        </Typography>
                    )}
                </Box>

                {/* Prompts */}
                {prompts.length > 0 && (
                    <Box>
                        <Stack spacing={2}>
                            {prompts.map((prompt: any, index: number) => (
                                <Box key={index}>
                                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                        <QuestionAnswer fontSize="small" color="primary" sx={{ opacity: 0.7 }} />
                                        <Typography variant="body2" fontWeight={600} color="primary.main">
                                            {prompt.question}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ pl: 3.5, borderLeft: '2px solid', borderColor: 'divider' }}>
                                        {prompt.answer}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                )}
            </Stack>
        </ProfileSectionBlock>
    );
}
