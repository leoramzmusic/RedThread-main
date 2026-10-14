import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTranslation } from "next-i18next/pages";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import EmailIcon from "@mui/icons-material/Email";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RefreshIcon from "@mui/icons-material/Refresh";
import { gsap, useGSAP } from "../../../lib/gsap";
import { useUI } from "../../../context/UIContext";

export type VerificationChannel = "phone" | "email";

interface VerificationCodeDialogProps {
  open: boolean;
  channel: VerificationChannel;
  target: string;
  error?: string | null;
  onClose: () => void;
  onConfirm: (code: string) => Promise<boolean>;
  onResend: () => Promise<void>;
  onDismissError?: () => void;
}

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

const emptyDigits = (): string[] => Array(OTP_LENGTH).fill("");

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function VerificationCodeDialog({
  open,
  channel,
  target,
  error,
  onClose,
  onConfirm,
  onResend,
  onDismissError,
}: VerificationCodeDialogProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDark = theme.palette.mode === "dark";
  const { drawerWidth } = useUI();
  const [digits, setDigits] = useState<string[]>(emptyDigits);
  const [submitting, setSubmitting] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const submittingRef = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">(
    "idle",
  );

  const code = digits.join("");
  const allFilled = digits.every((d) => d !== "");

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDigits(emptyDigits());
      setSubmitting(false);
      setStatus("idle");
      setResendLoading(false);
      setResendIn(RESEND_SECONDS);
    }
  }

  useEffect(() => {
    if (!open) return;
    timerRef.current = setInterval(() => {
      setResendIn((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    },
    [],
  );

  const cardsOf = (): HTMLElement[] => {
    if (!deckRef.current) return [];
    return Array.from(
      deckRef.current.querySelectorAll<HTMLElement>("[data-otp-card]"),
    );
  };

  const focusSlot = (index: number) => {
    const el = inputsRef.current[index];
    if (!el) return;
    el.focus();
    el.select?.();
  };

  const animateEnter = () => {
    if (prefersReducedMotion()) return;
    const cards = cardsOf();
    if (!cards.length) return;
    const mid = (cards.length - 1) / 2;
    gsap.from(cards, {
      transformOrigin: "50% 200%",
      y: -90,
      rotation: (i: number) => (i - mid) * 8,
      scale: 0.8,
      autoAlpha: 0,
      duration: 0.55,
      stagger: 0.06,
      ease: "back.out(1.4)",
      onComplete: () => gsap.set(cards, { clearProps: "transform,transformOrigin" }),
    });
  };

  const animateType = (index: number) => {
    const el = inputsRef.current[index];
    if (!el || prefersReducedMotion()) return;
    gsap.fromTo(
      el,
      { rotationY: -15 },
      {
        rotationY: 0,
        duration: 0.28,
        ease: "back.out(2)",
        onComplete: () => gsap.set(el, { clearProps: "transform" }),
      },
    );
    gsap.fromTo(
      el,
      { boxShadow: `0 0 0 0 ${theme.palette.primary.main}00` },
      {
        boxShadow: `0 0 0 5px ${theme.palette.primary.main}55`,
        duration: 0.2,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        onComplete: () => gsap.set(el, { clearProps: "boxShadow" }),
      },
    );
  };

  const animateComplete = () => {
    if (prefersReducedMotion()) return;
    const cards = cardsOf();
    if (!cards.length) return;
    const rects = cards.map((c) => c.getBoundingClientRect());
    const centerX =
      (rects[0].left + rects[rects.length - 1].right) / 2;
    const tl = gsap.timeline();
    tl.to(cards, {
      scale: 0.92,
      duration: 0.12,
      stagger: 0.03,
      ease: "power2.in",
    }).to(
      cards,
      {
        x: (i: number) => centerX - (rects[i].left + rects[i].width / 2),
        duration: 0.26,
        ease: "power3.inOut",
        stagger: 0.02,
      },
      ">-0.05",
    );
  };

  useGSAP(
    () => {
      if (open) animateEnter();
    },
    { scope: deckRef, dependencies: [open] },
  );

  useEffect(() => {
    if (status !== "success" && status !== "error") return;
    const cards = cardsOf();
    const icon = resultRef.current;
    const retryBtn = retryRef.current;
    if (prefersReducedMotion()) {
      gsap.set(cards, { autoAlpha: 0 });
      if (icon) gsap.set(icon, { autoAlpha: 1 });
      if (retryBtn) gsap.set(retryBtn, { autoAlpha: 1 });
      return;
    }
    if (status === "success") {
      gsap.to(cards, {
        x: 0,
        autoAlpha: 0,
        duration: 0.3,
        ease: "power2.inOut",
      });
    } else {
      gsap.to(cards, { autoAlpha: 0, duration: 0.2, ease: "power1.out" });
    }
    if (icon) {
      gsap.fromTo(
        icon,
        { autoAlpha: 0, scale: 0.5 },
        { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(2)" },
      );
      if (status === "error") {
        gsap.fromTo(
          icon,
          { x: 0 },
          {
            keyframes: { x: [0, -10, 10, -6, 6, 0] },
            duration: 0.5,
            ease: "power1.inOut",
            delay: 0.15,
          },
        );
      }
    }
    if (status === "error" && retryBtn) {
      gsap.fromTo(
        retryBtn,
        { autoAlpha: 0, scale: 0.4, rotation: -180 },
        {
          autoAlpha: 1,
          scale: 1,
          rotation: 0,
          duration: 0.5,
          ease: "back.out(2)",
          delay: 0.2,
        },
      );
    }
  }, [status]);

  const submit = async (value: string) => {
    if (submittingRef.current || value.length !== OTP_LENGTH) return;
    submittingRef.current = true;
    setSubmitting(true);
    setStatus("pending");
    animateComplete();
    let ok = false;
    try {
      ok = await onConfirm(value);
    } catch {
      ok = false;
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    if (ok) {
      setStatus("success");
      resultTimerRef.current = setTimeout(() => onClose(), 900);
    } else {
      setStatus("error");
    }
  };

  const retry = () => {
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    onDismissError?.();
    setDigits(emptyDigits());
    setStatus("idle");
    gsap.set(cardsOf(), { autoAlpha: 1, clearProps: "transform" });
    window.setTimeout(() => focusSlot(0), 0);
  };

  const handleSlotChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit) {
      animateType(index);
      if (index < OTP_LENGTH - 1) focusSlot(index + 1);
    }
    if (next.every((d) => d !== "")) submit(next.join(""));
  };

  const handleSlotKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[index]) {
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        next[index - 1] = "";
        setDigits(next);
        focusSlot(index - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusSlot(index - 1);
      return;
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      focusSlot(index + 1);
      return;
    }
    if (e.key === "Enter" && code.length === OTP_LENGTH) {
      submit(code);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!text) return;
    e.preventDefault();
    const next = emptyDigits().map((_, i) => text[i] ?? "");
    setDigits(next);
    focusSlot(Math.min(text.length, OTP_LENGTH) - 1);
    if (next.every((d) => d !== "")) submit(next.join(""));
  };

  const handleConfirm = () => {
    if (code.length < OTP_LENGTH || submitting) return;
    submit(code);
  };

  const handleResend = async () => {
    if (resendLoading || resendIn > 0) return;
    setResendLoading(true);
    try {
      await onResend();
      setResendIn(RESEND_SECONDS);
    } catch {
      // Parent surfaces the error through the `error` prop.
    } finally {
      setResendLoading(false);
    }
  };

  const codeLabel = t(
    "profile.sections.identity.verification.codeLabel",
    "Código de verificación",
  );

  let liveMessage = "";
  if (status === "success") {
    liveMessage = t(
      "profile.sections.identity.verification.codeValid",
      "Confirmado",
    );
  } else if (status === "error") {
    liveMessage = t(
      "profile.sections.identity.verification.codeError",
      "Error, reintenta",
    );
  }

  const slotBorderColor = (index: number): string => {
    if (status === "error") return theme.palette.error.main;
    if (allFilled) return theme.palette.success.main;
    if (digits[index]) return theme.palette.primary.main;
    return theme.palette.warning.main;
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullScreen={isMobile}
      maxWidth="xs"
      fullWidth
      aria-labelledby="verification-code-title"
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            bgcolor: "rgba(0,0,0,0.55)",
          },
        },
        paper: {
          sx: {
            borderRadius: "12px",
            bgcolor: isDark ? "#232428" : "background.paper",
            color: isDark ? "#E0E0E0" : "text.primary",
            backgroundImage: "none",
            boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
            ...(isMobile ? {} : { m: 2, width: "calc(100% - 32px)" }),
          },
        },
      }}
      sx={{
        "& .MuiDialog-container": {
          pl: { xs: 0, md: `${drawerWidth}px` },
        },
      }}
    >
      <DialogTitle
        id="verification-code-title"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          fontWeight: 700,
        }}
      >
        {channel === "phone" ? (
          <PhoneIphoneIcon color="primary" />
        ) : (
          <EmailIcon color="primary" />
        )}
        {t(`profile.sections.identity.verification.${channel === "phone" ? "verifyPhoneTitle" : "verifyEmailTitle"}`)}
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2.5, sm: 3 } }}>
        <DialogContentText sx={{ mb: 2 }}>
          {t("profile.sections.identity.verification.codeBody", { target })}
        </DialogContentText>
        {error && status !== "error" && status !== "success" && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ position: "relative", my: 2 }}>
          <Stack
            ref={deckRef}
            role="group"
            aria-label={codeLabel}
            direction="row"
            spacing={{ xs: 1, sm: 1.5 }}
            useFlexGap
            sx={{
              justifyContent: "center",
              perspective: 600,
            }}
          >
            {digits.map((digit, i) => (
              <Box
                key={i}
                sx={{
                  display: "inline-flex",
                  borderRadius: "12px",
                  willChange: "transform",
                  transition: "transform .2s ease, box-shadow .2s ease",
                  "&:hover": { transform: "translateY(-2px)" },
                  "&:focus-within": {
                    transform: "translateY(-2px)",
                    boxShadow: `0 0 8px ${theme.palette.primary.main}99`,
                  },
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                    "&:hover": { transform: "none" },
                    "&:focus-within": {
                      transform: "none",
                      boxShadow: `0 0 0 3px ${theme.palette.primary.main}40`,
                    },
                  },
                }}
              >
                <Box
                  component="input"
                  data-otp-card
                  ref={(el: HTMLInputElement | null) => {
                    inputsRef.current[i] = el;
                  }}
                  value={digit}
                  onChange={(e) => handleSlotChange(i, e.target.value)}
                  onKeyDown={(e) => handleSlotKeyDown(i, e)}
                  onPaste={handlePaste}
                  onFocus={(e) => e.target.select?.()}
                  disabled={submitting || status === "success" || status === "error"}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={1}
                  aria-label={t(
                    "profile.sections.identity.verification.digitLabel",
                    { n: i + 1, total: OTP_LENGTH },
                  )}
                  sx={{
                    width: { xs: 48, sm: 56 },
                    height: { xs: 64, sm: 72 },
                    textAlign: "center",
                    fontSize: { xs: "2rem", sm: "2.25rem" },
                    fontWeight: 700,
                    color: "text.primary",
                    bgcolor: "background.paper",
                    border: "2px solid",
                    borderColor: slotBorderColor(i),
                    borderRadius: "12px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    outline: "none",
                    p: 0,
                    caretColor: theme.palette.primary.main,
                    transition:
                      "border-color .2s ease, background-color .2s ease",
                    willChange: "transform",
                    "&:disabled": {
                      opacity: 0.6,
                      bgcolor: "action.disabledBackground",
                    },
                  }}
                />
              </Box>
            ))}
          </Stack>
          {(status === "success" || status === "error") && (
            <Box
              ref={resultRef}
              aria-hidden="true"
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                opacity: 0,
              }}
            >
              {status === "success" ? (
                <CheckCircleIcon sx={{ fontSize: 64, color: "success.main" }} />
              ) : (
                <CancelIcon sx={{ fontSize: 64, color: "error.main" }} />
              )}
            </Box>
          )}
        </Box>
        <Box
          aria-live="polite"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1,
            height: 1,
            m: -1,
            p: 0,
            border: 0,
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
            whiteSpace: "nowrap",
          }}
        >
          {liveMessage}
        </Box>
        {channel === "email" && (
          <DialogContentText variant="body2" sx={{ mt: 1.5, color: "text.secondary" }}>
            {t("profile.sections.identity.verification.linkHint", { target })}
          </DialogContentText>
        )}
        <Button
          onClick={handleResend}
          disabled={resendIn > 0 || resendLoading}
          sx={{ mt: 1.5, textTransform: "none" }}
        >
          {resendLoading ? (
            <CircularProgress size={16} sx={{ mr: 1 }} />
          ) : resendIn > 0 ? (
            t("profile.sections.identity.verification.resendIn", { seconds: resendIn })
          ) : (
            t("profile.sections.identity.verification.resend")
          )}
        </Button>
      </DialogContent>
      <DialogActions
        sx={{
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: 1,
          px: { xs: 2.5, sm: 3 },
          pb: 3,
        }}
      >
        <Button
          onClick={onClose}
          disabled={submitting}
          color="inherit"
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          {t("profile.sections.identity.verification.cancel")}
        </Button>
        {status === "error" ? (
          <IconButton
            ref={retryRef}
            onClick={retry}
            aria-label={t(
              "profile.sections.identity.verification.retry",
              "Reintentar código",
            )}
            sx={{
              alignSelf: "center",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            <RefreshIcon />
          </IconButton>
        ) : (
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            disabled={!allFilled || submitting || status === "success"}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {submitting ? (
              <CircularProgress size={22} />
            ) : (
              t("profile.sections.identity.verification.confirmCode")
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
