import { useState } from 'react';
import { Box, Container, Typography, Paper, Stack, Button, Chip, useTheme } from '@mui/material';
import { KawaiiCat, YukiLottie, YukiLoader, YukiEmptyState, YukiBadge, YukiOnboarding, YukiTooltip, YukiErrorBoundary } from '../../../components/common/yuki';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetStaticProps } from 'next';

const STATES = ['idle', 'loading', 'success', 'error', 'sleeping', 'curious', 'waving', 'playful'] as const;
const MODULE_COLORS = [
  { name: 'Red (Default)', color: '#E63946' },
  { name: 'Blue', color: '#3B82F6' },
  { name: 'Gold', color: '#F59E0B' },
  { name: 'Violet', color: '#8B5CF6' },
  { name: 'Emerald', color: '#10B981' },
  { name: 'Rose', color: '#F43F5E' },
];

export default function YukiDemo() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeState, setActiveState] = useState<typeof STATES[number]>('idle');
  const [activeColor, setActiveColor] = useState('#E63946');
  const [showBadge, setShowBadge] = useState(true);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight={800} gutterBottom>
        Yuki (雪) — Component Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Mascota oficial de RedThread. Gatito kawaii blanco que juega con una bola de estambre.
      </Typography>

      {/* SVG Interactive */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: isDark ? '#1a1a2e' : '#f8f9fa' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>KawaiiCat (SVG Interactive)</Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          {STATES.map((s) => (
            <Chip
              key={s}
              label={s}
              onClick={() => setActiveState(s)}
              color={activeState === s ? 'primary' : 'default'}
              variant={activeState === s ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
          {MODULE_COLORS.map((c) => (
            <Chip
              key={c.color}
              label={c.name}
              onClick={() => setActiveColor(c.color)}
              sx={{
                bgcolor: c.color,
                color: 'white',
                opacity: activeColor === c.color ? 1 : 0.5,
                '&:hover': { opacity: 0.8 },
              }}
            />
          ))}
        </Stack>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <KawaiiCat state={activeState} moduleColor={activeColor} size={160} showYarn />
        </Box>
      </Paper>

      {/* Lottie Animations */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: isDark ? '#1a1a2e' : '#f8f9fa' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>YukiLottie (Bodymovin)</Typography>
        <Stack direction="row" spacing={3} sx={{ justifyContent: 'center', flexWrap: 'wrap', gap: 3, py: 2 }}>
          {(['idle', 'loading', 'success', 'error', 'sleeping'] as const).map((s) => (
            <Box key={s} sx={{ textAlign: 'center' }}>
              <YukiLottie state={s} size={100} />
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>{s}</Typography>
            </Box>
          ))}
        </Stack>
      </Paper>

      {/* Loader */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: isDark ? '#1a1a2e' : '#f8f9fa' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>YukiLoader</Typography>
        <YukiLoader message="Cargando tu perfil..." size={100} />
      </Paper>

      {/* Empty State */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: isDark ? '#1a1a2e' : '#f8f9fa' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>YukiEmptyState</Typography>
        <YukiEmptyState
          title="Sin matches aún"
          description="¡Sigue explorando! Yuki encontrará a alguien especial para ti."
          actionLabel="Explorar"
          onAction={() => {}}
          MascotState="sleeping"
        />
      </Paper>

      {/* Badge */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: isDark ? '#1a1a2e' : '#f8f9fa' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>YukiBadge (Gamificación)</Typography>
        <Stack spacing={2} sx={{ maxWidth: 320 }}>
          <YukiBadge type="achievement" title="Primer Match" description="¡Conectaste con alguien por primera vez!" visible={showBadge} autoHide={false} />
          <YukiBadge type="streak" title="Racha de 7 días" description="Has abierto la app 7 días seguidos" visible={showBadge} autoHide={false} />
          <YukiBadge type="levelup" title="Nivel 5 alcanzado" description="Tu perfil está creciendo" visible={showBadge} autoHide={false} />
          <YukiBadge type="milestone" title="100 mensajes enviados" description="¡Eres muy sociable!" visible={showBadge} autoHide={false} />
        </Stack>
        <Button size="small" sx={{ mt: 2 }} onClick={() => setShowBadge((v) => !v)}>
          {showBadge ? 'Ocultar' : 'Mostrar'} badges
        </Button>
      </Paper>

      {/* Color Palette */}
      <Paper sx={{ p: 3, bgcolor: isDark ? '#1a1a2e' : '#f8f9fa' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>Paleta Oficial</Typography>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
          {MODULE_COLORS.map((c) => (
            <Box key={c.color} sx={{ textAlign: 'center' }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: c.color, boxShadow: 2 }} />
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>{c.name}</Typography>
              <Typography variant="caption" display="block" color="text.secondary">{c.color}</Typography>
            </Box>
          ))}
        </Stack>
      </Paper>

      {/* Onboarding */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: isDark ? '#1a1a2e' : '#f8f9fa' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>YukiOnboarding</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Guía interactiva para nuevos usuarios. Se muestra automáticamente la primera vez.
        </Typography>
        <Button
          variant="outlined"
          onClick={() => {
            localStorage.removeItem('yuki-onboarding-demo');
            window.location.reload();
          }}
        >
          Resetear y mostrar onboarding
        </Button>
        <YukiOnboarding
          storageKey="yuki-onboarding-demo"
          steps={[
            { title: '¡Bienvenido!', description: 'Soy Yuki, tu gatito guía. Te mostraré cómo funciona RedThread.', mascotState: 'waving' },
            { title: 'Descubre personas', description: 'Usa el radar para encontrar personas cerca de ti con intereses similares.', mascotState: 'curious', moduleColor: '#3B82F6' },
            { title: 'Conecta', description: 'Cuando encuentres a alguien especial, inicia una conversación.', mascotState: 'success', moduleColor: '#10B981' },
          ]}
        />
      </Paper>

      {/* Tooltip */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: isDark ? '#1a1a2e' : '#f8f9fa' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>YukiTooltip</Typography>
        <Stack direction="row" spacing={4} sx={{ justifyContent: 'center', py: 3 }}>
          <YukiTooltip message="¡Prueba deslizar para descubrir!" position="top" autoShow={false} storageKey="tooltip-demo-top">
            <Button variant="contained">Tooltip Arriba</Button>
          </YukiTooltip>
          <YukiTooltip message="Aquí puedes ver tu perfil" position="bottom" autoShow={false} storageKey="tooltip-demo-bottom">
            <Button variant="contained">Tooltip Abajo</Button>
          </YukiTooltip>
        </Stack>
      </Paper>

      {/* Error Boundary */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: isDark ? '#1a1a2e' : '#f8f9fa' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>YukiErrorBoundary</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Captura errores de React y muestra a Yuki con un mensaje amigable.
        </Typography>
        <YukiErrorBoundary>
          <Button
            variant="outlined"
            color="error"
            onClick={() => { throw new Error('Demo error de Yuki'); }}
          >
            Lanzar error de prueba
          </Button>
        </YukiErrorBoundary>
      </Paper>
    </Container>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'es', ['common'])),
  },
});
