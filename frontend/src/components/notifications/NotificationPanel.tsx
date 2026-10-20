import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
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
} from "@mui/icons-material";
import NotificationItem from "./NotificationItem";
import { useNotifications } from "../../hooks/useNotifications";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

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
  const [tab, setTab] = useState(0);
  const {
    items,
    counts,
    loading,
    error,
    refresh,
    markRead,
    markBucket,
    markAllRead,
  } = useNotifications(FILTERS[tab], { unread: tab === 2 });
  const prefersReducedMotion = usePrefersReducedMotion();
  const seenRef = useRef<Set<string>>(new Set());

  const tabCounts = [counts.all, counts.social, counts.messages, counts.system];
  const showSurvey = counts.survey_pending > 0 && (tab === 0 || tab === 3);
  const systemUnread = counts.system - (counts.survey_pending > 0 ? 1 : 0);

  useEffect(() => {
    if (loading || tab !== 1) return;
    if (counts.social <= 0 || seenRef.current.has("social")) return;
    seenRef.current.add("social");
    void markBucket("social");
  }, [tab, loading, counts.social, markBucket]);

  useEffect(() => {
    if (loading || tab !== 3) return;
    if (systemUnread <= 0 || seenRef.current.has("system")) return;
    seenRef.current.add("system");
    void markBucket("system");
  }, [tab, loading, systemUnread, markBucket]);

  const handleSurvey = () => {
    onClose();
    void router.push("/home?encuesta=1");
  };

  const surveyCopy =
    counts.survey_pending === 1
      ? t("notifications.survey.pending_one")
      : t("notifications.survey.pending_other", {
          count: counts.survey_pending,
        });

  return (
    <Box
      sx={{
        width: 380,
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
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t("notifications.title")}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {tab === 3 && (
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

      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
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
          <Fade in appear key={tab} timeout={prefersReducedMotion ? 0 : 200}>
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
                {items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markRead}
                    onNavigate={onClose}
                  />
                ))}
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
                    {t(`notifications.empty.${TABS[tab].key}`)}
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
