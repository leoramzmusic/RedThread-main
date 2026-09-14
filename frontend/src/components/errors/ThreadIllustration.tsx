import React from 'react';
import { RED, BLUE } from '../../styles/glass';
import { ThreadOrnament } from './registry';

interface ThreadIllustrationProps {
  variant: ThreadOrnament;
  accent: string;
  isDark: boolean;
}

/**
 * Ilustración SVG del "hilo" Red Thread.
 * - La hebra: un arco que pasa del acento del error al azul de la marca,
 *   se dibuja con el keyframe `rtThreadDraw` (css clase .rt-thread).
 * - El ornamento central: metáfora del status (nudo, candado, aguja...).
 */
export default function ThreadIllustration({ variant, accent, isDark }: ThreadIllustrationProps) {
  const gradId = React.useId();
  const thread = `url(#${gradId})`;

  return (
    <svg
      width="240"
      height="150"
      viewBox="0 0 240 150"
      fill="none"
      role="img"
      aria-hidden="true"
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="240" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={accent} />
          <stop offset="60%" stopColor={accent} />
          <stop offset="100%" stopColor={BLUE} />
        </linearGradient>
      </defs>

      {variant === 'broken' ? (
        /* 404 — hebra roja cortada a la mitad, con puntas deshilachadas rectas */
        <g
          className="rt-thread"
          fill="none"
          stroke={RED}
          strokeWidth="5"
          strokeLinecap="round"
        >
          {/* Mitad izquierda, rota antes del corte */}
          <path d="M16 88 C 46 58, 78 100, 100 76" />
          {/* Mitad derecha, separada tras el corte */}
          <path d="M142 82 C 170 58, 200 98, 224 78" />
          {/* Fibras sueltas del corte (izquierda) */}
          <g strokeWidth="2.5">
            <path d="M98 74 L104 68" />
            <path d="M99 79 L108 78" />
            <path d="M99 83 L106 87" />
            {/* Fibras sueltas del corte (derecha) */}
            <path d="M144 78 L138 72" />
            <path d="M143 82 L134 81" />
            <path d="M143 86 L136 90" />
          </g>
        </g>
      ) : (
        <path
          className="rt-thread"
          d="M20 30 C 66 120, 174 120, 220 30"
          stroke={thread}
          strokeWidth="5"
          strokeLinecap="round"
        />
      )}

      <g className="rt-fade-in">
        {variant === 'forbidden' && (
          <g stroke={accent} strokeWidth="4" strokeLinecap="round">
            <path d="M98 70 a22 22 0 0 1 44 0" fill="none" />
            <rect x="90" y="70" width="60" height="46" rx="10" fill={accent} fillOpacity="0.12" stroke={accent} />
            <circle cx="120" cy="86" r="5" fill={accent} />
            <path d="M120 91 V98" stroke={accent} strokeWidth="4" />
          </g>
        )}

        {variant === 'unauthorized' && (
          <g>
            <path
              d="M150 46 L162 72 L150 100 L138 72 Z"
              stroke={accent}
              strokeWidth="4"
              strokeLinejoin="round"
              fill={accent}
              fillOpacity="0.12"
            />
            <circle cx="150" cy="62" r="3" fill={accent} />
            <path
              d="M134 78 C 122 82, 112 94, 118 102"
              stroke={accent}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M116 106 C 108 112, 100 104, 104 98"
              stroke={accent}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}

        {variant === 'server' && (
          <g fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round">
            <ellipse cx="108" cy="74" rx="28" ry="20" transform="rotate(-18 108 74)" />
            <ellipse cx="136" cy="72" rx="24" ry="18" transform="rotate(16 136 72)" />
            <path d="M118 46 C 112 56, 116 60, 124 58" />
            <path d="M112 98 C 118 88, 114 84, 108 86" />
          </g>
        )}

        {variant === 'badgateway' && (
          <g>
            <path
              d="M92 104 V76 a28 28 0 0 1 56 0 V104"
              stroke={accent}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M100 94 L108 86 L116 94 L124 86 L132 94"
              stroke={accent}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {variant === 'unavailable' && (
          <g transform="translate(120 78)">
            <circle r="16" fill="none" stroke={accent} strokeWidth="4" />
            <circle r="6" fill={accent} fillOpacity="0.85" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <path
                key={deg}
                d={`M${20 * Math.cos((deg * Math.PI) / 180)} ${20 * Math.sin((deg * Math.PI) / 180)} L${26 * Math.cos((deg * Math.PI) / 180)} ${26 * Math.sin((deg * Math.PI) / 180)}`}
                stroke={accent}
                strokeWidth="4"
                strokeLinecap="round"
              />
            ))}
          </g>
        )}

        {variant === 'timeout' && (
          <g>
            <path
              d="M102 44 H138 L120 66 L138 92 H102 L120 66 Z"
              stroke={accent}
              strokeWidth="4"
              fill={accent}
              fillOpacity="0.08"
              strokeLinejoin="round"
            />
            <circle cx="114" cy="70" r="3" fill={accent} />
            <path d="M138 96 C 160 98, 172 84, 176 66" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M176 66 V58 M176 66 H168" stroke={accent} strokeWidth="4" strokeLinecap="round" />
          </g>
        )}

        {variant === 'unprocessable' && (
          <g>
            <path
              d="M114 48 L140 66 L114 86 L88 66 Z"
              stroke={accent}
              strokeWidth="4"
              fill="none"
              strokeLinejoin="round"
            />
            <path d="M168 34 L196 62 M196 34 L168 62" stroke={accent} strokeWidth="4" strokeLinecap="round" />
            <circle cx="120" cy="66" r="3" fill={accent} />
          </g>
        )}
      </g>
    </svg>
  );
}