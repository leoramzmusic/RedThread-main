import { Box, Container, Typography } from '@mui/material';
import RedThreadLogo from './RedThreadLogo';
import { landingTypography as lgTypography } from '../../theme/liquidGlass';

interface Props {
  currentLang: string;
  footerText: string;
  bodyFont?: string;
}

const getBodyFontFamily = (font?: string) => `${font || lgTypography.heroBody.family}, Inter, sans-serif`;

export default function LandingFooter({ currentLang, footerText, bodyFont }: Props) {
  return (
    <>
      {/* Footer minimalista */}
      <Box
        component="footer"
        sx={{
          borderTop: '1px solid rgba(255,255,255,0.12)',
          mt: { xs: 4, md: 6 },
          py: { xs: 4, md: 5 },
          px: { xs: 2, sm: 3 },
          color: 'rgba(255,255,255,0.85)',
          position: 'relative',
          zIndex: 1,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: { xs: '100%', xl: '1280px' }, '@media (min-width:1920px)': { maxWidth: '1600px' }, mx: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'center' }, justifyContent: 'space-between', gap: 2, textAlign: { xs: 'center', md: 'left' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <RedThreadLogo variant="mark" style={{ height: 22, width: 'auto', opacity: 0.9 }} />
              <Typography variant="caption" sx={{ letterSpacing: '0.06em', fontWeight: 600, opacity: 0.9 }}>RETH © 2026</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { label: currentLang === 'es' ? 'Privacidad' : currentLang === 'pt' ? 'Privacidade' : currentLang === 'fr' ? 'Confidentialité' : 'Privacy', href: '/legal/privacy' },
                { label: currentLang === 'es' ? 'Términos' : currentLang === 'pt' ? 'Termos' : currentLang === 'fr' ? 'CGU' : 'Terms', href: '/legal/terms' },
                { label: 'Contacto', href: '/help/contact' },
              ].map((l) => (
                <Box key={l.label} component="a" href={l.href} sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: 'white', textDecoration: 'underline' }, transition: 'color 0.2s ease' }}>
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
                <Box key={s.label} component="a" href={s.href} target="_blank" rel="noopener" aria-label={s.label} sx={{ width: 32, height: 32, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', bgcolor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', transition: 'all 0.2s ease', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.14)', transform: 'translateY(-2px)' } }}>
                  {s.label}
                </Box>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>
      {/* Footer legacy centrado */}
      <Box sx={{ py: 5, textAlign: 'center', color: 'white', opacity: 0.85, position: 'relative', zIndex: 1 }}>
        <Typography variant="body2" sx={{ fontFamily: getBodyFontFamily(bodyFont), letterSpacing: lgTypography.footer.tracking, lineHeight: lgTypography.footer.lineHeight }}>
          {footerText.split(/([❤♥])/).map((chunk: string, idx: number) =>
            /[❤♥]/.test(chunk) ? (
              <Box key={idx} component="span" aria-hidden="true" sx={{ display: 'inline-block', color: '#E63946', fontSize: '1.15em', lineHeight: 1, verticalAlign: '-0.08em', mx: 0.15, filter: 'drop-shadow(0 1px 2px rgba(230, 57, 70, 0.4))' }}>
                ♥
              </Box>
            ) : (
              chunk
            )
          )}
        </Typography>
      </Box>
    </>
  );
}
