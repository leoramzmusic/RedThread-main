import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItemIcon,
  ListSubheader,
  Menu,
  MenuItem,
  TextField,
} from "@mui/material";
import { PlayArrow as ResumeIcon } from "@mui/icons-material";
import { useTranslation } from "next-i18next/pages";

export const PAUSE_OPTIONS = ["15m", "30m", "1h", "4h"] as const;

export type PauseOption = (typeof PAUSE_OPTIONS)[number] | "1d";

interface PauseMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  paused: boolean;
  onClose: () => void;
  onPause: (duration: PauseOption) => void;
  onPauseUntil: (until: string) => void;
  onResume: () => void;
}

function toLocalInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
}

function defaultCustomValue(): string {
  const target = new Date(Date.now() + 60 * 60 * 1000);
  target.setSeconds(0, 0);
  return toLocalInputValue(target);
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
}: PauseMenuProps) {
  const { t } = useTranslation("common");
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [openedAt, setOpenedAt] = useState(0);

  const customDate = new Date(customValue);
  const customValid =
    Boolean(customValue) &&
    !Number.isNaN(customDate.getTime()) &&
    customDate.getTime() > openedAt;

  const choose = (duration: PauseOption) => {
    onClose();
    onPause(duration);
  };

  return (
    <>
      {!customOpen && (
        <Menu
          data-testid="notification-pause-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={onClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <ListSubheader component="div">
            {t("notifications.pause.title")}
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
              {t("notifications.pause.resume")}
            </MenuItem>
          )}
          {PAUSE_OPTIONS.map((option) => (
            <MenuItem
              key={option}
              data-testid={`notification-pause-${option}`}
              onClick={() => choose(option)}
            >
              {t(`notifications.snooze.${option}`)}
            </MenuItem>
          ))}
          <MenuItem
            data-testid="notification-pause-1d"
            onClick={() => {
              onClose();
              onPauseUntil(tomorrowMorning());
            }}
          >
            {t("notifications.pause.tomorrow")}
          </MenuItem>
          <MenuItem
            data-testid="notification-pause-custom"
            onClick={() => {
              onClose();
              setCustomValue(defaultCustomValue());
              setOpenedAt(Date.now());
              setCustomOpen(true);
            }}
          >
            {t("notifications.pause.custom")}
          </MenuItem>
        </Menu>
      )}
      <Dialog
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("notifications.pause.customTitle")}</DialogTitle>
        <DialogContent>
          <TextField
            data-testid="notification-pause-custom-input"
            type="datetime-local"
            value={customValue}
            onChange={(event) => setCustomValue(event.target.value)}
            fullWidth
            sx={{ mt: 1 }}
            slotProps={{
              htmlInput: { min: toLocalInputValue(new Date()) },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCustomOpen(false)}
            data-testid="notification-pause-custom-cancel"
          >
            {t("notifications.bulk.cancel")}
          </Button>
          <Button
            variant="contained"
            disabled={!customValid}
            data-testid="notification-pause-custom-confirm"
            onClick={() => {
              onPauseUntil(customDate.toISOString());
              setCustomOpen(false);
            }}
          >
            {t("notifications.pause.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
