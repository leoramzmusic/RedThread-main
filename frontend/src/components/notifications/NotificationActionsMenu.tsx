import React from "react";
import { Divider, ListItemIcon, Menu, MenuItem } from "@mui/material";
import {
  DeleteOutlineRounded,
  DoneAll,
  NotificationsOffOutlined,
  PushPinOutlined,
  ScheduleOutlined,
  SettingsOutlined,
} from "@mui/icons-material";
import { useTranslation } from "next-i18next/pages";
import type { AppNotification } from "../../hooks/useNotifications";

interface NotificationActionsMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  notification?: AppNotification | null;
  reminder?: boolean;
  onMarkRead?: () => void;
  onSnooze: () => void;
  onTogglePin?: () => void;
  onMute: () => void;
  onDismiss: () => void;
  onConfigure: () => void;
}

export default function NotificationActionsMenu({
  anchorEl,
  open,
  onClose,
  notification,
  reminder = false,
  onMarkRead,
  onSnooze,
  onTogglePin,
  onMute,
  onDismiss,
  onConfigure,
}: NotificationActionsMenuProps) {
  const { t } = useTranslation("common");
  const pinned = Boolean(notification?.pinned_at);

  const run = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      onClick={(event) => event.stopPropagation()}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
    >
      {!reminder && (
        <MenuItem
          data-testid="notification-action-read"
          disabled={notification?.is_read}
          onClick={() => run(() => onMarkRead?.())}
        >
          <ListItemIcon>
            <DoneAll fontSize="small" />
          </ListItemIcon>
          {t("notifications.actions.markRead")}
        </MenuItem>
      )}
      <MenuItem
        data-testid="notification-action-snooze"
        onClick={() => run(onSnooze)}
      >
        <ListItemIcon>
          <ScheduleOutlined fontSize="small" />
        </ListItemIcon>
        {t("notifications.actions.snooze")}
      </MenuItem>
      {!reminder && onTogglePin && (
        <MenuItem
          data-testid="notification-action-pin"
          onClick={() => run(onTogglePin)}
        >
          <ListItemIcon>
            <PushPinOutlined fontSize="small" />
          </ListItemIcon>
          {pinned
            ? t("notifications.actions.unpin")
            : t("notifications.actions.pin")}
        </MenuItem>
      )}
      <MenuItem
        data-testid="notification-action-mute"
        onClick={() => run(onMute)}
      >
        <ListItemIcon>
          <NotificationsOffOutlined fontSize="small" />
        </ListItemIcon>
        {reminder
          ? t("notifications.actions.hideForever")
          : t("notifications.actions.muteType")}
      </MenuItem>
      <MenuItem
        data-testid="notification-action-dismiss"
        onClick={() => run(onDismiss)}
      >
        <ListItemIcon>
          <DeleteOutlineRounded fontSize="small" />
        </ListItemIcon>
        {reminder
          ? t("notifications.actions.dismissDay")
          : t("notifications.actions.dismiss")}
      </MenuItem>
      <Divider />
      <MenuItem
        data-testid="notification-action-configure"
        onClick={() => run(onConfigure)}
      >
        <ListItemIcon>
          <SettingsOutlined fontSize="small" />
        </ListItemIcon>
        {t("notifications.actions.configure")}
      </MenuItem>
    </Menu>
  );
}
