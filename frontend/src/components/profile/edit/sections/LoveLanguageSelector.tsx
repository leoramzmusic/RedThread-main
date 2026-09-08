import { useState } from 'react';
import {
    Box,
    Typography,
    Tooltip,
    alpha,
    useTheme,
    ButtonBase,
    Collapse,
    Chip,
    Stack,
    keyframes,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    Favorite,
    ExpandMore,
    InfoOutlined,
    CheckCircle
} from '@mui/icons-material';
import { Controller, Control, useWatch } from 'react-hook-form';
import { LOVE_LANGUAGE_OPTIONS } from '../../../../constants/profileOptions';

interface LoveLanguageSelectorProps {
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

export default function LoveLanguageSelector({ control, defaultCollapsed = true }: LoveLanguageSelectorProps) {
    const theme = useTheme();
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const loveColor = "#F44336";

    // Watch current selection for dynamic info
    const currentLanguage = useWatch({
        control,
        name: 'love_language',
        defaultValue: null
    });

    // Get selected option details
    const selectedOption = LOVE_LANGUAGE_OPTIONS.find(opt => opt.value === currentLanguage);

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
                    <Favorite sx={{ mr: 1.5, color: loveColor }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                        Lenguaje del amor
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
                        ¿Cómo das y recibes afecto?
                    </Typography>

                    {/* Why it matters box */}
                    <Box
                        sx={{
                            p: 2,
                            mb: 3,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: alpha(theme.palette.error.main, 0.05),
                        }}
                    >
                        <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
                            <InfoOutlined sx={{ fontSize: 20, color: 'error.main', mt: 0.2 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main' }}>
                                ¿Por qué es importante definir el lenguaje del amor?
                            </Typography>
                        </Box>
                        <List dense sx={{ pl: 1 }}>
                            <ListItem sx={{ py: 0.5, px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Evita malentendidos afectivos"
                                    primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                />
                            </ListItem>
                            <ListItem sx={{ py: 0.5, px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Alinea formas de expresión emocional"
                                    primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                />
                            </ListItem>
                            <ListItem sx={{ py: 0.5, px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Refleja compatibilidad energética y emocional"
                                    primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                />
                            </ListItem>
                            <ListItem sx={{ py: 0.5, px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary="CARE puede adaptar el tono del vínculo"
                                    primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                />
                            </ListItem>
                        </List>
                    </Box>

                    {/* Love Language Options */}
                    <Box sx={{ mb: 3 }}>
                        <Controller
                            name="love_language"
                            control={control}
                            render={({ field }) => (
                                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ gap: 1.5 }}>
                                    {LOVE_LANGUAGE_OPTIONS.map((option) => {
                                        const isSelected = field.value === option.value;
                                        return (
                                            <Tooltip
                                                key={option.value}
                                                title={option.description}
                                                arrow
                                                placement="top"
                                            >
                                                <Chip
                                                    label={`${option.emoji} ${option.label}`}
                                                    onClick={() => field.onChange(option.value)}
                                                    variant={isSelected ? 'filled' : 'outlined'}
                                                    color={isSelected ? 'error' : 'default'}
                                                    sx={{
                                                        height: 40,
                                                        borderRadius: 2,
                                                        px: 1,
                                                        fontSize: '0.9rem',
                                                        fontWeight: isSelected ? 700 : 500,
                                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        animation: isSelected
                                                            ? `${pulse} 1.5s infinite ease-in-out`
                                                            : 'none',
                                                        '&:hover': {
                                                            bgcolor: isSelected ? 'error.dark' : alpha(theme.palette.error.main, 0.1),
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
                    </Box>

                    {/* Dynamic CARE Impact Info */}
                    <Collapse in={!!selectedOption}>
                        <Box
                            sx={{
                                mt: 2,
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha(loveColor, 0.08),
                                borderLeft: '4px solid',
                                borderColor: loveColor,
                                animation: `${fadeInUp} 0.5s ease-out`
                            }}
                        >
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: loveColor, mb: 0.5 }}>
                                🔄 Cómo afecta al algoritmo CARE:
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 500 }}>
                                {selectedOption?.careImpact}
                            </Typography>
                        </Box>
                    </Collapse>

                    {/* Bottom tooltip */}
                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
                        <Typography
                            variant="body2"
                            sx={{
                                fontStyle: 'italic',
                                color: 'error.main',
                                fontWeight: 500,
                                fontSize: '0.9rem',
                            }}
                        >
                            "Tu lenguaje del amor define cómo das y recibes afecto. CARE lo usa para crear vínculos que te hagan sentir visto."
                        </Typography>
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
}
