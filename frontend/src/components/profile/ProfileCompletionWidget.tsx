import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  useTheme,
  useMediaQuery,
  alpha,
  Fade,
  ButtonBase,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import { EmojiEvents, AutoFixHigh, ArrowForward } from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
import apiClient from "../../services/api";

import { Control, useWatch } from "react-hook-form";
import { useTranslation } from "next-i18next";
import {
  calculateProfileScore,
  calculateCompletionPercentage,
  getMaxScore,
  getProfileSuggestions,
} from "../../utils/profileScoring";

interface ProfileCompletionWidgetProps {
  control: Control<any>;
  onSuggestionClick?: (sectionId: string) => void;
  /** Keys `section-*` desactivadas en el portal (null = todas activas) */
  hiddenSections?: string[] | null;
}

// Contador animado (easeOutCubic): en montaje cuenta desde 0, luego desde
// el valor previo. Respeta reduced-motion (salta directo).
function useAnimatedNumber(value: number, animate: boolean) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    if (from === value || !animate) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }
    let raf = 0;
    const dur = 800;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        prevRef.current = value;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, animate]);

  return display;
}

export default function ProfileCompletionWidget({
  control,
  onSuggestionClick,
  hiddenSections = null,
}: ProfileCompletionWidgetProps) {
  const theme = useTheme();
  const { t } = useTranslation("common");
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  // Subscribe to form changes efficiently without re-rendering parent
  const formValues = useWatch({ control });

  // Fallback de integración (ej. Spotify roto): música cuenta sin conectar.
  // Default false = comportamiento anterior si el backend no lo soporta.
  const [musicFallback, setMusicFallback] = useState(false);
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get("/api/integraciones/spotify")
      .then((res) => {
        if (!cancelled && res?.data?.fallback_complete) setMusicFallback(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Calculate score and suggestions based on current values.
  // Las secciones desactivadas en el portal no cuentan (ni puntaje ni máximo).
  const hidden = hiddenSections ?? null;
  const score = calculateProfileScore(formValues, hidden, musicFallback);
  const percentage = calculateCompletionPercentage(score, getMaxScore(hidden));
  const suggestions = getProfileSuggestions(formValues, hidden, musicFallback);
  const shown = useAnimatedNumber(percentage, !reduceMotion);

  // Shimmer solo al montar o cuando cambia el valor (no permanente)
  const [justChanged, setJustChanged] = useState(true);
  useEffect(() => {
    if (reduceMotion) {
      setJustChanged(false);
      return;
    }
    setJustChanged(true);
    const t = setTimeout(() => setJustChanged(false), 1300);
    return () => clearTimeout(t);
  }, [percentage, reduceMotion]);
  const showShimmer = justChanged && !reduceMotion;

  // Celebración del logro: solo la primera vez que llega a 100%.
  // - Pulso del trofeo 0.7s una vez + confeti (import dinámico).
  // - Snackbar con badge dorado minimalista.
  // - Persiste el flag en BD (PUT /profiles/me) para no repetir.
  // - Todo desactivado con prefers-reduced-motion.
  // - Ref (no estado) para que StrictMode no dispare doble.
  const [pulse, setPulse] = useState(false);
  const [badgeOpen, setBadgeOpen] = useState(false);
  const firedRef = useRef(false);
  const alreadyUnlocked = Boolean(
    (formValues as any)?.profile_completed_achievement,
  );

  useEffect(() => {
    if (percentage !== 100 || alreadyUnlocked || firedRef.current || reduceMotion) {
      return;
    }
    firedRef.current = true;
    setPulse(true);
    setBadgeOpen(true);
    const pulseTimer = setTimeout(() => setPulse(false), 750);
    import("canvas-confetti")
      .then((m) => {
        const confetti = (m as any).default ?? m;
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
      })
      .catch(() => {});
    apiClient
      .put("/profiles/me", { profile_completed_achievement: true })
      .catch(() => {});
    return () => clearTimeout(pulseTimer);
  }, [percentage, alreadyUnlocked, reduceMotion]);

  // Color adaptativo: rojo <50%, amarillo 50-80%, verde >80%
  let color = theme.palette.error.main;
  let message = t(
    "profile.completionHint0",
    "Completa tu información básica para empezar.",
  );

  if (percentage >= 30) {
    message = t(
      "profile.completionHint30",
      "¡Vas bien! Agrega más detalles para destacar.",
    );
  }
  if (percentage >= 50) {
    color = theme.palette.warning.main;
  }
  if (percentage >= 70) {
    message = t(
      "profile.completionHint70",
      "¡Casi listo! Tu perfil se ve genial.",
    );
  }
  if (percentage > 80) {
    color = theme.palette.success.main;
  }
  if (percentage === 100) {
    color = theme.palette.success.dark;
    message = t(
      "profile.completionHint100",
      "¡Excelente! Tu perfil está al máximo nivel 🌟",
    );
  }
  const title =
    percentage === 100
      ? t("profile.complete", "Perfil completo")
      : t("profile.incomplete", "Perfil incompleto");
  const tier =
    percentage === 100 ? "done" : percentage >= 70 ? "high" : percentage >= 30 ? "mid" : "low";
  const isDone = percentage === 100;

  return (
    <Paper
      sx={{
        p: 3,
        position: "relative",
        overflow: "hidden",
        border: (theme) => "1px solid " + theme.palette.divider,
        boxShadow: 1,
        backgroundImage: "none",
      }}
    >
      {/* Resplandor decorativo del tier */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: -70,
          right: -50,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(color, 0.22)} 0%, transparent 70%)`,
          filter: "blur(24px)",
          pointerEvents: "none",
          transition: "background 0.5s ease",
        }}
      />

      <Box
        display="flex"
        alignItems="center"
        mb={1.5}
        justifyContent="space-between"
        sx={{ position: "relative" }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          {/* Insignia trofeo con gradiente + halo al completar + pulso único al 100% */}
          <Box
            sx={{
              position: "relative",
              width: 48,
              height: 48,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              color: "#fff",
              background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.65)} 100%)`,
              boxShadow: `0 4px 16px ${alpha(color, 0.45)}`,
              transition: "background 0.5s ease, box-shadow 0.5s ease",
              animation: pulse ? "rtTrophyPulse 0.7s ease-in-out" : "none",
              "@keyframes rtTrophyPulse": {
                "0%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.25)" },
                "100%": { transform: "scale(1)" },
              },
              "&::after": isDone
                ? {
                    content: '""',
                    position: "absolute",
                    inset: -5,
                    borderRadius: "50%",
                    border: `2px solid ${alpha(color, 0.6)}`,
                    animation: reduceMotion
                      ? "none"
                      : "rtRing 1.8s ease-out infinite",
                  }
                : {},
              "@keyframes rtRing": {
                "0%": { transform: "scale(0.85)", opacity: 0.9 },
                "100%": { transform: "scale(1.25)", opacity: 0 },
              },
              "@media (prefers-reduced-motion: reduce)": {
                "&::after": { animation: "none", display: "none" },
              },
            }}
          >
            <EmojiEvents sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight="700" color="text.primary">
              {title}
            </Typography>
            <Fade in key={tier} timeout={400}>
              <Typography
                variant="caption"
                sx={{ display: "block", fontWeight: 500, color: "text.secondary" }}
              >
                {message}
              </Typography>
            </Fade>
          </Box>
        </Box>
        <Typography
          variant="subtitle1"
          fontWeight="800"
          color={color}
          sx={{ fontVariantNumeric: "tabular-nums", transition: "color 0.5s ease" }}
        >
          {shown}%
        </Typography>
      </Box>

      <Tooltip
        title={
          percentage >= 70 && percentage < 100
            ? t("profile.completionAlmost", "Tu perfil está casi completo")
            : ""
        }
        arrow
        placement="top"
      >
      <LinearProgress
        variant="determinate"
        value={percentage}
        aria-label={t("profile.completionAria", "Progreso de completitud del perfil")}
        sx={{
          height: { xs: 8, md: 12 },
          borderRadius: { xs: 4, md: 6 },
          bgcolor: "grey.800",
          transition: "background-color 0.5s ease, box-shadow 0.25s ease",
          "&:hover": {
            boxShadow: `0 0 14px ${alpha(color, 0.4)}`,
          },
          "&:hover .MuiLinearProgress-bar::after": reduceMotion
            ? {}
            : {
                display: "block",
                animation: "rtShimmer 1.1s linear infinite",
              },
          "& .MuiLinearProgress-bar": {
            borderRadius: { xs: 4, md: 6 },
            transformOrigin: "left",
            bgcolor: color,
            transition:
              "transform 0.55s ease-out, background-color 0.5s ease",
            overflow: "hidden",
            animation:
              isDone && !reduceMotion ? "rtDonePulse 0.7s ease-out 1" : "none",
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 0,
              display: showShimmer ? "block" : "none",
              backgroundImage:
                "repeating-linear-gradient(-55deg, rgba(255,255,255,0.28) 0 8px, transparent 8px 16px)",
              animation: showShimmer
                ? "rtShimmer 1.1s linear infinite"
                : "none",
            },
          },
          "@keyframes rtShimmer": {
            from: { backgroundPosition: "0 0" },
            to: { backgroundPosition: "32px 0" },
          },
          "@keyframes rtDonePulse": {
            "0%": { transform: "scaleY(1)" },
            "40%": { transform: "scaleY(1.25)" },
            "100%": { transform: "scaleY(1)" },
          },
          "@media (prefers-reduced-motion: reduce)": {
            "& .MuiLinearProgress-bar": { transition: "none", animation: "none" },
            "& .MuiLinearProgress-bar::after": { display: "none" },
          },
        }}
      />
      </Tooltip>

      {/* Suggestions Checklist */}
      {suggestions.length > 0 && percentage < 100 && (
        <Box
          mt={2}
          pt={2}
          borderTop={`1px dashed ${alpha(theme.palette.text.secondary, 0.2)}`}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <AutoFixHigh fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight={600} color="primary">
              {t(
                "profile.suggestionsTitle",
                "Sugerencias para completar tu perfil:",
              )}
            </Typography>
          </Box>
          <Box component="ul" sx={{ m: 0, pl: 0, listStyle: "none" }}>
            {suggestions.map((s, idx) => (
              <Fade in key={`${s.sectionId}-${s.messageKey}-${idx}`} timeout={350 + idx * 90}>
                <li style={{ marginBottom: 4 }}>
                  <ButtonBase
                    onClick={() =>
                      onSuggestionClick && onSuggestionClick(s.sectionId)
                    }
                    sx={{
                      width: "100%",
                      justifyContent: "flex-start",
                      textAlign: "left",
                      p: 0.5,
                      borderRadius: 1,
                      transition: "background-color 0.2s ease, transform 0.2s ease",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        "& .arrow-icon": {
                          opacity: 1,
                          transform: "translateX(4px)",
                        },
                      },
                      "&:active": { transform: "scale(0.99)" },
                      "&:focus-visible": {
                        outline: "2px solid",
                        outlineColor: "primary.main",
                        outlineOffset: 1,
                      },
                    }}
                  >
                    <ArrowForward
                      className="arrow-icon"
                      sx={{
                        fontSize: 14,
                        mr: 1,
                        color: "primary.main",
                        opacity: 0.5,
                        transition: "all 0.2s",
                      }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        textDecoration: "underline",
                        textDecorationColor: alpha(
                          theme.palette.text.secondary,
                          0.3,
                        ),
                      }}
                    >
                      {t(`profile.suggestions.${s.messageKey}`, s.message)}
                    </Typography>
                  </ButtonBase>
                </li>
              </Fade>
            ))}
          </Box>
        </Box>
      )}

      {/* Badge de logro: solo la primera vez al 100% */}
      <Snackbar
        open={badgeOpen}
        autoHideDuration={5000}
        onClose={() => setBadgeOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          onClose={() => setBadgeOpen(false)}
          icon={<EmojiEvents sx={{ color: "#FFB300" }} />}
          sx={{ alignItems: "center", fontWeight: 600 }}
        >
          {t(
            "profile.achievementUnlocked",
            "🎉 ¡Logro desbloqueado! Perfil completo.",
          )}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
