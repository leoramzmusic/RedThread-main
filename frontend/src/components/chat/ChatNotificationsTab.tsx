import React, { useEffect } from "react";
import { List, Box, Typography } from "@mui/material";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationItem from "../notifications/NotificationItem";

interface ChatNotificationsTabProps {
  onUnreadCountChange?: (count: number) => void;
}

export default function ChatNotificationsTab({
  onUnreadCountChange,
}: ChatNotificationsTabProps) {
  const { items, loading, unreadCount, markRead } = useNotifications("all");

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  if (!loading && items.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography sx={{ color: "text.secondary" }}>
          No tienes notificaciones nuevas
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ flexGrow: 1, overflowY: "auto", p: 0 }}>
      {items.map((notif) => (
        <NotificationItem
          key={notif.id}
          notification={notif}
          onRead={markRead}
        />
      ))}
    </List>
  );
}
