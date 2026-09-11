import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { BRAND_ASSETS } from '../../config/brandAssets';

export type RedThreadLogoVariant = 'horizontal' | 'vertical' | 'mark';

interface RedThreadLogoProps {
  height?: number | string;
  width?: number | string;
  variant?: RedThreadLogoVariant;
  sx?: SxProps<Theme>;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

const VARIANT_SRC: Record<RedThreadLogoVariant, string> = {
  horizontal: BRAND_ASSETS.imagotipoHorizontal,
  vertical: BRAND_ASSETS.imagotipoVertical,
  mark: BRAND_ASSETS.isotipo,
};

export default function RedThreadLogo({
  height = 88,
  width = 'auto',
  variant = 'horizontal',
  sx,
  className = 'rt-hero-logo',
  style,
  'aria-label': ariaLabel = 'Red Thread (RETH)',
}: RedThreadLogoProps) {
  return (
    <Box
      className={className}
      style={style}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height,
        width,
        maxWidth: '100%',
        filter: 'drop-shadow(0 6px 18px rgba(136, 19, 55, 0.28))',
        ...sx,
      }}
    >
      <Box
        component="img"
        src={VARIANT_SRC[variant]}
        alt={ariaLabel}
        sx={{
          height: '100%',
          width: 'auto',
          maxWidth: '100%',
          objectFit: 'contain',
        }}
      />
    </Box>
  );
}
