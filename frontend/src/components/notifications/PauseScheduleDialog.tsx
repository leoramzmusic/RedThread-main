import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
  DarkMode as NightIcon,
  DeleteOutlined as DeleteIcon,
  EditOutlined as EditIcon,
} from "@mui/icons-material";
import { useTranslation } from "next-i18next/pages";
import {
  formatDayList,
  formatDayRange,
  isContiguousRange,
  PAUSE_EXCEPTIONS,
  weekdayLabels,
  weekdayNames,
  type PauseScheduleRule,
} from "./pauseTime";

export type PauseMode = "single" | "recurring";

interface PauseScheduleDialogProps {
  open: boolean;
  locale: string;
  schedule: PauseScheduleRule[];
  singleWindow: { start: string | null; end: string | null } | null;
  allow: string[];
  onClose: () => void;
  onSaveSingle: (payload: {
    from: string;
    to: string;
    allow: string[];
  }) => void;
  onSaveRule: (payload: {
    id: string | null;
    name: string;
    days: number[];
    start: string;
    end: string;
    timezone: string;
    utc_offset_minutes: number;
    allow: string[];
  }) => void;
  onDelete: (id: string) => void;
}

const DEFAULT_DAYS = [0, 1, 2, 3, 4];
const ACCENT = "#FF4757";

function toLocalInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultSingleWindow(): { from: string; to: string } {
  const from = new Date();
  from.setMinutes(0, 0, 0);
  const to = new Date(from.getTime() + 2 * 60 * 60 * 1000);
  return { from: toLocalInput(from), to: toLocalInput(to) };
}

export default function PauseScheduleDialog({
  open,
  locale,
  schedule,
  singleWindow,
  allow,
  onClose,
  onSaveSingle,
  onSaveRule,
  onDelete,
}: PauseScheduleDialogProps) {
  const { t } = useTranslation("common");
  const [mode, setMode] = useState<PauseMode>("recurring");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState("");
  const [days, setDays] = useState<number[]>(DEFAULT_DAYS);
  const [start, setStart] = useState("18:00");
  const [end, setEnd] = useState("08:00");
  const [single, setSingle] = useState(() =>
    singleWindow?.start && singleWindow?.end
      ? {
          from: toLocalInput(new Date(singleWindow.start)),
          to: toLocalInput(new Date(singleWindow.end)),
        }
      : defaultSingleWindow(),
  );
  const [exceptions, setExceptions] = useState<string[]>(allow);
  const shortLabels = useMemo(() => weekdayLabels(locale), [locale]);
  const longLabels = useMemo(() => weekdayNames(locale), [locale]);
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

  const toggleException = (types: string[]) => {
    setExceptions((prev) => {
      const has = types.every((type) => prev.includes(type));
      return has
        ? prev.filter((type) => !types.includes(type))
        : [...new Set([...prev, ...types])];
    });
  };

  const startEditing = (rule: PauseScheduleRule) => {
    setMode("recurring");
    setEditingId(rule.id ?? null);
    setRuleName(rule.name ?? "");
    setDays(rule.days);
    setStart(rule.start);
    setEnd(rule.end);
    setExceptions(rule.allow ?? []);
  };

  const save = () => {
    if (mode === "single") {
      onSaveSingle({
        from: new Date(single.from).toISOString(),
        to: new Date(single.to).toISOString(),
        allow: exceptions,
      });
    } else {
      onSaveRule({
        id: editingId,
        name: ruleName.trim(),
        days: [...days].sort(),
        start,
        end,
        timezone,
        utc_offset_minutes: offsetMinutes,
        allow: exceptions,
      });
    }
    onClose();
  };

  const previewText = () => {
    if (mode === "single") {
      return t(
        "notifications.pause.preview.single",
        "Las notificaciones se silenciarán del {{from}} al {{to}}.",
        {
          from: single.from.replace("T", " "),
          to: single.to.replace("T", " "),
        },
      );
    }
    if (isContiguousRange(days) && days.length > 1) {
      return t(
        "notifications.pause.preview.range",
        "Las notificaciones se silenciarán de {{from}} a {{to}}, de {{start}} a {{end}}.",
        {
          from: longLabels[Math.min(...days)],
          to: longLabels[Math.max(...days)],
          start,
          end,
        },
      );
    }
    return t(
      "notifications.pause.preview.days",
      "Las notificaciones se silenciarán los {{days}}, de {{start}} a {{end}}.",
      { days: formatDayList(days, locale), start, end },
    );
  };

  const previewAllow = () => {
    if (exceptions.length === 0) return null;
    const labels = PAUSE_EXCEPTIONS.filter((item) =>
      item.types.some((type) => exceptions.includes(type)),
    ).map((item) => t(`notifications.pause.allow.${item.key}`));
    return t(
      "notifications.pause.preview.allow",
      "Seguirán entrando: {{items}}.",
      { items: labels.join(", ") },
    );
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
            width: { xs: "95%", sm: "88%", md: "72%" },
            maxHeight: "86vh",
            borderRadius: "24px",
            background: "#15161F",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          height: 72,
          px: 3,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Typography variant="h6" component="span" sx={{ flex: 1 }}>
          {t("notifications.pause.schedule", "Programar pausas")}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label={t("notifications.bulk.cancel", "Cancelar")}
          sx={{
            color: "text.secondary",
            "&:hover": { color: ACCENT, background: "rgba(255,71,87,0.12)" },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: 3, py: 2.5 }}>
        <RadioGroup
          value={mode}
          onChange={(event) => setMode(event.target.value as PauseMode)}
          row
          sx={{ mb: 2, gap: 2 }}
        >
          <FormControlLabel
            value="single"
            data-testid="notification-pause-mode-single"
            control={<Radio size="small" />}
            label={t("notifications.pause.mode.single", "Pausa única")}
          />
          <FormControlLabel
            value="recurring"
            data-testid="notification-pause-mode-recurring"
            control={<Radio size="small" />}
            label={t("notifications.pause.mode.recurring", "Recurrente")}
          />
        </RadioGroup>

        {mode === "single" ? (
          <Stack spacing={2}>
            <TextField
              data-testid="notification-pause-single-from"
              type="datetime-local"
              label={t("notifications.pause.scheduleStart", "Desde")}
              value={single.from}
              onChange={(event) =>
                setSingle((prev) => ({ ...prev, from: event.target.value }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              data-testid="notification-pause-single-to"
              type="datetime-local"
              label={t("notifications.pause.scheduleEnd", "Hasta")}
              value={single.to}
              onChange={(event) =>
                setSingle((prev) => ({ ...prev, to: event.target.value }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Stack>
        ) : (
          <Stack spacing={2.5}>
            <TextField
              data-testid="notification-pause-name"
              label={t("notifications.pause.ruleName", "Nombre de la pausa")}
              placeholder={t(
                "notifications.pause.ruleNamePlaceholder",
                "Horario laboral",
              )}
              value={ruleName}
              onChange={(event) => setRuleName(event.target.value)}
              fullWidth
            />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t("notifications.pause.scheduleDays", "Días")}
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ flexWrap: "wrap" }}
              >
                {shortLabels.map((label, day) => {
                  const selected = days.includes(day);
                  return (
                    <Chip
                      key={day}
                      data-testid={`notification-pause-day-${day}`}
                      label={label}
                      onClick={() => toggleDay(day)}
                      size="small"
                      sx={{
                        background: selected
                          ? "rgba(255,71,87,0.12)"
                          : "transparent",
                        border: `1px solid ${
                          selected ? ACCENT : "rgba(255,255,255,0.12)"
                        }`,
                        color: selected ? ACCENT : "text.secondary",
                        fontWeight: selected ? 700 : 500,
                        "&:hover": {
                          borderColor: ACCENT,
                          color: ACCENT,
                          background: "rgba(255,71,87,0.12)",
                        },
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>
            <Stack
              direction="row"
              spacing={2}
              useFlexGap
              sx={{ flexWrap: "wrap" }}
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
            </Stack>
          </Stack>
        )}

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {t("notifications.pause.preview.title", "Vista previa")}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {previewText()}
          </Typography>
          {previewAllow() && (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 0.5 }}
            >
              {previewAllow()}
            </Typography>
          )}
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t(
              "notifications.pause.allow.title",
              "Permitir notificaciones prioritarias",
            )}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              columnGap: 2,
            }}
          >
            {PAUSE_EXCEPTIONS.map((item) => {
              const checked = item.types.every((type) =>
                exceptions.includes(type),
              );
              return (
                <FormControlLabel
                  key={item.key}
                  data-testid={`notification-pause-allow-${item.key}`}
                  control={
                    <Checkbox
                      size="small"
                      checked={checked}
                      onChange={() => toggleException(item.types)}
                    />
                  }
                  label={t(`notifications.pause.allow.${item.key}`)}
                />
              );
            })}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
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
          <Stack spacing={1.5}>
            {schedule.map((rule) => (
              <Box
                key={rule.id ?? `${rule.start}-${rule.end}`}
                data-testid={`notification-pause-rule-${rule.id}`}
                sx={{
                  p: 1.75,
                  borderRadius: "18px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <NightIcon sx={{ color: ACCENT, fontSize: 20 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {rule.name ||
                      t(
                        "notifications.pause.ruleNamePlaceholder",
                        "Horario laboral",
                      )}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    {formatDayRange(rule.days, locale)} · {rule.start} →{" "}
                    {rule.end}
                  </Typography>
                </Box>
                <IconButton
                  data-testid={`notification-pause-rule-edit-${rule.id}`}
                  onClick={() => startEditing(rule)}
                  title={t("notifications.pause.rule.edit", "Editar")}
                  aria-label={t("notifications.pause.rule.edit", "Editar")}
                  size="small"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  data-testid={`notification-pause-rule-delete-${rule.id}`}
                  onClick={() => onDelete(rule.id ?? "")}
                  title={t("notifications.pause.scheduleDelete", "Eliminar")}
                  aria-label={t(
                    "notifications.pause.scheduleDelete",
                    "Eliminar",
                  )}
                  size="small"
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Stack>
        )}

        <Typography variant="caption" sx={{ display: "block", mt: 2 }}>
          {t(
            "notifications.pause.scheduleTimezone",
            "Zona horaria: {{timezone}}",
            {
              timezone,
            },
          )}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          {t("notifications.bulk.cancel", "Cancelar")}
        </Button>
        <Button
          variant="contained"
          onClick={save}
          disabled={mode === "recurring" && days.length === 0}
          data-testid="notification-pause-schedule-save"
        >
          {t("notifications.pause.scheduleSave", "Guardar")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
