import React from "react";
import { ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import {
  PlayArrow as ResumeIcon,
  BoltOutlined as ShortcutIcon,
} from "@mui/icons-material";
import { useTranslation } from "next-i18next/pages";
import { formatDayRange, type PauseScheduleRule } from "./pauseTime";

export const PAUSE_OPTIONS = ["15m", "30m", "1h", "2h", "8h"] as const;

export type PauseOption = (typeof PAUSE_OPTIONS)[number];

interface PauseMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  paused: boolean;
  shortcut: PauseScheduleRule | null;
  locale: string;
  onClose: () => void;
  onPause: (duration: PauseOption) => void;
  onPauseUntil: (until: string) => void;
  onResume: () => void;
  onApplyShortcut: () => void;
  onOpenSchedule: () => void;
}

function tomorrow(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

export default function PauseMenu({
  anchorEl,
  open,
  paused,
  shortcut,
  locale,
  onClose,
  onPause,
  onPauseUntil,
  onResume,
  onApplyShortcut,
  onOpenSchedule,
}: PauseMenuProps) {
  const { t } = useTranslation("common");

  const choose = (duration: PauseOption) => {
    onClose();
    onPause(duration);
  };

  const labelForOption = (option: PauseOption) => {
    switch (option) {
      case "15m":
        return t("notifications.snooze.15m", "15 minutos");
      case "30m":
        return t("notifications.snooze.30m", "30 minutos");
      case "1h":
        return t("notifications.snooze.1h", "1 hora");
      case "2h":
        return t("notifications.snooze.2h", "2 horas");
      case "8h":
        return t("notifications.snooze.8h", "8 horas");
    }
  };

  return (
    <Menu
      data-testid="notification-pause-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
    >
      {shortcut && (
        <MenuItem
          data-testid="notification-pause-shortcut"
          disabled={paused}
          onClick={() => {
            onClose();
            onApplyShortcut();
          }}
          sx={{ alignItems: "flex-start" }}
        >
          <ListItemIcon sx={{ mt: 0.25 }}>
            <ShortcutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={
              shortcut.name ||
              t("notifications.pause.shortcut", "Rutina rápida")
            }
            secondary={formatDayRange(shortcut.days, locale)}
            slotProps={{
              primary: { variant: "body2", color: "text.primary" },
              secondary: { variant: "caption", color: "text.secondary" },
            }}
          />
        </MenuItem>
      )}
      {paused && (
        <MenuItem
          data-testid="notification-pause-resume"
          onClick={() => {
            onClose();
            onResume();
          }}
        >
          <ListItemIcon>
            <ResumeIcon fontSize="small" />
          </ListItemIcon>
          {t("notifications.pause.resume", "Reanudar notificaciones")}
        </MenuItem>
      )}
      {PAUSE_OPTIONS.map((option) => (
        <MenuItem
          key={option}
          data-testid={`notification-pause-${option}`}
          disabled={paused}
          onClick={() => choose(option)}
        >
          {labelForOption(option)}
        </MenuItem>
      ))}
      <MenuItem
        data-testid="notification-pause-1d"
        disabled={paused}
        onClick={() => {
          onClose();
          onPauseUntil(tomorrow());
        }}
      >
        {t("notifications.pause.tomorrow", "Hasta mañana")}
      </MenuItem>
      <MenuItem
        data-testid="notification-pause-custom"
        disabled={paused}
        onClick={() => {
          onClose();
          onOpenSchedule();
        }}
      >
        {t("notifications.pause.custom", "Personalizado")}
      </MenuItem>
    </Menu>
  );
}
