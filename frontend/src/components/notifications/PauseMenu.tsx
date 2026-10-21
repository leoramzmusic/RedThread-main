import React from "react";
import { ListItemIcon, ListSubheader, Menu, MenuItem } from "@mui/material";
import { PlayArrow as ResumeIcon } from "@mui/icons-material";
import { useTranslation } from "next-i18next/pages";

export const PAUSE_OPTIONS = ["15m", "30m", "1h", "2h", "8h"] as const;

export type PauseOption = (typeof PAUSE_OPTIONS)[number];

const PAUSE_LABELS: Record<PauseOption, string> = {
  "15m": "15 minutos",
  "30m": "30 minutos",
  "1h": "1 hora",
  "2h": "2 horas",
  "8h": "8 horas",
};

interface PauseMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  paused: boolean;
  onClose: () => void;
  onPause: (duration: PauseOption) => void;
  onPauseUntil: (until: string) => void;
  onResume: () => void;
  onOpenSchedule: () => void;
}

function tomorrowMorning(): string {
  const target = new Date();
  target.setDate(target.getDate() + 1);
  target.setHours(8, 0, 0, 0);
  return target.toISOString();
}

export default function PauseMenu({
  anchorEl,
  open,
  paused,
  onClose,
  onPause,
  onPauseUntil,
  onResume,
  onOpenSchedule,
}: PauseMenuProps) {
  const { t } = useTranslation("common");

  const choose = (duration: PauseOption) => {
    onClose();
    onPause(duration);
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
      <ListSubheader component="div">
        {t("notifications.pause.title", "Pausar notificaciones")}
      </ListSubheader>
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
          onClick={() => choose(option)}
        >
          {t(`notifications.snooze.${option}`, PAUSE_LABELS[option])}
        </MenuItem>
      ))}
      <MenuItem
        data-testid="notification-pause-1d"
        onClick={() => {
          onClose();
          onPauseUntil(tomorrowMorning());
        }}
      >
        {t("notifications.pause.tomorrow", "Hasta mañana")}
      </MenuItem>
      <MenuItem
        data-testid="notification-pause-custom"
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
