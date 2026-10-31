import React from "react";
import { Badge, Tooltip, IconButton } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";

interface NotificationBadgeProps {
  count?: number;
  onClick?: () => void;
  showZero?: boolean;
}

export default function NotificationBadge({
  count = 0,
  onClick,
  showZero = false,
}: NotificationBadgeProps) {
  const hasNotifications = count > 0;
  const shouldRender = hasNotifications || showZero;

  if (!shouldRender) {
    return null;
  }

  return (
    <Tooltip
      title={`Tienes ${count} notificación${count !== 1 ? "es" : ""} no leída${count !== 1 ? "s" : ""}`}
    >
      <IconButton
        size="large"
        onClick={onClick}
        sx={{
          position: "relative",
          color: "primary.main",
          "&:hover": { bgcolor: "action.hover", borderRadius: "50%" },
        }}
      >
        <NotificationsIcon />
        <Badge
          badgeContent={count > 99 ? "99+" : count}
          color="error"
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{
            top: -4,
            right: -4,
            "& .MuiBadge-badge": {
              bgcolor: "error.main",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.7rem",
              border: "2px solid",
              borderColor: "background.paper",
            },
          }}
          invisible={count === 0 && !showZero}
        />
      </IconButton>
    </Tooltip>
  );
}
