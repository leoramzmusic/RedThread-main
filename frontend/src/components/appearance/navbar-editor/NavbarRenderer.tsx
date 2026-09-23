import { Box, Button, IconButton } from '@mui/material';
import { Language as LanguageIcon, Menu as MenuIcon } from '@mui/icons-material';
import { landingShadows, shapeTokens } from '../../../theme/liquidGlass';
import { NavSection, Language, getTranslationFallback } from './types';
import { NavbarStyleSpec } from './styles';
import { NavbarIcon } from './NavbarIcon';

export interface NavbarRendererProps {
  sections: NavSection[];
  currentLang: Language;
  styleSpec: NavbarStyleSpec;
  scrolled?: boolean;
  interactive?: boolean;
  ctaLabel?: string;
  logoUrl?: string;
  onLogoError?: () => void;
}

const DEFAULT_CTA_LABEL: Record<string, string> = {
  es: 'Crear cuenta', en: 'Sign up', pt: 'Criar conta', fr: 'Créer un compte',
  de: 'Konto erstellen', it: 'Crea account', ru: 'Создать аккаунт', sv: 'Skapa konto',
  nl: 'Account aanmaken', zh: '注册', hi: 'खाता बनाएं', bn: 'অ্যাকাউন্ট তৈরি করুন',
  ja: 'アカウント作成', ko: '가입하기', ar: 'إنشاء حساب', sw: 'Jiandikishe',
  ha: 'Ƙirƙiri asusu', am: 'መለያ ፍጠር', fil: 'Gumawa ng account',
};

const WEIGHT = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const;

const getHoverSx = (animation: NavbarStyleSpec['hoverAnimation'], accent: string) => {
  switch (animation) {
    case 'underline':
      return { '&:hover': { color: 'white' } as object };
    case 'glow':
      return { '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', boxShadow: `0 0 14px ${accent}66` } as object };
    case 'draw':
      return { '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } as object };
    case 'none':
      return { '&:hover': { color: 'white' } as object };
    default:
      return { '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.12)', transform: 'translateY(-1px)' } as object };
  }
};

export default function NavbarRenderer({
  sections, currentLang, styleSpec, scrolled = false, interactive = true, ctaLabel, logoUrl, onLogoError,
}: NavbarRendererProps) {
  const visibleNavItems = sections
    .filter((s) => s.visible)
    .map((s) => ({ label: getTranslationFallback(s.translations, currentLang), href: s.route, icon: s.icon }));
  const resolvedCta = ctaLabel || DEFAULT_CTA_LABEL[currentLang] || DEFAULT_CTA_LABEL.en;
  const compact = styleSpec.id === 'compact';
  const itemFontSize = compact ? '0.8rem' : '0.875rem';
  const itemPy = compact ? 0.4 : 0.75;
  const pillPy = compact ? 0.5 : 1;
  const pillGap = compact ? '0.5rem' : { xs: 1, md: 2, lg: 3 };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: pillGap,
        width: '100%',
        px: { xs: 1.25, sm: 2, md: 2.5 },
        py: pillPy,
        borderRadius: compact ? 2 : shapeTokens.pill,
        bgcolor: scrolled ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px) saturate(1.7)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.7)',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: scrolled ? landingShadows.nav.scrolled : landingShadows.nav.rest,
        transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
        minWidth: 0,
      }}
    >
      <Box
        aria-label="RETH inicio"
        {...(interactive ? { 'data-nav-logo': '' } : {})}
        sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, cursor: 'pointer', height: compact ? 24 : 28, gap: 0.5, mr: 1 }}
      >
        {logoUrl ? (
          <Box
            component="img"
            src={logoUrl}
            alt="RETH"
            onError={onLogoError}
            sx={{ height: compact ? 24 : 28, width: 'auto', maxWidth: { xs: 110, sm: 140 }, objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <>
            <NavbarIcon name="Home" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: compact ? 22 : 24 }} />
            <Box component="span" sx={{ color: 'white', fontWeight: 800, letterSpacing: '-0.02em', fontSize: compact ? '0.85rem' : '0.95rem' }}>
              RETH
            </Box>
          </>
        )}
      </Box>

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
        {visibleNavItems.map((item) => (
          <Box key={`${item.label}-${item.href}`} sx={{ position: 'relative', display: 'flex', '&:hover .rt-nav-underline': { transform: 'scaleX(1)' }, '&:focus-within .rt-nav-underline': { transform: 'scaleX(1)' } }}>
            <Button
              role="menuitem"
              {...(interactive ? { 'data-nav-href': item.href } : {})}
              startIcon={styleSpec.showIcons ? <NavbarIcon name={item.icon} /> : undefined}
              sx={{
                color: 'rgba(255,255,255,0.88)',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: WEIGHT[styleSpec.fontWeight],
                fontSize: itemFontSize,
                letterSpacing: '0.01em',
                textTransform: 'none',
                px: 1.5,
                py: itemPy,
                borderRadius: shapeTokens.pill,
                transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
                ...getHoverSx(styleSpec.hoverAnimation, styleSpec.accent),
                '&:active': { transform: 'scale(0.97)', transition: 'transform 100ms ease-out' },
                '&:focus-visible': { outline: '2px solid #E63946', outlineOffset: 2 },
              }}
            >
              {item.label || `(${item.href})`}
            </Button>
            {styleSpec.underlineOnHover && (
              <Box
                className="rt-nav-underline"
                sx={{
                  position: 'absolute',
                  bottom: 2,
                  left: '16%',
                  width: '68%',
                  height: 2,
                  borderRadius: 1,
                  bgcolor: styleSpec.accent,
                  transform: 'scaleX(0)',
                  transformOrigin: 'center',
                  transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)',
                  pointerEvents: 'none',
                  '&:hover': { transform: 'scaleX(1)' },
                }}
              />
            )}
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 }, flexShrink: 0, ml: 'auto' }}>
        <Button
          aria-label="Seleccionar idioma"
          {...(interactive ? { 'data-nav-lang': '' } : {})}
          startIcon={<LanguageIcon sx={{ fontSize: 16 }} />}
          sx={{
            height: compact ? 30 : 34,
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
            '&:hover': { bgcolor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.28)' },
          }}
        >
          {currentLang.toUpperCase()}
        </Button>

        <Button
          variant="contained"
          {...(interactive ? { 'data-nav-cta': '' } : {})}
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
            px: compact ? 1.8 : 2.5,
            py: compact ? 0.6 : 0.9,
            boxShadow: landingShadows.ctaPrimary.rest,
            border: '1px solid rgba(255,255,255,0.18)',
            '&:hover': { bgcolor: '#FF6B6B', boxShadow: landingShadows.ctaPrimary.hover },
            '&:focus-visible': { outline: '2px solid white', outlineOffset: 2 },
          }}
        >
          {resolvedCta}
        </Button>

        <IconButton
          aria-label="Abrir menú"
          {...(interactive ? { 'data-nav-menu': '' } : {})}
          sx={{
            display: { xs: 'inline-flex', lg: 'none' },
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.18)',
            width: compact ? 32 : 36,
            height: compact ? 32 : 36,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
            '&:focus-visible': { outline: '2px solid #E63946', outlineOffset: 2 },
          }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}