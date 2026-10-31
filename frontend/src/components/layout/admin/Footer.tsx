import React from "react";
import { Box, Container, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "next-i18next/pages";
import { APP_VERSION } from "../../config/version";

export default function AdminFooter() {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const textMuted = isDark ? "rgba(255,255,255,0.5)" : "rgba(33,33,33,0.5)";
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "transparent",
        color: textMuted,
        pt: 4,
        pb: 3,
        px: 4,
        borderTop: "1px solid",
        borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
        mt: "auto",
      }}
    >
      <Container maxWidth="xl">
        <Typography variant="caption" sx={{ color: textMuted }}>
          © {currentYear} RETH Admin.{" "}
          {t("footer.rights", "Todos los derechos reservados.")}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: textMuted,
            opacity: 0.7,
            fontWeight: 600,
            fontSize: "0.65rem",
            letterSpacing: "0.1rem",
            display: "block",
            mt: 0.2,
          }}
        >
          v{APP_VERSION.admin}
        </Typography>
      </Container>
    </Box>
  );
}
