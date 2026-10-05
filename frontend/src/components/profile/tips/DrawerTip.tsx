import React from "react";
import { Box, Button, Typography } from "@mui/material";
import BottomSheet from "../../shared/BottomSheet";
import type { ProfileTipData } from "../../../hooks/useProfileTip";

interface DrawerTipProps {
  tip?: ProfileTipData | null;
  onClose: () => void;
  open?: boolean;
  title?: string;
  body?: string;
  buttonText?: string;
  fallback?: React.ReactNode;
}

const DrawerTip: React.FC<DrawerTipProps> = ({
  tip,
  onClose,
  open = true,
  title,
  body,
  buttonText,
}) => {
  const resolvedTitle = tip?.translation?.title ?? title ?? "";
  const resolvedBody = tip?.translation?.description ?? body ?? "";
  const resolvedButton =
    tip?.translation?.trigger_button_text ?? buttonText ?? "Entendido";

  return (
    <BottomSheet open={open} onClose={onClose}>
      <Box display="flex" flexDirection="column" gap={2} py={1}>
        {resolvedTitle && (
          <Typography variant="h6" fontWeight="bold">
            {resolvedTitle}
          </Typography>
        )}
        {resolvedBody && (
          <Typography variant="body2" color="text.secondary">
            {resolvedBody}
          </Typography>
        )}
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            mt: 1,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          {resolvedButton}
        </Button>
      </Box>
    </BottomSheet>
  );
};

export default DrawerTip;
