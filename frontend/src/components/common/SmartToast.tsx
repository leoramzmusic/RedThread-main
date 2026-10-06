import React, { forwardRef } from "react";
import {
  Snackbar,
  Box,
  Typography,
  IconButton,
  Slide,
  useMediaQuery,
  type SnackbarOrigin,
} from "@mui/material";
import type { SlideProps } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useTranslation } from "next-i18next";

export type SmartToastSeverity = "success" | "info" | "warning" | "error";

interface SmartToastProps {
  open: boolean;
  onClose: () => void;
  severity?: SmartToastSeverity;
  title: string;
  message?: string;
  /** Custom icon (e.g. ✨ for Smart Photos). Defaults to a semantic icon. */
  icon?: React.ReactNode;
  autoHideDuration?: number;
}

const SlideLeft = forwardRef<unknown, SlideProps>(function SlideLeft(
  props,
  ref,
) {
  return <Slide {...props} direction="left" ref={ref} />;
});

const SEVERITY_STYLE: Record<
  SmartToastSeverity,
  { tint: string; border: string; iconBg: string; iconColor: string }
> = {
  success: {
    tint: "rgba(46, 125, 50, 0.14)",
    border: "rgba(102, 187, 106, 0.35)",
    iconBg: "#2E7D32",
    iconColor: "#fff",
  },
  info: {
    tint: "rgba(25, 118, 210, 0.12)",
    border: "rgba(100, 181, 246, 0.35)",
    iconBg: "#1976D2",
    iconColor: "#fff",
  },
  warning: {
    tint: "rgba(237, 108, 2, 0.12)",
    border: "rgba(255, 167, 38, 0.4)",
    iconBg: "#ED6C02",
    iconColor: "#fff",
  },
  error: {
    tint: "rgba(211, 47, 47, 0.12)",
    border: "rgba(229, 115, 115, 0.4)",
    iconBg: "#D32F2F",
    iconColor: "#fff",
  },
};

const DEFAULT_ICON: Record<SmartToastSeverity, React.ReactNode> = {
  success: <CheckCircleIcon sx={{ fontSize: 20 }} />,
  info: <InfoIcon sx={{ fontSize: 20 }} />,
  warning: <WarningAmberIcon sx={{ fontSize: 20 }} />,
  error: <ErrorOutlineIcon sx={{ fontSize: 20 }} />,
};

type ToastCardProps = Omit<SmartToastProps, "open" | "autoHideDuration"> & {
  onClose: () => void;
};

const ToastCard = forwardRef<HTMLDivElement, ToastCardProps>(function ToastCard(
  { severity, title, message, icon, onClose },
  ref,
) {
  const { t } = useTranslation("common");
  const style = SEVERITY_STYLE[severity ?? "info"];
  return (
    <Box
      ref={ref}
      role="status"
      aria-atomic="true"
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        maxWidth: 360,
        p: 1.75,
        borderRadius: "16px",
        bgcolor: style.tint,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid",
        borderColor: style.border,
        boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: "50%",
          bgcolor: style.iconBg,
          color: style.iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon ?? DEFAULT_ICON[severity ?? "info"]}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={700} lineHeight={1.3}>
          {title}
        </Typography>
        {message ? (
          <Typography
            variant="body2"
            color="text.secondary"
            lineHeight={1.4}
            sx={{
              mt: 0.25,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {message}
          </Typography>
        ) : null}
      </Box>
      <IconButton
        size="small"
        onClick={onClose}
        aria-label={t("closeNotification", "Cerrar notificación")}
        sx={{ color: "text.secondary", mt: -0.5, mr: -0.5 }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
});

/**
 * Contextual floating toast.
 * Portrait (phones, vertical tablets) → top-right, like a mobile push.
 * Landscape (horizontal tablets, desktop) → bottom-right, like desktop.
 * Slide-in animation, auto-dismiss with manual close.
 */
export default function SmartToast({
  open,
  onClose,
  severity = "info",
  title,
  message,
  icon,
  autoHideDuration = 6000,
}: SmartToastProps) {
  const isPortrait = useMediaQuery("(orientation: portrait)");
  const anchorOrigin: SnackbarOrigin = isPortrait
    ? { vertical: "top", horizontal: "right" }
    : { vertical: "bottom", horizontal: "right" };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={(_, reason) => {
        if (reason !== "clickaway") onClose();
      }}
      anchorOrigin={anchorOrigin}
      TransitionComponent={SlideLeft}
      transitionDuration={300}
      sx={isPortrait ? { mt: 8 } : { mb: 2 }}
    >
      <ToastCard
        severity={severity}
        title={title}
        message={message}
        icon={icon}
        onClose={onClose}
      />
    </Snackbar>
  );
}
