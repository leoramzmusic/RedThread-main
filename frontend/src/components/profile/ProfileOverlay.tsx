import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedIcon from '@mui/icons-material/Verified';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import LanguageIcon from '@mui/icons-material/Language';
import PsychologyIcon from '@mui/icons-material/Psychology';
import BoltIcon from '@mui/icons-material/Bolt';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import ExploreIcon from '@mui/icons-material/Explore';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HeightIcon from '@mui/icons-material/Height';
import { Profile } from './ProfileCard';

interface ProfileOverlayProps {
    profile: Profile;
    activePhotoIndex: number;
    isBlind?: boolean;
    matchReason?: string;
    matchHighlights?: string[];
    isDiscovery?: boolean;
    isCurious?: boolean;
}

export default function ProfileOverlay({
    profile,
    activePhotoIndex,
    isBlind = false,
    matchReason,
    matchHighlights,
    isDiscovery,
    isCurious = false
}: ProfileOverlayProps) {

    // BLIND MODE OVERLAY - Multi-slide Experience
    if (isBlind) {
        // Slide 0: Identity & Core Check (Privacy First)
        if (activePhotoIndex === 0) {
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', pb: 8 }}>
                    <Box sx={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(255,255,255,0.2)',
                        mb: 3,
                        position: 'relative'
                    }}>
                        <Typography variant="h3" fontWeight={800} color="primary">
                            {Math.round(profile.affinity_score || 0)}%
                        </Typography>
                        {/* Lock Icon Badge */}
                        <Box sx={{
                            position: 'absolute', bottom: 0, right: 0,
                            bgcolor: '#424242', borderRadius: '50%', p: 0.5,
                            border: '2px solid black'
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>🔒</span>
                        </Box>
                    </Box>

                    <Typography variant="h5" fontWeight={700} gutterBottom>
                        {profile.display_name}, {profile.age}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                        Conexión Potencial • Fotos Ocultas
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', maxWidth: '90%' }}>
                        {profile.interests?.slice(0, 3).map(tag => (
                            <Chip key={tag} label={tag} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
                        ))}
                    </Box>

                    {profile.highlighted_fragments && profile.highlighted_fragments.length > 0 && (
                        <Box sx={{ mt: 3, px: 4, textAlign: 'center' }}>
                            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1 }}>
                                Primer destello narrativo
                            </Typography>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1, opacity: 0.9, lineHeight: 1.4 }}>
                                "{profile.highlighted_fragments[0]}"
                            </Typography>
                        </Box>
                    )}

                    <Typography variant="caption" sx={{ mt: 4, opacity: 0.6 }}>
                        Desliza para ver compatibilidad &gt;
                    </Typography>
                </Box>
            );
        }

        // Slide 1: Compatibility Breakdown (The "why" behind the score)
        if (activePhotoIndex === 1) {
            const breakdown = profile.affinity_breakdown || { music: 85, lifestyle: 70, personality: 90 }; // Fallback mock
            return (
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', px: 2, pb: 6 }}>
                    <Typography variant="overline" color="primary" fontWeight={700} align="center" gutterBottom>
                        ANÁLISIS DE COMPATIBILIDAD
                    </Typography>

                    <Stack spacing={3} sx={{ mt: 2 }}>
                        {[
                            { label: 'Sintonía de Objetivos', val: breakdown.intent, icon: <FavoriteIcon sx={{ color: '#F06292' }} /> },
                            { label: 'Gustos Musicales', val: breakdown.interests, icon: <MusicNoteIcon color="secondary" /> },
                            { label: 'Valores & Visión', val: breakdown.values, icon: <PsychologyIcon sx={{ color: '#FFD700' }} /> },
                            { label: 'Estilo de Vida', val: breakdown.lifestyle, icon: <ExploreIcon sx={{ color: '#4CAF50' }} /> },
                            { label: 'Escenario', val: profile.scenario_label || 'Global', icon: <LocationOnIcon sx={{ color: '#64B5F6' }} /> },
                        ].map((item, i) => (
                            <Box key={i}>
                                <Box display="flex" justifyContent="space-between" mb={0.5}>
                                    <Box display="flex" gap={1}>
                                        {item.icon}
                                        <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
                                    </Box>
                                    <Typography variant="body2" fontWeight={700}>
                                        {typeof item.val === 'number' ? `${Math.round(item.val)}%` : item.val || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box sx={{ width: '100%', height: 6, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                                    <Box sx={{
                                        width: typeof item.val === 'number' ? `${Math.round(item.val)}%` : (item.val ? '100%' : '0%'),
                                        height: '100%',
                                        bgcolor: typeof item.val === 'number' ? 'primary.main' : (item.val ? 'primary.dark' : 'rgba(255,255,255,0.2)'),
                                        borderRadius: 1,
                                        transition: 'width 1s ease-out'
                                    }} />
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            );
        }

        // Slide 2: Personality / Questionnaire (Deep Dive)
        if (activePhotoIndex === 2) {
            const prompt = profile.prompts && profile.prompts[0];
            return (
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', px: 2, pb: 6 }}>
                    <Typography variant="overline" color="secondary" fontWeight={700} align="center" gutterBottom>
                        PERSONALIDAD
                    </Typography>

                    {prompt ? (
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 3, borderRadius: 4, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#E1BEE7', mb: 2 }}>
                                {prompt.question}
                            </Typography>
                            <Typography variant="h5" fontStyle="italic">
                                "{prompt.answer}"
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ textAlign: 'center', opacity: 0.7 }}>
                            <Typography fontStyle="italic">"Prefiero las charlas profundas a las triviales..."</Typography>
                        </Box>
                    )}

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>
                            Toca el candado si el match ocurre.
                        </Typography>
                    </Box>
                </Box>
            );
        }
    }

    // 0: Identity (Main)
    if (activePhotoIndex === 0) {
        return (
            <Box sx={{ pointerEvents: 'none' }}>
                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '30px',
                        fontWeight: 900,
                        color: 'white',
                        lineHeight: 1,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        display: 'inline-block'
                    }}>
                        {profile.display_name}
                    </h1>
                    <h2 style={{
                        margin: 0,
                        fontSize: '24px',
                        fontWeight: 500,
                        color: 'white',
                        opacity: 0.95,
                        lineHeight: 1,
                        display: 'inline-block',
                        paddingTop: '6px'
                    }}>
                        {profile.show_age !== false ? profile.age : ''}
                    </h2>
                    {profile.verified && (
                        <VerifiedIcon sx={{ color: '#2196F3', fontSize: '2.0rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))', ml: 0.5 }} />
                    )}
                </div>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, opacity: 1 }}>
                    <LocationOnIcon sx={{ fontSize: '1.2rem', color: 'white' }} />
                    <Typography
                        variant="body1"
                        sx={{
                            fontWeight: 500,
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    >
                        {profile.distance_km !== undefined
                            ? `A ${Math.round(profile.distance_km)} km de distancia`
                            : 'Cerca de ti'
                        }
                    </Typography>
                </Box>

                {/* CARE Match Reason & Advice */}
                {(matchReason || profile.context_advice) && (
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {matchReason && (
                            <Chip
                                label={matchReason}
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(255,215,0,0.15)',
                                    color: '#FFD700',
                                    border: '1px solid rgba(255,215,0,0.3)',
                                    backdropFilter: 'blur(4px)',
                                    fontSize: '0.75rem',
                                    maxWidth: '100%',
                                    height: 'auto',
                                    '& .MuiChip-label': {
                                        whiteSpace: 'normal',
                                        padding: '8px 12px'
                                    }
                                }}
                            />
                        )}
                        {profile.context_advice && (
                            <Typography variant="caption" sx={{ color: '#64B5F6', fontWeight: 600, pl: 1, borderLeft: '2px solid #64B5F6' }}>
                                ✨ {profile.context_advice}
                            </Typography>
                        )}
                    </Box>
                )}

                {/* CARE Action/Highlight Badges */}
                <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                    {(isDiscovery || profile.is_discovery) && (
                        <Chip
                            icon={<ExploreIcon sx={{ fontSize: '1rem', color: '#E1BEE7' }} />}
                            label="Descubrimiento"
                            size="small"
                            sx={{
                                background: 'linear-gradient(45deg, #4A148C 30%, #9C27B0 90%)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.4)',
                                backdropFilter: 'blur(8px)',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                boxShadow: '0 2px 8px rgba(156, 39, 176, 0.4)',
                                '& .MuiChip-label': {
                                    padding: '4px 8px'
                                }
                            }}
                        />
                    )}
                    {(isCurious || profile.is_curious) && (
                        <Chip
                            icon={<ExploreIcon sx={{ fontSize: '1rem', color: '#B39DDB' }} />}
                            label="Sugerencia por curiosidad"
                            size="small"
                            sx={{
                                background: 'linear-gradient(45deg, #7B1FA2 30%, #4527A0 90%)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.4)',
                                backdropFilter: 'blur(8px)',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                boxShadow: '0 2px 8px rgba(103, 58, 183, 0.4)',
                                '& .MuiChip-label': {
                                    padding: '4px 8px'
                                }
                            }}
                        />
                    )}
                    {(matchHighlights || profile.match_highlights || []).map((highlight, idx) => (
                        <Chip
                            key={idx}
                            icon={<EmojiObjectsIcon sx={{ fontSize: '1rem', color: '#FFD700' }} />}
                            label={highlight}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(255, 215, 0, 0.1)',
                                color: '#FFD700',
                                border: '1px solid rgba(255, 215, 0, 0.2)',
                                backdropFilter: 'blur(4px)',
                                fontSize: '0.7rem',
                                fontWeight: 700
                            }}
                        />
                    ))}
                    {profile.activity_score && profile.activity_score > 0.8 && (
                        <Chip
                            icon={<BoltIcon sx={{ fontSize: '1rem', color: '#4CAF50' }} />}
                            label="Muy activo"
                            size="small"
                            sx={{
                                bgcolor: 'rgba(76, 175, 80, 0.15)',
                                color: '#4CAF50',
                                border: '1px solid rgba(76, 175, 80, 0.3)',
                                backdropFilter: 'blur(4px)',
                                fontSize: '0.7rem',
                                fontWeight: 600
                            }}
                        />
                    )}
                </Box>
            </Box>
        );
    }

    // 1: Casual (Interests)
    if (activePhotoIndex === 1) {
        return (
            <Box>
                <Typography variant="overline" fontWeight={800} sx={{ color: '#FFD700', letterSpacing: 1.5, mb: 1, display: 'block' }}>
                    MIS VIBRAS &amp; INTERESES
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {profile.interests.slice(0, 6).map(tag => (
                        <Chip
                            key={tag}
                            label={tag}
                            sx={{
                                bgcolor: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}
                        />
                    ))}
                    {profile.lifestyle_interests?.slice(0, 3).map(tag => (
                        <Chip
                            key={tag}
                            label={tag}
                            variant="outlined"
                            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
                        />
                    ))}
                </Box>
            </Box>
        );
    }

    // 2: Professional
    if (activePhotoIndex === 2) {
        return (
            <Box>
                <Typography variant="overline" fontWeight={800} sx={{ color: '#64B5F6', letterSpacing: 1.5, mb: 1, display: 'block' }}>
                    PROFESIONAL &amp; ACADÉMICO
                </Typography>
                <Stack spacing={1.5}>
                    {(profile.occupation || profile.work_company) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WorkIcon sx={{ color: '#64B5F6' }} />
                            <Typography variant="body1" fontWeight={500}>
                                {profile.occupation} {profile.work_company ? `en ${profile.work_company}` : ''}
                            </Typography>
                        </Box>
                    )}
                    {(profile.school || profile.education_level) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SchoolIcon sx={{ color: '#64B5F6' }} />
                            <Typography variant="body1">
                                {profile.education_level} {profile.school ? `- ${profile.school}` : ''}
                            </Typography>
                        </Box>
                    )}
                    {profile.languages && profile.languages.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LanguageIcon sx={{ color: '#64B5F6' }} />
                            <Typography variant="body1">
                                {profile.languages.join(', ')}
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </Box>
        );
    }

    // 3: Emotional (Music/Goals)
    if (activePhotoIndex === 3) {
        return (
            <Box>
                <Typography variant="overline" fontWeight={800} sx={{ color: '#F06292', letterSpacing: 1.5, mb: 1, display: 'block' }}>
                    MI LADO EMOCIONAL
                </Typography>

                {profile.mi_himno && profile.mi_himno.featured_songs?.[0] && (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        p: 1.5,
                        borderRadius: 2,
                        backdropFilter: 'blur(5px)',
                        mb: 2
                    }}>
                        <MusicNoteIcon sx={{ color: '#F06292', fontSize: 32 }} />
                        <Box>
                            <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>Mi Himno</Typography>
                            <Typography variant="body1" fontWeight={700}>
                                {profile.mi_himno.featured_songs[0].title}
                            </Typography>
                            <Typography variant="caption">
                                {profile.mi_himno.featured_songs[0].artist}
                            </Typography>
                        </Box>
                    </Box>
                )}

                {profile.relationship_goals && Array.isArray(profile.relationship_goals) && profile.relationship_goals.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FavoriteIcon sx={{ color: '#F06292' }} />
                        <Typography>
                            Busco: <strong>{
                                profile.relationship_goals.map(val => {
                                    const { INTENTION_OPTIONS } = require('../../constants/profileOptions');
                                    return INTENTION_OPTIONS.find((o: any) => o.value === val)?.label || val;
                                }).join(', ')
                            }</strong>
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    }

    // 4: Creative / Neurodiversity
    if (activePhotoIndex === 4) {
        return (
            <Box>
                <Typography variant="overline" fontWeight={800} sx={{ color: '#BA68C8', letterSpacing: 1.5, mb: 1, display: 'block' }}>
                    MI MENTE ÚNICA
                </Typography>

                {profile.neurodiversity && (
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <PsychologyIcon sx={{ color: '#BA68C8' }} />
                            <Typography fontWeight={600}>Neurodiversidad</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            {profile.neurodiversity.join(', ')}
                        </Typography>
                    </Box>
                )}

                {/* Fallback to prompts if no specific superpower field exists used */}
                {profile.prompts && profile.prompts.length > 0 && (
                    <Box sx={{ bgcolor: 'rgba(186, 104, 200, 0.15)', p: 2, borderRadius: 2, borderLeft: '4px solid #BA68C8' }}>
                        <Typography variant="caption" sx={{ color: '#E1BEE7', textTransform: 'uppercase', fontWeight: 700 }}>
                            {profile.prompts[0].question}
                        </Typography>
                        <Typography variant="body1" fontStyle="italic" sx={{ mt: 0.5 }}>
                            "{profile.prompts[0].answer}"
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    }

    // 5+: Spontaneous / More Prompts
    const promptIndex = activePhotoIndex - 4; // Map remaining photos to prompts
    const prompt = profile.prompts && profile.prompts[promptIndex];
    if (prompt) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <Box sx={{ bgcolor: 'rgba(0,0,0,0.5)', p: 3, borderRadius: 4, backdropFilter: 'blur(4px)' }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#FFAB91', mb: 2 }}>
                        {prompt.question}
                    </Typography>
                    <Typography variant="h4" fontWeight={300} fontStyle="italic">
                        "{prompt.answer}"
                    </Typography>
                </Box>
            </Box>
        );
    }

    // Fallback if index > defined sections
    return (
        <Box>
            <Typography variant="h5" fontWeight={700}>{profile.display_name}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>Ver más detalles...</Typography>
        </Box>
    );
}
