import React, { ReactNode, useState } from "react";
import {
  Box,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

interface CollapsibleMenuProps {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  onItemClick?: () => void;
}

export default function CollapsibleMenu({
  label,
  icon,
  children,
  defaultExpanded = false,
  onItemClick,
}: CollapsibleMenuProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = () => {
    setExpanded(!expanded);
    onItemClick?.();
  };

  return (
    <Box>
      <ListItemButton
        onClick={toggle}
        sx={{
          borderRadius: "8px",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <ListItemIcon sx={{ minWidth: 36, justifyContent: "center" }}>
          {icon}
        </ListItemIcon>
        <ListItemText primary={label} />
        {expanded ? (
          <ExpandLess sx={{ fontSize: "1.2rem", color: "text.disabled" }} />
        ) : (
          <ExpandMore sx={{ fontSize: "1.2rem", color: "text.disabled" }} />
        )}
      </ListItemButton>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ pl: 3, borderLeft: "2px solid", borderColor: "divider" }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}
