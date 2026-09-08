import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { SubscriptionTier, getPlanConfig, getPlanLabel, getPlanIcon } from '../../config/planConfig';

export type BadgeSize = 'small' | 'medium' | 'large';
export type BadgeVariant = 'full' | 'icon' | 'minimal';

interface PlanBadgeProps {
  tier?: SubscriptionTier | string;
  size?: BadgeSize;
  variant?: BadgeVariant;
  showTooltip?: boolean;
  lang?: 'en' | 'es';
}

export default function PlanBadge({
  tier = 'free',
  size = 'medium',
  variant = 'full',
  showTooltip = true,
  lang = 'es',
}: PlanBadgeProps) {
  const config = getPlanConfig(tier);
  const label = getPlanLabel(tier, lang);
  const icon = getPlanIcon(tier);

  // Size configurations
  const sizeConfig = {
    small: {
      height: 20,
      fontSize: '0.7rem',
      iconSize: '0.8rem',
      px: 0.75,
    },
    medium: {
      height: 24,
      fontSize: '0.8rem',
      iconSize: '1rem',
      px: 1,
    },
    large: {
      height: 32,
      fontSize: '0.9rem',
      iconSize: '1.2rem',
      px: 1.5,
    },
  };

  const currentSize = sizeConfig[size];

  // Render icon only variant
  if (variant === 'icon') {
    const iconElement = (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: currentSize.height,
          height: currentSize.height,
          borderRadius: '50%',
          background: config.color.gradient,
          fontSize: currentSize.iconSize,
          boxShadow: `0 2px 8px ${config.color.primary}40`,
        }}
      >
        {icon}
      </Box>
    );

    if (showTooltip) {
      return (
        <Tooltip title={label} arrow>
          {iconElement}
        </Tooltip>
      );
    }
    return iconElement;
  }

  // Render minimal variant (just colored dot)
  if (variant === 'minimal') {
    const minimalElement = (
      <Box
        sx={{
          width: currentSize.height * 0.6,
          height: currentSize.height * 0.6,
          borderRadius: '50%',
          background: config.color.gradient,
          boxShadow: `0 2px 4px ${config.color.primary}40`,
        }}
      />
    );

    if (showTooltip) {
      return (
        <Tooltip title={label} arrow>
          {minimalElement}
        </Tooltip>
      );
    }
    return minimalElement;
  }

  const fullBadge = (
    <Chip
      icon={
        <span style={{ fontSize: currentSize.iconSize, marginLeft: 4 }}>
          {icon}
        </span>
      }
      label={label}
      size={size === 'large' ? 'medium' : 'small'}
      sx={{
        height: currentSize.height,
        background: config.color.gradient,
        color: tier === 'free' ? '#424242' : '#fff',
        fontWeight: 600,
        fontSize: currentSize.fontSize,
        px: currentSize.px,
        boxShadow: `0 2px 8px ${config.color.primary}40`,
        border: 'none',
        transition: 'all 0.3s ease',
        cursor: showTooltip ? 'help' : 'default',
        '& .MuiChip-icon': {
          color: tier === 'free' ? '#424242' : '#fff',
          margin: 0,
        },
        '& .MuiChip-label': {
          px: 0.5,
        },
        // Responsive sizing for mobile
        '@media (max-width: 600px)': {
          height: size === 'large' ? 28 : size === 'medium' ? 22 : 18,
          fontSize: size === 'large' ? '0.85rem' : size === 'medium' ? '0.75rem' : '0.65rem',
        },
        // Subtle hover for Premium
        ...(tier === 'premium' && {
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: `0 4px 12px ${config.color.primary}50`,
          },
        }),
        // VIP gets a subtle pulse animation
        ...(tier === 'vip' && {
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': {
              boxShadow: `0 2px 8px ${config.color.primary}40`,
            },
            '50%': {
              boxShadow: `0 4px 16px ${config.color.primary}60`,
            },
          },
        }),
      }}
    />
  );

  if (showTooltip && config.features.length > 0) {
    return (
      <Tooltip
        title={
          <Box sx={{ p: 0.5 }}>
            <Typography variant="caption" fontWeight={600} display="block" mb={0.5}>
              {label}
            </Typography>
            {config.features.slice(0, 3).map((feature, idx) => (
              <Typography key={idx} variant="caption" display="block" sx={{ opacity: 0.9 }}>
                • {feature}
              </Typography>
            ))}
          </Box>
        }
        arrow
      >
        {fullBadge}
      </Tooltip>
    );
  }

  return fullBadge;
}
