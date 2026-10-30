import React from "react";
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  PlayArrow as ResumeIcon,
  BoltOutlined as ShortcutIcon,
  EditOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
} from "@mui/icons-material";
import { useTranslation } from "next-i18next/pages";
import {
  formatDayRange,
  pauseRemaining,
  type PauseScheduleRule,
} from "./pauseTime";

export const PAUSE_OPTIONS = ["15m", "30m", "1h", "2h", "8h"] as const;

export type PauseOption = (typeof PAUSE_OPTIONS)[number];

interface PauseMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  dndActive: boolean;
  dndSource?: string | null;
  activeRoutineId?: string | null;
  activeRoutineName?: string | null;
  windowEnd?: string | null;
  pausedUntil?: string | null;
  shortcut: PauseScheduleRule | null;
  routines: PauseScheduleRule[];
  locale: string;
  onClose: () => void;
  onPause: (duration: PauseOption) => void;
  onPauseUntil: (until: string) => void;
  onResume: () => void;
  onApplyShortcut: () => void;
  onOpenSchedule: () => void;
  onSelectRoutine: (id: string) => void;
  onEditRoutine: (rule: PauseScheduleRule) => void;
  onDeleteRoutine: (id: string) => void;
}

function tomorrow(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

const blockedStyle = {
  opacity: 0.4,
  pointerEvents: "none" as const,
  cursor: "default" as const,
};

export default function PauseMenu({
  anchorEl,
  open,
  dndActive,
  dndSource,
  activeRoutineId,
  activeRoutineName,
  windowEnd,
  pausedUntil,
  shortcut,
  routines,
  locale,
  onClose,
  onPause,
  onPauseUntil,
  onResume,
  onApplyShortcut,
  onOpenSchedule,
  onSelectRoutine,
  onEditRoutine,
  onDeleteRoutine,
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

  const isManualActive = dndActive && dndSource === "manual";
  const isRoutineActive = dndActive && dndSource === "routine";
  const remainingLabel = pausedUntil ? pauseRemaining(pausedUntil) : null;

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
          disabled={dndActive}
          onClick={() => {
            onClose();
            onApplyShortcut();
          }}
          sx={{
            alignItems: "flex-start",
            ...(dndActive ? blockedStyle : {}),
          }}
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

      {dndActive && (
        <>
          {isRoutineActive && activeRoutineName && (
            <MenuItem disabled sx={{ py: 0.5 }}>
              <ListItemText
                primary={
                  <>
                    <Box component="span" sx={{ mr: 0.5 }}>
                      🌙
                    </Box>
                    {t("notifications.pause.activeByRoutine", "Activo por:")}{" "}
                    <Box
                      component="span"
                      sx={{ fontWeight: 700, color: "text.primary" }}
                    >
                      {activeRoutineName}
                    </Box>
                  </>
                }
                secondary={
                  windowEnd
                    ? t("notifications.pause.windowEnd", "Finaliza: {{time}}", {
                        time: windowEnd,
                      })
                    : undefined
                }
                slotProps={{
                  primary: { variant: "caption", color: "text.secondary" },
                  secondary: { variant: "caption", color: "text.secondary" },
                }}
              />
            </MenuItem>
          )}
          {isManualActive && remainingLabel && (
            <MenuItem disabled sx={{ py: 0.5 }}>
              <ListItemText
                primary={
                  <>
                    <Box component="span" sx={{ mr: 0.5 }}>
                      ⏱
                    </Box>
                    {t("notifications.pause.activeByManual", "Activo durante:")}{" "}
                    <Box
                      component="span"
                      sx={{ fontWeight: 700, color: "text.primary" }}
                    >
                      {remainingLabel}
                    </Box>
                  </>
                }
                slotProps={{
                  primary: { variant: "caption", color: "text.secondary" },
                }}
              />
            </MenuItem>
          )}
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
        </>
      )}

      {routines.length > 0 && (
        <>
          <MenuItem data-testid="notification-pause-routines-section" disabled>
            <ListItemText
              primary={t(
                "notifications.pause.routines",
                "Rutinas personalizadas",
              )}
              slotProps={{
                primary: { variant: "caption", color: "text.secondary" },
              }}
            />
          </MenuItem>
          {routines.map((rule) => {
            const ruleEnabled = Boolean(rule.enabled ?? true);
            const isActiveNow = Boolean(
              rule.id && rule.id === activeRoutineId && isRoutineActive,
            );
            const handleRoutineClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (dndActive || isActiveNow) return;
              onClose();
              onSelectRoutine(rule.id ?? "");
            };
            return (
              <MenuItem
                key={rule.id ?? `${rule.start}-${rule.end}`}
                data-testid={`notification-pause-routine-${rule.id}`}
                onClick={
                  dndActive || isActiveNow ? undefined : handleRoutineClick
                }
                sx={{
                  px: 2,
                  py: 1,
                  ...(dndActive
                    ? blockedStyle
                    : {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: isActiveNow ? "default" : "pointer",
                        backgroundColor: isActiveNow
                          ? "rgba(255,255,255,0.06)"
                          : undefined,
                        "&:hover": isActiveNow
                          ? { backgroundColor: "rgba(255,255,255,0.06)" }
                          : { backgroundColor: "rgba(255,255,255,0.08)" },
                      }),
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <ListItemText
                    primary={
                      <>
                        {rule.name ||
                          t(
                            "notifications.pause.ruleNamePlaceholder",
                            "Rutina",
                          )}
                        {isActiveNow && (
                          <Box
                            component="span"
                            sx={{
                              ml: 1,
                              px: 0.75,
                              py: 0.25,
                              borderRadius: "999px",
                              bgcolor: "primary.main",
                              color: "#fff",
                              fontSize: "0.6rem",
                              fontWeight: 700,
                              verticalAlign: "middle",
                            }}
                          >
                            {t("notifications.pause.activeNow", "ACTIVA")}
                          </Box>
                        )}
                      </>
                    }
                    secondary={
                      <>
                        {formatDayRange(rule.days, locale)} ·{rule.start} →{" "}
                        {rule.end}
                      </>
                    }
                    slotProps={{
                      primary: {
                        variant: "body2",
                        color: ruleEnabled ? "text.primary" : "text.disabled",
                      },
                      secondary: {
                        variant: "caption",
                        color: "text.secondary",
                      },
                    }}
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 0.5, ml: 1 }}>
                  <IconButton
                    size="small"
                    disabled={dndActive || isActiveNow}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onClose();
                      onEditRoutine(rule);
                    }}
                    title={t("notifications.pause.rule.edit", "Editar")}
                    aria-label={t("notifications.pause.rule.edit", "Editar")}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={dndActive || isActiveNow}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onClose();
                      onDeleteRoutine(rule.id ?? "");
                    }}
                    title={t("notifications.pause.scheduleDelete", "Eliminar")}
                    aria-label={t(
                      "notifications.pause.scheduleDelete",
                      "Eliminar",
                    )}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </MenuItem>
            );
          })}
        </>
      )}

      {PAUSE_OPTIONS.map((option) => {
        const disabled = dndActive;
        return (
          <MenuItem
            key={option}
            data-testid={`notification-pause-${option}`}
            disabled={disabled}
            onClick={() => choose(option)}
            sx={{
              ...(disabled ? blockedStyle : {}),
            }}
          >
            {labelForOption(option)}
          </MenuItem>
        );
      })}
      <MenuItem
        data-testid="notification-pause-1d"
        disabled={dndActive}
        onClick={() => {
          onClose();
          onPauseUntil(tomorrow());
        }}
        sx={{
          ...(dndActive ? blockedStyle : {}),
        }}
      >
        {t("notifications.pause.tomorrow", "Hasta mañana")}
      </MenuItem>
      <MenuItem
        data-testid="notification-pause-custom"
        disabled={dndActive}
        onClick={() => {
          onClose();
          onOpenSchedule();
        }}
        sx={{
          ...(dndActive ? blockedStyle : {}),
        }}
      >
        {t("notifications.pause.custom", "Personalizado")}
      </MenuItem>
    </Menu>
  );
}
