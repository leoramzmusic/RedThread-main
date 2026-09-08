import { Card, CardProps } from '@mui/material';
import { ReactNode } from 'react';
import { SubscriptionTier, getPlanConfig } from '../../config/planConfig';

export type CardVariant = 'outlined' | 'filled' | 'elevated';

interface PlanCardProps extends Omit<CardProps, 'variant'> {
  tier?: SubscriptionTier | string;
  children: ReactNode;
  variant?: CardVariant;
}

export default function PlanCard({
  tier = 'free',
  children,
  variant = 'elevated',
  sx,
  ...props
}: PlanCardProps) {
  const config = getPlanConfig(tier);
  const isPremiumOrVip = tier === 'premium' || tier === 'vip';

  // Base styles for all variants
  const baseStyles = {
    position: 'relative' as const,
    overflow: 'visible' as const,
  };

  // Variant-specific styles
  const variantStyles = {
    outlined: {
      border: isPremiumOrVip ? `2px solid ${config.color.primary}` : '1px solid #E0E0E0',
      boxShadow: isPremiumOrVip 
        ? `0 0 0 1px ${config.color.primary}20, 0 2px 8px ${config.color.primary}15`
        : 'none',
      background: 'transparent',
    },
    filled: {
      border: 'none',
      background: isPremiumOrVip 
        ? `linear-gradient(135deg, ${config.color.light}30 0%, transparent 100%)`
        : 'transparent',
      boxShadow: isPremiumOrVip
        ? `0 2px 12px ${config.color.primary}20`
        : '0 2px 8px rgba(0,0,0,0.08)',
    },
    elevated: {
      border: isPremiumOrVip ? `1px solid ${config.color.primary}40` : 'none',
      boxShadow: isPremiumOrVip
        ? `0 4px 20px ${config.color.primary}25, 0 0 0 1px ${config.color.primary}10`
        : '0 4px 20px rgba(0,0,0,0.08)',
    },
  };

  return (
    <Card
      {...props}
      sx={{
        ...baseStyles,
        ...variantStyles[variant],
        // VIP gets subtle animation
        ...(tier === 'vip' && variant === 'elevated' && {
          animation: 'cardGlow 4s ease-in-out infinite',
          '@keyframes cardGlow': {
            '0%, 100%': {
              boxShadow: `0 4px 20px ${config.color.primary}25, 0 0 0 1px ${config.color.primary}10`,
            },
            '50%': {
              boxShadow: `0 6px 24px ${config.color.primary}35, 0 0 0 1px ${config.color.primary}20`,
            },
          },
        }),
        ...sx,
      }}
    >
      {children}
    </Card>
  );
}
