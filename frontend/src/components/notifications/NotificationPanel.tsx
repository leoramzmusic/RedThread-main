import React, { useRef, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { useSnackbar } from "notistack";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Skeleton,
  Fade,
} from "@mui/material";
import {
  Assignment as SurveyIcon,
  Close as CloseIcon,
  DoneAll as MarkReadIcon,
  NotificationsOff as EmptyIcon,
  Inbox as InboxIcon,
  Favorite as LikeIcon,
  ChatBubble as ChatIcon,
  Campaign as SystemIcon,
  MoreVert as MoreIcon,
  ArrowBack as BackIcon,
  DeleteOutlined as DeleteIcon,
  RestoreFromTrashOutlined as RestoreIcon,
} from "@mui/icons-material";
import NotificationItem from "./NotificationItem";
import NotificationSwipeable from "./NotificationSwipeable";
import type { SnoozeOption } from "./SnoozeMenu";
import {
  useNotifications,
  type AppNotification,
} from "../../hooks/useNotifications";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import apiClient from "../../services/api";

interface NotificationPanelProps {
  onClose: () => void;
}

const FILTERS = ["all", "social", "messages", "system"] as const;
const TABS = [
  { key: "all", icon: InboxIcon },
  { key: "likes", icon: LikeIcon },
  { key: "chats", icon: ChatIcon },
  { key: "system", icon: SystemIcon },
] as const;

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { enqueueSnackbar } = useSnackbar();
  const [filter, setFilter] = useState<string>("all");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [bumpedIds, setBumpedIds] = useState<Set<string>>(() => new Set());
  const [bumpSeq, setBumpSeq] = useState(0);
  const updatedAtRef = useRef<Map<string, string>>(new Map());
  const bumpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    items,
    counts,
    loading,
    error,
    refresh,
    markRead,
    markBucket,
    markAllRead,
    archive,
    unarchive,
    remove,
    restore,
    snooze,
    unsnooze,
  } = useNotifications(filter, { unread: filter === "messages" });
  const prefersReducedMotion = usePrefersReducedMotion();
  const seenRef = useRef<Set<string>>(new Set());

  const tabIndex = Math.max(
    FILTERS.indexOf(filter as (typeof FILTERS)[number]),
    0,
  );
  const isArchived = filter === "archived";
  const tabCounts = [counts.all, counts.social, counts.messages, counts.system];
  const showSurvey =
    !isArchived &&
    counts.survey_pending > 0 &&
    (filter === "all" || filter === "system");
  const systemUnread = counts.system - (counts.survey_pending > 0 ? 1 : 0);

  React.useEffect(() => {
    if (loading || filter !== "social") return;
    if (counts.social <= 0 || seenRef.current.has("social")) return;
    seenRef.current.add("social");
    void markBucket("social");
  }, [filter, loading, counts.social, markBucket]);

  React.useEffect(() => {
    if (loading || filter !== "system") return;
    if (systemUnread <= 0 || seenRef.current.has("system")) return;
    seenRef.current.add("system");
    void markBucket("system");
  }, [filter, loading, systemUnread, markBucket]);

  React.useEffect(() => {
    const previous = updatedAtRef.current;
    const changed: string[] = [];
    const currentIds = new Set(items.map((notification) => notification.id));
    items.forEach((notification) => {
      const stamp = notification.updated_at ?? notification.created_at;
      const last = previous.get(notification.id);
      if (last !== undefined && last !== stamp) changed.push(notification.id);
      previous.set(notification.id, stamp);
    });
    previous.forEach((_, id) => {
      if (!currentIds.has(id)) previous.delete(id);
    });
    if (changed.length === 0) return;
    setBumpedIds(new Set(changed));
    setBumpSeq((value) => value + 1);
    if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
    bumpTimerRef.current = setTimeout(() => {
      bumpTimerRef.current = null;
      setBumpedIds(new Set());
    }, 700);
  }, [items]);

  React.useEffect(
    () => () => {
      if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
    },
    [],
  );

  const snackbarOptions = (id: string) => ({
    key: `notification-${id}`,
    preventDuplicate: true,
    autoHideDuration: 5000,
  });

  const undo = (id: string, message: string, action: () => Promise<void>) => {
    enqueueSnackbar(message, {
      ...snackbarOptions(id),
      action: (
        <Button color="inherit" size="small" onClick={() => void action()}>
          {t("notifications.actions.undo")}
        </Button>
      ),
    });
  };

  const handleArchive = (id: string) => {
    void archive(id);
    undo(id, t("notifications.undo.archived"), () => unarchive(id));
  };

  const handleDelete = (id: string) => {
    void remove(id);
    undo(id, t("notifications.undo.deleted"), () => restore(id));
  };

  const handleSnooze = (id: string, duration: SnoozeOption) => {
    void snooze(id, duration);
    if (duration === "always") {
      enqueueSnackbar(t("notifications.undo.snoozed"), snackbarOptions(id));
      return;
    }
    undo(id, t("notifications.undo.snoozed"), () => unsnooze(id));
  };

  const sendQuickReply = async (
    notification: AppNotification,
    content: string,
  ) => {
    const conversationId = notification.metadata?.conversation_id;
    const matchId = notification.metadata?.match_id;
    if (!conversationId && !matchId) return;
    const payload = conversationId
      ? { conversation_id: conversationId, content }
      : { match_id: matchId, content };
    try {
      await apiClient.post("/chat/send", payload);
      await markRead(notification.id);
    } catch {
      enqueueSnackbar(t("notifications.error"), {
        key: `quick-reply-${notification.id}`,
        variant: "error",
        action: (
          <Button
            color="inherit"
            size="small"
            onClick={() => void sendQuickReply(notification, content)}
          >
            {t("notifications.retry")}
          </Button>
        ),
      });
    }
  };

  const handleMenuClose = () => setMenuAnchor(null);

  const handleSurvey = () => {
    onClose();
    void router.push("/home?encuesta=1");
  };

  const surveyCopy =
    counts.survey_pending === 1
      ? t("notifications.survey.pending_one", {
          count: counts.survey_pending,
        })
      : t("notifications.survey.pending_other", {
          count: counts.survey_pending,
        });

  const emptyKey = isArchived ? "archived" : TABS[tabIndex].key;

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
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
        <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          {isArchived && (
            <IconButton
              data-testid="notification-back"
              onClick={() => setFilter("all")}
              title={t("notifications.archived.back")}
              aria-label={t("notifications.archived.back")}
              size="small"
              sx={{ mr: 0.5 }}
            >
              <BackIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
            {isArchived
              ? t("notifications.archived.title")
              : t("notifications.title")}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {filter === "system" && (
            <IconButton
              data-testid="notification-mark-all"
              onClick={() => {
                void markAllRead();
              }}
              title={t("notifications.markAllRead")}
              aria-label={t("notifications.markAllRead")}
              size="small"
              sx={{ mr: 1 }}
            >
              <MarkReadIcon />
            </IconButton>
          )}
          {!isArchived && (
            <IconButton
              data-testid="notification-menu"
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              title={t("notifications.menu", "Más opciones")}
              aria-label={t("notifications.menu", "Más opciones")}
              size="small"
              sx={{ mr: 1 }}
            >
              <MoreIcon />
            </IconButton>
          )}
          <IconButton
            data-testid="notification-close"
            onClick={onClose}
            aria-label={t("notifications.close")}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {!isArchived && (
        <Tabs
          value={tabIndex}
          onChange={(_, value) => setFilter(FILTERS[value])}
          variant="fullWidth"
          sx={{ borderBottom: "1px solid", borderColor: "divider" }}
        >
          {TABS.map(({ key, icon: Icon }, index) => (
            <Tab
              key={key}
              data-testid={`notification-tab-${key}`}
              icon={<Icon fontSize="small" />}
              iconPosition="start"
              sx={{
                minWidth: 0,
                px: 0.5,
                fontSize: "0.75rem",
                "& .MuiTab-iconWrapper": { mr: 0.5 },
              }}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Box component="span">{t(`notifications.tabs.${key}`)}</Box>
                  {tabCounts[index] > 0 && (
                    <Box
                      component="span"
                      sx={{
                        px: "6px",
                        borderRadius: "10px",
                        bgcolor: "action.selected",
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        lineHeight: "16px",
                      }}
                    >
                      {tabCounts[index]}
                    </Box>
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          data-testid="notification-menu-archived"
          onClick={() => {
            handleMenuClose();
            setFilter("archived");
          }}
          sx={{ fontSize: "0.875rem" }}
        >
          {t("notifications.archived.title")}
        </MenuItem>
        <MenuItem
          data-testid="notification-menu-settings"
          onClick={() => {
            handleMenuClose();
            onClose();
            void router.push("/settings#notifications");
          }}
          sx={{ fontSize: "0.875rem" }}
        >
          {t("notifications.settings", "Ajustes")}
        </MenuItem>
      </Menu>

      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        {loading ? (
          <Box>
            {[0, 1, 2].map((row) => (
              <Box
                key={row}
                data-testid="notification-skeleton"
                sx={{ display: "flex", gap: 1.5, p: 2 }}
              >
                <Skeleton variant="circular" width={56} height={56} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="60%" />
                  <Skeleton width="90%" />
                  <Skeleton width="30%" />
                </Box>
              </Box>
            ))}
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {t("notifications.error")}
            </Typography>
            <Button
              sx={{ mt: 2 }}
              variant="outlined"
              size="small"
              onClick={() => {
                void refresh();
              }}
            >
              {t("notifications.retry")}
            </Button>
          </Box>
        ) : (
          <Fade in appear key={filter} timeout={prefersReducedMotion ? 0 : 200}>
            <Box>
              <List disablePadding>
                {showSurvey && (
                  <ListItemButton
                    data-testid="notification-survey-item"
                    onClick={handleSurvey}
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
                      primary={t("notifications.survey.title")}
                      secondary={surveyCopy}
                    />
                  </ListItemButton>
                )}
                {items.map((notification) =>
                  isArchived ? (
                    <Box key={notification.id}>
                      <NotificationItem
                        notification={notification}
                        onRead={markRead}
                        onNavigate={onClose}
                      />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 1,
                          px: 2,
                          py: 1,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<RestoreIcon />}
                          data-testid={`notification-restore-${notification.id}`}
                          onClick={() => void unarchive(notification.id)}
                        >
                          {t("notifications.actions.unarchive")}
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          startIcon={<DeleteIcon />}
                          data-testid={`notification-delete-${notification.id}`}
                          onClick={() => void remove(notification.id)}
                        >
                          {t("notifications.actions.delete")}
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <NotificationSwipeable
                      key={
                        bumpedIds.has(notification.id)
                          ? `${notification.id}:${bumpSeq}`
                          : notification.id
                      }
                      onArchive={() => handleArchive(notification.id)}
                      onDelete={() => handleDelete(notification.id)}
                    >
                      <NotificationItem
                        notification={notification}
                        bumped={bumpedIds.has(notification.id)}
                        onRead={markRead}
                        onNavigate={onClose}
                        onQuickReply={sendQuickReply}
                        onArchive={handleArchive}
                        onDelete={handleDelete}
                        onSnooze={(duration) =>
                          handleSnooze(notification.id, duration)
                        }
                      />
                    </NotificationSwipeable>
                  ),
                )}
              </List>
              {!showSurvey && items.length === 0 && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 4,
                    opacity: 0.6,
                  }}
                >
                  <EmptyIcon
                    sx={{ fontSize: 60, mb: 2, color: "text.secondary" }}
                  />
                  <Typography variant="body1" color="text.secondary">
                    {t(`notifications.empty.${emptyKey}`)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        )}
      </Box>
    </Box>
  );
}
