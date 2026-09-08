import { Box, Typography, LinearProgress, Paper, useTheme, alpha, Fade, ButtonBase } from '@mui/material';
import { EmojiEvents, AutoFixHigh, ArrowForward } from '@mui/icons-material';

import { Control, useWatch } from 'react-hook-form';
import { calculateProfileScore, calculateCompletionPercentage, getProfileSuggestions } from '../../utils/profileScoring';

interface ProfileCompletionWidgetProps {
    control: Control<any>;
    onSuggestionClick?: (sectionId: string) => void;
}

export default function ProfileCompletionWidget({ control, onSuggestionClick }: ProfileCompletionWidgetProps) {
    const theme = useTheme();

    // Subscribe to form changes efficiently without re-rendering parent
    const formValues = useWatch({ control });

    // Calculate score and suggestions based on current values
    const score = calculateProfileScore(formValues);
    const percentage = calculateCompletionPercentage(score);
    const suggestions = getProfileSuggestions(formValues);

    // Color logic
    let color = theme.palette.error.main;
    let message = 'Completa tu información básica para empezar.';

    if (percentage >= 30) {
        color = theme.palette.warning.main;
        message = '¡Vas bien! Agrega más detalles para destacar.';
    }
    if (percentage >= 70) {
        color = theme.palette.success.main;
        message = '¡Casi listo! Tu perfil se ve genial.';
    }
    if (percentage === 100) {
        color = theme.palette.success.dark;
        message = '¡Excelente! Tu perfil está al máximo nivel 🌟';
    }

    return (
        <Paper
            sx={{
                p: 3,
                position: 'relative',
                border: (theme) => '1px solid ' + theme.palette.divider,
                boxShadow: 1,
                backgroundImage: 'none'
            }}
        >
            <Box display="flex" alignItems="center" mb={1} justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1}>
                    <EmojiEvents sx={{ color }} />
                    <Typography variant="subtitle2" fontWeight="700" color="text.primary">
                        Perfil completo
                    </Typography>
                </Box>
                <Typography variant="h6" fontWeight="800" color={color}>
                    {percentage}%
                </Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(color, 0.15),
                    '& .MuiLinearProgress-bar': {
                        bgcolor: color,
                        borderRadius: 4
                    }
                }}
            />
            <Typography variant="caption" sx={{ mt: 1, display: 'block', fontWeight: 500, color: 'text.secondary' }}>
                {message}
            </Typography>

            {/* Suggestions Checklist */}
            {suggestions.length > 0 && percentage < 100 && (
                <Box mt={2} pt={2} borderTop={`1px dashed ${alpha(theme.palette.text.secondary, 0.2)}`}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <AutoFixHigh fontSize="small" color="primary" />
                        <Typography variant="subtitle2" fontWeight={600} color="primary">
                            Sugerencias para mejorar:
                        </Typography>
                    </Box>
                    <Box component="ul" sx={{ m: 0, pl: 0, listStyle: 'none' }}>
                        {suggestions.map((s, idx) => (
                            <Fade in key={idx} timeout={500}>
                                <li style={{ marginBottom: 4 }}>
                                    <ButtonBase
                                        onClick={() => onSuggestionClick && onSuggestionClick(s.sectionId)}
                                        sx={{
                                            width: '100%',
                                            justifyContent: 'flex-start',
                                            textAlign: 'left',
                                            p: 0.5,
                                            borderRadius: 1,
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                '& .arrow-icon': { opacity: 1, transform: 'translateX(4px)' }
                                            }
                                        }}
                                    >
                                        <ArrowForward
                                            className="arrow-icon"
                                            sx={{
                                                fontSize: 14,
                                                mr: 1,
                                                color: 'primary.main',
                                                opacity: 0.5,
                                                transition: 'all 0.2s'
                                            }}
                                        />
                                        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'underline', textDecorationColor: alpha(theme.palette.text.secondary, 0.3) }}>
                                            {s.message}
                                        </Typography>
                                    </ButtonBase>
                                </li>
                            </Fade>
                        ))}
                    </Box>
                </Box>
            )}
        </Paper>
    );
}
