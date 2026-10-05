import React from "react";
import { Box, Collapse, Typography } from "@mui/material";
import SocialStyleTest from "../edit/SocialStyleTest";
import type { ProfileTipData } from "../../../hooks/useProfileTip";

interface StepperTipProps {
  tip?: ProfileTipData | null;
  onClose: () => void;
  open?: boolean;
  onResult?: (result: string) => void;
  fallback?: React.ReactNode;
}

const StepperTip: React.FC<StepperTipProps> = ({
  tip,
  onClose,
  open = true,
  onResult,
}) => {
  const titleOverride = tip?.translation?.title;

  return (
    <Collapse in={open}>
      <Box>
        {titleOverride && (
          <Typography variant="h6" fontWeight={700} mb={1}>
            {titleOverride}
          </Typography>
        )}
        <SocialStyleTest
          open={open}
          onClose={onClose}
          onResult={onResult ?? (() => {})}
        />
      </Box>
    </Collapse>
  );
};

export default StepperTip;
