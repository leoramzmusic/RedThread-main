import { useState, useEffect } from 'react';
import { Box, Button, IconButton, Drawer, List, ListItemButton, ListItemText, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LanguageIcon from '@mui/icons-material/Language';
import { useRouter } from 'next/router';
import RedThreadLogo from './RedThreadLogo';
import { landingShadows, shapeTokens } from '../../theme/liquidGlass';
import { supportedLanguages } from '../../config/languages';
import LanguageSelectorModal from './LanguageSelectorModal';
import appearanceService from '../../services/appearanceService';
import { AppearanceType } from '../../types/appearance';
import { getMediaUrl } from '../../utils/media';

const languages = supportedLanguages.map((l) => l.code) as unknown as readonly string[];
type Language = (typeof supportedLanguages)[number]['code'];

interface LandingNavbarProps {
  currentLang: Language;
  onLangChange: (lang: Language) => void;
}

const NAV_ITEMS: Record<string, Array<{ label: string; href: string }>> = {
  es: [
    { label: 'Producto', href: '#producto' },
    { label: 'Planes', href: '#planes' },
    { label: 'Seguridad', href: '#seguridad' },
    { label: 'Soporte', href: '#soporte' },
    { label: 'Descarga', href: '#descarga' },
  ],
  en: [
    { label: 'Product', href: '#producto' },
    { label: 'Plans', href: '#planes' },
    { label: 'Safety', href: '#seguridad' },
    { label: 'Support', href: '#soporte' },
    { label: 'Download', href: '#descarga' },
  ],
  pt: [
    { label: 'Produto', href: '#producto' },
    { label: 'Planos', href: '#planes' },
    { label: 'Segurança', href: '#seguridad' },
    { label: 'Suporte', href: '#soporte' },
    { label: 'Download', href: '#descarga' },
  ],
  fr: [
    { label: 'Produit', href: '#producto' },
    { label: 'Forfaits', href: '#planes' },
    { label: 'Sécurité', href: '#seguridad' },
    { label: 'Support', href: '#soporte' },
    { label: 'Télécharger', href: '#descarga' },
  ],
};

const CTA_LABEL: Record<string, string> = {
  es: 'Crear cuenta',
  en: 'Sign up',
  pt: 'Criar conta',
  fr: 'Créer un compte',
};

export default function LandingNavbar({ currentLang, onLangChange }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [navLogoUrl, setNavLogoUrl] = useState<string>('/imagotipo.png');
  const router = useRouter();
  const navItems = NAV_ITEMS[currentLang] ?? NAV_ITEMS.en;
  const ctaLabel = CTA_LABEL[currentLang] ?? CTA_LABEL.en;

  const handleLangChange = (code: string) => {
    onLangChange(code as Language);
    setLangModalOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Carga imagotipo navbar dinámico (portal → isNavLogo) con fallback a /imagotipo.png
  useEffect(() => {
    let cancelled = false;
    appearanceService
      .getPublicResources(AppearanceType.LANDING_BANNER)
      .then((resources) => {
        if (cancelled) return;
        const active = resources.find((r) => r.is_active && (r.metadata as any)?.isNavLogo);
        if (active?.url) setNavLogoUrl(getMediaUrl(active.url));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleNavClick = (href: string) => {
    setDrawerOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      router.push(href);
    }
  };

  return (
    <>
      <Box
        component="nav"
        aria-label="Main navigation"
        sx={{
          position: 'fixed',
          top: 'max(12px, env(safe-area-inset-top, 16px))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1100,
          width: { xs: 'calc(100% - 16px)', lg: 'min(1240px, calc(100% - 32px))' },
          maxWidth: 1240,
          display: 'flex',
          justifyContent: 'center',
          px: { xs: 0, lg: 0 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, md: 2, lg: 3 },
            width: '100%',
            px: { xs: 1.25, sm: 2, md: 2.5 },
            py: 1,
            borderRadius: shapeTokens.pill,
            bgcolor: scrolled ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px) saturate(1.7)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.7)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: scrolled ? landingShadows.nav.scrolled : landingShadows.nav.rest,
            transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
            minWidth: 0,
          }}
        >
          {/* Izq: Imagotipo horizontal — altura fija para no alterar alto del navbar */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, cursor: 'pointer', height: 28 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="RETH inicio"
          >
            <Box
              component="img"
              src={navLogoUrl}
              alt="RETH"
              onError={() => setNavLogoUrl('/imagotipo.png')}
              sx={{
                height: 28,
                width: 'auto',
                maxWidth: { xs: 110, sm: 140 },
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </Box>

          {/* Centro: menús principales - hidden en <lg */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              gap: 0.5,
              flex: 1,
              justifyContent: 'center',
              minWidth: 0,
            }}
            role="menubar"
          >
            {navItems.map((item) => (
              <Button
                key={item.label}
                role="menuitem"
                onClick={() => handleNavClick(item.href)}
                sx={{
                  color: 'rgba(255,255,255,0.88)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  letterSpacing: '0.01em',
                  textTransform: 'none',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: shapeTokens.pill,
                  transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
                  '&:hover': {
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.12)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': { transform: 'scale(0.97)', transition: 'transform 100ms ease-out' },
                  '&:focus-visible': { outline: '2px solid #E63946', outlineOffset: 2 },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Der: selector idioma (Tinder modal) + CTA + hamburger */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 }, flexShrink: 0, ml: 'auto' }}>
            <Button
              onClick={() => setLangModalOpen(true)}
              aria-label="Seleccionar idioma"
              startIcon={<LanguageIcon sx={{ fontSize: 16 }} />}
              sx={{
                height: 34,
                borderRadius: shapeTokens.pill,
                bgcolor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: 'white',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 700,
                fontSize: '0.8rem',
                letterSpacing: '0.04em',
                px: 1.5,
                textTransform: 'none',
                backdropFilter: 'blur(12px) saturate(1.5)',
                WebkitBackdropFilter: 'blur(12px) saturate(1.5)',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.28)' },
              }}
            >
              {currentLang.toUpperCase()}
            </Button>

            <Button
              variant="contained"
              onClick={() => router.push('/auth/register')}
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                bgcolor: '#E63946',
                color: 'white',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 600,
                fontSize: '0.875rem',
                letterSpacing: '0.01em',
                textTransform: 'none',
                borderRadius: shapeTokens.pill,
                px: 2.5,
                py: 0.9,
                boxShadow: landingShadows.ctaPrimary.rest,
                border: '1px solid rgba(255,255,255,0.18)',
                transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                '&:hover': { bgcolor: '#FF6B6B', transform: 'translateY(-2px)', boxShadow: landingShadows.ctaPrimary.hover },
                '&:active': { transform: 'scale(0.97)', transition: 'transform 100ms ease-out' },
                '&:focus-visible': { outline: '2px solid white', outlineOffset: 2 },
              }}
            >
              {ctaLabel}
            </Button>

            <IconButton
              aria-label="Abrir menú"
              onClick={() => setDrawerOpen(true)}
              sx={{
                display: { xs: 'inline-flex', lg: 'none' },
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.18)',
                width: 36,
                height: 36,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                '&:focus-visible': { outline: '2px solid #E63946', outlineOffset: 2 },
              }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: 300,
            maxWidth: '85vw',
            bgcolor: 'rgba(26,27,30,0.92)',
            backdropFilter: 'blur(20px) saturate(1.5)',
            color: 'white',
            borderLeft: '1px solid rgba(255,255,255,0.12)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RedThreadLogo variant="mark" style={{ height: 24, width: 'auto' }} />
            <Box component="span" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>RETH</Box>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <List sx={{ p: 1.5 }}>
          {navItems.map((item) => (
            <ListItemButton key={item.label} onClick={() => handleNavClick(item.href)} sx={{ borderRadius: 2, mb: 0.5 }}>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500, fontFamily: 'Inter, system-ui, sans-serif' }} />
            </ListItemButton>
          ))}
        </List>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
        <Box sx={{ px: 2, pb: 1 }}>
          <Button
            fullWidth
            onClick={() => setLangModalOpen(true)}
            startIcon={<LanguageIcon sx={{ fontSize: 16 }} />}
            sx={{
              height: 40,
              borderRadius: shapeTokens.pill,
              bgcolor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.04em',
              textTransform: 'none',
              backdropFilter: 'blur(12px) saturate(1.5)',
            }}
          >
            {currentLang.toUpperCase()} · Idioma
          </Button>
        </Box>
        <Box sx={{ p: 2, pt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => { setDrawerOpen(false); router.push('/auth/register'); }}
            sx={{ bgcolor: '#E63946', borderRadius: shapeTokens.pill, py: 1.2, fontWeight: 600, '&:hover': { bgcolor: '#FF6B6B' } }}
          >
            {ctaLabel}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => { setDrawerOpen(false); router.push('/auth/login'); }}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', borderRadius: shapeTokens.pill, py: 1.2, '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}
          >
            {currentLang === 'es' ? 'Iniciar sesión' : currentLang === 'pt' ? 'Entrar' : currentLang === 'fr' ? 'Se connecter' : 'Sign in'}
          </Button>
        </Box>
      </Drawer>

      <LanguageSelectorModal open={langModalOpen} onClose={() => setLangModalOpen(false)} currentLang={currentLang} onLangChange={handleLangChange} />
    </>
  );
}
