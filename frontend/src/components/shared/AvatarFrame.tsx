import { Box, Avatar, SxProps, Theme } from '@mui/material';
import { SubscriptionTier, getPlanConfig } from '../../config/planConfig';

interface AvatarFrameProps {
  src?: string;
  alt?: string;
  tier?: SubscriptionTier | string;
  size?: number;
  sx?: SxProps<Theme>;
  children?: React.ReactNode;
  showBadge?: boolean;
}

export default function AvatarFrame({
  src,
  alt,
  tier = 'free',
  size = 40,
  sx,
  children,
  showBadge = true,
}: AvatarFrameProps) {
  const config = getPlanConfig(tier);
  const isPremium = tier === 'premium';
  const isVIP = tier === 'vip';

  // Frame styles
  const frameStyle: SxProps<Theme> = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    p: (isPremium || isVIP) ? '3px' : 0, // Padding for the border
    borderRadius: '50%',
    background: (isPremium || isVIP) ? config.color.gradient : 'transparent',
    boxShadow: isVIP 
      ? `0 0 10px ${config.color.primary}60` 
      : isPremium 
        ? `0 0 5px ${config.color.primary}40` 
        : 'none',
    ...sx,
  };

  return (
    <Box sx={frameStyle}>
      {children || (
        <Avatar
          src={src}
          alt={alt}
          sx={{
            width: size,
            height: size,
            border: (isPremium || isVIP) ? '2px solid #fff' : 'none', // Inner white border
          }}
        />
      )}
      
      {/* Optional: Add a small icon badge at the bottom right */}
      {(isPremium || isVIP) && showBadge && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: size * 0.35,
            height: size * 0.35,
            bgcolor: config.color.primary,
            borderRadius: '50%',
            border: '2px solid #fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          {config.icon}
        </Box>
      )}
    </Box>
  );
}
