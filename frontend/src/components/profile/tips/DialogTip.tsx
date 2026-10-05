import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import type { ProfileTipData } from "../../../hooks/useProfileTip";

interface DialogTipProps {
  tip?: ProfileTipData | null;
  onClose: () => void;
  open?: boolean;
  fallback?: React.ReactNode;
}

const DialogTip: React.FC<DialogTipProps> = ({
  tip,
  onClose,
  open = true,
}) => {
  const title = tip?.translation?.title ?? "";
  const description = tip?.translation?.description ?? "";
  const buttonText = tip?.translation?.trigger_button_text ?? "Entendido";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      {title && <DialogTitle>{title}</DialogTitle>}
      {description && (
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DialogTip;
