import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  IconButton,
  Button,
  Divider,
  Badge,
} from "@mui/material";
import {
  Assignment as SurveyIcon,
  Close as CloseIcon,
  DoneAll as MarkReadIcon,
  NotificationsOff as EmptyIcon,
} from "@mui/icons-material";
import apiClient from "../../services/api";
import NotificationItem from "./NotificationItem";

interface NotificationPanelProps {
  onClose: () => void;
  onUpdateUnreadCount: (count: number) => void;
  surveyPendingCount: number;
  onOpenSurvey: () => void;
}

export default function NotificationPanel({
  onClose,
  onUpdateUnreadCount,
  surveyPendingCount,
  onOpenSurvey,
}: NotificationPanelProps) {
  const [tab, setTab] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Map tabs to types: 0=All, 1=Matches, 2=Requests, 3=System
      let type = null;
      if (tab === 1) type = "match";
      if (tab === 2) type = "request"; // or 'friend_request'
      if (tab === 3) type = "system";

      const params = type ? { type } : {};
      const response = await apiClient.get("/notifications", { params });
      setNotifications(response.data);

      // Update unread count (global)
      const unreadResponse = await apiClient.get("/notifications/unread-count");
      onUpdateUnreadCount(unreadResponse.data.count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [tab]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.post(`/notifications/${id}/read`);
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      // Update count
      const unreadResponse = await apiClient.get("/notifications/unread-count");
      onUpdateUnreadCount(unreadResponse.data.count);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      onUpdateUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const showSurvey = surveyPendingCount > 0 && (tab === 0 || tab === 3);
  const hasContent = showSurvey || notifications.length > 0;

  return (
    <Box
      sx={{
        width: 380,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
          }}
        >
          Notificaciones
        </Typography>
        <Box>
          <IconButton
            onClick={handleMarkAllRead}
            title="Marcar todo como leído"
            size="small"
            sx={{ mr: 1 }}
          >
            <MarkReadIcon />
          </IconButton>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Tab label="Todo" />
        <Tab label="Matches" />
        <Tab label="Solicitudes" />
        <Tab label="Sistema" />
      </Tabs>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress size={30} />
          </Box>
        ) : hasContent ? (
          <List disablePadding>
            {showSurvey && (
              <ListItemButton
                data-testid="notification-survey-item"
                onClick={onOpenSurvey}
                sx={{
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  bgcolor: "action.hover",
                }}
              >
                <ListItemIcon>
                  <SurveyIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Encuesta pendiente"
                  secondary={
                    surveyPendingCount === 1
                      ? "Te falta 1 pregunta para completar tus preferencias."
                      : `Te faltan ${surveyPendingCount} preguntas para completar tus preferencias.`
                  }
                />
              </ListItemButton>
            )}
            {notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onRead={handleMarkAsRead}
              />
            ))}
          </List>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              p: 4,
              opacity: 0.6,
            }}
          >
            <EmptyIcon sx={{ fontSize: 60, mb: 2, color: "text.secondary" }} />
            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
              }}
            >
              No tienes notificaciones
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
