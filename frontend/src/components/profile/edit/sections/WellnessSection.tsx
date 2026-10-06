import {
  HealthAndSafety,
  Accessible,
  MedicalServices,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { Control, Controller, UseFormSetValue } from "react-hook-form";
import { useTranslation } from "next-i18next";
import {
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";

import EnergyLevelSelector from "./EnergyLevelSelector";
import HealthConditionsSelector from "./HealthConditionsSelector";
import DisabilitySelector from "./DisabilitySelector";

interface WellnessSectionProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
}

export default function WellnessSection({
  control,
  setValue,
}: WellnessSectionProps) {
  const { t } = useTranslation("common");

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
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <HealthAndSafety color="action" />
            <Typography variant="h6">
              {t("profile.health.title", { defaultValue: "Salud y Bienestar" })}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2.5, pb: 2, pt: 0 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <HealthConditionsSelector
                control={control}
                name="health_conditions"
                statusName="health_status"
                privacyName="show_health"
                label={t("profile.health.conditions.label", {
                  defaultValue: "Condiciones de salud",
                })}
                color="#ef5350"
              />
            </Grid>
            <Grid item xs={12}>
              <DisabilitySelector
                control={control}
                setValue={setValue}
                name="disabilities"
                diagnosesName="disabilities_diagnoses"
                privacyName="show_disabilities"
                label={t("profile.health.disability.label", {
                  defaultValue: "Discapacidad",
                })}
                color="#9e9e9e"
                options={[
                  {
                    value: "visual",
                    label: t("profile.health.disability.visual", {
                      defaultValue: "Visual",
                    }),
                  },
                  {
                    value: "auditory",
                    label: t("profile.health.disability.auditory", {
                      defaultValue: "Auditiva",
                    }),
                  },
                  {
                    value: "motor",
                    label: t("profile.health.disability.motor", {
                      defaultValue: "Motriz",
                    }),
                  },
                  {
                    value: "cognitive",
                    label: t("profile.health.disability.cognitive", {
                      defaultValue: "Cognitiva",
                    }),
                  },
                  {
                    value: "psychosocial",
                    label: t("profile.health.disability.psychosocial", {
                      defaultValue: "Psicosocial",
                    }),
                  },
                  {
                    value: "neurological",
                    label: t("profile.health.disability.neurological", {
                      defaultValue: "Neurológica",
                    }),
                  },
                  {
                    value: "intellectual",
                    label: t("profile.health.disability.intellectual", {
                      defaultValue: "Intelectual",
                    }),
                  },
                ]}
              />
            </Grid>
            <Grid item xs={12}>
              <EnergyLevelSelector
                control={control}
                name="energy_level"
                label={t("profile.health.energy.label", {
                  defaultValue: "Nivel de energía",
                })}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}

// Helper needed because alpha is not imported from MUI normally in a file like this
import { alpha } from "@mui/material/styles";
