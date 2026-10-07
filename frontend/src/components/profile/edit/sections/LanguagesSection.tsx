import {
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  FormControlLabel,
  Switch,
  Divider,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Translate,
  Language,
  Public as PublicIcon,
  AutoAwesome,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { Controller } from "react-hook-form";
import { SectionWithTranslationProps } from "../types";
import { alpha, useTheme } from "@mui/material";

interface LanguagesSectionProps extends SectionWithTranslationProps {
  options: any;
  // watch is inherited from SectionWithTranslationProps
}

export default function LanguagesSection({
  control,
  options,
  t,
  watch,
}: LanguagesSectionProps) {
  const theme = useTheme();
  const autoPreferred = watch ? watch("auto_preferred_languages") : true;
  const spokenLanguages = watch ? watch("languages") : [];

  // Check for Multilingual Badge
  let languageBadgeLabel = null;
  if (spokenLanguages && spokenLanguages.length >= 2) {
    if (spokenLanguages.length === 2)
      languageBadgeLabel = t("profile.languages.badge2", "Bilingüe");
    else if (spokenLanguages.length === 3)
      languageBadgeLabel = t("profile.languages.badge3", "Trilingüe");
    else if (spokenLanguages.length >= 4)
      languageBadgeLabel = t("profile.languages.badge4", "Políglota");
  }

  return (
    <Grid item xs={12}>
      <Accordion
        defaultExpanded
        sx={{
          position: "relative",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: 1,
          backgroundImage: "none",
          borderRadius: "16px",
          overflow: "hidden",
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
              <Translate color="action" />
              <Typography variant="h6">
                {t("profile.languages.title", "Idiomas")}
              </Typography>
            </Box>
            {languageBadgeLabel && (
              <Chip
                icon={<AutoAwesome fontSize="small" />}
                label={languageBadgeLabel}
                size="small"
                color="primary"
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                }}
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2.5, pb: 2, pt: 0 }}>
          <Grid container spacing={2}>
            {/* 1. Idiomas Hablados (Lo que ofreces) */}
            <Grid item xs={12}>
              <Controller
                name="languages"
                control={control}
                render={({ field }) => {
                  const langOpts: any[] =
                    options.languages ?? options.language ?? [];
                  const allValues = langOpts.map((o: any) => o.value);
                  const allSelected =
                    allValues.length > 0 &&
                    allValues.every((v: string) =>
                      (field.value as string[] | undefined)?.includes(v),
                    );
                  const handleLangChange = (event: any) => {
                    const value = event.target.value as string[];
                    if (value.includes("all")) {
                      field.onChange(allSelected ? [] : allValues);
                    } else {
                      field.onChange(value.filter((v: string) => v !== "all"));
                    }
                  };
                  return (
                    <FormControl size="small" fullWidth>
                      <InputLabel>
                        {t(
                          "profile.languages.spokenLabel",
                          "Idiomas que hablo",
                        )}
                      </InputLabel>
                      <Select
                        {...field}
                        multiple
                        label={t(
                          "profile.languages.spokenLabel",
                          "Idiomas que hablo",
                        )}
                        onChange={handleLangChange}
                        renderValue={(selected: any) => (
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                          >
                            {(selected as string[]).map((value) => (
                              <Chip
                                key={value}
                                label={value}
                                size="small"
                                icon={<PublicIcon fontSize="small" />}
                                sx={{ pl: 0.5 }}
                              />
                            ))}
                          </Box>
                        )}
                      >
                        <MenuItem value="all">
                          <em>
                            {t("profile.languages.all", "Todos los idiomas")}
                          </em>
                        </MenuItem>
                        {langOpts.map((opt: any) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  );
                }}
              />
            </Grid>

            {/* 2. Configuración de Matching (Lo que buscas) */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Language color="action" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={700}>
                    {t(
                      "profile.languages.affinityTitle",
                      "Afinidad Lingüística Global",
                    )}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontStyle: "italic",
                    pl: 3.5,
                    borderLeft: "3px solid",
                    borderColor: "primary.light",
                    ml: 0.5,
                  }}
                >
                  {t(
                    "profile.languages.affinityQuote",
                    '"Tus idiomas son puentes. CARE los usa para conectar con personas que puedan entenderte de verdad."',
                  )}
                </Typography>
              </Box>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                  borderRadius: 2,
                }}
              >
                <Controller
                  name="auto_preferred_languages"
                  control={control}
                  defaultValue={true}
                  render={({ field }) => (
                    <FormControlLabel
                      sx={{ width: "100%", alignItems: "flex-start", m: 0 }}
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          color="primary"
                          sx={{ mt: -0.5 }}
                        />
                      }
                      label={
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {t(
                              "profile.languages.filterLabel",
                              "Usar mis idiomas para filtrar matches",
                            )}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            sx={{ mt: 0.5, lineHeight: 1.4 }}
                          >
                            {field.value
                              ? t(
                                  "profile.languages.filterOn",
                                  "Priorizando personas que hablan tus idiomas para una comunicación fluida.",
                                )
                              : t(
                                  "profile.languages.filterOff",
                                  "Modo explorador activado: Abierto a conexiones interculturales sin barreras lingüísticas.",
                                )}
                          </Typography>
                        </Box>
                      }
                    />
                  )}
                />
              </Paper>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}
