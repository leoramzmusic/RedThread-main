import { Box, Paper, Typography, Button, Container } from "@mui/material";
import { useTranslation } from "next-i18next";
import {
  useProfileTip,
  type ProfileTipData,
} from "../../../hooks/useProfileTip";

interface InfoDrawersProps {
  infoDrawerOpen: boolean;
  setInfoDrawerOpen: (open: boolean) => void;
  goalsInfoOpen: boolean;
  setGoalsInfoOpen: (open: boolean) => void;
  pronounsInfoOpen: boolean;
  setPronounsInfoOpen: (open: boolean) => void;
  locationInfoOpen: boolean;
  setLocationInfoOpen: (open: boolean) => void;
  identityInfoOpen: boolean;
  setIdentityInfoOpen: (open: boolean) => void;
  isDragging: boolean;
  dragOffsetY: number;
  handleDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
  // Optional DB tips map (e.g. from admin preview). When absent, tips are
  // fetched lazily via useProfileTip; hardcoded t() strings remain fallback.
  tips?: Record<string, ProfileTipData | null>;
}

export default function InfoDrawers({
  infoDrawerOpen,
  setInfoDrawerOpen,
  goalsInfoOpen,
  setGoalsInfoOpen,
  pronounsInfoOpen,
  setPronounsInfoOpen,
  locationInfoOpen,
  setLocationInfoOpen,
  identityInfoOpen,
  setIdentityInfoOpen,
  isDragging,
  dragOffsetY,
  handleDragStart,
  tips,
}: InfoDrawersProps) {
  const { t, i18n } = useTranslation("common");
  // Resolve each tip in the active UI language (the API's `translation` field
  // follows the saved preferred_language, not the current UI locale). Missing
  // fields fall back to t(), which is defined in all 21 locales.
  const uiLang = (i18n.language || "es").split("-")[0];
  const tr = (tip: ProfileTipData | null) => tip?.translations?.[uiLang] ?? null;
  // DB-first: fetch each drawer tip; an injected `tips` map takes precedence.
  // Any missing/inactive/failed tip resolves to null -> hardcoded fallback.
  const { tip: fetchedSafety } = useProfileTip("safety");
  const { tip: fetchedGoals } = useProfileTip("goals");
  const { tip: fetchedPronouns } = useProfileTip("pronouns");
  const { tip: fetchedLocation } = useProfileTip("location");
  const { tip: fetchedIdentity } = useProfileTip("identity");
  const safety = tips?.safety ?? fetchedSafety ?? null;
  const goals = tips?.goals ?? fetchedGoals ?? null;
  const pronouns = tips?.pronouns ?? fetchedPronouns ?? null;
  const location = tips?.location ?? fetchedLocation ?? null;
  const identity = tips?.identity ?? fetchedIdentity ?? null;
  return (
    <>
      {/* Safety Info Drawer (Custom Bottom Sheet with Drag) */}
      {infoDrawerOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "md",
              display: "flex",
              justifyContent: "center",
              pl: { md: "260px", xs: 0 },
              boxSizing: "border-box",
            }}
          >
            <Container
              maxWidth="md"
              sx={{ p: "0 !important", pointerEvents: "auto" }}
            >
              <Paper
                elevation={24}
                sx={{
                  position: "relative",
                  width: "100%",
                  bgcolor: "background.paper",
                  color: "text.primary",
                  borderRadius: "16px 16px 0 0",
                  p: 0,
                  pb: 4,
                  backgroundImage: "none",
                  borderTop: 1,
                  borderColor: "divider",
                  transform: "translateY(" + dragOffsetY + "px)",
                  transition: isDragging
                    ? "none"
                    : "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  overflow: "hidden",
                  cursor: isDragging ? "grabbing" : "auto",
                  animation: "slideUp 0.3s ease-out",
                  "@keyframes slideUp": {
                    from: { transform: "translateY(100%)" },
                    to: { transform: "translateY(0)" },
                  },
                }}
              >
                <Box
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  sx={{
                    width: "100%",
                    height: 40,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "grab",
                    touchAction: "none",
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 4,
                      bgcolor: "action.disabled",
                      borderRadius: 2,
                    }}
                  />
                </Box>

                <Box px={3} pb={2} textAlign="center">
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{ color: "text.primary", mb: 2 }}
                  >
                    {tr(safety)?.title ||
                      t("profile.safety.title", "Consejos de Seguridad")}
                  </Typography>

                  <Box display="flex" gap={1} justifyContent="center" mb={2}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        maxWidth: 400,
                        mx: "auto",
                      }}
                    >
                      {tr(safety)?.description ||
                        t(
                          "profile.safety.body",
                          "⚠️ Por tu seguridad, no incluyas nombres de usuario de redes sociales ni información de contacto directa en tu biografía.",
                        )}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{ mb: 3, color: "text.secondary" }}
                  >
                    <span style={{ color: "inherit" }}>
                      {t(
                        "profile.safety.linkPrefix",
                        "Aprende más sobre nuestras ",
                      )}
                    </span>
                    <a
                      href="/community-rules"
                      target="_blank"
                      style={{
                        color: "#448AFF",
                        textDecoration: "underline",
                        fontWeight: "bold",
                      }}
                    >
                      {t("profile.safety.linkText", "Reglas de la comunidad")}
                    </a>
                  </Typography>

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => setInfoDrawerOpen(false)}
                    sx={{
                      maxWidth: 300,
                      fontWeight: "bold",
                      textTransform: "none",
                      borderRadius: 2,
                      py: 1.2,
                    }}
                  >
                    {tr(safety)?.trigger_button_text ||
                      t("profile.safety.button", "Entendido")}
                  </Button>
                </Box>
              </Paper>
            </Container>
          </Box>
        </Box>
      )}

      {/* Goals Info Drawer */}
      {goalsInfoOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "md",
              display: "flex",
              justifyContent: "center",
              pl: { md: "260px", xs: 0 },
              boxSizing: "border-box",
            }}
          >
            <Container
              maxWidth="md"
              sx={{ p: "0 !important", pointerEvents: "auto" }}
            >
              <Paper
                elevation={24}
                sx={{
                  position: "relative",
                  width: "100%",
                  bgcolor: "background.paper",
                  color: "text.primary",
                  borderRadius: "16px 16px 0 0",
                  p: 0,
                  pb: 4,
                  backgroundImage: "none",
                  borderTop: 1,
                  borderColor: "divider",
                  transform: "translateY(" + dragOffsetY + "px)",
                  transition: isDragging
                    ? "none"
                    : "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  overflow: "hidden",
                  cursor: isDragging ? "grabbing" : "auto",
                  animation: "slideUp 0.3s ease-out",
                  "@keyframes slideUp": {
                    from: { transform: "translateY(100%)" },
                    to: { transform: "translateY(0)" },
                  },
                }}
              >
                <Box
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  sx={{
                    width: "100%",
                    height: 40,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "grab",
                    touchAction: "none",
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 4,
                      bgcolor: "action.disabled",
                      borderRadius: 2,
                    }}
                  />
                </Box>

                <Box px={3} pb={2} textAlign="center">
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{ color: "text.primary", mb: 2 }}
                  >
                    {tr(goals)?.title ||
                      t("profile.goals_info.title", "Las emociones cambian")}
                  </Typography>

                  <Box display="flex" gap={1} justifyContent="center" mb={2}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        maxWidth: 400,
                        mx: "auto",
                      }}
                    >
                      {tr(goals)?.description ||
                        t(
                          "profile.goals_info.body",
                          "Te preguntaremos de vez en cuando en caso de que tu opinión haya cambiado. O si prefieres, actualiza tus objetivos en tu perfil.",
                        )}
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => setGoalsInfoOpen(false)}
                    sx={{
                      borderRadius: 20,
                      py: 1.5,
                      maxWidth: 200,
                      mx: "auto",
                      display: "block",
                    }}
                  >
                    {tr(goals)?.trigger_button_text ||
                      t("profile.goals_info.button", "Entendido")}
                  </Button>
                </Box>
              </Paper>
            </Container>
          </Box>
        </Box>
      )}

      {/* Pronouns Info Drawer */}
      {pronounsInfoOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1300,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "md",
              display: "flex",
              justifyContent: "center",
              pl: { md: "260px", xs: 0 },
              boxSizing: "border-box",
            }}
          >
            <Container
              maxWidth="md"
              sx={{ p: "0 !important", pointerEvents: "auto" }}
            >
              <Paper
                elevation={24}
                sx={{
                  position: "relative",
                  width: "100%",
                  bgcolor: "background.paper",
                  color: "text.primary",
                  borderRadius: "16px 16px 0 0",
                  p: 0,
                  pb: 4,
                  backgroundImage: "none",
                  borderTop: 1,
                  borderColor: "divider",
                  transform:
                    "translateY(" + (isDragging ? dragOffsetY : 0) + "px)",
                  transition: isDragging
                    ? "none"
                    : "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  overflow: "hidden",
                  cursor: isDragging ? "grabbing" : "auto",
                  animation: "slideUp 0.3s ease-out",
                  "@keyframes slideUp": {
                    from: { transform: "translateY(100%)" },
                    to: { transform: "translateY(0)" },
                  },
                }}
              >
                <Box
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  sx={{
                    width: "100%",
                    height: 40,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "grab",
                    touchAction: "none",
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 4,
                      bgcolor: "action.disabled",
                      borderRadius: 2,
                    }}
                  />
                </Box>

                <Box px={3} pb={2} textAlign="center">
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{ color: "text.primary", mb: 2 }}
                  >
                    {tr(pronouns)?.title ||
                      t(
                        "profile.pronouns.infoModal.title",
                        "¿Por qué son importantes los pronombres?",
                      )}
                  </Typography>

                  <Box
                    display="flex"
                    gap={1}
                    justifyContent="center"
                    mb={2}
                    flexDirection="column"
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        maxWidth: 400,
                        mx: "auto",
                      }}
                    >
                      {tr(pronouns)?.description ||
                        t(
                          "profile.pronouns.infoModal.text1",
                          "Los pronombres permiten a nuestrxs usuarixs darle mas profundidad y detalle a su perfil.",
                        )}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        maxWidth: 400,
                        mx: "auto",
                        mt: 1,
                      }}
                    >
                      {t(
                        "profile.pronouns.infoModal.text2",
                        "Los pronombres son parte importante de una persona y nos indican cómo referirnos correctamente a ella.",
                      )}
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => setPronounsInfoOpen(false)}
                    sx={{
                      maxWidth: 300,
                      fontWeight: "bold",
                      textTransform: "none",
                      borderRadius: 2,
                      py: 1.2,
                    }}
                  >
                    {tr(pronouns)?.trigger_button_text ||
                      t("profile.pronouns.infoModal.button", "De acuerdo")}
                  </Button>
                </Box>
              </Paper>
            </Container>
          </Box>
        </Box>
      )}

      {/* Location Info Drawer */}
      {locationInfoOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1300,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "md",
              display: "flex",
              justifyContent: "center",
              pl: { md: "260px", xs: 0 },
              boxSizing: "border-box",
            }}
          >
            <Container maxWidth="md" sx={{ p: "0 !important", pointerEvents: "auto" }}>
              <Paper
                elevation={24}
                sx={{
                  position: "relative",
                  width: "100%",
                  bgcolor: "background.paper",
                  color: "text.primary",
                  borderRadius: "16px 16px 0 0",
                  p: 0,
                  pb: 4,
                  backgroundImage: "none",
                  borderTop: 1,
                  borderColor: "divider",
                  transform: "translateY(" + (isDragging ? dragOffsetY : 0) + "px)",
                  transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  overflow: "hidden",
                  cursor: isDragging ? "grabbing" : "auto",
                  animation: "slideUp 0.3s ease-out",
                  "@keyframes slideUp": {
                    from: { transform: "translateY(100%)" },
                    to: { transform: "translateY(0)" },
                  },
                }}
              >
                <Box
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  sx={{
                    width: "100%",
                    height: 40,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "grab",
                    touchAction: "none",
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 4,
                      bgcolor: "action.disabled",
                      borderRadius: 2,
                    }}
                  />
                </Box>

                <Box px={3} pb={2} textAlign="center">
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: "text.primary", mb: 2 }}>
                    {tr(location)?.title ||
                      t("profile.location.infoModal.title", "¿Por qué pedimos tu ubicación?")}
                  </Typography>

                  <Box display="flex" gap={1} justifyContent="center" mb={2}>
                    <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 400, mx: "auto" }}>
                      {tr(location)?.description ||
                        t("profile.location.infoModal.text", "Tu ubicación nos ayuda a mostrarte personas cercanas y a definir el alcance de tus conexiones. Nunca compartiremos tu ubicación exacta sin tu consentimiento.")}
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => setLocationInfoOpen(false)}
                    sx={{
                      maxWidth: 300,
                      fontWeight: "bold",
                      textTransform: "none",
                      borderRadius: 2,
                      py: 1.2,
                    }}
                  >
                    {tr(location)?.trigger_button_text ||
                      t("profile.location.infoModal.button", "Entendido")}
                  </Button>
                </Box>
              </Paper>
            </Container>
          </Box>
        </Box>
      )}

      {/* Identity Info Drawer */}
      {identityInfoOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1300,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "md",
              display: "flex",
              justifyContent: "center",
              pl: { md: "260px", xs: 0 },
              boxSizing: "border-box",
            }}
          >
            <Container maxWidth="md" sx={{ p: "0 !important", pointerEvents: "auto" }}>
              <Paper
                elevation={24}
                sx={{
                  position: "relative",
                  width: "100%",
                  bgcolor: "background.paper",
                  color: "text.primary",
                  borderRadius: "16px 16px 0 0",
                  p: 0,
                  pb: 4,
                  backgroundImage: "none",
                  borderTop: 1,
                  borderColor: "divider",
                  transform: "translateY(" + (isDragging ? dragOffsetY : 0) + "px)",
                  transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  overflow: "hidden",
                  cursor: isDragging ? "grabbing" : "auto",
                  animation: "slideUp 0.3s ease-out",
                  "@keyframes slideUp": {
                    from: { transform: "translateY(100%)" },
                    to: { transform: "translateY(0)" },
                  },
                }}
              >
                <Box
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  sx={{
                    width: "100%",
                    height: 40,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "grab",
                    touchAction: "none",
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 4,
                      bgcolor: "action.disabled",
                      borderRadius: 2,
                    }}
                  />
                </Box>

                <Box px={3} pb={2} textAlign="center">
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: "text.primary", mb: 2 }}>
                    {tr(identity)?.title ||
                      t("profile.identity.infoModal.title", "¿Por qué pedimos tu identidad?")}
                  </Typography>

                  <Box display="flex" gap={1} justifyContent="center" mb={2}>
                    <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 400, mx: "auto" }}>
                      {tr(identity)?.description ||
                        t("profile.identity.infoModal.text", "Tu identidad nos ayuda a verificar tu perfil y mantener la seguridad de la comunidad. Nunca compartiremos tus datos sin tu consentimiento.")}
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => setIdentityInfoOpen(false)}
                    sx={{
                      maxWidth: 300,
                      fontWeight: "bold",
                      textTransform: "none",
                      borderRadius: 2,
                      py: 1.2,
                    }}
                  >
                    {tr(identity)?.trigger_button_text ||
                      t("profile.identity.infoModal.button", "Entendido")}
                  </Button>
                </Box>
              </Paper>
            </Container>
          </Box>
        </Box>
      )}
    </>
  );
}
