import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

type MascotState = 'idle' | 'loading' | 'success' | 'error' | 'sleeping' | 'curious' | 'waving' | 'playful';

interface KawaiiCatProps {
  moduleColor?: string;
  size?: number;
  state?: MascotState;
  showYarn?: boolean;
  interactive?: boolean;
  'aria-label'?: string;
  sx?: SxProps<Theme>;
}

const LOADING_Y_OFFSETS = [0, -4, 0, -2, 0] as const;

const KawaiiCat = memo(function KawaiiCat({
  moduleColor = '#E63946',
  size = 120,
  state = 'idle',
  showYarn = false,
  interactive = true,
  'aria-label': ariaLabel = 'Yuki the cat mascot',
  sx,
}: KawaiiCatProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isBooped, setIsBooped] = useState(false);
  const [tailWag, setTailWag] = useState(false);
  const [loadingFrame, setLoadingFrame] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Follow cursor — throttled to 20fps via rAF
  useEffect(() => {
    if (!interactive || state === 'sleeping') return;
    let lastTime = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastTime < 50) return; // 20fps max
      lastTime = now;
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxOff = 3;
      const norm = Math.min(dist / 200, 1);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setEyeOffset({
          x: (dx / (dist || 1)) * maxOff * norm,
          y: (dy / (dist || 1)) * maxOff * norm,
        });
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [interactive, state]);

  // Auto-blink
  useEffect(() => {
    if (!interactive || state === 'sleeping') return;
    const iv = setInterval(() => {
      if (Math.random() > 0.7) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }
    }, 2000);
    return () => clearInterval(iv);
  }, [interactive, state]);

  // Loading animation
  useEffect(() => {
    if (state !== 'loading') { setLoadingFrame(0); return; }
    const iv = setInterval(() => setLoadingFrame((f) => (f + 1) % 4), 300);
    return () => clearInterval(iv);
  }, [state]);

  const handleBoop = useCallback(() => {
    if (!interactive) return;
    setIsBooped(true);
    setIsBlinking(true);
    setTailWag(true);
    setTimeout(() => { setIsBooped(false); setIsBlinking(false); }, 600);
    setTimeout(() => setTailWag(false), 1000);
  }, [interactive]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (interactive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleBoop();
    }
  }, [interactive, handleBoop]);

  const eyeRy = state === 'sleeping' ? 0.5 : isBlinking ? 0.5 : 4.5;
  const isSleeping = state === 'sleeping';
  const isCurious = state === 'curious';
  const isSuccess = state === 'success';
  const isError = state === 'error';
  const isLoading = state === 'loading';
  const isWaving = state === 'waving';
  const isPlayful = state === 'playful';

  // Mouth variations
  const mouthOpen = isSuccess || isBooped || isWaving;
  const mouthSad = isError;

  // Body bounce for loading
  const bodyY = isLoading ? LOADING_Y_OFFSETS[loadingFrame] : isSuccess ? -2 : 0;

  // Head tilt for curious
  const headTilt = isCurious ? 'rotate(-8 50 50)' : isPlayful ? 'rotate(12 50 50)' : '';

  return (
    <Box
      ref={containerRef}
      onClick={handleBoop}
      onKeyDown={handleKeyDown}
      role={interactive ? 'button' : 'img'}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        cursor: interactive ? 'pointer' : 'default',
        userSelect: 'none',
        outline: 'none',
        transition: prefersReducedMotion ? 'none' : 'transform 0.2s ease',
        '&:hover': interactive ? { transform: 'scale(1.05)' } : undefined,
        '&:focus-visible': {
          outline: '2px solid #E63946',
          outlineOffset: 2,
          borderRadius: '50%',
        },
        ...sx,
      }}
    >
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <title>{ariaLabel}</title>
        {/* Yarn ball - only when showYarn */}
        {showYarn && (
          <g>
            <circle cx="88" cy="85" r="16" fill={moduleColor} opacity="0.9">
              {isLoading && !prefersReducedMotion && (
                <animate attributeName="r" values="16;18;14;16" dur="0.6s" repeatCount="indefinite" />
              )}
            </circle>
            <circle cx="88" cy="85" r="16" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4" />
            <path d="M80 80 Q88 75 96 80 Q100 88 92 92 Q84 96 78 88 Q76 82 80 80Z" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
            <path d="M72 85 Q65 90 60 85 Q55 78 50 82" fill="none" stroke={moduleColor} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          </g>
        )}

        {/* Cat body */}
        <g transform={`translate(0, ${bodyY})`}>
          {/* Body */}
          <ellipse cx="50" cy="78" rx="28" ry="22" fill="white" />
          <ellipse cx="50" cy="78" rx="28" ry="22" fill="url(#catShading)" opacity="0.25" />

          {/* Head with optional tilt */}
          <g transform={headTilt}>
            <circle cx="50" cy="50" r="24" fill="white" />
            <circle cx="50" cy="50" r="24" fill="url(#catHeadShading)" opacity="0.15" />

            {/* Ears */}
            <path d="M30 38 L26 16 L42 32 Z" fill="white" />
            <path d="M30 38 L28 20 L40 33 Z" fill="#FFB6C1" opacity="0.6" />
            <path d="M70 38 L74 16 L58 32 Z" fill="white" />
            <path d="M70 38 L72 20 L60 33 Z" fill="#FFB6C1" opacity="0.6" />

            {/* Eyes */}
            {isSleeping ? (
              <g>
                <path d="M36 48 Q40 52 44 48" stroke="#1A1B1E" strokeWidth="1.5" fill="none" />
                <path d="M56 48 Q60 52 64 48" stroke="#1A1B1E" strokeWidth="1.5" fill="none" />
              </g>
            ) : (
              <g>
                {/* Left eye */}
                <ellipse
                  cx={40 + eyeOffset.x} cy={48 + eyeOffset.y}
                  rx="5" ry={eyeRy} fill="#1A1B1E"
                  style={{ transition: 'cx 0.1s, cy 0.1s, ry 0.05s' }}
                />
                <circle cx={42 + eyeOffset.x * 0.4} cy={46 + eyeOffset.y * 0.4} r="1.8" fill="white" />
                {/* Right eye */}
                <ellipse
                  cx={60 + eyeOffset.x} cy={48 + eyeOffset.y}
                  rx="5" ry={eyeRy} fill="#1A1B1E"
                  style={{ transition: 'cx 0.1s, cy 0.1s, ry 0.05s' }}
                />
                <circle cx={62 + eyeOffset.x * 0.4} cy={46 + eyeOffset.y * 0.4} r="1.8" fill="white" />
              </g>
            )}

            {/* Blush */}
            <ellipse cx="30" cy="55" rx="6" ry="3.5" fill="#FFB6C1"
              opacity={isSuccess || isBooped ? 0.85 : 0.55}
              style={{ transition: 'opacity 0.2s' }}
            />
            <ellipse cx="70" cy="55" rx="6" ry="3.5" fill="#FFB6C1"
              opacity={isSuccess || isBooped ? 0.85 : 0.55}
              style={{ transition: 'opacity 0.2s' }}
            />

            {/* Nose */}
            <ellipse cx="50" cy="53" rx="2" ry="1.5" fill="#FFB6C1" />

            {/* Mouth */}
            {isSleeping ? (
              <path d="M46 58 Q50 60 54 58" fill="none" stroke="#1A1B1E" strokeWidth="1.2" strokeLinecap="round" />
            ) : mouthSad ? (
              <path d="M44 60 Q50 54 56 60" fill="none" stroke="#1A1B1E" strokeWidth="1.5" strokeLinecap="round" />
            ) : mouthOpen ? (
              <path d="M44 56 Q50 64 56 56" fill="#FFB6C1" stroke="#1A1B1E" strokeWidth="1.2" strokeLinecap="round" />
            ) : (
              <path d="M46 58 Q50 62 54 58" fill="none" stroke="#1A1B1E" strokeWidth="1.5" strokeLinecap="round" />
            )}

            {/* Whiskers */}
            <line x1="18" y1="51" x2="34" y2="53" stroke="#1A1B1E" strokeWidth="1" opacity="0.3" />
            <line x1="18" y1="56" x2="34" y2="56" stroke="#1A1B1E" strokeWidth="1" opacity="0.3" />
            <line x1="66" y1="53" x2="82" y2="51" stroke="#1A1B1E" strokeWidth="1" opacity="0.3" />
            <line x1="66" y1="56" x2="82" y2="56" stroke="#1A1B1E" strokeWidth="1" opacity="0.3" />

            {/* State decorations */}
            {isSleeping && (
              <g opacity="0.5">
                <text x="70" y="38" fontSize="8" fill="#1A1B1E" fontWeight="bold" fontFamily="sans-serif">z</text>
                <text x="76" y="30" fontSize="10" fill="#1A1B1E" fontWeight="bold" fontFamily="sans-serif">z</text>
                <text x="82" y="22" fontSize="13" fill="#1A1B1E" fontWeight="bold" fontFamily="sans-serif">Z</text>
              </g>
            )}

            {isCurious && (
              <text x="70" y="34" fontSize="14" fill={moduleColor} fontWeight="bold" fontFamily="sans-serif" opacity="0.7">?</text>
            )}

            {isSuccess && (
              <g opacity="0.75">
                <text x="18" y="34" fontSize="9" fill={moduleColor}>✦</text>
                <text x="74" y="28" fontSize="7" fill={moduleColor}>✦</text>
                <text x="68" y="42" fontSize="5" fill={moduleColor}>✦</text>
              </g>
            )}

            {isError && (
              <g opacity="0.5">
                <circle cx="72" cy="40" r="2.5" fill="#87CEEB" />
                <circle cx="76" cy="45" r="1.8" fill="#87CEEB" />
              </g>
            )}
          </g>

          {/* Waving paw */}
          {isWaving && (
            <g>
              <ellipse cx="78" cy="65" rx="7" ry="5" fill="white" transform="rotate(-30 78 65)" />
              <circle cx="76" cy="66" r="1.5" fill="#FFB6C1" opacity="0.5" />
              <circle cx="80" cy="64" r="1.5" fill="#FFB6C1" opacity="0.5" />
            </g>
          )}

          {/* Tail */}
          <path
            d={isPlayful
              ? "M22 78 Q8 72 6 60 Q4 50 12 46"
              : "M22 78 Q10 70 8 55 Q6 45 15 42"
            }
            fill="none" stroke="white" strokeWidth="4.5" strokeLinecap="round"
          >
            {!prefersReducedMotion && (
              <animate
                attributeName="d"
                values={tailWag
                  ? "M22 78 Q8 68 5 52 Q2 42 12 38;M22 78 Q14 72 12 58 Q10 48 20 45;M22 78 Q8 68 5 52 Q2 42 12 38"
                  : isPlayful
                    ? "M22 78 Q8 72 6 60 Q4 50 12 46;M22 78 Q12 74 10 62 Q8 52 16 48;M22 78 Q8 72 6 60 Q4 50 12 46"
                    : "M22 78 Q10 70 8 55 Q6 45 15 42;M22 78 Q12 72 10 58 Q8 48 18 45;M22 78 Q10 70 8 55 Q6 45 15 42"
                }
                dur={tailWag ? '0.4s' : '2.5s'}
                repeatCount="indefinite"
              />
            )}
          </path>

          {/* Paws */}
          {isPlayful ? (
            <g>
              {/* Playful: paws up */}
              <ellipse cx="32" cy="82" rx="7" ry="5" fill="white" transform="rotate(-20 32 82)" />
              <ellipse cx="68" cy="82" rx="7" ry="5" fill="white" transform="rotate(20 68 82)" />
              <ellipse cx="38" cy="70" rx="6" ry="4.5" fill="white" transform="rotate(-40 38 70)" />
              <ellipse cx="62" cy="70" rx="6" ry="4.5" fill="white" transform="rotate(40 62 70)" />
              {/* Paw pads */}
              <circle cx="30" cy="83" r="1.5" fill="#FFB6C1" opacity="0.5" />
              <circle cx="34" cy="81" r="1.5" fill="#FFB6C1" opacity="0.5" />
              <circle cx="66" cy="81" r="1.5" fill="#FFB6C1" opacity="0.5" />
              <circle cx="70" cy="83" r="1.5" fill="#FFB6C1" opacity="0.5" />
              <circle cx="36" cy="71" r="1.5" fill="#FFB6C1" opacity="0.5" />
              <circle cx="40" cy="69" r="1.5" fill="#FFB6C1" opacity="0.5" />
              <circle cx="60" cy="69" r="1.5" fill="#FFB6C1" opacity="0.5" />
              <circle cx="64" cy="71" r="1.5" fill="#FFB6C1" opacity="0.5" />
            </g>
          ) : (
            <g>
              <ellipse cx="35" cy="95" rx="8" ry="5" fill="white" />
              <ellipse cx="65" cy="95" rx="8" ry="5" fill="white" />
              <circle cx="33" cy="96" r="2" fill="#FFB6C1" opacity="0.45" />
              <circle cx="37" cy="96" r="2" fill="#FFB6C1" opacity="0.45" />
              <circle cx="63" cy="96" r="2" fill="#FFB6C1" opacity="0.45" />
              <circle cx="67" cy="96" r="2" fill="#FFB6C1" opacity="0.45" />
            </g>
          )}

          {/* Boop effect */}
          {isBooped && (
            <g>
              <circle cx="50" cy="28" r="2" fill={moduleColor} opacity="0.8">
                {!prefersReducedMotion && (
                  <>
                    <animate attributeName="r" from="2" to="10" dur="0.5s" fill="freeze" />
                    <animate attributeName="opacity" from="0.8" to="0" dur="0.5s" fill="freeze" />
                  </>
                )}
              </circle>
              <text x="50" y="18" textAnchor="middle" fontSize="14" fill={moduleColor}>✨</text>
            </g>
          )}
        </g>

        <defs>
          <radialGradient id="catShading" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="#E0E0E0" />
          </radialGradient>
          <radialGradient id="catHeadShading" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="#E8E8E8" />
          </radialGradient>
        </defs>
      </svg>
    </Box>
  );
});

export default KawaiiCat;