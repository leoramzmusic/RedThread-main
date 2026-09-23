import { useRef } from 'react';
import { Box, Grid, Typography, Dialog, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { supportedLanguages } from '../../config/languages';

type Language = (typeof supportedLanguages)[number]['code'];

interface Props {
  open: boolean;
  onClose: () => void;
  currentLang: Language;
  onLangChange: (lang: Language) => void;
}

const MORE_LANGS: Record<string, string> = {
  es: 'Más idiomas próximamente...',
  en: 'More languages coming soon...',
  pt: 'Mais idiomas em breve...',
  fr: 'Plus de langues bientôt...',
  de: 'Weitere Sprachen folgen in Kürze...',
  it: 'Altre lingue in arrivo...',
  ru: 'Скоро больше языков...',
  sv: 'Fler språk kommer snart...',
  nl: 'Meer talen binnenkort...',
  zh: '更多语言即将推出...',
  hi: 'और भाषाएँ जल्द आ रही हैं...',
  bn: 'আরও ভাষা শীঘ্রই আসছে...',
  ja: '近日、さらに言語を追加予定...',
  ko: '더 많은 언어가 곧 제공됩니다...',
  ar: 'المزيد من اللغات قريباً...',
  sw: 'Lugha zaidi zinakuja hivi karibuni...',
  ha: 'Ƙarin harsuna nan ba da jimawa ba...',
  am: 'ተጨማሪ ቋንቋዎች በቅርቡ ይመጣሉ...',
  fil: 'Parami pang mga wika...',
};

function nearestTile(tiles: HTMLElement[], from: HTMLElement, dir: 'left' | 'right' | 'up' | 'down'): HTMLElement | null {
  const r = from.getBoundingClientRect();
  let best: HTMLElement | null = null;
  let bestDist = Infinity;
  for (const t of tiles) {
    if (t === from) continue;
    const tr = t.getBoundingClientRect();
    const overlapY = tr.top < r.bottom && tr.bottom > r.top;
    const overlapX = tr.left < r.right && tr.right > r.left;
    let dist = Infinity;
    if (dir === 'right' && tr.left >= r.right - 4 && overlapY) dist = tr.left - r.right;
    if (dir === 'left' && tr.right <= r.left + 4 && overlapY) dist = r.left - tr.right;
    if (dir === 'down' && tr.top >= r.bottom - 4 && overlapX) dist = tr.top - r.bottom;
    if (dir === 'up' && tr.bottom <= r.top + 4 && overlapX) dist = r.top - tr.bottom;
    if (dist < bestDist) {
      bestDist = dist;
      best = t;
    }
  }
  return best;
}

export default function LanguageSelectorModal({ open, onClose, currentLang, onLangChange }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);

  const handleChange = (code: string) => {
    onLangChange(code as Language);
    onClose();
  };

  const handleGridKeyDown = (e: React.KeyboardEvent) => {
    const dirs: Record<string, 'left' | 'right' | 'up' | 'down'> = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
    };
    const dir = dirs[e.key];
    if (!dir) return;
    const tiles = Array.from(gridRef.current?.querySelectorAll<HTMLElement>('[data-lang-tile]') ?? []);
    const focused = document.activeElement as HTMLElement | null;
    if (!focused || !tiles.includes(focused)) return;
    e.preventDefault();
    nearestTile(tiles, focused, dir)?.focus();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' } },
        paper: {
          sx: {
            bgcolor: '#0F0F0F',
            backgroundImage: 'none',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
            overflow: 'hidden',
            maxHeight: { xs: '85vh', md: '78vh' },
          },
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          p: { xs: 3, md: 4 },
          pr: { xs: 6, md: 7 },
          pb: 2,
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: '50%',
              bgcolor: 'rgba(230,57,70,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(230,57,70,0.25)',
            }}
          >
            <Box
              component="img"
              src="/img/assets/isotipo.png"
              alt="RETH"
              sx={{ width: 26, height: 26, objectFit: 'contain', display: 'block' }}
            />
          </Box>
        </Box>
        <Typography
          variant="h6"
          sx={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2 }}
        >
          {currentLang === 'es' ? 'Elige un idioma' : currentLang === 'pt' ? 'Escolha um idioma' : currentLang === 'fr' ? 'Choisir une langue' : 'Choose a language'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.02em', mt: 0.5, display: 'block' }}>
          {supportedLanguages.find((l) => l.code === currentLang)?.label ?? currentLang.toUpperCase()}
        </Typography>
        <IconButton
          onClick={onClose}
          aria-label="Cerrar"
          sx={{
            position: 'absolute', top: 14, right: 14,
            width: 30, height: 30,
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.18)',
            bgcolor: 'rgba(255,255,255,0.06)',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'rgba(230,57,70,0.18)',
              borderColor: 'rgba(230,57,70,0.55)',
              color: '#E63946',
            },
          }}
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      <Box
        sx={{
          p: { xs: 2, md: 3 },
          overflowY: 'auto',
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain',
        }}
      >
        <Grid ref={gridRef} container spacing={1} onKeyDown={handleGridKeyDown}>
          {supportedLanguages.map((lang) => {
            const isActive = lang.code === currentLang;
            return (
              <Grid item xs={6} sm={4} md={3} key={lang.code}>
                <Box
                  data-lang-tile
                  onClick={() => handleChange(lang.code)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isActive}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleChange(lang.code);
                    }
                  }}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: isActive ? '1.5px solid #E63946' : '1px solid rgba(255,255,255,0.08)',
                    bgcolor: isActive ? 'rgba(230,57,70,0.14)' : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(230,57,70,0.12)',
                      borderColor: 'rgba(230,57,70,0.35)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
                    },
                    '&:active': { transform: 'scale(0.98)' },
                    '&:focus-visible': {
                      outline: '2px solid #E63946',
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Typography sx={{ color: isActive ? '#FF6B6B' : 'white', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2, fontFamily: 'Inter, system-ui, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lang.label.split(' ')[0]}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem', lineHeight: 1.2, mt: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lang.code.toUpperCase()} · {lang.sample?.split(' ').slice(0, 2).join(' ') ?? lang.label}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
        <Box sx={{ mt: 3.5, p: 2.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, letterSpacing: '0.02em', display: 'block' }}>
            {MORE_LANGS[currentLang] ?? MORE_LANGS.en}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.4)', mt: 0.5, fontSize: '0.65rem' }}>
            {supportedLanguages.length} idiomas disponibles · RETH Liquid Glass
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}
