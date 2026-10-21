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
  ArchiveOutlined as ArchiveIcon,
  DeleteOutlined as DeleteIcon,
  RestoreFromTrashOutlined as RestoreIcon,
  SelectAllOutlined as SelectAllIcon,
  NotificationsPausedOutlined as PausedIcon,
  ScheduleOutlined as ScheduleIcon,
} from "@mui/icons-material";
import NotificationItem from "./NotificationItem";
import NotificationSwipeable from "./NotificationSwipeable";
import PauseMenu from "./PauseMenu";
import { pauseDeadlineLabel, pauseRemaining } from "./pauseTime";
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
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [filter, setFilter] = useState<string>("all");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [pauseAnchor, setPauseAnchor] = useState<null | HTMLElement>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set<string>(),
  );
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
    bulkArchive,
    bulkUnarchive,
    bulkDelete,
    bulkRestore,
    bulkMarkRead,
    snooze,
    unsnooze,
    pausedUntil,
    pause,
    resume,
  } = useNotifications(filter, { unread: filter === "messages" });
  const prefersReducedMotion = usePrefersReducedMotion();
  const seenRef = useRef<Set<string>>(new Set());

  const tabIndex = Math.max(
    FILTERS.indexOf(filter as (typeof FILTERS)[number]),
    0,
  );
  const isArchived = filter === "archived";
  const isTrash = filter === "trash";
  const isSpecialView = isArchived || isTrash;
  const tabCounts = [counts.all, counts.social, counts.messages, counts.system];
  const showSurvey =
    !isSpecialView &&
    counts.survey_pending > 0 &&
    (filter === "all" || filter === "system");
  const systemUnread = counts.system - (counts.survey_pending > 0 ? 1 : 0);
  const pauseRemainingLabel = pauseRemaining(pausedUntil, clock);
  const isPaused = Boolean(pauseRemainingLabel);
  const pauseTime = isPaused ? pauseDeadlineLabel(pausedUntil as string) : "";
  const pauseTooltip = isPaused
    ? t("notifications.pause.active", { time: pauseTime })
    : t("notifications.pause.title");
  const unreadLabel = counts.count > 99 ? "99+" : String(counts.count);

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

  React.useEffect(() => {
    if (!pausedUntil) return;
    const initial = setTimeout(() => setClock(Date.now()), 0);
    const timer = setInterval(() => setClock(Date.now()), 30000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [pausedUntil]);

  React.useEffect(() => {
    setSelectionMode(false);
    setSelectedIds(new Set<string>());
  }, [filter]);

  React.useEffect(() => {
    const visible = new Set(items.map((notification) => notification.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

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

  const undoBulk = (
    ids: string[],
    message: string,
    action: () => Promise<void>,
  ) => {
    enqueueSnackbar(message, {
      key: `notification-bulk-${ids[0] ?? "empty"}`,
      preventDuplicate: true,
      autoHideDuration: 5000,
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
    undo(id, t("notifications.undo.snoozed"), () => unsnooze(id));
  };

  const enterSelection = (id: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set<string>());
  };

  const selectAll = () => {
    setSelectedIds(new Set(items.map((notification) => notification.id)));
  };

  const handleBulkArchive = () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    void bulkArchive(ids);
    exitSelection();
    undoBulk(ids, t("notifications.undo.archived"), () => bulkUnarchive(ids));
  };

  const handleBulkDelete = () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    void bulkDelete(ids);
    exitSelection();
    undoBulk(ids, t("notifications.undo.deleted"), () => bulkRestore(ids));
  };

  const handleBulkMarkRead = () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    void bulkMarkRead(ids);
    exitSelection();
    enqueueSnackbar(t("notifications.undo.read"), {
      key: `notification-bulk-read-${ids[0] ?? "empty"}`,
      preventDuplicate: true,
      autoHideDuration: 5000,
    });
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
      return;
    }
    await markRead(notification.id);
    closeSnackbar(`quick-reply-${notification.id}`);
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

  const emptyKey = isArchived
    ? "archived"
    : isTrash
      ? "trash"
      : TABS[tabIndex].key;

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {selectionMode ? (
        <Box
          data-testid="notification-selection-toolbar"
          sx={{
            p: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
            <IconButton
              data-testid="notification-selection-cancel"
              onClick={exitSelection}
              title={t("notifications.bulk.cancel")}
              aria-label={t("notifications.bulk.cancel")}
              size="small"
            >
              <CloseIcon />
            </IconButton>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, ml: 1 }}
              noWrap
            >
              {t("notifications.bulk.selected", {
                count: selectedIds.size,
              })}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              data-testid="notification-bulk-mark-read"
              onClick={handleBulkMarkRead}
              disabled={selectedIds.size === 0}
              title={t("notifications.bulk.markRead")}
              aria-label={t("notifications.bulk.markRead")}
              size="small"
              sx={{ mr: 0.5 }}
            >
              <MarkReadIcon />
            </IconButton>
            <IconButton
              data-testid="notification-bulk-archive"
              onClick={handleBulkArchive}
              disabled={selectedIds.size === 0}
              title={t("notifications.bulk.archive")}
              aria-label={t("notifications.bulk.archive")}
              size="small"
              sx={{ mr: 0.5 }}
            >
              <ArchiveIcon />
            </IconButton>
            <IconButton
              data-testid="notification-bulk-delete"
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0}
              title={t("notifications.bulk.delete")}
              aria-label={t("notifications.bulk.delete")}
              size="small"
              color="error"
              sx={{ mr: 0.5 }}
            >
              <DeleteIcon />
            </IconButton>
            <IconButton
              data-testid="notification-select-all"
              onClick={selectAll}
              title={t("notifications.bulk.selectAll")}
              aria-label={t("notifications.bulk.selectAll")}
              size="small"
            >
              <SelectAllIcon />
            </IconButton>
          </Box>
        </Box>
      ) : (
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
            {isSpecialView && (
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
                : isTrash
                  ? t("notifications.trash.title")
                  : t("notifications.title")}
            </Typography>
            {!isSpecialView && counts.count > 0 && (
              <Typography
                component="span"
                data-testid="notification-unread-count"
                sx={{
                  ml: 1,
                  px: 0.7,
                  py: 0.1,
                  borderRadius: 2,
                  bgcolor: "action.selected",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  lineHeight: 1.5,
                }}
              >
                {unreadLabel}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {!isSpecialView && (
              <IconButton
                data-testid="notification-pause"
                onClick={(event) => setPauseAnchor(event.currentTarget)}
                title={pauseTooltip}
                aria-label={pauseTooltip}
                size="small"
                color={isPaused ? "primary" : "default"}
              >
                {isPaused ? <PausedIcon /> : <ScheduleIcon />}
              </IconButton>
            )}
            {!isSpecialView && isPaused && (
              <Typography
                data-testid="notification-pause-remaining"
                variant="caption"
                sx={{
                  color: "primary.main",
                  fontWeight: 700,
                  mr: 0.5,
                  whiteSpace: "nowrap",
                }}
              >
                {pauseRemainingLabel}
              </Typography>
            )}
            {!isSpecialView && (
              <IconButton
                data-testid="notification-mark-all"
                onClick={() => {
                  void markAllRead(filter);
                }}
                title={t("notifications.markAllRead")}
                aria-label={t("notifications.markAllRead")}
                size="small"
                sx={{ mr: 0.5 }}
              >
                <MarkReadIcon />
              </IconButton>
            )}
            {!isSpecialView && (
              <IconButton
                data-testid="notification-menu"
                onClick={(event) => setMenuAnchor(event.currentTarget)}
                title={t("notifications.menu", "Más opciones")}
                aria-label={t("notifications.menu", "Más opciones")}
                size="small"
                sx={{ mr: 0.5 }}
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
      )}

      {!isSpecialView && !selectionMode && (
        <Tabs
          value={tabIndex}
          onChange={(_, value) => setFilter(FILTERS[value])}
          variant="fullWidth"
          sx={{ borderBottom: "1px solid", borderColor: "divider" }}
        >
          {TABS.map(({ key, icon: Icon }, index) => {
            const active = tabIndex === index;
            const count = tabCounts[index];
            const labelTransition = prefersReducedMotion
              ? "none"
              : "max-width 220ms ease, opacity 180ms ease, transform 220ms ease, margin 220ms ease";
            return (
              <Tab
                key={key}
                data-testid={`notification-tab-${key}`}
                sx={{
                  minWidth: 0,
                  minHeight: 48,
                  px: 0.25,
                  fontSize: "0.75rem",
                }}
                label={
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      px: active ? 1 : 0.5,
                      py: 0.5,
                      borderRadius: "999px",
                      bgcolor: active ? "action.hover" : "transparent",
                      transition: prefersReducedMotion
                        ? "none"
                        : "background-color 220ms ease, padding 220ms ease",
                    }}
                  >
                    <Icon fontSize="small" />
                    <Box
                      component="span"
                      data-testid={`notification-tab-label-${key}`}
                      sx={{
                        display: "inline-block",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        maxWidth: active ? 120 : 0,
                        ml: active ? "4px" : 0,
                        opacity: active ? 1 : 0,
                        transform: active
                          ? "translateX(0)"
                          : "translateX(-4px)",
                        transition: labelTransition,
                      }}
                    >
                      {t(`notifications.tabs.${key}`)}
                    </Box>
                    {count > 0 && (
                      <Box
                        component="span"
                        sx={{
                          px: "6px",
                          ml: "4px",
                          borderRadius: "10px",
                          bgcolor: "action.selected",
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          lineHeight: "16px",
                        }}
                      >
                        {count}
                      </Box>
                    )}
                  </Box>
                }
              />
            );
          })}
        </Tabs>
      )}

      <PauseMenu
        anchorEl={pauseAnchor}
        open={Boolean(pauseAnchor)}
        paused={isPaused}
        onClose={() => setPauseAnchor(null)}
        onPause={(duration) => void pause(duration)}
        onPauseUntil={(until) => void pause(undefined, until)}
        onResume={() => void resume()}
      />

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          data-testid="notification-menu-mark-all"
          onClick={() => {
            handleMenuClose();
            void markAllRead("all");
          }}
          sx={{ fontSize: "0.875rem" }}
        >
          {t("notifications.markAllRead")}
        </MenuItem>
        <MenuItem
          data-testid="notification-menu-select"
          disabled={items.length === 0}
          onClick={() => {
            handleMenuClose();
            setSelectionMode(true);
            setSelectedIds(new Set<string>());
          }}
          sx={{ fontSize: "0.875rem" }}
        >
          {t("notifications.selectMode")}
        </MenuItem>
        <MenuItem
          data-testid="notification-menu-trash"
          onClick={() => {
            handleMenuClose();
            setFilter("trash");
          }}
          sx={{ fontSize: "0.875rem" }}
        >
          {t("notifications.trash.title")}
        </MenuItem>
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
          {t("notifications.settings.title", "Ajustes")}
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
                {items.map((notification) => {
                  if (isArchived) {
                    return (
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
                    );
                  }

                  if (isTrash) {
                    return (
                      <Box key={notification.id}>
                        <NotificationItem
                          notification={notification}
                          onRead={markRead}
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
                            data-testid={`notification-trash-restore-${notification.id}`}
                            onClick={() => void restore(notification.id)}
                          >
                            {t("notifications.actions.unarchive")}
                          </Button>
                        </Box>
                      </Box>
                    );
                  }

                  const item = (
                    <NotificationItem
                      notification={notification}
                      bumped={bumpedIds.has(notification.id)}
                      selected={selectedIds.has(notification.id)}
                      selectionMode={selectionMode}
                      onToggleSelect={toggleSelection}
                      onLongPress={enterSelection}
                      onRead={markRead}
                      onNavigate={onClose}
                      onQuickReply={sendQuickReply}
                      onArchive={handleArchive}
                      onDelete={handleDelete}
                      onSnooze={(duration) =>
                        handleSnooze(notification.id, duration)
                      }
                    />
                  );

                  return selectionMode ? (
                    <React.Fragment key={notification.id}>
                      {item}
                    </React.Fragment>
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
                      {item}
                    </NotificationSwipeable>
                  );
                })}
              </List>
              {!showSurvey && items.length === 0 && (
                <Box
                  data-testid="notification-empty"
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 4,
                    minHeight: 240,
                  }}
                >
                  <Box
                    sx={{
                      width: 96,
                      height: 96,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "action.hover",
                      mb: 2,
                    }}
                  >
                    <EmptyIcon sx={{ fontSize: 48, color: "text.secondary" }} />
                  </Box>
                  <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    sx={{ fontWeight: 600, textAlign: "center" }}
                  >
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
