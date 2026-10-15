import {
  Grid,
  Typography,
  Box,
  IconButton,
  Tooltip,
  keyframes,
  alpha,
  useTheme,
  useMediaQuery,
  ButtonBase,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Info as InfoIcon,
  Search,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { Controller } from "react-hook-form";
import { useTranslation } from "next-i18next/pages";
import { INTENTION_OPTIONS } from "../../../../constants/profileOptions";
import { BaseSectionProps } from "../types";

interface RelationshipGoalsSectionProps extends BaseSectionProps {
  setGoalsInfoOpen: (open: boolean) => void;
  isDiscovery?: boolean;
}

// One-shot micro-bounce played when an option becomes selected.
const bounce = keyframes`
  0% { transform: scale(1); }
  40% { transform: scale(1.25) translateY(-6px); }
  70% { transform: scale(0.94); }
  100% { transform: scale(1); }
`;

export default function RelationshipGoalsSection({
  control,
  setGoalsInfoOpen,
  isDiscovery = false,
}: RelationshipGoalsSectionProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const accent = theme.palette.primary.main;

  // Display-only: option values stay stable; labels/descriptions render translated.
  const goalDesc = (value: string, fallback: string) =>
    t(`profile.intentions_desc.${value}`, fallback);

  return (
    <Grid size={12}>
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
        {!isDiscovery && (
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ px: 3, py: 1 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                pr: 2
              }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}>
                <Search color="action" fontSize="small" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {t("profile.fields.goals", "Objetivos de relación")}
                </Typography>
              </Box>
              <Tooltip title={t("common.moreInfo", "Más información")}>
                <IconButton
                  size="small"
                  component="span"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGoalsInfoOpen(true);
                  }}
                >
                  <InfoIcon fontSize="small" color="info" />
                </IconButton>
              </Tooltip>
            </Box>
          </AccordionSummary>
        )}
        <AccordionDetails sx={{ px: isDiscovery ? 1 : 2.5, pb: isDiscovery ? 3 : 2, pt: 0 }}>
          <Typography
            variant="body2"
            sx={{
              color: isDiscovery ? "rgba(255,255,255,0.7)" : "text.secondary",
              mb: 2,
            }}
          >
            {t(
              "profile.goals_subtitle",
              "Selecciona lo que buscas en este momento",
            )}
          </Typography>
          <Controller
            name="relationship_goals"
            control={control}
            render={({ field }) => (
              <Grid container spacing={2}>
                {INTENTION_OPTIONS.map((option) => {
                  const isSelected = (field.value || []).includes(option.value);
                  const label = t(
                    `profile.intentions_map.${option.value}`,
                    option.label,
                  );
                  const description = goalDesc(
                    option.value,
                    option.description || "",
                  );
                  const selectedBorder = isDiscovery ? "gold" : accent;
                  const selectedBg = isDiscovery
                    ? "rgba(255,215,0,0.1)"
                    : alpha(accent, 0.1);

                  return (
                    <Grid
                      key={option.value}
                      size={{
                        xs: 6,
                        sm: 6,
                        md: 3
                      }}>
                      <Tooltip
                        title={description}
                        arrow
                        placement="top"
                        enterDelay={500}
                      >
                        <ButtonBase
                          onClick={() => {
                            const currentValues = field.value || [];
                            if (isSelected) {
                              field.onChange(
                                currentValues.filter(
                                  (v: string) => v !== option.value,
                                ),
                              );
                            } else {
                              field.onChange([...currentValues, option.value]);
                            }
                          }}
                          aria-pressed={isSelected}
                          aria-label={
                            description ? `${label}. ${description}` : label
                          }
                          sx={{
                            p: 1.5,
                            width: "100%",
                            height: "100%",
                            minHeight: 120,
                            cursor: "pointer",
                            border: "2px solid",
                            borderColor: isSelected
                              ? selectedBorder
                              : isDiscovery
                                ? "rgba(255,255,255,0.1)"
                                : "divider",
                            bgcolor: isSelected
                              ? selectedBg
                              : isDiscovery
                                ? "rgba(255,255,255,0.05)"
                                : "background.paper",
                            borderRadius: 3,
                            transition: "all 0.25s ease",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            position: "relative",
                            overflow: "visible",
                            "&:hover": {
                              borderColor: isSelected
                                ? selectedBorder
                                : isDiscovery
                                  ? "rgba(255,255,255,0.3)"
                                  : alpha(accent, 0.6),
                              boxShadow: isDiscovery
                                ? "none"
                                : "0 4px 14px rgba(15,23,42,0.12)",
                              "& .emoji-icon": {
                                transform: reduceMotion
                                  ? "none"
                                  : "scale(1.1) translateY(-6px)",
                              },
                            },
                            "&:active": {
                              transform: reduceMotion ? "none" : "scale(0.97)",
                            },
                          }}
                        >
                          <Box
                            className="emoji-icon"
                            sx={{
                              fontSize: isDiscovery
                                ? "60px !important"
                                : "72px !important",
                              lineHeight: 1,
                              mb: 1,
                              transition:
                                "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                              animation:
                                isSelected && !reduceMotion
                                  ? `${bounce} 0.45s ease`
                                  : "none",
                              filter: isSelected
                                ? isDiscovery
                                  ? "drop-shadow(0 12px 24px rgba(255,215,0,0.5))"
                                  : "drop-shadow(0 10px 20px rgba(59,130,246,0.35))"
                                : "drop-shadow(0 4px 8px rgba(0,0,0,0.12))",
                              userSelect: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "auto",
                              height: "auto",
                            }}
                          >
                            {option.emoji}
                          </Box>
                          <Typography
                            variant="body2"
                            color={
                              isSelected
                                ? isDiscovery
                                  ? "gold"
                                  : accent
                                : isDiscovery
                                  ? "white"
                                  : "text.primary"
                            }
                            sx={{
                              fontWeight: isSelected ? 700 : 500
                            }}
                          >
                            {label}
                          </Typography>
                        </ButtonBase>
                      </Tooltip>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          />
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}
