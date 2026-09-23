import { Box, Container, Typography, IconButton, Stack } from '@mui/material';
import {
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { landingTypography as lgTypography } from '../../theme/liquidGlass';
import { FooterCopyrightText } from './LoveTicker';

interface Props {
  currentLang: string;
  footerText: string;
  bodyFont?: string;
  /** Tagline editable desde el portal (apariencia › banners). Fallback a los defaults por idioma. */
  footerTagline?: string | null;
}

const getBodyFontFamily = (font?: string) => `${font || lgTypography.heroBody.family}, Inter, sans-serif`;

const pick = <T,>(m: Record<string, T>, lang: string): T => m[lang] ?? m.en;

const TAGLINES: Record<string, string> = {
  es: 'Conexiones significativas inspiradas en la leyenda del hilo rojo.',
  en: 'Meaningful connections inspired by the legend of the red thread.',
  pt: 'Conexões significativas inspiradas na lenda do fio vermelho.',
  fr: 'Des connexions significatives inspirées par la légende du fil rouge.',
};

const COL_HEADERS: Record<string, { legal: string; help: string; company: string }> = {
  es: { legal: 'LEGAL', help: 'AYUDA', company: 'EMPRESA' },
  en: { legal: 'LEGAL', help: 'HELP', company: 'COMPANY' },
  pt: { legal: 'LEGAL', help: 'AJUDA', company: 'EMPRESA' },
  fr: { legal: 'JURIDIQUE', help: 'AIDE', company: 'ENTREPRISE' },
};

const LINK_LABELS: Record<string, Record<string, string>> = {
  es: {
    privacy: 'Política de Privacidad', terms: 'Términos de Servicio', security: 'Seguridad',
    community: 'Normas de la Comunidad', faq: 'Preguntas Frecuentes', contact: 'Contacto',
    support: 'Soporte', about: 'Acerca de', careers: 'Carreras', press: 'Prensa',
  },
  en: {
    privacy: 'Privacy Policy', terms: 'Terms of Service', security: 'Security',
    community: 'Community Guidelines', faq: 'FAQ', contact: 'Contact',
    support: 'Support', about: 'About', careers: 'Careers', press: 'Press',
  },
  pt: {
    privacy: 'Política de Privacidade', terms: 'Termos de Serviço', security: 'Segurança',
    community: 'Diretrizes da Comunidade', faq: 'Perguntas Frequentes', contact: 'Contato',
    support: 'Suporte', about: 'Sobre', careers: 'Carreiras', press: 'Imprensa',
  },
  fr: {
    privacy: 'Politique de Confidentialité', terms: 'Conditions d\'Utilisation', security: 'Sécurité',
    community: 'Règles de la Communauté', faq: 'FAQ', contact: 'Contact',
    support: 'Assistance', about: 'À Propos', careers: 'Carrières', press: 'Presse',
  },
};

// Reutilizados por el mockup del portal (apariencia › banners)
export const FOOTER_TAGLINES = TAGLINES;
export const FOOTER_HEADERS = COL_HEADERS;
export const FOOTER_LINK_LABELS = LINK_LABELS;

const CONTAINER_SX = {
  maxWidth: { xs: '100%', xl: '1280px' },
  '@media (min-width:1920px)': { maxWidth: '1600px' },
  mx: 'auto',
  width: '100%',
  px: { xs: 2, sm: 3, md: 4 },
} as const;

const RED_UNDERLINE = {
  width: 28,
  height: 2,
  borderRadius: '999px',
  background: 'linear-gradient(90deg, #E63946, rgba(230,57,70,0.15))',
  boxShadow: '0 0 8px rgba(230,57,70,0.7)',
  mb: 2,
} as const;

export default function LandingFooter({ currentLang, footerText, bodyFont, footerTagline }: Props) {
  const headers = pick(COL_HEADERS, currentLang);
  const labels = { ...LINK_LABELS.en, ...(LINK_LABELS[currentLang] ?? {}) };
  const tagline = footerTagline?.trim() ? footerTagline : (TAGLINES[currentLang] ?? TAGLINES.en);

  const socials = [
    { icon: <TwitterIcon />, url: 'https://twitter.com/redthread', label: 'X / Twitter' },
    { icon: <InstagramIcon />, url: 'https://instagram.com/redthread_app', label: 'Instagram' },
    { icon: <FacebookIcon />, url: 'https://facebook.com/redthreadapp', label: 'Facebook' },
    { icon: <EmailIcon />, url: 'mailto:support@redthread.app', label: 'Email' },
  ];

  const linkSx = {
    color: 'rgba(255,255,255,0.72) !important',
    WebkitTextFillColor: 'currentColor',
    fontSize: '0.85rem',
    textDecoration: 'none',
    transition: 'color 0.2s ease, text-shadow 0.2s ease',
    '&:hover': {
      color: '#fff !important',
      WebkitTextFillColor: 'currentColor',
      textDecoration: 'underline',
      textShadow: '0 0 12px rgba(230,57,70,0.85)',
    },
  } as const;

  const headerSx = {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: 700,
    fontSize: '0.82rem',
    letterSpacing: '0.12rem',
    textTransform: 'uppercase' as const,
    mb: 1.5,
  } as const;

  const colDivider = {
    borderLeft: { xs: 'none', md: '1px solid' },
    borderColor: { md: 'rgba(255,255,255,0.12)' },
    pl: { xs: 0, md: 4 },
    pt: { xs: 3, md: 0 },
  } as const;

  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        position: 'relative',
        boxSizing: 'border-box',
        mt: 'auto',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        bgcolor: 'rgba(10,10,12,0.72)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        color: 'rgba(255,255,255,0.85)',
        overflow: 'hidden',
        zIndex: 1,
        // Hilo rojo sutil en el borde superior
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '38%',
          height: 2,
          background: 'linear-gradient(90deg, transparent, #E63946, transparent)',
          boxShadow: '0 0 12px rgba(230,57,70,0.8)',
        },
      }}
    >
      {/* 1) Barra minimalista */}
      <Box sx={{ width: '100%', py: { xs: 3, md: 4 }, borderBottom: '1px solid rgba(255,255,255,0.08)', boxSizing: 'border-box' }}>
        <Container disableGutters maxWidth={false} sx={CONTAINER_SX}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: 2, textAlign: { xs: 'center', md: 'left' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
              <Box
                component="img"
                src="/img/assets/isotipo.png"
                alt="RETH"
                sx={{ height: 20, width: 20, objectFit: 'contain', opacity: 0.9, flexShrink: 0, display: 'block' }}
              />
              <Typography variant="caption" sx={{ letterSpacing: '0.06em', fontWeight: 600, opacity: 0.9, whiteSpace: 'nowrap' }}>RETH © 2026</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { label: currentLang === 'es' ? 'Privacidad' : currentLang === 'pt' ? 'Privacidade' : currentLang === 'fr' ? 'Confidentialité' : 'Privacy', href: '/legal/privacy' },
                { label: currentLang === 'es' ? 'Términos' : currentLang === 'pt' ? 'Termos' : currentLang === 'fr' ? 'CGU' : 'Terms', href: '/legal/terms' },
                { label: 'Contacto', href: '/help/contact' },
              ].map((l) => (
                <Box key={l.label} component="a" href={l.href} sx={linkSx}>
                  {l.label}
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center' }}>
              {[
                { label: 'X', href: 'https://x.com' },
                { label: 'IG', href: 'https://instagram.com' },
                { label: 'TT', href: 'https://tiktok.com' },
              ].map((s) => (
                <Box
                  key={s.label}
                  component="a"
                  href={s.href}
                  target="_blank"
                  rel="noopener"
                  aria-label={s.label}
                  sx={{
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.18)',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em',
                    bgcolor: 'rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s ease',
                    '&:hover': { color: '#fff', bgcolor: 'rgba(230,57,70,0.22)', borderColor: 'rgba(230,57,70,0.55)', transform: 'translateY(-2px)', boxShadow: '0 0 14px rgba(230,57,70,0.45)' },
                  }}
                >
                  {s.label}
                </Box>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 2) Cuatro columnas (un solo contenedor) */}
      <Box sx={{ width: '100%', py: { xs: 4, md: 5 }, borderBottom: '1px solid rgba(255,255,255,0.08)', boxSizing: 'border-box' }}>
        <Container disableGutters maxWidth={false} sx={CONTAINER_SX}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: { xs: 0, sm: 3, md: 4 }, alignItems: 'start' }}>
            {/* RETH */}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={headerSx}>RETH</Typography>
              <Box sx={RED_UNDERLINE} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, mb: 2, fontStyle: 'italic' }}>
                {tagline}
              </Typography>
              <Stack direction="row" spacing={1}>
                {socials.map((s) => (
                  <IconButton
                    key={s.label}
                    size="small"
                    href={s.url}
                    target="_blank"
                    rel="noopener"
                    aria-label={s.label}
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.18)',
                      bgcolor: 'rgba(255,255,255,0.06)',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        color: '#fff',
                        bgcolor: 'rgba(230,57,70,0.18)',
                        borderColor: 'rgba(230,57,70,0.55)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 0 14px rgba(230,57,70,0.45)',
                      },
                    }}
                  >
                    {s.icon}
                  </IconButton>
                ))}
              </Stack>
            </Box>

            {/* LEGAL */}
            <Box sx={{ ...colDivider, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={headerSx}>{headers.legal}</Typography>
              <Box sx={RED_UNDERLINE} />
              <Stack spacing={1.5}>
                <Box component="a" href="/legal/privacy" sx={linkSx}>{labels.privacy}</Box>
                <Box component="a" href="/legal/terms" sx={linkSx}>{labels.terms}</Box>
                <Box component="a" href="/legal/security" sx={linkSx}>{labels.security}</Box>
                <Box component="a" href="/legal/community-guidelines" sx={linkSx}>{labels.community}</Box>
              </Stack>
            </Box>

            {/* AYUDA */}
            <Box sx={{ ...colDivider, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={headerSx}>{headers.help}</Typography>
              <Box sx={RED_UNDERLINE} />
              <Stack spacing={1.5}>
                <Box component="a" href="/help" sx={linkSx}>{labels.faq}</Box>
                <Box component="a" href="/help/contact" sx={linkSx}>{labels.contact}</Box>
                <Box component="a" href="mailto:support@redthread.app" sx={linkSx}>{labels.support}</Box>
              </Stack>
            </Box>

            {/* EMPRESA */}
            <Box sx={{ ...colDivider, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={headerSx}>{headers.company}</Typography>
              <Box sx={RED_UNDERLINE} />
              <Stack spacing={1.5}>
                <Box component="a" href="#" sx={linkSx}>{labels.about}</Box>
                <Box component="a" href="#" sx={linkSx}>{labels.careers}</Box>
                <Box component="a" href="#" sx={linkSx}>{labels.press}</Box>
              </Stack>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 3) Texto de cierre (footerText del CMS) */}
      <Box sx={{ width: '100%', py: 4, textAlign: 'center', boxSizing: 'border-box' }}>
        <Container disableGutters maxWidth={false} sx={CONTAINER_SX}>
          <Typography variant="body2" sx={{ fontFamily: getBodyFontFamily(bodyFont), letterSpacing: lgTypography.footer.tracking, lineHeight: lgTypography.footer.lineHeight, opacity: 0.85 }}>
            <FooterCopyrightText text={footerText} />
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
