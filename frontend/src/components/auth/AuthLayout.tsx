import { ReactNode } from 'react';
import { Box, Paper, Typography, IconButton, useTheme, Zoom } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useAppTheme } from '../../context/ThemeContext';
import LanguageSelector from '../common/LanguageSelector';
import { useTranslation } from 'next-i18next';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

export default function AuthLayout(props: AuthLayoutProps) {
    const { children, title, subtitle } = props || {};
    const { mode, toggleMode, theme } = useAppTheme();
    const muiTheme = useTheme();
    const { t } = useTranslation('common');

    const handleToggle = () => {
        toggleMode();
        // Save to localStorage for immediate persistence across reloads
        const newMode = mode === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme_mode', newMode);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                position: 'relative',
                transition: 'background-color 0.3s ease',
                backgroundImage: mode === 'light'
                    ? 'linear-gradient(135deg, #FFF0F0 0%, #FFFFFF 100%)'
                    : 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)',
            }}
        >
            {/* Ephemeral Actions (Theme & Language) */}
            <Box sx={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 1, alignItems: 'center', zIndex: 10 }}>
                <LanguageSelector />
                <IconButton onClick={handleToggle} color="primary" sx={{ bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 2 }}>
                    {mode === 'dark' ? <LightMode /> : <DarkMode />}
                </IconButton>
            </Box>

            {/* Main Card */}
            <Zoom in timeout={500}>
                <Paper
                    elevation={mode === 'dark' ? 4 : 1}
                    sx={{
                        p: { xs: 3, sm: 5 },
                        width: '100%',
                        maxWidth: 480,
                        borderRadius: 3,
                        bgcolor: 'background.paper',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Logo / Header */}
                    <Box mb={4}>
                        <Typography
                            variant="h4"
                            fontWeight={800}
                            color="primary"
                            sx={{
                                letterSpacing: '-1px',
                                mb: 1
                            }}
                        >
                            RED THREAD
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {subtitle}
                        </Typography>
                    </Box>

                    {children}

                </Paper>
            </Zoom>
        </Box>
    );
}
