import { useState, useEffect, useCallback } from 'react';
import type React from 'react';
import { Box, Button, IconButton, Drawer, List, ListItemButton, ListItemText, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LanguageIcon from '@mui/icons-material/Language';
import { useRouter } from 'next/router';
import RedThreadLogo from './RedThreadLogo';
import { shapeTokens } from '../../theme/liquidGlass';
import LanguageSelectorModal from './LanguageSelectorModal';
import appearanceService from '../../services/appearanceService';
import { AppearanceType } from '../../types/appearance';
import { getMediaUrl } from '../../utils/media';
import NavbarRenderer from '../../components/appearance/navbar-editor/NavbarRenderer';
import { getDefaultStyleSpec, mergeStyleSpec, NavbarStyleSpec, NAVBAR_STYLE_ID_DEFAULT } from '../../components/appearance/navbar-editor/styles';
import { NavSection, Language, getTranslationFallback, DEFAULT_SECTIONS } from '../../components/appearance/navbar-editor/types';

interface LandingNavbarProps {
  currentLang: Language;
  onLangChange: (lang: Language) => void;
}

const INITIAL_NAV_SECTIONS: NavSection[] = DEFAULT_SECTIONS.map((s) => ({ ...s, id: s.key }));

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
  const [navLogoUrl, setNavLogoUrl] = useState<string>('/img/assets/isotipo.png');
  const [navSections, setNavSections] = useState<NavSection[]>(INITIAL_NAV_SECTIONS);
  const [styleSpec, setStyleSpec] = useState<NavbarStyleSpec>(() => getDefaultStyleSpec(NAVBAR_STYLE_ID_DEFAULT));
  const router = useRouter();
  const ctaLabel = CTA_LABEL[currentLang] ?? CTA_LABEL.en;

  const handleLangChange = (code: string) => {
    onLangChange(code as Language);
    setLangModalOpen(false);
  };

  // Carga secciones del navbar dinámicas (público, sin auth)
  const fetchNavSections = useCallback(() => {
    appearanceService
      .getPublicResources(AppearanceType.LANDING_NAVBAR)
      .then((resources) => {
        const mapped = resources
          .filter(r => r.is_active && (r.metadata as any)?.visible)
          .map(r => ({
            id: (r as any)?.id ?? r._id ?? '',
            key: (r.metadata as any)?.key || '',
            route: (r.metadata as any)?.route || '',
            icon: (r.metadata as any)?.icon || 'Menu',
            visible: (r.metadata as any)?.visible ?? true,
            locked: (r.metadata as any)?.locked ?? false,
            order: (r.metadata as any)?.order ?? 0,
            translations: ((r.metadata as any)?.translations || {}) as Record<Language, string>,
          }))
          .sort((a, b) => a.order - b.order);
        if (mapped.length > 0) setNavSections(mapped);
      })
      .catch(() => {});
  }, []);

  const fetchStyleSpec = useCallback(() => {
    appearanceService
      .getPublicResources(AppearanceType.LANDING_NAVBAR_STYLE)
      .then((resources) => {
        const active = resources.find((r) => r.is_active && (r.metadata as any)?.id);
        if (active?.metadata?.id) {
          const base = getDefaultStyleSpec((active.metadata as any).id);
          setStyleSpec(mergeStyleSpec(base, { accent: active.metadata.accent, fontWeight: active.metadata.fontWeight, hoverAnimation: active.metadata.hoverAnimation }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNavSections();
    fetchStyleSpec();
  }, [fetchNavSections, fetchStyleSpec]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Carga imagotipo navbar dinámico (portal → isNavLogo) con fallback a /img/assets/isotipo.png
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

  const handlePillClick = (e: React.MouseEvent) => {
    const el = (e.target as Element).closest(
      '[data-nav-logo],[data-nav-href],[data-nav-lang],[data-nav-cta],[data-nav-menu]'
    );
    if (!el) return;
    if (el.hasAttribute('data-nav-logo')) window.scrollTo({ top: 0, behavior: 'smooth' });
    else if (el.hasAttribute('data-nav-href')) handleNavClick(el.getAttribute('data-nav-href') || '');
    else if (el.hasAttribute('data-nav-lang')) setLangModalOpen(true);
    else if (el.hasAttribute('data-nav-cta')) router.push('/auth/register');
    else if (el.hasAttribute('data-nav-menu')) setDrawerOpen(true);
  };

  // Obtiene items visibles para el idioma actual
  const visibleNavItems = navSections
    .filter(s => s.visible)
    .map(s => ({ label: getTranslationFallback(s.translations, currentLang), href: s.route }));

  return (
    <>
      <Box
        component="nav"
        aria-label="Main navigation"
        onClick={handlePillClick}
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
        <NavbarRenderer
          sections={navSections}
          currentLang={currentLang}
          styleSpec={styleSpec}
          scrolled={scrolled}
          interactive
          ctaLabel={ctaLabel}
          logoUrl={navLogoUrl}
          onLogoError={() => setNavLogoUrl('/img/assets/isotipo.png')}
        />
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
          {visibleNavItems.map((item) => (
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
