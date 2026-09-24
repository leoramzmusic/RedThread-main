import { Box, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography, IconButton, Chip } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';
import NavbarRenderer from './NavbarRenderer';
import { NavSection, Language } from './types';
import { NavbarStyleSpec } from './styles';
import { NavbarLayoutMode } from './layoutMode';

export interface NavbarResponsivePreviewProps {
  sections: NavSection[];
  currentLang: Language;
  draft: NavbarStyleSpec;
  saved: NavbarStyleSpec;
  showCompare: boolean;
}

export const RESUMEN_RESOLUTIONS = [
  { id: 'desktop', label: 'Desktop', width: 1280 },
  { id: 'tablet', label: 'Tablet', width: 768 },
  { id: 'mobile', label: 'Móvil', width: 375 },
] as const;

type ResolutionId = (typeof RESUMEN_RESOLUTIONS)[number]['id'];

function Mockup({ sections, currentLang, styleSpec, width, label, layoutMode }: {
  sections: NavSection[];
  currentLang: Language;
  styleSpec: NavbarStyleSpec;
  width: number;
  label: string;
  layoutMode: NavbarLayoutMode;
}) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mb: 0.5, display: 'block' }}>
        {label}
      </Typography>
      <Box
        sx={{
          mx: 'auto',
          maxWidth: '100%',
          width: Math.min(width, 1100),
          borderRadius: 2,
          bgcolor: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ height: 32, bgcolor: 'rgba(26,27,30,0.9)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', px: 1.5, gap: 1 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FF5F57' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FEBC2E' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#28C840' }} />
          <Box sx={{ flex: 1, mx: 1, height: 16, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.06)' }} />
        </Box>
        <Box
          data-mockup-stage=""
          style={{ height: layoutMode === 'mobile' ? 110 : 64 }}
          sx={{ position: 'relative', background: 'linear-gradient(135deg, #1c1d20 0%, #232529 55%, #2a1014 100%)' }}
        >
          <NavbarRenderer sections={sections} currentLang={currentLang} styleSpec={styleSpec} scrolled={false} layoutMode={layoutMode} />
        </Box>
      </Box>
    </Box>
  );
}

export default function NavbarResponsivePreview({ sections, currentLang, draft, saved, showCompare }: NavbarResponsivePreviewProps) {
  const [resolution, setResolution] = useState<ResolutionId>('desktop');
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setResolution((prev) => {
          const idx = RESUMEN_RESOLUTIONS.findIndex((r) => r.id === prev);
          return RESUMEN_RESOLUTIONS[(idx + 1) % RESUMEN_RESOLUTIONS.length].id;
        });
      }, 4000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing]);

  const active = RESUMEN_RESOLUTIONS.find((r) => r.id === resolution);
  const compare = showCompare && draft.id !== saved.id;

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 3, overflow: 'hidden', background: 'linear-gradient(135deg, #1c1d20 0%, #232529 55%, #2a1014 100%)' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 1.5 }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
          Vista previa — {currentLang.toUpperCase()}
        </Typography>
        <Stack direction="row" alignItems="center" gap={1}>
          <ToggleButtonGroup exclusive size="small" value={resolution} onChange={(_, v) => { if (v) setResolution(v); }} aria-label="Resolución">
            {RESUMEN_RESOLUTIONS.map((r) => (
              <ToggleButton key={r.id} value={r.id} sx={{ px: 1.5, color: 'white' }}>
                {r.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Chip size="small" label={`${active?.width}px`} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }} />
          <IconButton
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pausar rotación' : 'Reproducir rotación'}
            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' } }}
          >
            {playing ? <Pause /> : <PlayArrow />}
          </IconButton>
        </Stack>
      </Stack>

      <Stack direction={compare ? 'row' : 'row'} spacing={2} sx={{ justifyContent: compare ? 'center' : 'flex-start' }}>
        {compare ? (
          <>
            <Mockup sections={sections} currentLang={currentLang} styleSpec={saved} width={active!.width} label={`Estilo actual — ${saved.label}`} layoutMode={resolution} />
            <Mockup sections={sections} currentLang={currentLang} styleSpec={draft} width={active!.width} label={`Seleccionado — ${draft.label}`} layoutMode={resolution} />
          </>
        ) : (
          <Mockup sections={sections} currentLang={currentLang} styleSpec={draft} width={active!.width} label="" layoutMode={resolution} />
        )}
      </Stack>
    </Paper>
  );
}