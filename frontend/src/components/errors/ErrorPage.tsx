import React, { useEffect, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useAppTheme } from '../../context/ThemeContext';
import {
  BLUE,
  glassSurface,
  orbisLayer,
  glassHeading,
  pillPrimary,
  pillGlass,
  textPrimary,
  textSecondary,
  hairline,
} from '../../styles/glass';
import { ErrorCta, getErrorMeta } from './registry';
import ThreadIllustration from './ThreadIllustration';

interface ErrorPageProps {
  code: number;
  /** Si se define, redirige automáticamente tras `redirectDelayMs`. */
  redirectTo?: string;
  redirectDelayMs?: number;
}

function alpha(hex: string, opacity: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default function ErrorPage({ code, redirectTo, redirectDelayMs = 2500 }: ErrorPageProps) {
  const { t } = useTranslation('common');
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const router = useRouter();

  const meta = getErrorMeta(code);
  const [secondsLeft, setSecondsLeft] = useState(() => Math.ceil(redirectDelayMs / 1000));

  useEffect(() => {
    if (!redirectTo) return;
    let remaining = redirectDelayMs;
    const tick = setInterval(() => {
      remaining -= 1000;
      setSecondsLeft(Math.max(0, Math.ceil(remaining / 1000)));
    }, 1000);
    const timer = setTimeout(() => {
      router.replace(redirectTo);
    }, redirectDelayMs);
    return () => {
      clearInterval(tick);
      clearTimeout(timer);
    };
  }, [redirectTo, redirectDelayMs, router]);

  const run = (cta: ErrorCta) => {
    const action = cta.action ?? 'push';
    if (action === 'back') router.back();
    else if (action === 'reload') router.reload();
    else router.push(cta.href);
  };

  const title = t(meta.titleKey, meta.defaultTitle);
  const narrative = t(meta.narrativeKey, meta.defaultNarrative);
  const primaryLabel = t(meta.primary.i18n, meta.primary.default);

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        px: { xs: 2, sm: 3 },
        py: { xs: 6, sm: 8 },
      }}
    >
      <Box sx={{ position: 'absolute', inset: 0, ...orbisLayer(isDark) }} />

      {/* Hebra decorativa inferior */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: -60,
          right: -60,
          bottom: '8%',
          height: 1,
          background: `linear-gradient(90deg, transparent, ${meta.accent}, ${BLUE}, transparent)`,
          opacity: 0.35,
        }}
      />

      <Box
        component="main"
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 560,
          ...glassSurface(isDark, { elevated: true, sheen: 'auto', level: 'high' }),
          ...(redirectTo
            ? {
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'inherit',
                  padding: '1px',
                  background: `linear-gradient(135deg, ${alpha(meta.accent, 0.5)}, transparent 40%, transparent 60%, ${alpha(BLUE, 0.5)})`,
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  pointerEvents: 'none',
                },
              }
            : {}),
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            px: { xs: 3, sm: 5 },
            py: { xs: 5, sm: 6 },
          }}
        >
          <Box
            sx={{
              mb: 2,
              filter: `drop-shadow(0 10px 28px ${alpha(meta.accent, 0.35)})`,
              animation: 'rtBreathe 7s ease-in-out infinite',
            }}
          >
            <ThreadIllustration variant={meta.ornament} accent={meta.accent} isDark={isDark} />
          </Box>

          <Typography
            sx={{
              ...glassHeading,
              fontWeight: 800,
              lineHeight: 1,
              fontSize: { xs: 64, sm: 92 },
              background: isDark
                ? `linear-gradient(180deg, #FFFFFF 0%, ${alpha(meta.accent, 0.75)} 130%)`
                : `linear-gradient(180deg, #1A1B1E 0%, ${alpha(meta.accent, 0.85)} 145%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              filter: `drop-shadow(0 4px 18px ${alpha(meta.accent, 0.28)})`,
            }}
          >
            {meta.code}
          </Typography>

          <Typography
            sx={{
              ...glassHeading,
              mt: 1.5,
              fontSize: { xs: 22, sm: 28 },
              color: textPrimary(isDark),
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              mt: 1.5,
              maxWidth: 420,
              fontSize: 15,
              lineHeight: 1.6,
              color: textSecondary(isDark),
            }}
          >
            {narrative}
          </Typography>

          <Box
            component="hr"
            sx={{
              height: 1,
              width: '72%',
              border: 'none',
              my: 3,
              background: `linear-gradient(90deg, transparent, ${hairline(isDark)}, transparent)`,
            }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: '100%', maxWidth: 380 }}>
            <Button fullWidth variant="contained" sx={pillPrimary()} onClick={() => run(meta.primary)}>
              {primaryLabel}
            </Button>
            {meta.secondary && (
              <Button
                fullWidth
                variant="outlined"
                sx={pillGlass(isDark)}
                onClick={() => run(meta.secondary!)}
              >
                {t(meta.secondary.i18n, meta.secondary.default)}
              </Button>
            )}
          </Stack>

          {redirectTo && (
            <Typography
              aria-live="polite"
              sx={{
                mt: 2.5,
                fontSize: 13,
                color: textSecondary(isDark),
                animation: 'rtFadeUp 0.6s ease 0.4s both',
              }}
            >
              {t('errors.redirecting', 'Redirigiendo en {{s}} segundos…', { s: secondsLeft })}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}