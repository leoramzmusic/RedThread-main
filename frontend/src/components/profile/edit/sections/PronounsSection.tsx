import {
  Grid,
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Info as InfoIcon,
  Male,
  Female,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { Controller } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { ListSubheader } from "@mui/material";
import { PRONOUN_CATEGORIES } from "../../../../constants/profileOptions";
import { SectionWithOptionsProps } from "../types";

interface PronounsSectionProps extends SectionWithOptionsProps {
  setPronounsInfoOpen: (open: boolean) => void;
}

export default function PronounsSection({
  control,
  setPronounsInfoOpen,
}: PronounsSectionProps) {
  const { t } = useTranslation("common");
  // Display-only: stored values stay as-is; categories/options render translated.
  const normKey = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  const pCat = (cat: string) => t(`profile.pronouns.cat.${normKey(cat)}`, cat);
  const pOpt = (opt: string) => t(`profile.pronouns.opt.${normKey(opt)}`, opt);
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
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
            pr={2}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Box display="flex" sx={{ color: "text.secondary" }}>
                <Male fontSize="small" />
                <Female fontSize="small" />
              </Box>
              <Typography variant="h6">
                {t("profile.pronouns.title", "Pronombres")}
              </Typography>
            </Box>
            <Tooltip
              title={t(
                "profile.pronouns.tooltip",
                "Tu pronombre es parte de tu identidad. La compatibilidad se basa en la orientación sexual y otros factores.",
              )}
            >
              <IconButton
                size="small"
                component="span"
                onClick={(e) => {
                  e.stopPropagation();
                  setPronounsInfoOpen(true);
                }}
              >
                <InfoIcon fontSize="small" color="info" />
              </IconButton>
            </Tooltip>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2.5, pb: 2, pt: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 2, fontWeight: 500 }}
          >
            {t(
              "profile.pronouns.quote",
              "“Tus pronombres definen cómo te nombramos, no cómo conectas.”",
            )}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="pronouns"
                control={control}
                render={({ field }) => (
                  <FormControl size="small" fullWidth>
                    <InputLabel>
                      {t("profile.pronouns.label", "Pronombres")}
                    </InputLabel>
                    <Select size="small"
                      {...field}
                      label={t("profile.pronouns.label", "Pronombres")}
                    >
                      <MenuItem value="">
                        {t("common.selectPlaceholder", "Selecciona...")}
                      </MenuItem>
                      {PRONOUN_CATEGORIES.flatMap((c) => [
                        <ListSubheader key={c.category}>
                          {pCat(c.category)}
                        </ListSubheader>,
                        ...c.options.map((o) => (
                          <MenuItem key={o} value={o}>
                            {pOpt(o)}
                          </MenuItem>
                        )),
                      ])}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}
