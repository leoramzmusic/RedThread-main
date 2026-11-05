import { Box, Typography } from "@mui/material";
import NotificationItem from "../NotificationItem";
import { buildPreviewNotification } from "./templateMeta";

interface PanelPreviewProps {
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

export default function PanelPreview({
  title,
  body,
  icon,
  category,
  priority,
  actionUrl,
  theme,
  animate = false,
  animationClass,
}: PanelPreviewProps) {
  const notification = buildPreviewNotification({
    title,
    body,
    icon,
    category,
    priority,
    action_url: actionUrl,
  });

  return (
    <Box
      className={animate ? animationClass : undefined}
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minHeight: 0,
        borderRadius: 6,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Header del panel real de RETH */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          bgcolor: "background.default",
        }}
      >
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: "text.primary" }}
        >
          Notifications
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontSize: "0.6875rem" }}
          >
            1 notificación
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          position: "relative",
          p: 0.5,
        }}
      >
        <NotificationItem
          notification={notification}
          density="standard"
          variant="inbox"
          onRead={() => undefined}
        />
      </Box>
    </Box>
  );
}
