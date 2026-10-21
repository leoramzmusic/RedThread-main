import React, { useState } from "react";
import {
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Box,
  IconButton,
  TextField,
} from "@mui/material";
import {
  ArchiveOutlined,
  ChatBubbleOutlined,
  CampaignOutlined,
  DeleteOutlined,
  FavoriteBorder,
  MoreVert,
  ScheduleOutlined,
  Send,
  SettingsOutlined,
} from "@mui/icons-material";
import { useTranslation } from "next-i18next/pages";
import { liquidColors, motionTokens } from "../../theme/liquidGlass";
import { buildNotificationText, formatRelativeTime } from "./notificationText";
import SnoozeMenu, { type SnoozeOption } from "./SnoozeMenu";
import type { AppNotification } from "../../hooks/useNotifications";

interface NotificationItemProps {
  notification: AppNotification;
  bumped?: boolean;
  onRead: (id: string) => void;
  onNavigate?: (notification: AppNotification) => void;
  onQuickReply?: (
    notification: AppNotification,
    message: string,
  ) => void | Promise<void>;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSnooze?: (duration: SnoozeOption) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const resolveUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  return `${API_URL}${url}`;
};

const iconFor = (type: string) => {
  if (type === "like")
    return (
      <FavoriteBorder sx={{ color: liquidColors.primaryLight, fontSize: 16 }} />
    );
  if (type === "message")
    return (
      <ChatBubbleOutlined sx={{ color: liquidColors.accent, fontSize: 16 }} />
    );
  if (type === "promo")
    return (
      <CampaignOutlined sx={{ color: liquidColors.accentGold, fontSize: 16 }} />
    );
  if (type === "match")
    return (
      <FavoriteBorder sx={{ color: liquidColors.accentViolet, fontSize: 16 }} />
    );
  return <SettingsOutlined sx={{ color: "text.secondary", fontSize: 16 }} />;
};

export default function NotificationItem({
  notification,
  bumped = false,
  onRead,
  onNavigate,
  onQuickReply,
  onArchive,
  onDelete,
  onSnooze,
}: NotificationItemProps) {
  const { t, i18n } = useTranslation("common");
  const [reply, setReply] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [snoozeAnchor, setSnoozeAnchor] = useState<HTMLElement | null>(null);
  const { title, body } = buildNotificationText(notification, t, i18n.language);
  const thumb =
    notification.metadata?.shown_media_thumbnail_url ||
    notification.metadata?.shown_media_url;
  const canReply =
    notification.type === "message" &&
    !!notification.metadata?.can_reply &&
    !!onQuickReply;
  const displayName =
    notification.user?.name ?? notification.actors?.[0]?.name ?? "";
  const initial = displayName.trim().charAt(0).toUpperCase();

  const handleClick = async () => {
    if (!notification.is_read) await onRead(notification.id);
    onNavigate?.(notification);
  };

  const openSnoozeMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setSnoozeAnchor(event.currentTarget);
  };

  return (
    <ListItem
      data-testid={`notification-item-${notification.id}`}
      alignItems="flex-start"
      sx={{
        position: "relative",
        cursor: "pointer",
        bgcolor: notification.is_read ? "transparent" : "rgba(230,57,70,0.07)",
        borderBottom: "1px solid",
        borderColor: "divider",
        borderInlineStart: notification.is_read
          ? "3px solid transparent"
          : `3px solid ${liquidColors.primary}`,
        transition: `background-color ${motionTokens.durations.micro}ms ${motionTokens.easing}`,
        "&:hover": { bgcolor: "action.selected" },
        "&:hover .notification-hover-actions, &:focus-within .notification-hover-actions":
          {
            opacity: 1,
            pointerEvents: "auto",
          },
        "@media (hover: none)": {
          ".notification-hover-actions": { display: "none" },
        },
        animation: bumped
          ? `notification-bump ${motionTokens.durations.macro}ms ${motionTokens.easing}`
          : "none",
        "@keyframes notification-bump": {
          "0%": { backgroundColor: "rgba(230,57,70,0.22)" },
          "100%": { backgroundColor: "rgba(230,57,70,0.07)" },
        },
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
          transition: "none",
        },
      }}
      onClick={handleClick}
    >
      <ListItemAvatar sx={{ minWidth: 64 }}>
        <Box sx={{ position: "relative", width: 56, height: 56 }}>
          {thumb ? (
            <Box
              data-testid="notification-thumb"
              component="img"
              src={resolveUrl(thumb)}
              alt=""
              sx={{
                width: 56,
                height: 56,
                borderRadius: "12px",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <Avatar
              alt={displayName}
              src={resolveUrl(notification.user?.photo)}
              sx={{ width: 56, height: 56 }}
            >
              {initial}
            </Avatar>
          )}
          {thumb && notification.user?.photo && (
            <Avatar
              alt={displayName}
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
            {iconFor(notification.type)}
          </Box>
        </Box>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography
            component="span"
            variant="subtitle2"
            sx={{
              fontWeight: notification.is_read ? 400 : 600,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </Typography>
        }
        secondary={
          <Box component="span">
            {body && (
              <Typography
                component="span"
                variant="body2"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: expanded ? "unset" : 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {body}
              </Typography>
            )}
            {notification.type === "promo" && (
              <Typography
                component="span"
                variant="caption"
                sx={{
                  color: "primary.main",
                  cursor: "pointer",
                  display: "block",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
              >
                {expanded
                  ? t("notifications.expand.less")
                  : t("notifications.expand.more")}
              </Typography>
            )}
            <Typography
              variant="caption"
              sx={{ display: "block", color: "text.secondary", mt: 0.5 }}
            >
              {formatRelativeTime(
                notification.updated_at || notification.created_at,
                i18n.language,
              )}
            </Typography>
            {canReply && (
              <Box
                data-testid="notification-quick-reply"
                sx={{ display: "flex", gap: 1, mt: 1 }}
                onClick={(e) => e.stopPropagation()}
              >
                <TextField
                  size="small"
                  fullWidth
                  placeholder={t("notifications.quickReply.placeholder")}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <IconButton
                  aria-label={t("notifications.quickReply.send")}
                  disabled={!reply.trim()}
                  onClick={() => {
                    void onQuickReply?.(notification, reply.trim());
                    setReply("");
                  }}
                >
                  <Send fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        }
        slotProps={{
          secondary: { component: "span" },
        }}
      />
      {(onArchive || onDelete || onSnooze) && (
        <Box
          data-testid="notification-hover-actions"
          className="notification-hover-actions"
          onClick={(event) => event.stopPropagation()}
          sx={{
            position: "absolute",
            top: 8,
            right: 52,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: 0.25,
            p: 0.25,
            borderRadius: "24px",
            bgcolor: "background.paper",
            boxShadow: 1,
            opacity: 0,
            pointerEvents: "none",
            transition: `opacity ${motionTokens.durations.micro}ms ${motionTokens.easing}`,
          }}
        >
          {onArchive && (
            <IconButton
              data-testid="notification-hover-archive"
              aria-label={t("notifications.actions.archive")}
              title={t("notifications.actions.archive")}
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                onArchive(notification.id);
              }}
              sx={{ width: 44, height: 44 }}
            >
              <ArchiveOutlined fontSize="small" />
            </IconButton>
          )}
          {onSnooze && (
            <IconButton
              data-testid="notification-hover-snooze"
              aria-label={t("notifications.actions.snooze")}
              title={t("notifications.actions.snooze")}
              size="small"
              onClick={openSnoozeMenu}
              sx={{ width: 44, height: 44 }}
            >
              <ScheduleOutlined fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              data-testid="notification-hover-delete"
              aria-label={t("notifications.actions.delete")}
              title={t("notifications.actions.delete")}
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(notification.id);
              }}
              sx={{ width: 44, height: 44 }}
            >
              <DeleteOutlined fontSize="small" />
            </IconButton>
          )}
        </Box>
      )}
      {onSnooze && (
        <>
          <IconButton
            data-testid="notification-snooze-trigger"
            aria-label={t("notifications.actions.snooze")}
            title={t("notifications.actions.snooze")}
            size="small"
            onClick={openSnoozeMenu}
            sx={{ width: 44, height: 44, alignSelf: "flex-start", ml: 0.5 }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
          <SnoozeMenu
            anchorEl={snoozeAnchor}
            open={Boolean(snoozeAnchor)}
            onClose={() => setSnoozeAnchor(null)}
            onSelect={(duration) => {
              setSnoozeAnchor(null);
              onSnooze(duration);
            }}
          />
        </>
      )}
    </ListItem>
  );
}
