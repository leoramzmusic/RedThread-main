import { Box } from '@mui/material';
import { ReactNode } from 'react';
import { SubscriptionTier, getPlanConfig } from '../../config/planConfig';

interface PlanFrameProps {
  tier?: SubscriptionTier | string;
  children: ReactNode;
  size?: number | string;
  borderWidth?: number;
  animate?: boolean;
}

export default function PlanFrame({
  tier = 'free',
  children,
  size = 100,
  borderWidth = 3,
  animate = true,
}: PlanFrameProps) {
  const config = getPlanConfig(tier);
  const isVIP = tier === 'vip';

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        padding: `${borderWidth}px`,
        background: config.color.gradient,
        boxShadow: `0 4px 12px ${config.color.primary}30`,
        // VIP gets animated glow
        ...(isVIP && animate && {
          animation: 'glow 3s ease-in-out infinite',
          '@keyframes glow': {
            '0%, 100%': {
              boxShadow: `0 4px 12px ${config.color.primary}30, 0 0 20px ${config.color.primary}20`,
            },
            '50%': {
              boxShadow: `0 4px 16px ${config.color.primary}50, 0 0 30px ${config.color.primary}40`,
            },
          },
        }),
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
