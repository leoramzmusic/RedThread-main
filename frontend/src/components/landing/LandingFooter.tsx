import { Box, Container, Typography, IconButton, Stack, useMediaQuery, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import {
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Email as EmailIcon,
  ExpandMore,
} from '@mui/icons-material';
import { type ReactNode } from 'react';
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

const FOOTER_LAYOUT_QUERY = '(min-width: 1025px)';

const linkSx = {
  color: 'rgba(255,255,255,0.72) !important',
  WebkitTextFillColor: 'currentColor',
  fontSize: 'clamp(0.875rem, 1.2vw, 1rem)',
  lineHeight: 1.5,
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
  fontSize: 'clamp(0.8rem, 1vw, 0.9rem)',
  letterSpacing: '0.12rem',
  textTransform: 'uppercase' as const,
  mb: 1.5,
} as const;

function FooterAccordion({ header, children }: { header: string; children: ReactNode }) {
  return (
    <Accordion
      disableGutters
      sx={{
        bgcolor: 'transparent',
        boxShadow: 'none',
        '&:before': { display: 'none' },
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px !important',
        '&:not(:last-child)': { mb: 1.5 },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore sx={{ color: 'rgba(255,255,255,0.7)' }} />}
        sx={{ px: 2, minHeight: 52, '& .MuiAccordionSummary-content': { my: 1.2 } }}
      >
        <Typography variant="subtitle2" sx={{ ...headerSx, mb: 0 }}>{header}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pt: 0, pb: 2.5 }}>{children}</AccordionDetails>
    </Accordion>
  );
}

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

  const isDesktop = useMediaQuery(FOOTER_LAYOUT_QUERY, { defaultMatches: true });

  const linkGroups = {
    legal: [
      { label: labels.privacy, href: '/legal/privacy' },
      { label: labels.terms, href: '/legal/terms' },
      { label: labels.security, href: '/legal/security' },
      { label: labels.community, href: '/legal/community-guidelines' },
    ],
    help: [
      { label: labels.faq, href: '/help' },
      { label: labels.contact, href: '/help/contact' },
      { label: labels.support, href: 'mailto:support@redthread.app' },
    ],
    company: [
      { label: labels.about, href: '#' },
      { label: labels.careers, href: '#' },
      { label: labels.press, href: '#' },
    ],
  };

  const renderLinks = (links: { label: string; href: string }[], gap: number) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap }}>
      {links.map((l) => (
        <Box key={`${l.href}-${l.label}`} component="a" href={l.href} sx={linkSx}>
          {l.label}
        </Box>
      ))}
    </Box>
  );

  const rethContent = (
    <>
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
    </>
  );

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
          </Box>
        </Container>
      </Box>

      {/* 2) Cuatro columnas (un solo contenedor) */}
      <Box sx={{ width: '100%', py: { xs: 4, md: 5 }, borderBottom: '1px solid rgba(255,255,255,0.08)', boxSizing: 'border-box' }}>
        <Container disableGutters maxWidth={false} sx={CONTAINER_SX}>
          <Box
            data-footer-layout={isDesktop ? 'grid' : 'accordion'}
            sx={
              isDesktop
                ? { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, alignItems: 'start' }
                : { display: 'flex', flexDirection: 'column', gap: 1.5 }
            }
          >
            {isDesktop ? (
              <>
                {/* RETH */}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={headerSx}>RETH</Typography>
                  <Box sx={RED_UNDERLINE} />
                  {rethContent}
                </Box>

                {/* LEGAL */}
                <Box sx={{ ...colDivider, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={headerSx}>{headers.legal}</Typography>
                  <Box sx={RED_UNDERLINE} />
                  {renderLinks(linkGroups.legal, 1.5)}
                </Box>

                {/* AYUDA */}
                <Box sx={{ ...colDivider, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={headerSx}>{headers.help}</Typography>
                  <Box sx={RED_UNDERLINE} />
                  {renderLinks(linkGroups.help, 1.5)}
                </Box>

                {/* EMPRESA */}
                <Box sx={{ ...colDivider, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={headerSx}>{headers.company}</Typography>
                  <Box sx={RED_UNDERLINE} />
                  {renderLinks(linkGroups.company, 1.5)}
                </Box>
              </>
            ) : (
              <>
                <FooterAccordion header="RETH">{rethContent}</FooterAccordion>
                <FooterAccordion header={headers.legal}>{renderLinks(linkGroups.legal, 2)}</FooterAccordion>
                <FooterAccordion header={headers.help}>{renderLinks(linkGroups.help, 2)}</FooterAccordion>
                <FooterAccordion header={headers.company}>{renderLinks(linkGroups.company, 2)}</FooterAccordion>
              </>
            )}
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
