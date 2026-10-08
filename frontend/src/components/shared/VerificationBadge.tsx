import { Tooltip } from '@mui/material';
import {
  Verified as VerifiedIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';

export type VerificationStatus = 'none' | 'pending' | 'verified';

interface VerificationBadgeProps {
  status: VerificationStatus;
  size?: 'small' | 'medium' | 'large';
}

const sizeMap = {
  small: 16,
  medium: 20,
  large: 24,
};

const TOOLTIPS: Record<VerificationStatus, string> = {
  none: 'No Verificado',
  pending: 'Verificación de identidad en revisión',
  verified: 'Este usuario verificó su identidad',
};

export default function VerificationBadge({
  status,
  size = 'small',
}: VerificationBadgeProps) {
  const iconSize = sizeMap[size];

  if (status === 'pending') {
    return (
      <Tooltip title={TOOLTIPS.pending} arrow>
        <PendingIcon sx={{ fontSize: iconSize, color: '#F59E0B' }} />
      </Tooltip>
    );
  }

  const isVerified = status === 'verified';
  return (
    <Tooltip
      title={isVerified ? TOOLTIPS.verified : TOOLTIPS.none}
      arrow
    >
      <VerifiedIcon
        sx={{
          fontSize: iconSize,
          color: isVerified ? '#2196F3' : '#9E9E9E',
        }}
      />
    </Tooltip>
  );
}