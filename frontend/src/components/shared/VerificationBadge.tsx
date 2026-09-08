import { Tooltip } from '@mui/material';
import { Verified as VerifiedIcon } from '@mui/icons-material';

interface VerificationBadgeProps {
  verified: boolean;
  size?: 'small' | 'medium' | 'large';
  showUnverified?: boolean; // Whether to show gray badge for unverified
}

const sizeMap = {
  small: 16,
  medium: 20,
  large: 24,
};

export default function VerificationBadge({
  verified,
  size = 'small',
  showUnverified = false,
}: VerificationBadgeProps) {
  if (!verified && !showUnverified) return null;

  const iconSize = sizeMap[size];
  const color = verified ? '#2196F3' : '#9E9E9E';
  const tooltipText = verified ? 'Perfil Verificado' : 'No Verificado';

  return (
    <Tooltip title={tooltipText} arrow>
      <VerifiedIcon
        sx={{
          fontSize: iconSize,
          color: color,
        }}
      />
    </Tooltip>
  );
}
