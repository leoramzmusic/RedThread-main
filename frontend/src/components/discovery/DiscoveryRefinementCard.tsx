import React, { useState } from 'react';
import {
    Card,
    Box,
    Typography,
    LinearProgress,
    Button,
    TextField,
    IconButton,
    Chip,
    Fade,
    useTheme
} from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    Close as CloseIcon,
    Check as CheckIcon,
    AutoAwesome as MagicIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { useForm, Controller } from 'react-hook-form';
import ZodiacSelector from '../profile/edit/sections/ZodiacSelector';
import RelationshipGoalsSection from '../profile/edit/sections/RelationshipGoalsSection';
import CivilStatusSection from '../profile/edit/sections/CivilStatusSection';
import IdentitySection from '../profile/edit/sections/IdentitySection';
import InterestsSection from '../profile/edit/sections/InterestsSection';
import MusicGenreSelector from '../profile/MusicGenreSelector';
import ProfessionalAcademicSection from '../profile/edit/sections/ProfessionalAcademicSection';
import LocationSection from '../profile/edit/sections/LocationSection';
import RelationshipTypeSelector from '../profile/edit/sections/RelationshipTypeSelector';
import HeightSelector from '../profile/edit/sections/HeightSelector';
import { Suggestion, calculateProfileScore, calculateCompletionPercentage } from '../../utils/profileScoring';

interface DiscoveryRefinementCardProps {
    currentCompletion: number;
    suggestion: Suggestion;
    profile?: any;
    options?: any;
    onSave: (field: string, value: any) => Promise<void>;
    onSkip: () => void;
}

export default function DiscoveryRefinementCard({
    currentCompletion,
    suggestion,
    profile = {},
    options = {},
    onSave,
    onSkip
}: DiscoveryRefinementCardProps) {
    const { t } = useTranslation('discover');
    const theme = useTheme();
    const [loading, setLoading] = useState(false);

    const { control, handleSubmit, watch, setValue } = useForm({
        defaultValues: profile
    });

    const fieldMap: Record<string, string | string[]> = {
        'section-aboutme': 'bio',
        'section-goals': 'relationship_goals',
        'section-interests': 'lifestyle_interests',
        'section-identity': 'sexual_orientation',
        'section-zodiac': 'zodiac',
        'section-relationship-type': 'relationship_type',
        'section-height': 'height_cm',
        'section-education': ['education_center', 'education_level'],
        'section-professional': ['occupation', 'work_company', 'show_professional_only_matches'],
        'section-location': 'city',
        'section-status': 'relationship_status',
        'section-music-genres': 'music_genres',
    };

    const fieldMapping = fieldMap[suggestion.sectionId] || suggestion.sectionId.replace('section-', '');
    const fieldName = (Array.isArray(fieldMapping) ? fieldMapping[0] : fieldMapping) as string;

    const handleSave = async (data: any) => {
        setLoading(true);
        try {
            // Get the value for the specific field being refined
            const fields = fieldMap[suggestion.sectionId] || [suggestion.sectionId.replace('section-', '')];
            const fieldsArray = Array.isArray(fields) ? fields : [fields];

            const payload: Record<string, any> = {};
            fieldsArray.forEach(field => {
                payload[field] = data[field];
            });

            if (Object.keys(payload).length > 0) {
                // If it's a single field, pass it as (field, value)
                // If it's multiple fields, pass the whole object (this will be handled by the update in index.tsx)
                if (fieldsArray.length === 1) {
                    await onSave(fieldsArray[0], payload[fieldsArray[0]]);
                } else {
                    await onSave('MULTIPLE', payload);
                }
            }
        } catch (err) {
            console.error('Failed to save refinement:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            sx={{
                maxWidth: 600,
                width: '100%',
                height: { xs: 'auto', sm: '600px' },
                minHeight: { xs: '650px', sm: '600px' },
                borderRadius: 5,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 100%)', // Premium Deep Blue
                color: 'white',
                boxShadow: '0 10px 40px -10px rgba(13, 71, 161, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
        >
            {/* Header with Progress */}
            <Box sx={{ p: 4, pt: 5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="overline" sx={{ letterSpacing: 2, opacity: 0.8, fontWeight: 700 }}>
                        {t('refinement.profileProgress', 'PROGRESO DEL PERFIL')}
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="gold">
                        {calculateCompletionPercentage(calculateProfileScore(profile))}%
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={calculateCompletionPercentage(calculateProfileScore(profile))}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(90deg, #FFD700 0%, #FFA000 100%)', // Golden energy
                        }
                    }}
                />
            </Box>

            {/* Main Content - Improved Scrollable Area */}
            <Box sx={{
                flex: 1,
                px: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,215,0,0.2)', borderRadius: 2 }
            }}>

                <Typography variant="body2" sx={{ opacity: 0.8, mb: 3, fontStyle: 'italic', maxWidth: '400px', textAlign: 'center' }}>
                    {t('refinement.carePhrase', '"Lo que eliges suma, lo que no eliges nunca resta. Define tus gustos para vibrar mejor."')}
                </Typography>

                <Box sx={{ width: '100%', maxWidth: 500, mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={600} sx={{ mb: 1, textAlign: 'center' }}>
                        {suggestion.message}
                    </Typography>

                    <Box sx={{
                        width: '100%',
                        bgcolor: 'rgba(255,255,255,0.04)',
                        borderRadius: 4,
                        p: 1.5,
                        border: '1px solid rgba(255,255,255,0.08)',
                        '& .MuiAccordion-root': {
                            bgcolor: 'transparent',
                            boxShadow: 'none',
                            border: 'none',
                            '&:before': { display: 'none' }
                        },
                        '& .MuiTypography-root': { color: 'white' },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                        '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                        },
                        '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.7)' },
                        '& .MuiPaper-root': { bgcolor: 'rgba(255,255,255,0.05)', color: 'white' },
                        '& .MuiChip-root': { color: 'white' }
                    }}>
                        {suggestion.sectionId === 'section-zodiac' && (
                            <ZodiacSelector control={control} defaultCollapsed={false} isDiscovery={true} />
                        )}

                        {suggestion.sectionId === 'section-relationship-type' && (
                            <RelationshipTypeSelector control={control} isDiscovery={true} />
                        )}

                        {suggestion.sectionId === 'section-height' && (
                            <HeightSelector control={control} isDiscovery={true} />
                        )}

                        {suggestion.sectionId === 'section-goals' && (
                            <RelationshipGoalsSection
                                control={control}
                                watch={watch}
                                setValue={setValue}
                                setGoalsInfoOpen={() => { }}
                                isDiscovery={true}
                            />
                        )}

                        {suggestion.sectionId === 'section-status' && (
                            <CivilStatusSection
                                control={control}
                                options={options}
                                relationshipStatus={watch('relationship_status')}
                                profile={profile}
                                watch={watch}
                                setValue={setValue}
                                onSave={handleSave}
                                isDiscovery={true}
                            />
                        )}

                        {suggestion.sectionId === 'section-identity' && (
                            <IdentitySection
                                control={control}
                                options={options}
                                setValue={setValue}
                                watch={watch}
                                isDiscovery={true}
                            />
                        )}

                        {suggestion.sectionId === 'section-interests' && (
                            <InterestsSection
                                lifestyleInterests={watch('lifestyle_interests') || []}
                                setLifestyleInterests={(val: string[] | ((prev: string[]) => string[])) => {
                                    if (typeof val === 'function') {
                                        const current = watch('lifestyle_interests') || [];
                                        setValue('lifestyle_interests', val(current));
                                    } else {
                                        setValue('lifestyle_interests', val);
                                    }
                                }}
                                isDiscovery={true}
                            />
                        )}

                        {suggestion.sectionId === 'section-education' && (
                            <ProfessionalAcademicSection
                                control={control}
                                options={options}
                                setValue={setValue}
                                watch={watch}
                                isDiscovery={true}
                                showEducation={true}
                                showProfessional={false}
                            />
                        )}

                        {suggestion.sectionId === 'section-professional' && (
                            <ProfessionalAcademicSection
                                control={control}
                                options={options}
                                setValue={setValue}
                                watch={watch}
                                isDiscovery={true}
                                showEducation={false}
                                showProfessional={true}
                            />
                        )}

                        {suggestion.sectionId === 'section-location' && (
                            <LocationSection
                                control={control}
                                setValue={setValue}
                                watch={watch}
                                citySearch={watch('location')?.city || ''}
                                setCitySearch={(val: string) => setValue('location.city', val)}
                                userPlan={profile?.subscription_tier || 'free'}
                                isDiscovery={true}
                            />
                        )}

                        {suggestion.sectionId === 'section-music-genres' && (
                            <MusicGenreSelector
                                selectedGenres={watch('music_genres') || []}
                                onGenresChange={(genres) => setValue('music_genres', genres)}
                                editable={true}
                            />
                        )}

                        {!['section-zodiac', 'section-relationship-type', 'section-height', 'section-goals', 'section-status', 'section-identity', 'section-interests', 'section-professional', 'section-education', 'section-location'].includes(suggestion.sectionId) && (
                            <Controller
                                name={fieldName}
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        variant="outlined"
                                        placeholder={t('refinement.placeholder', 'Escribe aquí...')}
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.05)',
                                            borderRadius: 2,
                                            '& .MuiOutlinedInput-root': {
                                                color: 'white',
                                                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                                                '&.Mui-focused fieldset': { borderColor: 'gold' },
                                            }
                                        }}
                                    />
                                )}
                            />
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Actions - Pinned at bottom */}
            <Box sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(0,0,0,0.1)', flexShrink: 0 }}>
                <Button
                    onClick={onSkip}
                    sx={{ color: 'white', opacity: 0.6, '&:hover': { opacity: 1 } }}
                >
                    {t('common.skip', 'Saltar')}
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit(handleSave)}
                    disabled={loading}
                    sx={{
                        bgcolor: 'gold',
                        color: 'black',
                        fontWeight: 800,
                        px: 4,
                        py: 1.5,
                        borderRadius: 3,
                        '&:hover': { bgcolor: '#FFC107' },
                        '&.Mui-disabled': { bgcolor: 'rgba(255,215,0,0.3)', color: 'rgba(0,0,0,0.3)' }
                    }}
                    startIcon={loading ? null : <CheckIcon />}
                >
                    {loading ? t('common.saving', 'Guardando...') : t('common.save', 'Guardar')}
                </Button>
            </Box>

            {/* Small Decorative Elements */}
            <Box sx={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,215,0,0.05)', zIndex: 0 }} />
            <Box sx={{ position: 'absolute', top: -30, left: -30, width: 150, height: 150, borderRadius: '50%', bgcolor: 'rgba(13, 71, 161, 0.2)', zIndex: 0 }} />
        </Card>
    );
}
