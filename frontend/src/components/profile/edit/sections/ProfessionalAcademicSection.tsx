import {
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Divider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  School,
  Work,
  Business,
  Lock,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { Controller } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { SectionWithOptionsProps } from "../types";
import OptionSelector from "./OptionSelector";

export default function ProfessionalAcademicSection({
  control,
  options,
  isDiscovery = false,
  showEducation,
  showProfessional,
}: SectionWithOptionsProps & {
  showEducation?: boolean;
  showProfessional?: boolean;
}) {
  const { t } = useTranslation("common");
  // Default to showing both if none specified (as in the main profile editor)
  const renderEducation =
    showEducation !== false && (showEducation || !showProfessional);
  const renderProfessional =
    showProfessional !== false && (showProfessional || !showEducation);
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
          overflow: "hidden",
        }}
      >
        {!isDiscovery && (
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ px: 3, py: 1 }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Work color="action" />
              <Typography variant="h6">
                {t("profile.professional.title", "Profesional y Académico")}
              </Typography>
            </Box>
          </AccordionSummary>
        )}
        <AccordionDetails sx={{ px: isDiscovery ? 1 : 2.5, pb: isDiscovery ? 3 : 2, pt: 0 }}>
          <Typography
            variant="body2"
            sx={{
              color: isDiscovery ? "rgba(255,255,255,0.7)" : "text.secondary",
              mt: 0.5,
              mb: 3,
              lineHeight: 1.4,
            }}
          >
            {t(
              "profile.professional.intro",
              "Tu historia profesional y académica es parte de tu camino. No define tu valor, pero puede conectar con quienes comparten experiencias similares.",
            )}
          </Typography>
          <Grid container spacing={2}>
            {/* Bloque 1: Educación */}
            {renderEducation && (
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <School
                    sx={{
                      color: isDiscovery ? "gold" : "#FFB300",
                      fontSize: 20,
                    }}
                  />
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{
                      color: isDiscovery ? "white" : "text.secondary",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    {t("profile.professional.education", "Educación")}
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="education_center"
                      control={control}
                      render={({ field }) => (
                        <TextField size="small"
                          {...field}
                          fullWidth
                          label={t(
                            "profile.professional.schoolLabel",
                            "Centro de estudios",
                          )}
                          placeholder={t(
                            "profile.professional.schoolPlaceholder",
                            "Universidad o Institución",
                          )}
                          variant="outlined"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: isDiscovery
                                ? "rgba(255,255,255,0.05)"
                                : "inherit",
                              color: isDiscovery ? "white" : "inherit",
                              "& fieldset": {
                                borderColor: isDiscovery
                                  ? "rgba(255,255,255,0.2)"
                                  : "inherit",
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color: isDiscovery
                                ? "rgba(255,255,255,0.7)"
                                : "inherit",
                            },
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <School
                                  sx={{
                                    color: isDiscovery ? "gold" : "#FFB300",
                                    opacity: 0.8,
                                  }}
                                />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <OptionSelector
                      control={control}
                      name="education_level"
                      label={t(
                        "profile.professional.eduLevelLabel",
                        "Nivel Educativo",
                      )}
                      icon={<School />}
                      color={isDiscovery ? "gold" : "#FFA000"}
                      options={options?.education_level || []}
                      isDiscovery={isDiscovery}
                    />
                  </Grid>
                </Grid>
              </Grid>
            )}

            {/* Bloque 2: Trabajo */}
            {renderProfessional && (
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Work sx={{ color: "#546E7A", fontSize: 20 }} />
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: 1 }}
                  >
                    {t("profile.professional.work", "Profesional")}
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="occupation"
                      control={control}
                      render={({ field }) => (
                        <TextField size="small"
                          {...field}
                          fullWidth
                          label={t(
                            "profile.professional.jobLabel",
                            "Puesto laboral",
                          )}
                          placeholder={t(
                            "profile.professional.jobPlaceholder",
                            "¿A qué te dedicas?",
                          )}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: isDiscovery
                                ? "rgba(255,255,255,0.05)"
                                : "inherit",
                              color: isDiscovery ? "white" : "inherit",
                              "& fieldset": {
                                borderColor: isDiscovery
                                  ? "rgba(255,255,255,0.2)"
                                  : "inherit",
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color: isDiscovery
                                ? "rgba(255,255,255,0.7)"
                                : "inherit",
                            },
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Work
                                  sx={{
                                    color: isDiscovery
                                      ? "rgba(255,255,255,0.7)"
                                      : "#546E7A",
                                    opacity: 0.8,
                                  }}
                                />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="work_company"
                      control={control}
                      render={({ field }) => (
                        <TextField size="small"
                          {...field}
                          fullWidth
                          label={t(
                            "profile.professional.companyLabel",
                            "Compañía",
                          )}
                          placeholder={t(
                            "profile.professional.companyPlaceholder",
                            "Nombre de la empresa",
                          )}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: isDiscovery
                                ? "rgba(255,255,255,0.05)"
                                : "inherit",
                              color: isDiscovery ? "white" : "inherit",
                              "& fieldset": {
                                borderColor: isDiscovery
                                  ? "rgba(255,255,255,0.2)"
                                  : "inherit",
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color: isDiscovery
                                ? "rgba(255,255,255,0.7)"
                                : "inherit",
                            },
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Business
                                  sx={{
                                    color: isDiscovery
                                      ? "rgba(255,255,255,0.7)"
                                      : "#78909C",
                                    opacity: 0.8,
                                  }}
                                />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  {/* Privacidad */}
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        mt: 0.2,
                        p: 2,
                        bgcolor: "rgba(0, 0, 0, 0.02)",
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Lock sx={{ color: "text.disabled", fontSize: 20 }} />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {t(
                              "profile.professional.privacyTitle",
                              "Privacidad selectiva",
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t(
                              "profile.professional.privacyDesc",
                              "Mostrar esta sección solo si hay coincidencias académicas o laborales.",
                            )}
                          </Typography>
                        </Box>
                      </Box>
                      <Controller
                        name="show_professional_only_matches"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            color="primary"
                          />
                        )}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}
