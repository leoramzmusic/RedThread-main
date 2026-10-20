import React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import {
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import {
  Favorite as LikeIcon,
  Visibility as ViewIcon,
  PersonAdd as MatchIcon,
  EmojiEvents as RewardIcon,
  Info as SystemIcon,
  Chat as MessageIcon,
  Circle as UnreadIcon,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import { dateFnsLocale } from "../../utils/dateLocale";
import type { AppNotification } from "../../hooks/useNotifications";

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (id: string) => void;
  onNavigate?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const resolveUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  return `${API_URL}${url}`;
};

export default function NotificationItem({
  notification,
  onRead,
  onNavigate,
}: NotificationItemProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation("common");
  const metadata = notification.metadata || {};
  const name =
    notification.user?.name ??
    notification.actors?.[0]?.name ??
    t("notifications.actor.fallback");
  const mediaThumb =
    metadata.shown_media_thumbnail_url || metadata.shown_media_url;
  const initial = name ? name.trim().charAt(0).toUpperCase() : undefined;

  const getIcon = (type: string) => {
    switch (type) {
      case "like":
        return <LikeIcon sx={{ color: "#FF4081", fontSize: 16 }} />;
      case "view":
        return <ViewIcon sx={{ color: "#4CAF50", fontSize: 16 }} />;
      case "match":
        return <MatchIcon sx={{ color: "#E91E63", fontSize: 16 }} />;
      case "reward":
        return <RewardIcon sx={{ color: "#FFD700", fontSize: 16 }} />;
      case "message":
        return <MessageIcon sx={{ color: "#2196F3", fontSize: 16 }} />;
      default:
        return <SystemIcon sx={{ color: "#9E9E9E", fontSize: 16 }} />;
    }
  };

  const getTitle = () => {
    switch (notification.type) {
      case "like":
        return metadata.superlike
          ? t("notifications.like.superlike", { name })
          : t("notifications.like.single", { name });
      case "match":
        return t("notifications.match.single", { name });
      case "message":
        return metadata.preview || t("notifications.message.single", { name });
      default:
        return notification.content || t("notifications.system.fallback");
    }
  };

  const handleClick = () => {
    if (!notification.is_read) {
      void onRead(notification.id);
    }
    onNavigate?.();

    switch (notification.type) {
      case "like":
        router.push("/likes");
        return;
      case "match": {
        if (notification.target_type === "chat" && notification.target_id) {
          router.push(`/chat?conversation=${notification.target_id}`);
          return;
        }
        if (notification.target_type === "profile") {
          const nickname =
            notification.user?.nickname ?? notification.actors?.[0]?.nickname;
          if (nickname) {
            router.push(`/profile/${nickname}`);
            return;
          }
        }
        router.push("/likes");
        return;
      }
      case "message":
        if (notification.target_id) {
          router.push(`/chat?conversation=${notification.target_id}`);
        }
        return;
      default: {
        const url = notification.target_id || metadata.target_url;
        if (!url) return;
        if (url.startsWith("/")) {
          router.push(url);
        } else {
          window.location.assign(url);
        }
      }
    }
  };

  return (
    <ListItem
      alignItems="flex-start"
      data-testid={`notification-item-${notification.id}`}
      sx={{
        bgcolor: notification.is_read ? "transparent" : "action.hover",
        borderBottom: "1px solid",
        borderColor: "divider",
        cursor: "pointer",
        transition: "background-color 0.2s",
        "&:hover": {
          bgcolor: "action.selected",
        },
      }}
      onClick={handleClick}
    >
      <ListItemAvatar sx={{ minWidth: 64 }}>
        <Box sx={{ position: "relative", width: 56, height: 56 }}>
          {mediaThumb ? (
            <Box
              component="img"
              src={resolveUrl(mediaThumb)}
              alt=""
              sx={{
                width: 56,
                height: 56,
                borderRadius: "8px",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <Avatar
              alt={name}
              src={resolveUrl(notification.user?.photo)}
              sx={{ width: 56, height: 56 }}
            >
              {initial}
            </Avatar>
          )}
          {mediaThumb && notification.user?.photo && (
            <Avatar
              alt={name}
              src={resolveUrl(notification.user.photo)}
              sx={{
                position: "absolute",
                left: "-4px",
                bottom: "-4px",
                width: 24,
                height: 24,
                border: "2px solid",
                borderColor: "background.paper",
              }}
            />
          )}
          <Box
            sx={{
              position: "absolute",
              bottom: "-2px",
              right: "-2px",
              bgcolor: "background.paper",
              borderRadius: "50%",
              p: 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: 1,
            }}
          >
            {getIcon(notification.type)}
          </Box>
        </Box>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography
            variant="subtitle2"
            component="span"
            sx={{
              fontWeight: notification.is_read ? 400 : 600,
            }}
          >
            {getTitle()}
          </Typography>
        }
        secondary={
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "text.secondary",
              mt: 0.5,
            }}
          >
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: dateFnsLocale(i18n.language),
            })}
          </Typography>
        }
      />
      {!notification.is_read && (
        <IconButton size="small" edge="end" disabled>
          <UnreadIcon sx={{ fontSize: 10, color: "primary.main" }} />
        </IconButton>
      )}
    </ListItem>
  );
}
