import { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap';

interface ParallaxImageProps {
  src: string;
  alt?: string;
  intensity?: number;
  drift?: number;
  objectFit?: 'cover' | 'contain';
  className?: string;
  frameSx?: SxProps<Theme>;
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ParallaxImage = ({
  src,
  alt = '',
  intensity = 0.12,
  drift = 5,
  objectFit = 'cover',
  className,
  frameSx,
}: ParallaxImageProps) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useGSAP(
    () => {
      const frame = frameRef.current;
      const img = imgRef.current;
      if (!frame || !img || typeof window === 'undefined') return;
      if (prefersReducedMotion()) return;
      try {
        gsap.fromTo(
          img,
          { scale: 1, yPercent: drift },
          {
            scale: 1 + intensity,
            yPercent: -drift,
            ease: 'none',
            scrollTrigger: {
              trigger: frame,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          }
        );
      } catch {
        /* noop */
      }
    },
    { scope: frameRef, dependencies: [loaded, src, intensity, drift] }
  );

  const handleLoad = () => {
    setLoaded(true);
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  return (
    <Box
      ref={frameRef}
      className={className}
      sx={{ position: 'relative', overflow: 'hidden', ...frameSx }}
    >
      <Box
        component="img"
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={handleLoad}
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit,
          willChange: 'transform',
          transformOrigin: 'center center',
        }}
      />
    </Box>
  );
};

export default ParallaxImage;