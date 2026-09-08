import { Avatar, Badge, Box } from '@mui/material';
import { ReactNode } from 'react';
import { SubscriptionTier, getPlanConfig } from '../../config/planConfig';
import PlanBadge from './PlanBadge';

export type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';
export type BadgePosition = 'top-right' | 'bottom-right';

interface PlanAvatarProps {
  src?: string;
  alt?: string;
  tier?: SubscriptionTier | string;
  size?: AvatarSize | number;
  showBadge?: boolean;
  badgePosition?: BadgePosition;
  children?: ReactNode;
}

export default function PlanAvatar({
  src,
  alt = 'Avatar',
  tier = 'free',
  size = 'medium',
  showBadge = false,
  badgePosition = 'bottom-right',
  children,
}: PlanAvatarProps) {
  const config = getPlanConfig(tier);
  const isPremiumOrVip = tier === 'premium' || tier === 'vip';

  // Size configurations
  const sizeMap = {
    small: 32,
    medium: 40,
    large: 56,
    xlarge: 80,
  };

  const avatarSize = typeof size === 'number' ? size : sizeMap[size];
  const borderWidth = avatarSize > 50 ? 3 : 2;

  // Badge positioning
  const badgeAnchor = badgePosition === 'top-right' 
    ? { vertical: 'top' as const, horizontal: 'right' as const }
    : { vertical: 'bottom' as const, horizontal: 'right' as const };

  const avatar = (
    <Box
      sx={{
        position: 'relative',
        width: avatarSize,
        height: avatarSize,
        borderRadius: '50%',
        padding: isPremiumOrVip ? `${borderWidth}px` : 0,
        background: isPremiumOrVip ? config.color.gradient : 'transparent',
        boxShadow: isPremiumOrVip 
          ? `0 4px 12px ${config.color.primary}30`
          : 'none',
        // VIP gets animated glow
        ...(tier === 'vip' && {
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
      <Avatar
        src={src}
        alt={alt}
        sx={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      >
        {children}
      </Avatar>
    </Box>
  );

  // Show badge only for Premium/VIP
  if (showBadge && isPremiumOrVip) {
    return (
      <Badge
        overlap="circular"
        anchorOrigin={badgeAnchor}
        badgeContent={
          <PlanBadge 
            tier={tier} 
            size="small" 
            variant="icon" 
            showTooltip={false}
          />
        }
      >
        {avatar}
      </Badge>
    );
  }

  return avatar;
}
