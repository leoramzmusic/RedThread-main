import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Box, Button, IconButton, Paper, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { CARE_DIMENSION_KEYS } from "../../constants/careDimensions";
import { listPreferences } from "../../services/carePreferencesService";
import CarePreferenceSurvey from "./CarePreferenceSurvey";

export default function CarePreferenceSurveyBubble() {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await listPreferences();
        if (cancelled) return;
        const answered = new Set(items.map((item) => item.dimension));
        setPendingCount(
          CARE_DIMENSION_KEYS.filter((key) => !answered.has(key)).length,
        );
      } catch {
        if (!cancelled) setPendingCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (router.isReady && router.query.encuesta === "1") setOpen(true);
  }, [router.isReady, router.query.encuesta]);

  const handlePendingChange = useCallback((count: number) => {
    setPendingCount(count);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("care-preferences-changed", { detail: count }),
      );
    }
  }, []);

  if (pendingCount === null) return null;
  if (pendingCount === 0 && !open) return null;

  const positionSx = {
    position: "fixed",
    right: { xs: 16, sm: 24 },
    bottom: { xs: 88, sm: 96 },
    zIndex: 1200,
  };

  if (!open) {
    return (
      <Button
        data-testid="survey-bubble"
        variant="contained"
        onClick={() => setOpen(true)}
        startIcon={<AssignmentIcon />}
        sx={{
          ...positionSx,
          borderRadius: "999px",
          textTransform: "none",
          boxShadow: 6,
        }}
      >
        Tienes una encuesta disponible
      </Button>
    );
  }

  return (
    <Paper
      data-testid="survey-bubble-panel"
      elevation={12}
      sx={{
        ...positionSx,
        width: { xs: "calc(100vw - 32px)", sm: 420 },
        maxHeight: { xs: "calc(100vh - 180px)", sm: "calc(100vh - 140px)" },
        display: "flex",
        flexDirection: "column",
        bgcolor: "#1F1F1F",
        color: "#FFFFFF",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Preferencias CARE
        </Typography>
        <IconButton
          data-testid="survey-bubble-close"
          aria-label="Cerrar encuesta"
          onClick={() => setOpen(false)}
          sx={{ color: "#FFFFFF" }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ px: 2, pb: 2, overflowY: "auto" }}>
        <CarePreferenceSurvey onPendingChange={handlePendingChange} />
      </Box>
    </Paper>
  );
}
