import { useMemo, useState, useEffect, useCallback, useRef, memo } from 'react';
import { Lottie, type LottieHandle } from 'lottie-react';
import { Box, IconButton, Tooltip, type SxProps, type Theme } from '@mui/material';
import { Pause as PauseIcon, PlayArrow as PlayIcon } from '@mui/icons-material';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

type MascotState = 'idle' | 'loading' | 'success' | 'error' | 'sleeping' | 'curious';

interface YukiLottieProps {
  state?: MascotState;
  size?: number;
  loop?: boolean;
  sx?: SxProps<Theme>;
}

const cache = new Map<string, object>();

function useLottieData(state: string) {
  const [data, setData] = useState<object | null>(() => {
    const fileName = state === 'curious' ? 'idle' : state;
    return cache.get(fileName) ?? null;
  });

  useEffect(() => {
    const fileName = state === 'curious' ? 'idle' : state;
    if (cache.has(fileName)) {
      setData(cache.get(fileName)!);
      return;
    }
    const controller = new AbortController();
    fetch(`/lottie/yuki-${fileName}.json`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        cache.set(fileName, json);
        setData(json);
      })
      .catch(() => {
        if (!controller.signal.aborted && !cache.has('idle')) {
          fetch('/lottie/yuki-idle.json')
            .then((r) => r.json())
            .then((json) => {
              cache.set('idle', json);
              setData(json);
            });
        } else if (!controller.signal.aborted) {
          setData(cache.get('idle') ?? null);
        }
      });
    return () => controller.abort();
  }, [state]);

  return data;
}

const YukiLottie = memo(function YukiLottie({
  state = 'idle',
  size = 120,
  loop = true,
  sx,
}: YukiLottieProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const animationData = useLottieData(state);
  const lottieRef = useRef<LottieHandle>(null);
  const [isPaused, setIsPaused] = useState(prefersReducedMotion);

  const lottieStyle = useMemo(() => ({ width: size, height: size }), [size]);

  const handleTogglePause = useCallback(() => {
    const inst = lottieRef.current;
    if (!inst) return;
    if (isPaused) {
      inst.play();
      setIsPaused(false);
    } else {
      inst.pause();
      setIsPaused(true);
    }
  }, [isPaused]);

  useEffect(() => {
    setIsPaused(prefersReducedMotion);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!animationData || prefersReducedMotion || isPaused) return;
    lottieRef.current?.play();
  }, [animationData, prefersReducedMotion, isPaused]);

  if (!animationData) return null;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
      role="group"
      aria-label={`Yuki the cat - ${state} state`}
    >
      <Lottie
        lottieRef={lottieRef}
        src={animationData}
        loop={loop && state !== 'success' && !prefersReducedMotion}
        autoplay={false}
        style={lottieStyle}
      />
      <Tooltip title={isPaused ? 'Reanudar animación' : 'Pausar animación'}>
        <IconButton
          size="small"
          onClick={handleTogglePause}
          aria-label={isPaused ? 'Reanudar animación' : 'Pausar animación'}
          sx={{
            mt: -0.5,
            width: 20,
            height: 20,
            color: 'text.secondary',
            '&:hover': { color: 'text.primary' },
          }}
        >
          {isPaused ? <PlayIcon sx={{ fontSize: 14 }} /> : <PauseIcon sx={{ fontSize: 14 }} />}
        </IconButton>
      </Tooltip>
    </Box>
  );
});

export default YukiLottie;