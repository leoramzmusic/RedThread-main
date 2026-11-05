import * as React from "react";
import { Box, Chip, Paper, Typography, useTheme } from "@mui/material";
import { ArrowRight, MoreVert } from "@mui/icons-material";

const DEVICE_SPECS: Record<
  string,
  {
    label: string;
    accent: string;
    width: number;
    minHeight: number;
    radius: number;
  }
> = {
  android: {
    label: "Android",
    accent: "#3DDC84",
    width: 340,
    minHeight: 140,
    radius: 24,
  },
  ios: {
    label: "iPhone",
    accent: "#007AFF",
    width: 330,
    minHeight: 150,
    radius: 28,
  },
  tablet: {
    label: "Tablet",
    accent: "#7C3AED",
    width: 420,
    minHeight: 150,
    radius: 24,
  },
  desktop: {
    label: "Desktop",
    accent: "#2563eb",
    width: 380,
    minHeight: 120,
    radius: 10,
  },
};

const CATEGORY_IDENTITY: Record<
  string,
  { label: string; emoji: string; color: string; bg: string }
> = {
  system: { label: "Sistema", emoji: "⚙", color: "#3b82f6", bg: "#eff6ff" },
  match: { label: "Social", emoji: "❤️", color: "#ec4899", bg: "#fdf2f8" },
  like: { label: "Social", emoji: "❤️", color: "#ec4899", bg: "#fdf2f8" },
  message: { label: "Mensajes", emoji: "💬", color: "#2563eb", bg: "#eff6ff" },
  survey: { label: "CARE", emoji: "📋", color: "#f59e0b", bg: "#fffbeb" },
  reminder: { label: "Perfil", emoji: "👤", color: "#a855f7", bg: "#faf5ff" },
  promo: { label: "Premium", emoji: "★", color: "#10b981", bg: "#ecfdf5" },
  security: { label: "Seguridad", emoji: "🛡", color: "#ef4444", bg: "#fef2f2" },
};

interface PushFrameProps {
  device: string;
  title: string;
  body: string;
  icon: string;
  actionUrl?: string | null;
  category: string;
  priority: string;
  theme: "light" | "dark";
  animate?: boolean;
  animationClass?: string;
}

function PushFrame({
  device,
  title,
  body,
  icon,
  actionUrl,
  category,
  priority,
  theme,
  animate = false,
  animationClass,
}: PushFrameProps) {
  const spec = DEVICE_SPECS[device] ?? DEVICE_SPECS.android;
  const ident = CATEGORY_IDENTITY[category] ?? CATEGORY_IDENTITY.system;
  const isDark = theme === "dark";
  const desktop = device === "desktop";

  const cardBg = isDark ? (desktop ? "#202124" : "#0b0b0b") : "#ffffff";
  const text = isDark ? "#f9fafb" : "#111827";
  const sub = isDark ? "#9ca3af" : "#6b7280";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";

  const accentColor = ident.color;

  if (desktop) {
    return (
      <Paper
        className={animate ? animationClass : undefined}
        elevation={0}
        sx={{
          bgcolor: cardBg,
          color: text,
          border: `1px solid ${border}`,
          borderRadius: 0,
          width: spec.width,
          minHeight: spec.minHeight,
          flexShrink: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: isDark
            ? "0 12px 32px rgba(0,0,0,0.35)"
            : "0 6px 20px rgba(0,0,0,0.08)",
        }}
      >
        {/* Windows header: RETH • ⋯ × */}
        <Box
          sx={{
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${border}`,
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: 0,
                bgcolor: accentColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 10 }}>{ident.emoji}</span>
            </Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                fontSize: "0.75rem",
                color: text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              RETH
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <MoreVert
              fontSize="small"
              sx={{ color: sub, cursor: "pointer", mr: 0.5 }}
            />
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: 0,
                cursor: "pointer",
                color: sub,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8,
              }}
            >
              ×
            </Box>
          </Box>
        </Box>

        {/* Contenido de la notificación */}
        <Box
          sx={{
            p: 1.5,
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            borderBottom: `1px solid ${border}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 0,
                bgcolor: ident.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 14 }}>{ident.emoji}</span>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  lineHeight: 1.25,
                  color: text,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.8125rem",
                  lineHeight: 1.4,
                  color: sub,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  mt: 0.25,
                  minWidth: 0,
                }}
              >
                {body}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: "auto", mb: 0 }}>
            <Typography
              variant="caption"
              sx={{ color: sub, fontSize: "0.6875rem" }}
            >
              hace 1 min
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  }

  // Mobile / Tablet: tarjeta con área de sistema operativo
  return (
    <Paper
      className={animate ? animationClass : undefined}
      elevation={0}
      sx={{
        bgcolor: cardBg,
        color: text,
        border: `1px solid ${border}`,
        borderRadius: 0,
        width: spec.width,
        minHeight: spec.minHeight,
        flexShrink: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: isDark
          ? "0 12px 32px rgba(0,0,0,0.35)"
          : "0 6px 20px rgba(0,0,0,0.08)",
      }}
    >
      {/* Área de sistema operativo (barra de estado / lock screen) */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 1,
            py: 0.75,
            bgcolor: isDark ? "#1f2937" : "#f3f4f6",
          }}
        >
          <Box
            sx={{
              width: 4,
              height: 4,
              borderRadius: 0,
              bgcolor: sub,
              opacity: 0.4,
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: sub, fontSize: "0.625rem" }}
          >
            12:00
          </Typography>
          <Box
            sx={{
              width: 4,
              height: 4,
              borderRadius: 0,
              bgcolor: sub,
              opacity: 0.4,
            }}
          />
        </Box>
      </Box>

      {/* Notificación */}
      <Box
        sx={{
          bgcolor: cardBg,
          color: text,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 2,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 0,
              bgcolor: ident.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 20 }}>{ident.emoji}</span>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                fontSize: "0.9375rem",
                lineHeight: 1.25,
                color: text,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              RETH
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: sub, fontSize: "0.6875rem", mt: 0.25 }}
            >
              RedThread · Ahora
            </Typography>
          </Box>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: 0,
              bgcolor: accentColor,
              flexShrink: 0,
            }}
          />
        </Box>

        <Box
          sx={{
            p: 2.5,
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 0,
                bgcolor: ident.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 24 }}>{ident.emoji}</span>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  lineHeight: 1.35,
                  color: text,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  minWidth: 0,
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.8125rem",
                  lineHeight: 1.45,
                  color: sub,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  mt: 0.5,
                  minWidth: 0,
                }}
              >
                {body}
              </Typography>
            </Box>
          </Box>
          {priority === "P1" && (
            <Chip
              label="Action"
              size="small"
              variant="outlined"
              sx={{
                color: "#ef4444",
                borderColor: "#ef444440",
                fontWeight: 700,
                fontSize: "0.68rem",
                alignSelf: "flex-start",
                mt: 0.5,
                flexShrink: 0,
              }}
            />
          )}
          {actionUrl && (
            <Chip
              label="Abrir"
              icon={<ArrowRight fontSize="inherit" sx={{ ml: 0.5 }} />}
              size="small"
              variant="outlined"
              sx={{
                color: ident.color,
                borderColor: `${ident.color}40`,
                fontWeight: 700,
                fontSize: "0.68rem",
                alignSelf: "flex-start",
                mt: 0.5,
                flexShrink: 0,
              }}
            />
          )}
          <Box sx={{ mt: "auto", mb: 0 }}>
            <Typography
              variant="caption"
              sx={{ color: sub, fontSize: "0.6875rem" }}
            >
              hace 1 min
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

function osBg(isDark: boolean) {
  return isDark ? "#1f2937" : "#f3f4f6";
}

interface PushPreviewProps {
  device: string;
  title: string;
  body: string;
  icon: string;
  category: string;
  priority: string;
  actionUrl?: string | null;
  theme: "light" | "dark";
  animate?: boolean;
  animationClass?: string;
}

export default function PushPreview({
  device,
  title,
  body,
  icon,
  category,
  priority,
  actionUrl,
  theme,
  animate = false,
  animationClass,
}: PushPreviewProps) {
  const isDesktop = device === "desktop";
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        width: "100%",
        minHeight: 0,
        justifyContent: isDesktop ? "flex-end" : "center",
        alignItems: isDesktop ? "flex-end" : "center",
      }}
    >
      <PushFrame
        animationClass={animate ? animationClass : undefined}
        device={device}
        title={title}
        body={body}
        icon={icon}
        category={category}
        priority={priority}
        actionUrl={actionUrl}
        theme={theme}
        animate={animate}
      />
    </Box>
  );
}
