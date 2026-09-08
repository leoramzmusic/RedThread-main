import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Typography, Link as MuiLink, IconButton, Stack, Collapse, Tooltip } from '@mui/material';
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
  const currentYear = new Date().getFullYear();
  const [expanded, setExpanded] = useState(true);

  // Load persistence from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('footer_expanded');
    if (savedState !== null) {
      setExpanded(savedState === 'true');
    }
  }, []);

  const handleToggle = () => {
    const newState = !expanded;
    setExpanded(newState);
    localStorage.setItem('footer_expanded', String(newState));
  };

  const linkStyles = {
    color: 'text.secondary',
    textDecoration: 'none',
    fontSize: '0.85rem',
    transition: 'color 0.2s ease',
    '&:hover': {
      color: 'primary.main',
    },
  };

  const headerStyles = {
    color: 'text.primary',
    fontWeight: 700,
    fontSize: '0.9rem',
    letterSpacing: '0.05rem',
    mb: 2,
  };

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        color: 'text.secondary',
        pt: expanded ? 6 : 2,
        pb: 3,
        px: 4,
        borderTop: '1px solid',
        borderColor: 'divider',
        mt: 'auto',
        transition: 'all 0.3s ease-in-out',
        position: 'relative'
      }}
    >
      <Container maxWidth="xl">
        {/* Collapse Toggle Button */}
        <Box sx={{ position: 'absolute', top: 12, right: 32, zIndex: 10 }}>
          <Tooltip title={expanded ? t('footer.collapse', 'Colapsar') : t('footer.expand', 'Expandir')}>
            <IconButton
              onClick={handleToggle}
              size="small"
              sx={{
                color: 'text.disabled',
                bgcolor: 'action.hover',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: 'action.selected',
                }
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
              <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.7, lineHeight: 1.6, mb: 2 }}>
                {t('footer.tagline', 'Conexiones significativas inspiradas en la leyenda del hilo rojo.')}
              </Typography>
              <Stack direction="row" spacing={1}>
                {[
                  { icon: <TwitterIcon />, url: 'https://twitter.com/redthread' },
                  { icon: <InstagramIcon />, url: 'https://instagram.com/redthread_app' },
                  { icon: <FacebookIcon />, url: 'https://facebook.com/redthreadapp' },
                  { icon: <EmailIcon />, url: 'mailto:support@redthread.app' },
                ].map((social, idx) => (
                  <IconButton
                    key={idx}
                    size="small"
                    href={social.url}
                    target="_blank"
                    sx={{
                      color: 'text.secondary',
                      transition: 'all 0.2s ease',
                      '&:hover': { color: 'primary.main', bgcolor: 'action.hover' }
                    }}
                  >
                    {React.cloneElement(social.icon as React.ReactElement<any>, { fontSize: 'small' })}
                  </IconButton>
                ))}
              </Stack>
            </Grid>

            {/* Legal Links */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1" sx={headerStyles}>
                {t('footer.legal', 'LEGAL')}
              </Typography>
              <Stack spacing={1}>
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
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1" sx={headerStyles}>
                {t('footer.help', 'AYUDA')}
              </Typography>
              <Stack spacing={1}>
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
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1" sx={headerStyles}>
                {t('footer.company', 'EMPRESA')}
              </Typography>
              <Stack spacing={1}>
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
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            © {currentYear} RETH. {t('footer.rights', 'Todos los derechos reservados.')}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.disabled',
              opacity: 0.5,
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
