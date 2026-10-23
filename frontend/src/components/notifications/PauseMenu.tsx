import React from "react";
import {
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
} from "@mui/material";
import { PlayArrow as ResumeIcon } from "@mui/icons-material";
import { useTranslation } from "next-i18next/pages";
import {
  formatDayRange,
  pauseDeadlineLabel,
  type ActivePause,
} from "./pauseTime";

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
  activePauses: ActivePause[];
  locale: string;
  onClose: () => void;
  onPause: (duration: PauseOption) => void;
  onPauseUntil: (until: string) => void;
  onResume: () => void;
  onOpenSchedule: () => void;
}

function tomorrow(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

export default function PauseMenu({
  anchorEl,
  open,
  paused,
  activePauses,
  locale,
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
      {activePauses.length > 0 && (
        <>
          <ListSubheader component="div">
            {t("notifications.pause.activePauses.title", "Pausas activas")}
          </ListSubheader>
          {activePauses.map((pause, index) => (
            <MenuItem
              key={pause.id ?? `single-${index}`}
              data-testid="notification-active-pause-item"
              disabled
              sx={{
                alignItems: "flex-start",
                opacity: 1,
                "&.Mui-disabled": { opacity: 1 },
              }}
            >
              <ListItemText
                primary={
                  pause.name ||
                  t("notifications.pause.mode.single", "Pausa única")
                }
                secondary={
                  pause.kind === "recurring"
                    ? `${formatDayRange(pause.days ?? [], locale)} · ${pause.start} → ${pause.end}`
                    : t(
                        "notifications.pause.activePauses.until",
                        "Termina a las {{time}}",
                        {
                          time: pauseDeadlineLabel(pause.until ?? pause.end),
                        },
                      )
                }
                slotProps={{
                  primary: { variant: "body2", color: "text.primary" },
                  secondary: { variant: "caption", color: "text.secondary" },
                }}
              />
            </MenuItem>
          ))}
        </>
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
          onClick={() => choose(option)}
        >
          {t(`notifications.snooze.${option}`, PAUSE_LABELS[option])}
        </MenuItem>
      ))}
      <MenuItem
        data-testid="notification-pause-1d"
        onClick={() => {
          onClose();
          onPauseUntil(tomorrow());
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
