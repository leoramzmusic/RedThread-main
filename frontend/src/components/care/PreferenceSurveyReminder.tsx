import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, Button } from "@mui/material";
import { CARE_DIMENSION_KEYS } from "../../constants/careDimensions";
import { listPreferences } from "../../services/carePreferencesService";

export default function PreferenceSurveyReminder() {
  const [pending, setPending] = useState<number | null>(null);

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

  if (!pending) return null;

  const message =
    pending === 1
      ? "Encuesta pendiente: te falta 1 pregunta para completar tus preferencias."
      : `Encuesta pendiente: te faltan ${pending} preguntas para completar tus preferencias.`;

  return (
    <Alert
      data-testid="preferences-reminder"
      severity="info"
      sx={{ mb: 2 }}
      action={
        <Button
          data-testid="preferences-reminder-cta"
          component={Link}
          href="/home?encuesta=1"
          size="small"
        >
          Continuar
        </Button>
      }
    >
      {message}
    </Alert>
  );
}
