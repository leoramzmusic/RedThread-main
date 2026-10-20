import React from "react";
import { useRouter } from "next/router";
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
import { es } from "date-fns/locale";

interface NotificationItemProps {
  notification: any;
  onRead: (id: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const resolveUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  return `${API_URL}${url}`;
};

export default function NotificationItem({
  notification,
  onRead,
}: NotificationItemProps) {
  const router = useRouter();
  const metadata = notification.metadata || {};
  const actorCount = notification.actor_count || 1;
  const isGroupLike = notification.type === "like" && actorCount > 1;
  const mediaThumb =
    metadata.shown_media_thumbnail_url || metadata.shown_media_url;
  const mediaLabel = metadata.shown_media_type === "video" ? "video" : "foto";

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
    const userName = notification.user?.name || "Alguien";
    switch (notification.type) {
      case "like":
        if (isGroupLike) {
          const target = metadata.shown_media_id
            ? `tu ${mediaLabel}`
            : "tu perfil";
          return `A ${actorCount} personas les gustó ${target}`;
        }
        return notification.content || `A ${userName} le gustas`;
      case "view":
        return `${userName} vio tu perfil`;
      case "match":
        return (
          notification.content || `¡Tienes un nuevo match con ${userName}!`
        );
      case "reward":
        return "¡Ganaste una recompensa!";
      case "message":
        return `Mensaje de ${userName}`;
      default:
        return notification.content || "Notificación del sistema";
    }
  };

  const getSubtitle = () => {
    if (isGroupLike) {
      const names = (notification.actors || [])
        .map((actor: any) => actor.name)
        .filter(Boolean)
        .slice(0, 3);
      if (names.length > 0) {
        return `Incluye a ${names.join(", ")}${actorCount > names.length ? ` y ${actorCount - names.length} más` : ""}`;
      }
      return "Toca para ver quiénes dieron like";
    }
    if (notification.type === "like") {
      return metadata.shown_media_id
        ? `Le gustó tu ${mediaLabel}`
        : "Le gustas";
    }
    if (notification.type === "message") {
      return notification.content;
    }
    return null;
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }

    if (isGroupLike || notification.target_type === "likes") {
      router.push("/likes");
      return;
    }
    if (notification.target_type === "chat") {
      router.push("/chat");
      return;
    }
    if (metadata.target_url) {
      router.push(metadata.target_url);
      return;
    }
    if (notification.target_type === "profile") {
      const nickname = notification.actors?.[0]?.nickname;
      if (nickname) router.push(`/profile/${nickname}`);
      return;
    }
    if (notification.target_type === "url" && notification.target_id) {
      router.push(notification.target_id);
    }
  };

  const subtitle = getSubtitle();

  return (
    <ListItem
      alignItems="flex-start"
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
                borderRadius: 2,
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <Avatar
              alt={notification.user?.name}
              src={resolveUrl(notification.user?.photo)}
              sx={{ width: 56, height: 56 }}
            />
          )}
          {mediaThumb && notification.user?.photo && (
            <Avatar
              alt={notification.user?.name}
              src={resolveUrl(notification.user.photo)}
              sx={{
                position: "absolute",
                left: -4,
                bottom: -4,
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
              bottom: -2,
              right: -2,
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
          <React.Fragment>
            {subtitle && (
              <Typography
                component="span"
                variant="body2"
                sx={{
                  color: "text.primary",
                  display: "inline",
                }}
              >
                {subtitle}
              </Typography>
            )}
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
                locale: es,
              })}
            </Typography>
          </React.Fragment>
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
