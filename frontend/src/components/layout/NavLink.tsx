import { Box, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface NavLinkProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactElement;
}

export default function NavLink({
  label,
  active,
  onClick,
  icon,
}: NavLinkProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const primary = theme.palette.primary.main;

  const baseColor = isDark ? "rgba(255,255,255,0.65)" : "rgba(33,33,33,0.65)";
  const hoverColor = isDark ? "#FFFFFF" : "#111111";

  return (
    <Box
      onClick={onClick}
      sx={{
        position: "relative",
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
        flexShrink: 0,
        px: active ? 1.5 : 1,
        py: 0.75,
        fontSize: "0.875rem",
        fontWeight: active ? 700 : 500,
        letterSpacing: "0.2px",
        color: active ? primary : baseColor,
        background: "transparent",
        borderRadius: 0,
        transition: "color 0.2s ease, padding 0.2s ease",
        "&:hover": {
          background: "transparent",
          color: active ? primary : hoverColor,
          transform: "none",
          "&::after": { width: "100%", left: 0 },
        },
        // Línea inferior estilo Facebook que se expande al hacer hover o está activa
        "&::after": {
          content: '""',
          position: "absolute",
          left: 0,
          bottom: 0,
          height: 2,
          width: active ? "100%" : "0%",
          borderRadius: "1px",
          background: `linear-gradient(90deg, ${primary}, ${alpha(primary, 0.35)})`,
          boxShadow: active ? `0 0 8px ${alpha(primary, 0.8)}` : "none",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        "@media (prefers-reduced-motion: no-preference)": {
          "&:hover::after": { width: "100%", left: 0 },
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {icon && (
          <Box
            sx={{
              fontSize: active ? "1.1rem" : "1rem",
              color: active ? primary : baseColor,
              transition: "color 0.2s ease",
            }}
          >
            {icon}
          </Box>
        )}
        {active && label ? (
          <Box sx={{ ml: icon ? 0.5 : 0, minWidth: 0 }}>{label}</Box>
        ) : null}
      </Box>
    </Box>
  );
}
