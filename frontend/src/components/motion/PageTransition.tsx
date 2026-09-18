import { useEffect, useState, type ReactNode } from 'react';
import { Box, useTheme } from '@mui/material';
import { useRouter } from 'next/router';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const router = useRouter();
  const theme = useTheme();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter');

  useEffect(() => {
    setTransitionStage('enter');
    setDisplayChildren(children);
  }, [children]);

  useEffect(() => {
    const handleRouteChangeStart = () => {
      setTransitionStage('exit');
    };

    const handleRouteChangeComplete = () => {
      setTransitionStage('enter');
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router.events]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        opacity: transitionStage === 'enter' ? 1 : 0,
        transform: transitionStage === 'enter' ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          opacity: 1,
          transform: 'none',
        },
      }}
    >
      {displayChildren}
    </Box>
  );
}