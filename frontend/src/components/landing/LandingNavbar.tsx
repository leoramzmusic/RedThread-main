import { useState, useEffect } from 'react';
import { Box, Container, IconButton, Tooltip } from '@mui/material';
import RedThreadLogo from './RedThreadLogo';

const languages = ['es', 'en', 'pt', 'fr'] as const;
type Language = typeof languages[number];

interface LandingNavbarProps {
  currentLang: Language;
  onLangChange: (lang: Language) => void;
}

export default function LandingNavbar({ currentLang, onLangChange }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Box
      component="nav"
      aria-label="Main navigation"
      sx={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1100,
        width: { xs: 'calc(100% - 32px)', md: 'auto' },
        maxWidth: 600,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: 2,
          py: 1,
          borderRadius: 999,
          bgcolor: scrolled ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(24px) saturate(1.7)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.7)',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: scrolled
            ? '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'
            : '0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
          transition: 'all 0.3s ease',
        }}
      >
        <RedThreadLogo
          variant="mark"
          aria-label="Red Thread (RETH)"
          style={{ height: 32, width: 'auto' }}
        />

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {languages.map((lang) => (
            <Tooltip key={lang} title={lang.toUpperCase()} placement="bottom">
              <IconButton
                size="small"
                disableRipple
                aria-pressed={currentLang === lang}
                aria-label={`Switch to ${lang.toUpperCase()}`}
                onClick={() => onLangChange(lang)}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: currentLang === lang ? '#E63946' : 'rgba(255,255,255,0.7)',
                  bgcolor: currentLang === lang ? 'rgba(230,57,70,0.15)' : 'transparent',
                  border: currentLang === lang ? '1.5px solid rgba(230,57,70,0.4)' : '1.5px solid transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(230,57,70,0.2)',
                    color: '#E63946',
                    border: '1.5px solid rgba(230,57,70,0.3)',
                  },
                  '&:focus-visible': {
                    outline: '2px solid #E63946',
                    outlineOffset: 2,
                  },
                }}
              >
                {lang}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      </Box>
    </Box>
  );
}