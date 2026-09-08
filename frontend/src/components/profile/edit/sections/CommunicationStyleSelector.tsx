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
    Chat,
    ExpandMore,
    InfoOutlined,
    CheckCircle
} from '@mui/icons-material';
import { Controller, Control, useWatch } from 'react-hook-form';
import { COMMUNICATION_STYLE_OPTIONS } from '../../../../constants/profileOptions';

interface CommunicationStyleSelectorProps {
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

export default function CommunicationStyleSelector({ control, defaultCollapsed = true }: CommunicationStyleSelectorProps) {
    const theme = useTheme();
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const communicationColor = "#00BCD4";

    // Watch current selection for dynamic info
    const currentStyle = useWatch({
        control,
        name: 'communication_style',
        defaultValue: null
    });

    // Get selected option details
    const selectedOption = COMMUNICATION_STYLE_OPTIONS.find(opt => opt.value === currentStyle);

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
                    <Chat sx={{ mr: 1.5, color: communicationColor }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                        Estilo de comunicación
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
                        ¿Cómo prefieres comunicarte con tus conexiones?
                    </Typography>

                    {/* Why it matters box */}
                    <Box
                        sx={{
                            p: 2,
                            mb: 3,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: alpha(theme.palette.info.main, 0.05),
                        }}
                    >
                        <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
                            <InfoOutlined sx={{ fontSize: 20, color: 'info.main', mt: 0.2 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'info.main' }}>
                                ¿Por qué es necesario definir el estilo de comunicación?
                            </Typography>
                        </Box>
                        <List dense sx={{ pl: 1 }}>
                            <ListItem sx={{ py: 0.5, px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Evita frustraciones tempranas"
                                    primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                />
                            </ListItem>
                            <ListItem sx={{ py: 0.5, px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Alinea expectativas de contacto"
                                    primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                />
                            </ListItem>
                            <ListItem sx={{ py: 0.5, px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Refleja compatibilidad energética"
                                    primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                />
                            </ListItem>
                            <ListItem sx={{ py: 0.5, px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Modula el tono del vínculo"
                                    primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                />
                            </ListItem>
                        </List>
                    </Box>

                    {/* Communication Style Options */}
                    <Box sx={{ mb: 3 }}>
                        <Controller
                            name="communication_style"
                            control={control}
                            render={({ field }) => (
                                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ gap: 1.5 }}>
                                    {COMMUNICATION_STYLE_OPTIONS.map((option) => {
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
                                                    color={isSelected ? 'primary' : 'default'}
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
                                                            bgcolor: isSelected ? 'primary.dark' : alpha(theme.palette.primary.main, 0.1),
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
                                bgcolor: alpha(communicationColor, 0.08),
                                borderLeft: '4px solid',
                                borderColor: communicationColor,
                                animation: `${fadeInUp} 0.5s ease-out`
                            }}
                        >
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: communicationColor, mb: 0.5 }}>
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
                                color: 'primary.main',
                                fontWeight: 500,
                                fontSize: '0.9rem',
                            }}
                        >
                            "Tu estilo de comunicación define cómo fluye tu conexión. CARE lo usa para encontrar matches que se comuniquen como tú."
                        </Typography>
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
}
