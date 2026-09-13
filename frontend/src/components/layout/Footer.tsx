import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Grid, Typography, Link as MuiLink, IconButton, Stack, Collapse, Tooltip } from '@mui/material';
import { useTheme, alpha, darken } from '@mui/material/styles';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import {
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Email as EmailIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
} from '@mui/icons-material';
import { APP_VERSION } from '../../config/version';

export default function Footer() {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primary = theme.palette.primary.main;
  const dividerColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const textInactive = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(33,33,33,0.6)';
  const textMuted = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(33,33,33,0.5)';
  const glassBg = isDark ? 'rgba(16,18,32,0.55)' : 'rgba(255,255,255,0.72)';

  const currentYear = new Date().getFullYear();
  const [expanded, setExpanded] = useState(true);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);

  // Contrast-safe accent: on light mode, darken the theme accent when it's too
  // bright (white-ish pinks/yellows) so hover text always contrasts with the glass.
  const relativeLuminance = (hex: string): number => {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return 0;
    const full = hex.length === 4 ? hex.slice(1).split('').map((x) => x + x).join('') : hex.slice(1);
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
    const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const hoverAccent = isDark
    ? primary
    : relativeLuminance(primary) > 0.5
      ? darken(primary, 0.35)
      : primary;

  // Load persistence from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('footer_expanded');
    if (savedState !== null) {
      setExpanded(savedState === 'true');
    }
  }, []);

  // Entrance: slide up + fade when scrolled into view
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setInView(true);
        });
      },
      { threshold: 0.06 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleToggle = () => {
    const newState = !expanded;
    setExpanded(newState);
    localStorage.setItem('footer_expanded', String(newState));
  };

  const linkBaseColor = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(33,33,33,0.78)';
  const linkSolidColor = isDark ? '#FFFFFF' : '#111111';
  const linkStyles = {
    position: 'relative' as const,
    // !important so the global `a { color: inherit }` / `a:hover { color:
    // var(--primary-color) }` rules in globals.css can never paint the glyphs
    // with an unreadable color.
    color: `${linkBaseColor} !important`,
    WebkitTextFillColor: 'currentColor',
    textDecoration: 'none',
    fontSize: '0.85rem',
    // No color transition: animating `color` over a backdrop-filtered layer
    // can leave glyphs illegible mid-fade in some Chromium/WebKit builds.
    '&::after': {
      content: '""',
      position: 'absolute' as const,
      left: 0,
      bottom: -3,
      height: 1,
      width: 0,
      borderRadius: '999px',
      background: `linear-gradient(90deg, ${hoverAccent}, ${alpha(hoverAccent, 0.2)})`,
      transition: 'width 0.3s ease',
    },
    '&:hover': {
      // Text stays a solid, guaranteed-contrast neutral — the accent never
      // becomes the glyph color, so the label can't vanish regardless of theme.
      color: `${linkSolidColor} !important`,
      WebkitTextFillColor: 'currentColor',
      '&::after': { width: '100%' },
    },
  };

  const headerStyles = {
    color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(33,33,33,0.87)',
    fontWeight: 700,
    fontSize: '0.9rem',
    letterSpacing: '0.12rem',
    mb: 2,
    textTransform: 'uppercase' as const,
  };

  const socials = [
    { icon: <TwitterIcon />, url: 'https://twitter.com/redthread' },
    { icon: <InstagramIcon />, url: 'https://instagram.com/redthread_app' },
    { icon: <FacebookIcon />, url: 'https://facebook.com/redthreadapp' },
    { icon: <EmailIcon />, url: 'mailto:support@redthread.app' },
  ];

  return (
    <Box
      component="footer"
      ref={rootRef}
      sx={{
        bgcolor: glassBg,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        color: textInactive,
        pt: expanded ? 6 : 2,
        pb: 3,
        px: 4,
        borderTop: '1px solid',
        borderColor: dividerColor,
        boxShadow: `0 -1px 24px ${alpha(primary, 0.06)}`,
        mt: 'auto',
        transition: 'background-color 0.3s ease, color 0.3s ease, transform 0.6s ease, opacity 0.6s ease',
        position: 'relative',
        overflow: 'hidden',
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        opacity: inView ? 1 : 0,
        '@media (prefers-reduced-motion: no-preference)': {
          '@keyframes rtThreadTravel': {
            from: { transform: 'translateX(-40%)' },
            to: { transform: 'translateX(340%)' },
          },
          '@keyframes rtBreath': {
            '0%, 100%': { opacity: 0.78 },
            '50%': { opacity: 1 },
          },
        },
      }}
    >
      {/* Dynamic red thread traveling across the footer */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '38%',
          height: 2,
          borderRadius: '999px',
          background: `linear-gradient(90deg, transparent, ${primary}, transparent)`,
          boxShadow: `0 0 12px ${alpha(primary, 0.8)}`,
          '@media (prefers-reduced-motion: no-preference)': {
            animation: 'rtThreadTravel 9s linear infinite',
          },
          '@media (prefers-reduced-motion: reduce)': {
            display: 'none',
          },
        }}
      />

      <Container maxWidth="xl">
        {/* Collapse Toggle Button */}
        <Box sx={{ position: 'absolute', top: 12, right: 32, zIndex: 10 }}>
          <Tooltip title={expanded ? t('footer.collapse', 'Colapsar') : t('footer.expand', 'Expandir')}>
            <IconButton
              onClick={handleToggle}
              size="small"
              sx={{
                color: textMuted,
                bgcolor: alpha(primary, 0.08),
                border: `1px solid ${dividerColor}`,
                '&:hover': {
                  color: hoverAccent,
                  bgcolor: alpha(hoverAccent, 0.16),
                  boxShadow: `0 0 10px ${alpha(hoverAccent, 0.4)}`,
                },
              }}
            >
              {expanded ? <ExpandIcon fontSize="small" /> : <CollapseIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        <Collapse in={expanded} timeout="auto">
          <Grid container spacing={4} sx={{ mb: 6 }}>
            {/* About Section */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1" sx={headerStyles}>
                RETH
              </Typography>
              {/* Accent thread under section header */}
              <Box sx={{ width: 28, height: 2, borderRadius: '999px', background: `linear-gradient(90deg, ${primary}, ${alpha(primary, 0.15)})`, boxShadow: `0 0 8px ${alpha(primary, 0.7)}`, mb: 2 }} />
              <Typography
                variant="body2"
                className="rt-tagline"
                sx={{
                  color: textInactive,
                  opacity: 0.7,
                  lineHeight: 1.6,
                  mb: 2,
                  fontStyle: 'italic',
                  '@media (prefers-reduced-motion: no-preference)': {
                    animation: 'rtBreath 5s ease-in-out infinite',
                  },
                }}
              >
                {t('footer.tagline', 'Conexiones significativas inspiradas en la leyenda del hilo rojo.')}
              </Typography>
              <Stack direction="row" spacing={1}>
                {socials.map((social, idx) => (
                  <IconButton
                    key={idx}
                    size="small"
                    href={social.url}
                    target="_blank"
                    title={social.url}
                    sx={{
                      color: textInactive,
                      border: `1px solid ${dividerColor}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        color: hoverAccent,
                        bgcolor: alpha(hoverAccent, 0.1),
                        transform: 'rotate(6deg) scale(1.12)',
                        boxShadow: `0 0 12px ${alpha(hoverAccent, 0.5)}`,
                        filter: isDark
                          ? `drop-shadow(0 0 6px ${alpha(hoverAccent, 0.8)})`
                          : `drop-shadow(0 0 4px ${alpha(hoverAccent, 0.5)})`,
                      },
                    }}
                  >
                    {React.cloneElement(social.icon as React.ReactElement<any>, { fontSize: 'small' })}
                  </IconButton>
                ))}
              </Stack>
            </Grid>

            {/* Legal Links */}
            <Grid
              item
              xs={12}
              sm={6}
              md={3}
              sx={{
                borderLeft: { sm: '1px solid', md: '1px solid' },
                borderColor: dividerColor,
                pl: { sm: 4 },
              }}
            >
              <Typography variant="subtitle1" sx={headerStyles}>
                {t('footer.legal', 'LEGAL')}
              </Typography>
              <Box sx={{ width: 28, height: 2, borderRadius: '999px', background: `linear-gradient(90deg, ${primary}, ${alpha(primary, 0.15)})`, boxShadow: `0 0 8px ${alpha(primary, 0.7)}`, mb: 2 }} />
              <Stack spacing={1.5}>
                <MuiLink component={Link} href="/legal/privacy" sx={linkStyles}>
                  {t('footer.privacy', 'Política de Privacidad')}
                </MuiLink>
                <MuiLink component={Link} href="/legal/terms" sx={linkStyles}>
                  {t('footer.terms', 'Términos de Servicio')}
                </MuiLink>
                <MuiLink component={Link} href="/legal/security" sx={linkStyles}>
                  {t('footer.security', 'Seguridad')}
                </MuiLink>
                <MuiLink component={Link} href="/legal/community-guidelines" sx={linkStyles}>
                  {t('footer.community', 'Normas de la Comunidad')}
                </MuiLink>
              </Stack>
            </Grid>

            {/* Help Links */}
            <Grid
              item
              xs={12}
              sm={6}
              md={3}
              sx={{
                borderLeft: { sm: '1px solid', md: '1px solid' },
                borderColor: dividerColor,
                pl: { sm: 4 },
              }}
            >
              <Typography variant="subtitle1" sx={headerStyles}>
                {t('footer.help', 'AYUDA')}
              </Typography>
              <Box sx={{ width: 28, height: 2, borderRadius: '999px', background: `linear-gradient(90deg, ${primary}, ${alpha(primary, 0.15)})`, boxShadow: `0 0 8px ${alpha(primary, 0.7)}`, mb: 2 }} />
              <Stack spacing={1.5}>
                <MuiLink component={Link} href="/help" sx={linkStyles}>
                  {t('footer.faq', 'Preguntas Frecuentes')}
                </MuiLink>
                <MuiLink component={Link} href="/help/contact" sx={linkStyles}>
                  {t('footer.contact', 'Contacto')}
                </MuiLink>
                <MuiLink href="mailto:support@redthread.app" sx={linkStyles}>
                  {t('footer.support', 'Soporte')}
                </MuiLink>
              </Stack>
            </Grid>

            {/* Company Links */}
            <Grid
              item
              xs={12}
              sm={6}
              md={3}
              sx={{
                borderLeft: { sm: '1px solid', md: '1px solid' },
                borderColor: dividerColor,
                pl: { sm: 4 },
              }}
            >
              <Typography variant="subtitle1" sx={headerStyles}>
                {t('footer.company', 'EMPRESA')}
              </Typography>
              <Box sx={{ width: 28, height: 2, borderRadius: '999px', background: `linear-gradient(90deg, ${primary}, ${alpha(primary, 0.15)})`, boxShadow: `0 0 8px ${alpha(primary, 0.7)}`, mb: 2 }} />
              <Stack spacing={1.5}>
                <MuiLink href="#" sx={linkStyles}>
                  {t('footer.about', 'Acerca de')}
                </MuiLink>
                <MuiLink href="#" sx={linkStyles}>
                  {t('footer.careers', 'Carreras')}
                </MuiLink>
                <MuiLink href="#" sx={linkStyles}>
                  {t('footer.press', 'Prensa')}
                </MuiLink>
              </Stack>
            </Grid>
          </Grid>
        </Collapse>

        {/* Footer Meta */}
        <Box
          sx={{
            pt: expanded ? 3 : 0,
            borderTop: expanded ? '1px solid' : 'none',
            borderColor: dividerColor,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <Typography variant="caption" sx={{ color: textMuted }}>
            © {currentYear} RETH. {t('footer.rights', 'Todos los derechos reservados.')}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: textMuted,
              opacity: 0.7,
              fontWeight: 600,
              fontSize: '0.65rem',
              letterSpacing: '0.1rem'
            }}
          >
            v{APP_VERSION.user}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}