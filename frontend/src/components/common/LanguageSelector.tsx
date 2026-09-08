import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, Typography, Box } from '@mui/material';
import { Translate } from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

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

export default function LanguageSelector() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
                color="primary"
                sx={{
                    borderRadius: 2,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    gap: 1
                }}
            >
                <Translate sx={{ fontSize: 20 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    {currentLang.code}
                </Typography>
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                TransitionProps={{ timeout: 300 }}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        mt: 1,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        minWidth: 150
                    }
                }}
            >
                {LANGUAGES.map((lang) => (
                    <MenuItem
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        selected={router.locale === lang.code}
                        sx={{
                            fontSize: '0.9rem',
                            fontWeight: router.locale === lang.code ? 700 : 400,
                            display: 'flex',
                            justifyContent: 'space-between',
                            px: 2,
                            py: 1
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
