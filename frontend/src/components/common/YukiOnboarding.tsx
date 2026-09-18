import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Paper, Fade, IconButton, useTheme, alpha } from '@mui/material';
import { Close as CloseIcon, ArrowForward as NextIcon, ArrowBack as PrevIcon } from '@mui/icons-material';
import KawaiiCat from './KawaiiCat';

interface OnboardingStep {
  title: string;
  description: string;
  mascotState: 'idle' | 'waving' | 'curious' | 'success' | 'sleeping';
  moduleColor?: string;
  targetSelector?: string;
}

interface YukiOnboardingProps {
  steps: OnboardingStep[];
  storageKey?: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function YukiOnboarding({
  steps,
  storageKey = 'yuki-onboarding-completed',
  onComplete,
  onSkip,
}: YukiOnboardingProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      localStorage.setItem(storageKey, 'true');
      setIsVisible(false);
      onComplete?.();
    }
  }, [currentStep, steps.length, storageKey, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
    onSkip?.();
  }, [storageKey, onSkip]);

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Fade in={isVisible}>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      >
        <Paper
          elevation={8}
          sx={{
            position: 'relative',
            maxWidth: 420,
            width: '90%',
            borderRadius: 4,
            overflow: 'hidden',
            bgcolor: isDark ? 'rgba(29,29,31,0.98)' : 'rgba(255,255,255,0.98)',
          }}
        >
          {/* Progress bar */}
          <Box
            sx={{
              height: 3,
              bgcolor: 'rgba(255,255,255,0.1)',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${progress}%`,
                bgcolor: '#E63946',
                transition: 'width 0.3s ease',
              }}
            />
          </Box>

          {/* Close button */}
          <IconButton
            onClick={handleSkip}
            aria-label="Cerrar tutorial"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Box sx={{ p: 4, textAlign: 'center' }}>
            {/* Mascot */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              <KawaiiCat
                state={step.mascotState}
                moduleColor={step.moduleColor || '#E63946'}
                size={100}
                interactive
              />
            </Box>

            {/* Content */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: isDark ? '#fff' : '#1A1B1E',
                mb: 1,
              }}
            >
              {step.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                lineHeight: 1.6,
                mb: 3,
              }}
            >
              {step.description}
            </Typography>

            {/* Step counter */}
            <Typography
              variant="caption"
              sx={{
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
                mb: 2,
                display: 'block',
              }}
            >
              {currentStep + 1} / {steps.length}
            </Typography>

            {/* Navigation */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              {currentStep > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<PrevIcon />}
                  onClick={handlePrev}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                    color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                  }}
                >
                  Atrás
                </Button>
              )}
              <Button
                variant="contained"
                endIcon={isLast ? undefined : <NextIcon />}
                onClick={handleNext}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: '#E63946',
                  '&:hover': { bgcolor: '#FF6B6B' },
                  px: 3,
                }}
              >
                {isLast ? '¡Empezar!' : 'Siguiente'}
              </Button>
            </Box>

            {/* Skip link */}
            {!isLast && (
              <Button
                variant="text"
                size="small"
                onClick={handleSkip}
                sx={{
                  mt: 2,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
                }}
              >
                Saltar tutorial
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
}