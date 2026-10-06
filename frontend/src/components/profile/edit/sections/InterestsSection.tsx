import {
  Grid,
  Paper,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { AutoAwesome, ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import { useTranslation } from "next-i18next";
import LifestyleInterests from "../../LifestyleInterests";

interface InterestsSectionProps {
  lifestyleInterests: string[];
  setLifestyleInterests: (interests: string[]) => void;
  isDiscovery?: boolean;
}

export default function InterestsSection({
  lifestyleInterests,
  setLifestyleInterests,
  isDiscovery = false,
}: InterestsSectionProps) {
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
          ...(isDiscovery ? { bgcolor: "transparent" } : {}),
          borderRadius: "16px",
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
            <AutoAwesome
              sx={{ color: isDiscovery ? "white" : "action.active" }}
            />
            <Typography
              variant="h6"
              sx={{ color: isDiscovery ? "white" : "inherit" }}
            >
              {t("profileSections.interests.title", "Intereses")}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2.5, pb: 2, pt: 0 }}>
          <LifestyleInterests
            selectedInterests={lifestyleInterests}
            onInterestsChange={setLifestyleInterests}
            editable={true}
          />
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}
