import React, { ReactNode, useState } from "react";
import {
  Box,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

interface MenuItemData {
  id: string;
  label: string;
  icon: ReactNode;
  path?: string;
  items?: MenuItemData[];
}

interface SidebarItemProps {
  id: string;
  label: string;
  icon: ReactNode;
  path?: string;
  items?: MenuItemData[];
  collapsed?: boolean;
  isActive?: boolean;
  onClick?: (id: string) => void;
  level?: number;
  expandedIds?: Set<string>;
  onToggleExpand?: (id: string) => void;
}

export default function SidebarItem({
  id,
  label,
  icon,
  path,
  items,
  collapsed,
  isActive = false,
  onClick,
  level = 1,
  expandedIds,
  onToggleExpand,
}: SidebarItemProps) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const primary = theme.palette.primary.main;
  const hasItems = items && items.length > 0;
  const paddingLeft = level === 1 ? 2 : level === 2 ? 6 : 8;

  const expanded = expandedIds?.has(id) || localExpanded;

  const handleClick = () => {
    if (path) {
      onClick?.(id);
    }
  };

  const handleToggle = () => {
    setLocalExpanded(!localExpanded);
    onToggleExpand?.(id);
  };

  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton
        selected={isActive}
        onClick={hasItems && !collapsed ? handleToggle : handleClick}
        sx={{
          borderRadius: "8px",
          position: "relative",
          justifyContent: collapsed ? "center" : "flex-start",
          px: collapsed ? 0 : paddingLeft,
          minHeight: 44,
          transition: "all 0.2s ease",
          "&:hover": {
            bgcolor: alpha(primary, isDark ? 0.08 : 0.05),
            "& .MuiListItemIcon-root": {
              color: primary,
              transform: "scale(1.1)",
            },
            "& .MuiListItemText-primary": {
              color: isDark ? "rgba(255,255,255,0.92)" : primary,
            },
          },
          "&.Mui-selected": {
            bgcolor: alpha(primary, isDark ? 0.12 : 0.07),
            "&::before": {
              content: '""',
              position: "absolute",
              left: 0,
              top: "15%",
              height: "70%",
              width: 3,
              borderRadius: "0 3px 3px 0",
              transformOrigin: "top",
              bgcolor: primary,
              boxShadow: `0 0 8px ${alpha(primary, 0.7)}`,
            },
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed ? "auto" : 34,
            color: isActive
              ? primary
              : isDark
                ? "rgba(255,255,255,0.65)"
                : "rgba(0,0,0,0.55)",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
        >
          {icon}
        </ListItemIcon>
        {!collapsed && (
          <>
            <ListItemText
              primary={label}
              slotProps={{
                primary: {
                  sx: {
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive
                      ? isDark
                        ? "rgba(255,255,255,0.92)"
                        : "rgba(0,0,0,0.87)"
                      : isDark
                        ? "rgba(255,255,255,0.65)"
                        : "rgba(0,0,0,0.6)",
                    transition: "color 0.2s ease",
                  },
                },
              }}
            />
            {hasItems && (
              <>
                {expanded ? (
                  <ExpandLess
                    sx={{ fontSize: "1.2rem", color: "rgba(0,0,0,0.45)" }}
                  />
                ) : (
                  <ExpandMore
                    sx={{ fontSize: "1.2rem", color: "rgba(0,0,0,0.45)" }}
                  />
                )}
              </>
            )}
          </>
        )}
      </ListItemButton>

      {hasItems && !collapsed && expanded && (
        <Box sx={{ pl: level === 1 ? 4 : level === 2 ? 10 : 16 }}>
          {items.map((child) => (
            <SidebarItem
              key={child.id}
              id={child.id}
              label={child.label}
              icon={child.icon}
              path={child.path}
              items={child.items}
              collapsed={collapsed}
              isActive={false}
              onClick={onClick}
              level={level + 1}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </Box>
      )}
    </ListItem>
  );
}
