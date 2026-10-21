import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
  DeleteOutlined as DeleteIcon,
} from "@mui/icons-material";
import { useTranslation } from "next-i18next/pages";
import {
  describePauseRule,
  weekdayLabels,
  type PauseScheduleRule,
} from "./pauseTime";

interface PauseScheduleDialogProps {
  open: boolean;
  schedule: PauseScheduleRule[];
  onClose: () => void;
  onSave: (rule: PauseScheduleRule) => void;
  onDelete: (index: number) => void;
}

const DEFAULT_DAYS = [0, 1, 2, 3, 4];

export default function PauseScheduleDialog({
  open,
  schedule,
  onClose,
  onSave,
  onDelete,
}: PauseScheduleDialogProps) {
  const { t, i18n } = useTranslation("common");
  const [days, setDays] = useState<number[]>(DEFAULT_DAYS);
  const [start, setStart] = useState("18:00");
  const [end, setEnd] = useState("08:00");

  const locale = i18n?.language ?? "es";
  const labels = useMemo(() => weekdayLabels(locale), [locale]);
  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);
  const offsetMinutes = useMemo(() => -new Date().getTimezoneOffset(), []);

  const toggleDay = (day: number) => {
    setDays((prev) =>
      prev.includes(day)
        ? prev.filter((item) => item !== day)
        : [...prev, day].sort(),
    );
  };

  const save = () => {
    onSave({
      days: [...days].sort(),
      start,
      end,
      timezone,
      utc_offset_minutes: offsetMinutes,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            m: { xs: 1, sm: 2 },
            mx: "auto",
            width: { xs: "95%", sm: "80%", md: "70%" },
            maxHeight: "80vh",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          onClick={onClose}
          size="small"
          color="error"
          aria-label={t("notifications.bulk.cancel", "Cancelar")}
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" component="span" sx={{ flex: 1 }}>
          {t("notifications.pause.schedule", "Programar pausas")}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          {t(
            "notifications.pause.scheduleHint",
            "Elige los días y las horas en las que no quieres recibir alertas.",
          )}
        </Typography>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t("notifications.pause.scheduleDays", "Días")}
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          {labels.map((label, day) => (
            <Chip
              key={day}
              data-testid={`notification-pause-day-${day}`}
              label={label}
              onClick={() => toggleDay(day)}
              color={days.includes(day) ? "primary" : "default"}
              variant={days.includes(day) ? "filled" : "outlined"}
              size="small"
            />
          ))}
        </Stack>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mt: 3,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <TextField
            data-testid="notification-pause-start"
            type="time"
            label={t("notifications.pause.scheduleStart", "Desde")}
            value={start}
            onChange={(event) => setStart(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 160 }}
          />
          <TextField
            data-testid="notification-pause-end"
            type="time"
            label={t("notifications.pause.scheduleEnd", "Hasta")}
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 160 }}
          />
        </Box>
        <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
          {t(
            "notifications.pause.scheduleTimezone",
            "Zona horaria: {{timezone}}",
            {
              timezone,
            },
          )}
        </Typography>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t("notifications.pause.scheduleList", "Pausas programadas")}
        </Typography>
        {schedule.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t(
              "notifications.pause.scheduleEmpty",
              "Todavía no tienes pausas programadas",
            )}
          </Typography>
        ) : (
          schedule.map((rule, index) => (
            <Box
              key={`${rule.start}-${rule.days.join("-")}-${index}`}
              data-testid={`notification-pause-rule-${index}`}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                py: 0.5,
              }}
            >
              <Typography variant="body2">
                {describePauseRule(rule, locale)}
              </Typography>
              <IconButton
                data-testid={`notification-pause-rule-delete-${index}`}
                onClick={() => onDelete(index)}
                title={t("notifications.pause.scheduleDelete", "Eliminar")}
                aria-label={t("notifications.pause.scheduleDelete", "Eliminar")}
                size="small"
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          {t("notifications.bulk.cancel", "Cancelar")}
        </Button>
        <Button
          variant="contained"
          disabled={days.length === 0}
          onClick={save}
          data-testid="notification-pause-schedule-save"
        >
          {t("notifications.pause.scheduleSave", "Guardar")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
