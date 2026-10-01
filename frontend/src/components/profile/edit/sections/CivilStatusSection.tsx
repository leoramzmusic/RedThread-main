import {
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  VolunteerActivism,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { Controller } from "react-hook-form";
import { useTranslation } from "next-i18next";
import PartnerManager from "../../PartnerManager";
import { SectionWithOptionsProps } from "../types";

interface CivilStatusSectionProps extends SectionWithOptionsProps {
  relationshipStatus: string;
  profile: any;
  onSave: (data: any) => Promise<void>;
  isDiscovery?: boolean;
}

export default function CivilStatusSection({
  control,
  options,
  relationshipStatus,
  profile,
  watch,
  onSave,
  isDiscovery = false,
}: CivilStatusSectionProps) {
  const { t } = useTranslation("common");
  return (
    <Grid item xs={12}>
      <Accordion
        defaultExpanded
        sx={{
          position: "relative",
          border: isDiscovery
            ? "none"
            : (theme) => "1px solid " + theme.palette.divider,
          boxShadow: isDiscovery ? 0 : 1,
          backgroundImage: "none",
          bgcolor: isDiscovery ? "transparent" : "inherit",
          borderRadius: "12px !important",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary
          expandIcon={
            <ExpandMoreIcon sx={{ color: isDiscovery ? "white" : "inherit" }} />
          }
          sx={{ px: isDiscovery ? 1 : 3, py: 1 }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <VolunteerActivism
              sx={{ color: isDiscovery ? "white" : "action.active" }}
            />
            <Typography
              variant="h6"
              sx={{ color: isDiscovery ? "white" : "inherit" }}
            >
              {t("profileSections.civil.title", "Estado Civil y Pareja")}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: isDiscovery ? 1 : 3, pb: 2, pt: 0 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="relationship_status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>
                      {t("profileSections.civil.statusLabel", "Estado Civil")}
                    </InputLabel>
                    <Select
                      {...field}
                      label={t(
                        "profileSections.civil.statusLabel",
                        "Estado Civil",
                      )}
                    >
                      <MenuItem value="">
                        {t("common.selectPlaceholder", "Selecciona...")}
                      </MenuItem>
                      {options.relationship_status?.map((opt: any) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {(relationshipStatus === "in_relationship" ||
              relationshipStatus === "married" ||
              relationshipStatus === "open_relationship") && (
              <Grid item xs={12} md={6}>
                <PartnerManager
                  profile={profile}
                  onUpdate={() => {
                    onSave(watch());
                  }}
                />
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}
