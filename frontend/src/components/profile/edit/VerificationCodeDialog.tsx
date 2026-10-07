import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useTranslation } from "next-i18next";

export type VerificationChannel = "phone" | "email";

interface VerificationCodeDialogProps {
  open: boolean;
  channel: VerificationChannel;
  target: string;
  error?: string | null;
  onClose: () => void;
  onConfirm: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
}

const RESEND_SECONDS = 60;

export default function VerificationCodeDialog({
  open,
  channel,
  target,
  error,
  onClose,
  onConfirm,
  onResend,
}: VerificationCodeDialogProps) {
  const { t } = useTranslation("common");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setCode("");
      setSubmitting(false);
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

  const handleConfirm = async () => {
    if (code.length < 6 || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(code);
    } finally {
      setSubmitting(false);
    }
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

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {t(`profile.sections.identity.verification.${channel === "phone" ? "verifyPhoneTitle" : "verifyEmailTitle"}`)}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {t("profile.sections.identity.verification.codeBody", { target })}
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          fullWidth
          label={t("profile.sections.identity.verification.codeLabel")}
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").substring(0, 6))
          }
          placeholder="000000"
          inputProps={{ style: { textAlign: "center", letterSpacing: "8px", fontSize: "1.5rem" } }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
          }}
        />
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
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {t("profile.sections.identity.verification.cancel")}
        </Button>
        <Button
          onClick={handleConfirm}
          color="primary"
          disabled={code.length < 6 || submitting}
        >
          {submitting ? (
            <CircularProgress size={22} />
          ) : (
            t("profile.sections.identity.verification.confirmCode")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}