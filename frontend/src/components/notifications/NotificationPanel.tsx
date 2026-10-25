import React, { useRef, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { useSnackbar } from "notistack";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
  Chip,
  Menu,
  MenuItem,
  Skeleton,
  Fade,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
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
  ExpandMoreRounded as ExpandIcon,
} from "@mui/icons-material";
import NotificationItem from "./NotificationItem";
import NotificationSwipeable from "./NotificationSwipeable";
import NotificationActionsMenu from "./NotificationActionsMenu";
import SnoozeMenu, { type SnoozeOption } from "./SnoozeMenu";
import PauseMenu from "./PauseMenu";
import PauseScheduleDialog from "./PauseScheduleDialog";
import { pauseDeadlineLabel, pauseRemaining } from "./pauseTime";
import { useHoldToAct } from "./useHoldToAct";
import {
  useNotifications,
  type AppNotification,
} from "../../hooks/useNotifications";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import apiClient from "../../services/api";
import { categoryForType } from "./notificationCategory";
import { densityForCount } from "./notificationDensity";

interface NotificationPanelProps {
  onClose: () => void;
}

const SECTIONS = ["social", "messages", "system"] as const;
const REMINDER_KEY = "care_preferences";
const FILTER_META = [
  { key: "all", icon: InboxIcon },
  { key: "social", icon: LikeIcon },
  { key: "messages", icon: ChatIcon },
  { key: "system", icon: SystemIcon },
] as const;

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation("common");
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [filter, setFilter] = useState<string>("all");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [pauseAnchor, setPauseAnchor] = useState<null | HTMLElement>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set<string>(),
  );
  const [bumpedIds, setBumpedIds] = useState<Set<string>>(() => new Set());
  const [bumpSeq, setBumpSeq] = useState(0);
  const [actionTarget, setActionTarget] = useState<null | {
    anchor: HTMLElement;
    notification: AppNotification | null;
    reminderKey?: string;
  }>(null);
  const [snoozeTarget, setSnoozeTarget] = useState<null | {
    anchor: HTMLElement;
    notificationId?: string;
    reminderKey?: string;
  }>(null);
  const [hiddenReminders, setHiddenReminders] = useState<Set<string>>(
    () => new Set(),
  );
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => new Set(),
  );
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
    setPinned,
    dismissReminder,
    restoreReminder,
    pausedUntil,
    pauseSchedule,
    pauseAllow,
    pauseWindow,
    pauseShortcutId,
    pause,
    resume,
    applyPauseShortcut,
    savePauseSchedule,
    savePauseWindow,
    removePauseSchedule,
  } = useNotifications(filter, { unread: filter === "messages" });
  const appLocale = router.locale || i18n?.language || "es";
  const prefersReducedMotion = usePrefersReducedMotion();
  const seenRef = useRef<Set<string>>(new Set());

  const isArchived = filter === "archived";
  const isTrash = filter === "trash";
  const isSpecialView = isArchived || isTrash;
  const density = densityForCount(items.length);
  const itemDensity = density === "empty" ? "standard" : density;
  const pinnedItems =
    filter === "all"
      ? items.filter((notification) => Boolean(notification.pinned_at))
      : [];
  const sectionGroups =
    filter === "all"
      ? SECTIONS.map((key) => ({
          key,
          items: items.filter(
            (notification) =>
              !notification.pinned_at &&
              categoryForType(notification.type) === key,
          ),
        })).filter((section) => section.items.length > 0)
      : [];
  const showSurvey =
    !isSpecialView &&
    counts.survey_pending > 0 &&
    !hiddenReminders.has(REMINDER_KEY) &&
    (filter === "all" || filter === "system");
  const systemUnread = counts.system - (counts.survey_pending > 0 ? 1 : 0);
  const pauseRemainingLabel = pauseRemaining(pausedUntil, clock);
  const isPaused = Boolean(pauseRemainingLabel);
  const pauseTime = isPaused ? pauseDeadlineLabel(pausedUntil as string) : "";
  const pauseTooltip = isPaused
    ? t(
        "notifications.pause.active",
        "Notificaciones pausadas: {{remaining}} · hasta las {{time}}",
        {
          remaining: pauseRemainingLabel,
          time: pauseTime,
        },
      )
    : t("notifications.pause.title", "Pausar notificaciones");
  const pauseShortcut =
    pauseSchedule.find((rule) => rule.id === pauseShortcutId) ?? null;

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

  const handleMuteNotification = (id: string) => {
    void snooze(id, "always");
    enqueueSnackbar(t("notifications.actions.muted"), {
      key: `notification-mute-${id}`,
      preventDuplicate: true,
      autoHideDuration: 5000,
    });
  };

  const handleTogglePin = (notification: AppNotification) => {
    const pinned = Boolean(notification.pinned_at);
    void setPinned(notification.id, !pinned);
    enqueueSnackbar(
      pinned
        ? t("notifications.actions.unpinned")
        : t("notifications.actions.pinned"),
      {
        key: `notification-pin-${notification.id}`,
        preventDuplicate: true,
        autoHideDuration: 5000,
        action: (
          <Button
            color="inherit"
            size="small"
            onClick={() => void setPinned(notification.id, pinned)}
          >
            {t("notifications.actions.undo")}
          </Button>
        ),
      },
    );
  };

  const hideReminder = (
    duration: SnoozeOption | undefined,
    message: string,
  ) => {
    const key = REMINDER_KEY;
    setHiddenReminders((prev) => new Set(prev).add(key));
    if (duration) void dismissReminder(key, duration);
    else void dismissReminder(key);
    undo(`reminder-${key}`, message, async () => {
      setHiddenReminders((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      await restoreReminder(key);
    });
  };

  const handleReminderDismiss = (duration?: SnoozeOption) => {
    hideReminder(
      duration,
      duration
        ? t("notifications.reminder.dismissed")
        : t("notifications.reminder.muted"),
    );
  };

  const handleReminderSnooze = (duration: SnoozeOption) => {
    hideReminder(duration, t("notifications.reminder.snoozed"));
  };

  const handleSnoozeSelect = (duration: SnoozeOption) => {
    if (!snoozeTarget) return;
    const { notificationId, reminderKey } = snoozeTarget;
    setSnoozeTarget(null);
    if (reminderKey) {
      handleReminderSnooze(duration);
      return;
    }
    if (notificationId) handleSnooze(notificationId, duration);
  };

  const openItemActions = (id: string, anchor: HTMLElement) => {
    const notification = items.find((entry) => entry.id === id) ?? null;
    setActionTarget({ anchor, notification });
  };

  const openReminderActions = (anchor: HTMLElement) => {
    setActionTarget({
      anchor,
      notification: null,
      reminderKey: REMINDER_KEY,
    });
  };

  const {
    anchorRef: surveyAnchorRef,
    handlers: surveyHandlers,
    onClickCapture: surveyClickCapture,
  } = useHoldToAct<HTMLDivElement>({
    disabled: !showSurvey,
    allowInteractive: true,
    onTrigger: openReminderActions,
  });

  const openActionSnooze = () => {
    if (!actionTarget) return;
    setSnoozeTarget({
      anchor: actionTarget.anchor,
      notificationId: actionTarget.notification?.id,
      reminderKey: actionTarget.reminderKey,
    });
  };

  const muteActionTarget = () => {
    if (!actionTarget) return;
    if (actionTarget.reminderKey) handleReminderDismiss();
    else if (actionTarget.notification) {
      handleMuteNotification(actionTarget.notification.id);
    }
  };

  const dismissActionTarget = () => {
    if (!actionTarget) return;
    if (actionTarget.reminderKey) handleReminderDismiss("1d");
    else if (actionTarget.notification)
      handleDelete(actionTarget.notification.id);
  };

  const openNotificationSettings = () => {
    onClose();
    void router.push("/settings#notifications");
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

  const emptyKey = isArchived ? "archived" : isTrash ? "trash" : filter;

  const toggleSection = (key: string) => {
    setCollapsedSections((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderSectionHeader = (key: string, count: number) => {
    const collapsed = collapsedSections.has(key);
    return (
      <ListItemButton
        data-testid={`notification-section-${key}`}
        aria-expanded={!collapsed}
        onClick={() => toggleSection(key)}
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 3,
          minHeight: 44,
          px: 2,
          py: 0.75,
          gap: 1,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          component="span"
          variant="overline"
          sx={{
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: "text.secondary",
            lineHeight: 1.2,
          }}
        >
          {t(`notifications.sections.${key}`)}
        </Typography>
        <Box
          component="span"
          data-testid={`notification-section-count-${key}`}
          sx={{
            px: 0.7,
            borderRadius: "999px",
            bgcolor: "action.selected",
            fontSize: "0.6875rem",
            fontWeight: 700,
            lineHeight: "18px",
            color: "text.secondary",
          }}
        >
          {count}
        </Box>
        <ExpandIcon
          sx={{
            ml: "auto",
            fontSize: 20,
            color: "text.secondary",
            transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
            transition: prefersReducedMotion ? "none" : "transform 140ms ease",
          }}
        />
      </ListItemButton>
    );
  };

  const renderInboxNotification = (notification: AppNotification) => {
    const raised = actionTarget?.notification?.id === notification.id;
    const dimmed = Boolean(actionTarget) && !raised;
    const item = (
      <NotificationItem
        notification={notification}
        density={itemDensity}
        bumped={bumpedIds.has(notification.id)}
        selected={selectedIds.has(notification.id)}
        selectionMode={selectionMode}
        raised={raised}
        dimmed={dimmed}
        onToggleSelect={toggleSelection}
        onOpenActions={openItemActions}
        onRead={markRead}
        onNavigate={onClose}
        onQuickReply={sendQuickReply}
        onArchive={handleArchive}
      />
    );

    return selectionMode ? (
      <React.Fragment key={notification.id}>{item}</React.Fragment>
    ) : (
      <NotificationSwipeable
        key={
          bumpedIds.has(notification.id)
            ? `${notification.id}:${bumpSeq}`
            : notification.id
        }
        disabled={Boolean(actionTarget)}
        onDismiss={() => handleDelete(notification.id)}
        onSnooze={(anchor) =>
          setSnoozeTarget({
            anchor,
            notificationId: notification.id,
          })
        }
      >
        {item}
      </NotificationSwipeable>
    );
  };

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
        <Box data-testid="notification-header">
          <Box
            sx={{
              px: 2,
              pt: 1.25,
              pb: isSpecialView ? 1.25 : 0.5,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 1,
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
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  data-testid="notification-title"
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                  noWrap
                >
                  {isArchived
                    ? t("notifications.archived.title")
                    : isTrash
                      ? t("notifications.trash.title")
                      : isPaused
                        ? t("notifications.pause.dnd", "No molestar")
                        : t("notifications.title")}
                </Typography>
                {!isSpecialView && isPaused && (
                  <Typography
                    data-testid="notification-pause-remaining"
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "primary.main",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t(
                      "notifications.pause.activeFor",
                      "Activo durante: {{remaining}}",
                      { remaining: pauseRemainingLabel },
                    )}
                  </Typography>
                )}
              </Box>
            </Box>
            <IconButton
              data-testid="notification-close"
              onClick={onClose}
              aria-label={t("notifications.close")}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {!isSpecialView && (
            <Box
              sx={{
                px: 1.5,
                pb: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 0.5,
              }}
            >
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
              <IconButton
                data-testid="notification-mark-all"
                onClick={() => {
                  void markAllRead(filter);
                }}
                title={t("notifications.markAllRead")}
                aria-label={t("notifications.markAllRead")}
                size="small"
              >
                <MarkReadIcon />
              </IconButton>
              <IconButton
                data-testid="notification-menu"
                onClick={(event) => setMenuAnchor(event.currentTarget)}
                title={t("notifications.menu", "Más opciones")}
                aria-label={t("notifications.menu", "Más opciones")}
                size="small"
              >
                <MoreIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      )}

      {!isSpecialView && !selectionMode && (
        <Box
          data-testid="notification-filters"
          role="group"
          aria-label={t("notifications.filters", "Filtrar notificaciones")}
          sx={{
            display: "flex",
            width: "100%",
            gap: "4px",
            px: { xs: 1.5, sm: 2 },
            py: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          {FILTER_META.map(({ key, icon: Icon }) => {
            const active = filter === key;
            const count = counts[key];
            const label = t(`notifications.tabs.${key}`);
            const hasCount = count > 0;
            return (
              <Chip
                key={key}
                data-testid={`notification-chip-${key}`}
                clickable
                aria-pressed={active}
                title={label}
                onClick={() => setFilter(key)}
                icon={<Icon sx={{ fontSize: active ? 18 : 17 }} />}
                label={
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: active ? "center" : "center",
                      gap: active ? "6px" : "4px",
                      minWidth: 0,
                      whiteSpace: "nowrap",
                      px: active ? "8px" : "4px",
                    }}
                  >
                    {active && (
                      <Box
                        component="span"
                        data-testid={`notification-chip-label-${key}`}
                        sx={{
                          display: "inline-block",
                          maxWidth: "100px",
                          minWidth: 0,
                          opacity: 1,
                          overflow: "hidden",
                          textOverflow: "clip",
                          whiteSpace: "nowrap",
                          pl: "6px",
                          transition: prefersReducedMotion
                            ? "none"
                            : "max-width 220ms cubic-bezier(0.2, 0, 0, 1), opacity 220ms cubic-bezier(0.2, 0, 0, 1)",
                        }}
                      >
                        {label}
                      </Box>
                    )}
                    {hasCount && (
                      <Box
                        component="span"
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: "20px",
                          height: "20px",
                          ml: active ? "6px" : "4px",
                          borderRadius: "10px",
                          bgcolor: active
                            ? "rgba(255,255,255,0.25)"
                            : "action.selected",
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                          lineHeight: "16px",
                          opacity: 1,
                          width: "20px",
                          transition: prefersReducedMotion
                            ? "none"
                            : "opacity 220ms cubic-bezier(0.2, 0, 0, 1)",
                        }}
                      >
                        {count}
                      </Box>
                    )}
                  </Box>
                }
                sx={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 44,
                  flex: 1,
                  width: active ? "auto" : "52px",
                  minWidth: active ? "auto" : "52px",
                  maxWidth: active ? "none" : "52px",
                  borderRadius: "999px",
                  fontSize: "0.8125rem",
                  fontWeight: active ? 700 : 600,
                  pl: active ? "12px" : 0,
                  pr: active ? "12px" : 0,
                  bgcolor: active ? "primary.main" : "rgba(255,255,255,0.06)",
                  color: active
                    ? "#fff"
                    : isDark
                      ? "rgba(255,255,255,0.65)"
                      : "rgba(0,0,0,0.65)",
                  transition: prefersReducedMotion
                    ? "none"
                    : "width 220ms ease, padding 220ms ease, background-color 220ms ease, color 220ms ease",
                  "&:hover": {
                    bgcolor: active ? "primary.dark" : "rgba(0,0,0,0.04)",
                  },
                  "& .MuiChip-icon": {
                    flexShrink: 0,
                    color: active
                      ? "inherit"
                      : isDark
                        ? "rgba(255,255,255,0.65)"
                        : "rgba(0,0,0,0.65)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  },
                  "& .MuiChip-label": {
                    minWidth: 0,
                    px: 0,
                    overflow: active ? "visible" : "hidden",
                    mr: active ? "6px" : "4px",
                    display: active ? "inline-flex" : "inline-flex",
                    alignItems: active ? "center" : "center",
                    gap: active ? "6px" : "4px",
                  },
                }}
              />
            );
          })}
        </Box>
      )}

      <PauseMenu
        anchorEl={pauseAnchor}
        open={Boolean(pauseAnchor)}
        paused={isPaused}
        shortcut={pauseShortcut}
        locale={appLocale}
        onClose={() => setPauseAnchor(null)}
        onPause={(duration) => void pause(duration)}
        onPauseUntil={(until) => void pause(undefined, until)}
        onResume={() => void resume()}
        onApplyShortcut={() => {
          if (pauseShortcut?.id) void applyPauseShortcut(pauseShortcut.id);
        }}
        onOpenSchedule={() => setScheduleOpen(true)}
      />

      {scheduleOpen && (
        <PauseScheduleDialog
          open
          locale={appLocale}
          schedule={pauseSchedule}
          singleWindow={pauseWindow}
          allow={pauseAllow}
          onClose={() => setScheduleOpen(false)}
          onSaveSingle={(payload) => void savePauseWindow(payload)}
          onSaveRule={(payload) => void savePauseSchedule(payload)}
          onDelete={(id) => void removePauseSchedule(id)}
        />
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
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
            openNotificationSettings();
          }}
          sx={{ fontSize: "0.875rem" }}
        >
          {t("notifications.settings.title", "Ajustes")}
        </MenuItem>
      </Menu>

      <NotificationActionsMenu
        anchorEl={actionTarget?.anchor ?? null}
        open={Boolean(actionTarget)}
        notification={actionTarget?.notification ?? null}
        reminder={Boolean(actionTarget?.reminderKey)}
        onClose={() => setActionTarget(null)}
        onMarkRead={() => {
          if (actionTarget?.notification) {
            void markRead(actionTarget.notification.id);
          }
        }}
        onSnooze={openActionSnooze}
        onTogglePin={() => {
          if (actionTarget?.notification) {
            handleTogglePin(actionTarget.notification);
          }
        }}
        onMute={muteActionTarget}
        onDismiss={dismissActionTarget}
        onConfigure={openNotificationSettings}
      />

      <SnoozeMenu
        anchorEl={snoozeTarget?.anchor ?? null}
        open={Boolean(snoozeTarget)}
        onClose={() => setSnoozeTarget(null)}
        onSelect={handleSnoozeSelect}
      />

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
          <Fade in appear key={filter} timeout={prefersReducedMotion ? 0 : 280}>
            <Box>
              <List disablePadding>
                {showSurvey && (
                  <NotificationSwipeable
                    key="care-reminder"
                    allowInteractive
                    onDismiss={() => handleReminderDismiss("1d")}
                    onDismissForever={() => handleReminderDismiss()}
                    onSnooze={(anchor) =>
                      setSnoozeTarget({ anchor, reminderKey: REMINDER_KEY })
                    }
                  >
                    <ListItemButton
                      ref={surveyAnchorRef}
                      data-testid="notification-survey-item"
                      onClick={handleSurvey}
                      onClickCapture={surveyClickCapture}
                      {...surveyHandlers}
                      sx={{
                        borderBottom: "none",
                        bgcolor: "rgba(255, 255, 255, 0.02)",
                        borderRadius: "8px",
                        my: 0.5,
                        mx: 1,
                        "&:hover": {
                          bgcolor: "rgba(255, 255, 255, 0.05)",
                        },
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
                  </NotificationSwipeable>
                )}
                {isArchived &&
                  items.map((notification) => (
                    <Box key={notification.id}>
                      <NotificationItem
                        notification={notification}
                        density={itemDensity}
                        variant="archived"
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
                  ))}

                {isTrash &&
                  items.map((notification) => (
                    <Box key={notification.id}>
                      <NotificationItem
                        notification={notification}
                        density={itemDensity}
                        variant="trash"
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
                  ))}

                {!isSpecialView && filter === "all" && (
                  <>
                    {pinnedItems.length > 0 && (
                      <>
                        {renderSectionHeader("pinned", pinnedItems.length)}
                        {!collapsedSections.has("pinned") &&
                          pinnedItems.map(renderInboxNotification)}
                      </>
                    )}
                    {sectionGroups.map((section) => (
                      <React.Fragment key={section.key}>
                        {renderSectionHeader(section.key, section.items.length)}
                        {!collapsedSections.has(section.key) &&
                          section.items.map(renderInboxNotification)}
                      </React.Fragment>
                    ))}
                  </>
                )}

                {!isSpecialView &&
                  filter !== "all" &&
                  items.map(renderInboxNotification)}
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
