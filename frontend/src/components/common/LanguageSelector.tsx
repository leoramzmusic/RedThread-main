import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, Typography, Box, Slide, keyframes } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { Public } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { GLASS_ICON_BTN_SX } from './glassIconStyles';
import { getEnabledLanguages } from '../../services/languageService';
import apiClient from '../../services/api';
import { useSnackbar } from 'notistack';

const LANGUAGES = [
    { code: 'en', label: 'English', flag: 'EN' },
    { code: 'es', label: 'Español', flag: 'ES' },
    { code: 'pt', label: 'Português', flag: 'PT' },
    { code: 'fr', label: 'Français', flag: 'FR' },
    { code: 'de', label: 'Deutsch', flag: 'DE' },
    { code: 'it', label: 'Italiano', flag: 'IT' },
    { code: 'ru', label: 'Русский', flag: 'RU' },
    { code: 'sv', label: 'Svenska', flag: 'SV' },
    { code: 'nl', label: 'Nederlands', flag: 'NL' },
    { code: 'zh', label: '中文 (Mandarin)', flag: 'ZH' },
    { code: 'hi', label: 'हिन्दी (Hindi)', flag: 'HI' },
    { code: 'bn', label: 'বাংলা (Bengali)', flag: 'BN' },
    { code: 'ja', label: '日本語 (Japanese)', flag: 'JA' },
    { code: 'ko', label: '한국어 (Korean)', flag: 'KO' },
    { code: 'ar', label: 'العربية (Arabic)', flag: 'AR' },
    { code: 'sw', label: 'Kiswahili (Swahili)', flag: 'SW' },
    { code: 'ha', label: 'Hausa', flag: 'HA' },
    { code: 'am', label: 'አማርኛ (Amharic)', flag: 'AM' },
    { code: 'tl', label: 'Filipino/Tagalog', flag: 'TL' },
    { code: 'ms', label: 'Bahasa Melayu (Malay)', flag: 'MS' },
    { code: 'mi', label: 'Māori', flag: 'MI' },
];

const globeSpin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

function setLocaleCookie(code: string) {
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Lax`;
}

function redirectToLocale(code: string, pathWithoutLocale: string) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload required so the NEXT_LOCALE cookie and i18n middleware re-resolve the locale
    window.location.href = `/${code}${pathWithoutLocale}`;
}

const MenuTransition = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>(
    function MenuTransition(props, ref) {
        return <Slide direction="down" ref={ref} {...(props as React.ComponentProps<typeof Slide>)} />;
    }
);

export default function LanguageSelector({ showContinuityHint, onLanguageChange }: { showContinuityHint?: boolean; onLanguageChange?: (code: string) => Promise<void> } = {}) {
    const router = useRouter();
    const { enqueueSnackbar } = useSnackbar();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLanguageChange = async (code: string) => {
        const enabled = await getEnabledLanguages();
        if (!enabled.includes(code)) return;
        localStorage.setItem('preferred_language', code);
        setLocaleCookie(code);
        try {
            if (onLanguageChange) {
                await onLanguageChange(code);
            } else {
                // default authenticated sync via apiClient with credentials
                await apiClient.patch('/auth/me', { preferred_language: code });
            }
        } catch (e: unknown) {
            const status = (e as { response?: { status?: number } })?.response?.status;
            if (status === 401) {
                // anonymous — ignore, proceed to redirect
            } else if (status === 400) {
                enqueueSnackbar('Idioma no disponible', { variant: 'error' });
                throw e;
            } else {
                throw e;
            }
        }
        const currentPath = router?.asPath || '/';
        const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
        redirectToLocale(code, pathWithoutLocale);
    };

    const currentLang = LANGUAGES.find(l => l.code === (router?.locale || 'es')) || LANGUAGES[1];

    return (
        <Box>
            <IconButton
                onClick={handleClick}
                className={open ? 'rt-open' : undefined}
                aria-label="Seleccionar idioma"
                aria-haspopup="menu"
                aria-expanded={open}
                sx={{
                    ...GLASS_ICON_BTN_SX,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    gap: 1,
                }}
            >
                <Public
                    sx={{
                        fontSize: 18,
                        color: 'rgba(255,255,255,0.9)',
                        ...(open
                            ? {
                                  '@media (prefers-reduced-motion: no-preference)': {
                                      animation: `${globeSpin} 0.9s ease-in-out`,
                                  },
                              }
                            : {}),
                    }}
                />
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
                    {currentLang.code}
                </Typography>
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                TransitionComponent={MenuTransition}
                transitionDuration={{ enter: 300, exit: 200 }}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        mt: 1,
                        minWidth: 180,
                        maxHeight: 360,
                        bgcolor: 'rgba(255,255,255,0.12)',
                        backdropFilter: 'blur(18px)',
                        WebkitBackdropFilter: 'blur(18px)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        boxShadow: '0 18px 50px rgba(20, 30, 90, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                    }
                }}
            >
                {LANGUAGES.map((lang) => (
                    <MenuItem
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        selected={router?.locale === lang.code}
                        sx={{
                            fontFamily: "'Inter', 'Poppins', sans-serif",
                            fontSize: '0.9rem',
                            color: 'rgba(255,255,255,0.85)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            px: 2,
                            py: 1,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                            '&.Mui-selected': {
                                color: '#FFFFFF',
                                fontWeight: 700,
                                boxShadow: 'inset 2px 0 0 #E63946',
                            },
                        }}
                    >
                        {lang.label}
                        <span>{lang.flag}</span>
                    </MenuItem>
                ))}
            </Menu>
            {showContinuityHint && <Typography variant="caption" sx={{display:'block', mt:1, color:'rgba(255,255,255,0.6)'}}>Este idioma se aplicará también dentro de la aplicación</Typography>}
        </Box>
    );
}