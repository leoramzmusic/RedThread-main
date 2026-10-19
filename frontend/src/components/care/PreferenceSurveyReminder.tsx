import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, Button, Stack } from "@mui/material";
import { CARE_DIMENSION_KEYS } from "../../constants/careDimensions";
import { listPreferences } from "../../services/carePreferencesService";

export default function PreferenceSurveyReminder() {
  const [pending, setPending] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await listPreferences();
        if (cancelled) return;
        const answered = new Set(items.map((item) => item.dimension));
        setPending(
          CARE_DIMENSION_KEYS.filter((key) => !answered.has(key)).length,
        );
      } catch {
        if (!cancelled) setPending(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (dismissed || !pending) return null;

  const message =
    pending === 1
      ? "Tienes 1 pregunta pendiente en tus preferencias, ¿quieres continuar?"
      : `Tienes ${pending} preguntas pendientes en tus preferencias, ¿quieres continuar?`;

  return (
    <Alert
      data-testid="preferences-reminder"
      severity="info"
      sx={{ mb: 2 }}
      action={
        <Stack direction="row" spacing={1}>
          <Button
            data-testid="preferences-reminder-cta"
            component={Link}
            href="/discover#care-preferences"
            size="small"
          >
            Continuar
          </Button>
          <Button
            data-testid="preferences-reminder-dismiss"
            size="small"
            color="inherit"
            onClick={() => setDismissed(true)}
          >
            Ahora no
          </Button>
        </Stack>
      }
    >
      {message}
    </Alert>
  );
}
