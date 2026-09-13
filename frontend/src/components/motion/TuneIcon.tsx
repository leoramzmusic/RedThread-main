import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface TuneIconProps {
  sx?: SxProps<Theme>;
}

const BAR_STYLE = {
  width: 16,
  height: 2.5,
  borderRadius: '2px',
  bgcolor: 'currentColor',
  opacity: 0.9,
  position: 'relative',
} as const;

const KNOB_STYLE = {
  position: 'absolute',
  top: -2,
  left: '50%',
  width: 4,
  height: 4,
  borderRadius: '50%',
  bgcolor: 'rgb(126,117,255)',
  border: '1.5px solid #fff',
  boxShadow: '0 0 4px rgba(255,255,255,0.9)',
  transition: 'transform 0.3s cubic-bezier(0.34,1.4,0.5,1)',
} as const;

export default function TuneIcon({ sx }: TuneIconProps) {
  return (
    <Box
      className="rt-tune"
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
        ...sx,
      }}
    >
      <Box className="rt-tune-bar rt-tune-bar1" sx={BAR_STYLE}>
        <Box className="rt-tune-knob" sx={{ ...KNOB_STYLE, transform: 'translateX(calc(-50% - 4px))' }} />
      </Box>
      <Box className="rt-tune-bar rt-tune-bar2" sx={BAR_STYLE}>
        <Box className="rt-tune-knob" sx={{ ...KNOB_STYLE, transform: 'translateX(calc(-50% + 4px))' }} />
      </Box>
      <Box className="rt-tune-bar rt-tune-bar3" sx={BAR_STYLE}>
        <Box className="rt-tune-knob" sx={{ ...KNOB_STYLE, transform: 'translateX(-50%)' }} />
      </Box>
    </Box>
  );
}