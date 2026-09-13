import { IconButton, type IconButtonProps } from '@mui/material';
import { MorphIcon } from 'morphicons/react';
import type { IconInput, SpringPreset } from 'morphicons/react';
import { Menu, X } from 'lucide';

interface MorphToggleIconProps extends Omit<IconButtonProps, 'children'> {
  open: boolean;
  label?: string;
  iconOpen?: IconInput;
  iconClosed?: IconInput;
  spring?: SpringPreset;
  strokeWidth?: number;
}

const MorphToggleIcon = ({
  open,
  label,
  iconOpen = X,
  iconClosed = Menu,
  spring = 'bouncy',
  strokeWidth = 2,
  'aria-label': ariaLabel,
  ...rest
}: MorphToggleIconProps) => (
  <IconButton aria-label={ariaLabel ?? label} {...rest}>
    <MorphIcon
      icon={open ? iconOpen : iconClosed}
      size={24}
      strokeWidth={strokeWidth}
      absoluteStrokeWidth
      reducedMotion="user"
      spring={spring}
    />
  </IconButton>
);

export default MorphToggleIcon;