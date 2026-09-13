import { ReactNode, useState, useRef, useCallback, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, keyframes } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useAppTheme } from '../../context/ThemeContext';
import LanguageSelector from '../common/LanguageSelector';
import RedThreadLogo from '../landing/RedThreadLogo';
import { GLASS_ICON_BTN_SX } from '../common/glassIconStyles';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    authSuccess?: boolean;
}

const heartbeat = keyframes`
  0%, 100% { transform: scale(1); }
  12% { transform: scale(1.12); }
  24% { transform: scale(0.98); }
  36% { transform: scale(1.06); }
  50% { transform: scale(1); }
`;

const successGlow = keyframes`
  0% { filter: drop-shadow(0 6px 18px rgba(136, 19, 55, 0.28)); transform: scale(1); }
  25% { transform: scale(1.1); }
  60% { filter: drop-shadow(0 0 30px rgba(255, 45, 85, 0.95)); }
  100% { filter: drop-shadow(0 6px 22px rgba(255, 193, 7, 0.8)); transform: scale(1); }
`;

const threadFlow = keyframes`
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -100; }
`;

const blobDriftA = keyframes`
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(28px, -18px) scale(1.1); }
`;

const blobDriftB = keyframes`
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(-24px, 14px) scale(1.06); }
`;

export default function AuthLayout(props: AuthLayoutProps) {
    const { children, title, subtitle, authSuccess = false } = props || {};
    const { mode, toggleMode } = useAppTheme();

    const handleToggle = () => {
        toggleMode();
        const newMode = mode === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme_mode', newMode);
    };

    const paperRef = useRef<HTMLDivElement | null>(null);
    const activeInputRef = useRef<HTMLElement | null>(null);
    const [fieldRange, setFieldRange] = useState<{ top: number; bottom: number } | null>(null);

    const updateFieldRange = useCallback(() => {
        const paper = paperRef.current;
        const el = activeInputRef.current;
        if (!paper || !el) {
            setFieldRange(null);
            return;
        }
        const pRect = paper.getBoundingClientRect();
        const eRect = el.getBoundingClientRect();
        setFieldRange({ top: eRect.top - pRect.top, bottom: eRect.bottom - pRect.top });
    }, []);

    useEffect(() => {
        if (!fieldRange) return;
        const onResize = () => updateFieldRange();
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('orientationchange', onResize);
        };
    }, [fieldRange, updateFieldRange]);

    const handleFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const field = target.closest('input, textarea, select');
        if (field && paperRef.current?.contains(field)) {
            activeInputRef.current = field as HTMLElement;
            updateFieldRange();
        }
    };

    const handleBlurCapture = (e: React.FocusEvent<HTMLDivElement>) => {
        if (!paperRef.current?.contains(e.relatedTarget as Node)) {
            activeInputRef.current = null;
            setFieldRange(null);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                transition: 'background-color 0.3s ease',
                backgroundImage: mode === 'light'
                    ? 'linear-gradient(135deg, #5B6FE8 0%, #9A5FE0 100%)'
                    : 'linear-gradient(135deg, #101B3A 0%, #2C1350 100%)',
            }}
        >
            {/* Decorative glow blobs */}
            <Box
                aria-hidden="true"
                sx={{
                    position: 'absolute',
                    top: -180,
                    right: -140,
                    width: { xs: 340, md: 560 },
                    height: { xs: 340, md: 560 },
                    borderRadius: '50%',
                    background: mode === 'light'
                        ? 'radial-gradient(circle, rgba(255,182,193,0.45) 0%, rgba(255,182,193,0) 70%)'
                        : 'radial-gradient(circle, rgba(211,47,47,0.35) 0%, rgba(211,47,47,0) 70%)',
                    filter: 'blur(80px)',
                    pointerEvents: 'none',
                    zIndex: 0,
                    willChange: 'transform',
                    '@media (prefers-reduced-motion: no-preference)': {
                        animation: `${blobDriftA} 13s ease-in-out infinite alternate`,
                    },
                }}
            />
            <Box
                aria-hidden="true"
                sx={{
                    position: 'absolute',
                    bottom: -160,
                    left: -140,
                    width: { xs: 320, md: 520 },
                    height: { xs: 320, md: 520 },
                    borderRadius: '50%',
                    background: mode === 'light'
                        ? 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 70%)'
                        : 'radial-gradient(circle, rgba(251,113,133,0.22) 0%, rgba(251,113,133,0) 70%)',
                    filter: 'blur(80px)',
                    pointerEvents: 'none',
                    zIndex: 0,
                    willChange: 'transform',
                    '@media (prefers-reduced-motion: no-preference)': {
                        animation: `${blobDriftB} 17s ease-in-out infinite alternate`,
                    },
                }}
            />

            {/* Ephemeral Actions (Theme & Language) */}
            <Box sx={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 1, alignItems: 'center', zIndex: 10 }}>
                <LanguageSelector />
                <IconButton
                    onClick={handleToggle}
                    aria-label={mode === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
                    sx={GLASS_ICON_BTN_SX}
                >
                    {mode === 'dark' ? <LightMode /> : <DarkMode />}
                </IconButton>
            </Box>

            {/* Main Glass Card */}
            <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, px: 2 }}>
                <Paper
                    ref={paperRef}
                    elevation={0}
                    onFocusCapture={handleFocusCapture}
                    onBlurCapture={handleBlurCapture}
                    sx={{
                        p: { xs: 4, sm: 5 },
                        borderRadius: 4,
                        bgcolor: mode === 'light' ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(18px)',
                        WebkitBackdropFilter: 'blur(18px)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        boxShadow: mode === 'light'
                            ? '0 24px 60px rgba(20, 30, 90, 0.28), inset 0 1px 0 rgba(255,255,255,0.4)'
                            : '0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover .rt-thread-frame-base': {
                            opacity: 0.9,
                            stroke: '#E53935',
                        },
                        '&:hover .rt-thread-frame-flow': {
                            filter: 'drop-shadow(0 0 6px rgba(251, 113, 133, 0.85))',
                            stroke: '#FB7185',
                            '@media (prefers-reduced-motion: no-preference)': {
                                animationDuration: '3.5s',
                            },
                        },
                    }}
                >
                    {/* Red thread frame */}
                    <Box
                        component="svg"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                        focusable="false"
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: 0,
                        }}
                    >
                        <Box
                            component="rect"
                            className="rt-thread-frame-base"
                            x="2"
                            y="2"
                            width="96"
                            height="96"
                            rx="4"
                            pathLength={100}
                            fill="none"
                            sx={{
                                stroke: 'rgba(211,47,47,0.45)',
                                strokeWidth: 1.5,
                                vectorEffect: 'non-scaling-stroke',
                                transition: 'opacity 0.3s ease',
                            }}
                        />
                        <Box
                            component="rect"
                            className="rt-thread-frame-flow"
                            x="2"
                            y="2"
                            width="96"
                            height="96"
                            rx="4"
                            pathLength={100}
                            fill="none"
                            sx={{
                                stroke: '#FB7185',
                                strokeWidth: 2.4,
                                vectorEffect: 'non-scaling-stroke',
                                strokeDasharray: '4 21 3 72',
                                '@media (prefers-reduced-motion: no-preference)': {
                                    animation: `${threadFlow} 6s linear infinite`,
                                },
                            }}
                        />
                    </Box>

                    {/* Thread segment anchored to the focused field */}
                    {fieldRange && (
                        <Box
                            aria-hidden="true"
                            sx={{
                                position: 'absolute',
                                left: 8,
                                width: 3,
                                borderRadius: 2,
                                top: fieldRange.top,
                                height: Math.max(fieldRange.bottom - fieldRange.top, 24),
                                background: 'linear-gradient(180deg, #D32F2F, #FB7185)',
                                boxShadow: '0 0 10px rgba(251, 113, 133, 0.9), 0 0 4px rgba(211, 47, 47, 0.8)',
                                zIndex: 0,
                                pointerEvents: 'none',
                                transition: 'top 0.25s ease, height 0.25s ease',
                            }}
                        />
                    )}

                    {/* Content */}
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        {/* Logo / Header */}
                        <Box mb={4}>
                            <RedThreadLogo
                                variant="mark"
                                height={88}
                                aria-label="Red Thread (RETH)"
                                sx={{
                                    mx: 'auto',
                                    '@media (prefers-reduced-motion: no-preference)': authSuccess
                                        ? { animation: `${successGlow} 0.8s ease-out forwards` }
                                        : { animation: `${heartbeat} 3s ease-in-out infinite` },
                                }}
                            />
                            <Typography
                                variant="h4"
                                fontWeight={800}
                                color="white"
                                sx={{
                                    letterSpacing: '-1px',
                                    mt: 2,
                                    mb: 1,
                                    textShadow: '0 2px 8px rgba(0,0,0,0.25)',
                                }}
                            >
                                {title}
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                                {subtitle}
                            </Typography>
                        </Box>

                        {children}
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}