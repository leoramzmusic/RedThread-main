import { useState, type MouseEvent } from "react";
import {
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Box,
  Checkbox,
  IconButton,
  TextField,
} from "@mui/material";
import {
  ArchiveOutlined,
  AssignmentOutlined,
  CampaignOutlined,
  ChatBubbleOutlined,
  DoneRounded,
  FavoriteBorder,
  MoreVert,
  PushPinOutlined,
  SecurityOutlined,
  Send,
  SettingsOutlined,
} from "@mui/icons-material";
import { useTranslation } from "next-i18next/pages";
import { liquidColors, motionTokens } from "../../theme/liquidGlass";
import { buildNotificationText, formatRelativeTime } from "./notificationText";
import { useHoldToAct } from "./useHoldToAct";
import type { AppNotification } from "../../hooks/useNotifications";
import {
  priorityForNotification,
  quickActionForNotification,
  type NotificationPriority,
} from "./notificationPriority";
import type { NotificationDensity } from "./notificationDensity";

interface NotificationItemProps {
  notification: AppNotification;
  density?: Exclude<NotificationDensity, "empty">;
  variant?: "inbox" | "archived" | "trash";
  bumped?: boolean;
  selected?: boolean;
  selectionMode?: boolean;
  raised?: boolean;
  dimmed?: boolean;
  onToggleSelect?: (id: string) => void;
  onOpenActions?: (id: string, anchor: HTMLElement) => void;
  onRead: (id: string) => void;
  onNavigate?: (notification: AppNotification) => void;
  onQuickReply?: (
    notification: AppNotification,
    message: string,
  ) => void | Promise<void>;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSnooze?: (id: string, anchor: HTMLElement) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SIZE: Record<NotificationItemProps["density"] & string, number> = {
  sparse: 52,
  standard: 48,
  dense: 40,
};

const PADDING: Record<NotificationItemProps["density"] & string, number> = {
  sparse: 2,
  standard: 1.75,
  dense: 1.25,
};

const PRIORITY_LABEL: Record<NotificationPriority, string> = {
  P0: "notifications.priority.critical",
  P1: "notifications.priority.actionRequired",
  P2: "notifications.priority.informational",
  P3: "notifications.priority.passive",
};

const resolveUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  return `${API_URL}${url}`;
};

function iconFor(type: string, fontSize: number) {
  if (type === "like")
    return (
      <FavoriteBorder sx={{ color: liquidColors.primaryLight, fontSize }} />
    );
  if (type === "message")
    return <ChatBubbleOutlined sx={{ color: liquidColors.accent, fontSize }} />;
  if (type === "promo")
    return (
      <CampaignOutlined sx={{ color: liquidColors.accentGold, fontSize }} />
    );
  if (type === "match")
    return (
      <FavoriteBorder sx={{ color: liquidColors.accentViolet, fontSize }} />
    );
  if (type === "survey")
    return (
      <AssignmentOutlined sx={{ color: liquidColors.primaryLight, fontSize }} />
    );
  if (type === "security")
    return <SecurityOutlined sx={{ color: liquidColors.primary, fontSize }} />;
  return <SettingsOutlined sx={{ color: "text.secondary", fontSize }} />;
}

function iconTint(type: string) {
  if (type === "like" || type === "security") return "rgba(230,57,70,0.12)";
  if (type === "message") return "rgba(69,123,157,0.14)";
  if (type === "promo") return "rgba(212,175,55,0.16)";
  if (type === "match") return "rgba(139,92,246,0.14)";
  if (type === "survey") return "rgba(230,57,70,0.10)";
  return "action.hover";
}

export default function NotificationItem({
  notification,
  density = "standard",
  variant = "inbox",
  bumped = false,
  selected = false,
  selectionMode = false,
  raised = false,
  dimmed = false,
  onToggleSelect,
  onOpenActions,
  onRead,
  onNavigate,
  onQuickReply,
  onArchive,
}: NotificationItemProps) {
  const { t, i18n } = useTranslation("common");
  const [reply, setReply] = useState("");
  const [expanded, setExpanded] = useState(false);
  const { anchorRef, handlers, onClickCapture } = useHoldToAct<HTMLLIElement>({
    disabled: selectionMode || !onOpenActions,
    onTrigger: (anchor) => onOpenActions?.(notification.id, anchor),
  });
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
  const hasIdentity = Boolean(thumb || notification.user?.photo || displayName);
  const priority = priorityForNotification(notification);
  const size = SIZE[density];
  const densityPadding = PADDING[density];
  const isDense = density === "dense";
  const bodyLines = density === "dense" ? 1 : density === "sparse" ? 3 : 2;

  const quickAction = quickActionForNotification(notification);
  const quickActionVisible =
    !selectionMode &&
    variant === "inbox" &&
    ((quickAction === "markRead" && !notification.is_read) ||
      (quickAction === "archive" && !!onArchive));

  const handleClick = async () => {
    if (selectionMode) {
      onToggleSelect?.(notification.id);
      return;
    }
    if (!notification.is_read) await onRead(notification.id);
    onNavigate?.(notification);
  };

  const handleQuickAction = (event: MouseEvent) => {
    event.stopPropagation();
    if (quickAction === "markRead") {
      onRead(notification.id);
      return;
    }
    onArchive?.(notification.id);
  };

  return (
    <ListItem
      ref={anchorRef}
      data-testid={`notification-item-${notification.id}`}
      data-density={density}
      data-priority={priority}
      data-variant={variant}
      data-unread={notification.is_read ? "false" : "true"}
      data-selected={selected ? "true" : undefined}
      data-raised={raised ? "true" : undefined}
      data-dimmed={dimmed ? "true" : undefined}
      aria-selected={selectionMode ? selected : undefined}
      tabIndex={selectionMode ? -1 : 0}
      alignItems="flex-start"
      {...handlers}
      onClickCapture={onClickCapture}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        void handleClick();
      }}
      sx={{
        position: "relative",
        cursor: "pointer",
        py: densityPadding,
        pr: 0.5,
        pl: 1,
        mx: 1,
        mb: isDense ? 0.25 : 0.75,
        borderRadius: density === "dense" ? 14 : density === "sparse" ? 18 : 16,
        border: "1px solid",
        borderColor: selected ? "rgba(230,57,70,0.28)" : "divider",
        borderInlineStart:
          priority === "P0"
            ? `3px solid ${liquidColors.primary}`
            : !notification.is_read
              ? `3px solid ${liquidColors.primary}`
              : "3px solid transparent",
        touchAction: "pan-y",
        WebkitTouchCallout: "none",
        transform: raised ? "translateY(-2px) scale(1.005)" : "none",
        boxShadow: raised ? "0 12px 30px rgba(0,0,0,0.28)" : "none",
        filter: dimmed ? "blur(1.5px)" : "none",
        opacity: dimmed ? 0.55 : priority === "P3" ? 0.88 : 1,
        pointerEvents: dimmed ? "none" : undefined,
        zIndex: raised ? 2 : "auto",
        bgcolor: selected
          ? "rgba(230,57,70,0.14)"
          : notification.is_read
            ? "transparent"
            : "rgba(230,57,70,0.07)",
        transition: `background-color ${motionTokens.durations.micro}ms ${motionTokens.easing}, transform ${motionTokens.durations.micro}ms ${motionTokens.easing}, box-shadow ${motionTokens.durations.micro}ms ${motionTokens.easing}, filter ${motionTokens.durations.micro}ms ${motionTokens.easing}, opacity ${motionTokens.durations.micro}ms ${motionTokens.easing}`,
        "&:hover": {
          bgcolor: selected ? "rgba(230,57,70,0.18)" : "action.selected",
        },
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
      {selectionMode && (
        <Checkbox
          data-testid={`notification-select-${notification.id}`}
          checked={selected}
          onChange={() => onToggleSelect?.(notification.id)}
          onClick={(event) => event.stopPropagation()}
          slotProps={{ input: { "aria-label": t("notifications.selectMode") } }}
          sx={{ ml: -0.5, alignSelf: "flex-start", p: 0.5 }}
        />
      )}
      <ListItemAvatar sx={{ minWidth: size + 12, mt: 0.25 }}>
        <Box
          data-testid="notification-leading"
          data-size={size}
          sx={{ position: "relative", width: size, height: size }}
        >
          {thumb ? (
            <Box
              data-testid="notification-thumb"
              component="img"
              src={resolveUrl(thumb)}
              alt=""
              sx={{
                width: size,
                height: size,
                borderRadius: size >= 48 ? "14px" : "12px",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : hasIdentity ? (
            <Avatar
              alt={displayName}
              src={resolveUrl(notification.user?.photo)}
              sx={{ width: size, height: size }}
            >
              {initial}
            </Avatar>
          ) : (
            <Box
              data-testid="notification-system-icon"
              data-icon={notification.type}
              sx={{
                width: size,
                height: size,
                borderRadius: "50%",
                bgcolor: iconTint(notification.type),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {iconFor(notification.type, Math.round(size * 0.44))}
            </Box>
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
          {hasIdentity && (
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
              {iconFor(notification.type, isDense ? 13 : 16)}
            </Box>
          )}
        </Box>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box
            component="span"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              minWidth: 0,
            }}
          >
            <Typography
              component="span"
              variant="subtitle2"
              sx={{
                fontWeight: notification.is_read ? 500 : 700,
                fontSize: isDense ? "0.875rem" : "0.9375rem",
                lineHeight: 1.35,
                color: "text.primary",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              {title}
            </Typography>
            {priority === "P1" && (
              <Box
                component="span"
                data-testid="notification-priority-badge"
                sx={{
                  flexShrink: 0,
                  px: 0.6,
                  py: 0.1,
                  borderRadius: "999px",
                  bgcolor: "rgba(230,57,70,0.14)",
                  color: liquidColors.primary,
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  lineHeight: 1.5,
                  whiteSpace: "nowrap",
                }}
              >
                {t("notifications.priority.actionRequiredShort", "Action")}
              </Box>
            )}
            <Box component="span" sx={SR_ONLY}>
              {t(PRIORITY_LABEL[priority])}
            </Box>
          </Box>
        }
        secondary={
          <Box component="span">
            {body && (
              <Typography
                component="span"
                variant="body2"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: expanded ? "unset" : bodyLines,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  mt: 0.25,
                  color: "text.secondary",
                  fontSize: isDense ? "0.75rem" : "0.8125rem",
                  lineHeight: 1.45,
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
            <Box
              component="span"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                mt: isDense ? 0.4 : 0.75,
                color: "text.secondary",
                fontSize: "0.75rem",
                minHeight: 18,
              }}
            >
              <Typography
                component="span"
                variant="caption"
                sx={{ fontSize: "inherit", color: "inherit" }}
              >
                {formatRelativeTime(
                  notification.updated_at || notification.created_at,
                  i18n.language,
                )}
              </Typography>
              {!notification.is_read && (
                <Box
                  component="span"
                  data-testid="notification-unread-dot"
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: liquidColors.primary,
                    flexShrink: 0,
                  }}
                />
              )}
              {notification.pinned_at && (
                <PushPinOutlined
                  data-testid="notification-pinned"
                  sx={{ fontSize: 14, color: "primary.main" }}
                />
              )}
              {!notification.is_read && (
                <Box component="span" sx={SR_ONLY}>
                  {t("notifications.unreadState", "Unread")}
                </Box>
              )}
            </Box>
            {canReply && !selectionMode && (
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
          primary: { component: "span" },
        }}
      />
      {quickActionVisible && (
        <Box
          data-testid="notification-hover-actions"
          className="notification-hover-actions"
          onClick={(event) => event.stopPropagation()}
          sx={{
            position: "absolute",
            top: isDense ? 2 : 4,
            right: 50,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            opacity: 0,
            pointerEvents: "none",
            transition: `opacity ${motionTokens.durations.micro}ms ${motionTokens.easing}`,
          }}
        >
          <IconButton
            data-testid="notification-quick-action"
            data-action={quickAction}
            aria-label={
              quickAction === "markRead"
                ? t("notifications.actions.markRead")
                : t("notifications.actions.archive")
            }
            title={
              quickAction === "markRead"
                ? t("notifications.actions.markRead")
                : t("notifications.actions.archive")
            }
            size="small"
            onClick={handleQuickAction}
            sx={{
              width: 44,
              height: 44,
              bgcolor: "background.paper",
              boxShadow: 1,
              "&:hover": { bgcolor: "background.paper" },
            }}
          >
            {quickAction === "markRead" ? (
              <DoneRounded fontSize="small" />
            ) : (
              <ArchiveOutlined fontSize="small" />
            )}
          </IconButton>
        </Box>
      )}
      {onOpenActions && !selectionMode && (
        <IconButton
          data-testid="notification-actions-trigger"
          aria-label={t("notifications.actions.more", "Más acciones")}
          title={t("notifications.actions.more", "Más acciones")}
          aria-haspopup="menu"
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            onOpenActions(notification.id, event.currentTarget);
          }}
          sx={{
            width: 44,
            height: 44,
            alignSelf: "flex-start",
            ml: 0.5,
            mt: isDense ? -0.5 : -0.75,
          }}
        >
          <MoreVert fontSize="small" />
        </IconButton>
      )}
    </ListItem>
  );
}

const SR_ONLY = {
  position: "absolute",
  width: "1px",
  height: "1px",
  p: 0,
  m: "-1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;
