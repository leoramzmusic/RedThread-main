import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Switch,
  Stack,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Alert,
} from "@mui/material";
import apiClient from "../../../../services/api";
import {
  Edit as EditIcon,
  PhotoLibrary,
  AutoAwesome,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { useTranslation } from "next-i18next";
import { useEffect, useRef, useState } from "react";
import MediaManager from "../../MediaManager";
import { smartPhotosTracker } from "../../../../services/smartPhotos";

interface PhotosSectionProps {
  profile: any;
  smartPhotos: boolean;
  setSmartPhotos: (value: boolean) => void;
}

export default function PhotosSection({
  profile,
  smartPhotos,
  setSmartPhotos,
}: PhotosSectionProps) {
  const { t } = useTranslation("common");
  const [smartPhotosSnackbar, setSmartPhotosSnackbar] = useState(false);
  const [smartChosenSnackbar, setSmartChosenSnackbar] = useState(false);
  const [galleryRefreshKey, setGalleryRefreshKey] = useState(0);
  const [resumeDone, setResumeDone] = useState(false);
  const [resuming, setResuming] = useState(false);
  const evaluatedOnMount = useRef(false);

  // Manual-order lock set by the backend when the user reorders by hand.
  const lockUntilRaw: string | null =
    profile?.smart_photos_manual_lock_until ?? null;
  const lockActive =
    !resumeDone &&
    !!lockUntilRaw &&
    new Date(lockUntilRaw).getTime() > Date.now();

  const handleResumeSmartPhotos = async () => {
    setResuming(true);
    try {
      const res = await apiClient.post("/media/smart-photos/resume");
      setResumeDone(true);
      if (res.data?.changed) {
        setSmartChosenSnackbar(true);
        setGalleryRefreshKey((k) => k + 1);
      }
    } catch (err) {
      console.error("Failed to resume Smart Photos:", err);
    } finally {
      setResuming(false);
    }
  };

  // When opening the section with Smart Photos on, re-evaluate once:
  // if the ranking changed, celebrate it and refresh the gallery.
  useEffect(() => {
    if (!smartPhotos || !profile?.user_id || evaluatedOnMount.current) return;
    evaluatedOnMount.current = true;
    smartPhotosTracker.evaluateSmartPhotos().then((result) => {
      if (result.changed) {
        setSmartChosenSnackbar(true);
        setGalleryRefreshKey((k) => k + 1);
      }
    });
  }, [smartPhotos, profile?.user_id]);

  const handleSmartPhotosChange = async (enabled: boolean) => {
    setSmartPhotos(enabled);
    if (enabled) {
      setSmartPhotosSnackbar(true);
      // Trigger immediate evaluation when user enables Smart Photos
      const result = await smartPhotosTracker.evaluateSmartPhotos();
      if (result.changed) {
        setSmartChosenSnackbar(true);
        setGalleryRefreshKey((k) => k + 1);
      }
    }
  };

  return (
    <Grid item xs={12}>
      <Accordion
        defaultExpanded
        sx={{
          position: "relative",
          border: (theme) => "1px solid " + theme.palette.divider,
          boxShadow: 1,
          backgroundImage: "none",
          borderRadius: "16px",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1 }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <PhotoLibrary color="action" />
            <Typography variant="h6" fontWeight="600">
              {t("profile.photos.title", "Fotos")}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2.5, pb: 2, pt: 0 }}>
          <MediaManager
            key={galleryRefreshKey}
            userId={profile.user_id}
            smartPhotosEnabled={smartPhotos}
          />

          {smartPhotos && lockActive ? (
            <Alert
              severity="info"
              sx={{ mt: 1.5, borderRadius: "12px" }}
              action={
                <Button
                  size="small"
                  onClick={() => void handleResumeSmartPhotos()}
                  disabled={resuming}
                >
                  {t("profile.photos.resumeSmart", "Reanudar Smart")}
                </Button>
              }
            >
              {t(
                "profile.photos.manualLock",
                "Ordenaste tus fotos manualmente: Smart Photos está en pausa y respetará tu orden.",
              )}
            </Alert>
          ) : null}

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={1.5}
            p={1.5}
            bgcolor="action.hover"
            borderRadius="12px"
            border="1px solid"
            borderColor="divider"
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                <Typography variant="subtitle2" fontWeight="600">
                  {t("profile.photos.smartTitle", "Smart Photos")}
                </Typography>
                <Tooltip
                  title={t(
                    "profile.photos.smartTooltip",
                    "Activa para mostrar automáticamente tu foto más popular",
                  )}
                >
                  <AutoAwesome sx={{ fontSize: 16, color: "warning.main" }} />
                </Tooltip>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {t(
                  "profile.photos.smartDesc",
                  "Selecciona automáticamente la mejor foto según interacción",
                )}
              </Typography>
            </Box>
            <Switch
              checked={smartPhotos}
              onChange={(e) => handleSmartPhotosChange(e.target.checked)}
              inputProps={{
                "aria-label": t(
                  "profile.photos.smartToggle",
                  "Smart Photos Toggle",
                ),
              }}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      <Snackbar
        open={smartPhotosSnackbar}
        autoHideDuration={6000}
        onClose={() => setSmartPhotosSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          onClose={() => setSmartPhotosSnackbar(false)}
          sx={{ width: "100%", mb: 2 }}
          variant="filled"
        >
          {t(
            "profile.photos.smartEnabled",
            "Smart Photos activado: tu mejor foto se seleccionará automáticamente según interacciones",
          )}
        </Alert>
      </Snackbar>

      <Snackbar
        open={smartChosenSnackbar}
        autoHideDuration={6000}
        onClose={() => setSmartChosenSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="info"
          onClose={() => setSmartChosenSnackbar(false)}
          sx={{ width: "100%", mb: 2 }}
          variant="filled"
        >
          {t(
            "profile.photos.smartChosen",
            "Smart Photos eligió esta como tu mejor foto según interacción",
          )}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
