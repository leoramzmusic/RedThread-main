import React, { useEffect } from "react";
import { List, Box, Typography } from "@mui/material";
import { useTranslation } from "next-i18next/pages";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationItem from "../notifications/NotificationItem";

interface ChatNotificationsTabProps {
  onUnreadCountChange?: (count: number) => void;
}

export default function ChatNotificationsTab({
  onUnreadCountChange,
}: ChatNotificationsTabProps) {
  const { t } = useTranslation("common");
  const { items, loading, unreadCount, markRead } = useNotifications("all");

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  if (!loading && items.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography sx={{ color: "text.secondary" }}>
          {t("notifications.empty.all")}
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
