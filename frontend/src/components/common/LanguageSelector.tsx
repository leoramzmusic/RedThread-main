import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, Typography, Box, Slide, keyframes } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { Public } from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { GLASS_ICON_BTN_SX } from './glassIconStyles';

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

function MenuTransition(props: TransitionProps) {
    return <Slide direction="down" {...(props as React.ComponentProps<typeof Slide>)} />;
}

export default function LanguageSelector() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLanguageChange = (code: string) => {
        // Save to localStorage for persistence
        localStorage.setItem('preferred_language', code);

        // Reload the page with the new locale
        const currentPath = router.asPath;
        window.location.href = `/${code}${currentPath}`;
    };

    const currentLang = LANGUAGES.find(l => l.code === (router.locale || 'es')) || LANGUAGES[1];

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
                        selected={router.locale === lang.code}
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
                                boxShadow: 'inset 2px 0 0 #FB7185',
                            },
                        }}
                    >
                        {lang.label}
                        <span>{lang.flag}</span>
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
}