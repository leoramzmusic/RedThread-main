import React from "react";
import { Menu, MenuItem } from "@mui/material";
import { useTranslation } from "next-i18next/pages";

export const SNOOZE_OPTIONS = [
  "15m",
  "1h",
  "2h",
  "8h",
  "1d",
  "always",
] as const;

export type SnoozeOption = (typeof SNOOZE_OPTIONS)[number];

interface SnoozeMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onSelect: (duration: SnoozeOption) => void;
}

export default function SnoozeMenu({
  anchorEl,
  open,
  onClose,
  onSelect,
}: SnoozeMenuProps) {
  const { t } = useTranslation("common");

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      onClick={(event) => event.stopPropagation()}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
    >
      {SNOOZE_OPTIONS.map((option) => (
        <MenuItem
          key={option}
          data-testid={`snooze-option-${option}`}
          onClick={() => {
            onClose();
            onSelect(option);
          }}
        >
          {t(`notifications.snooze.${option}`)}
        </MenuItem>
      ))}
    </Menu>
  );
}
