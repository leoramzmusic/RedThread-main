import { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { supportedLanguages } from '../../config/languages';

/** "Love" en cada código de supportedLanguages de la app */
const LOVE_BY_LANG: Record<string, string> = {
    en: 'Love',
    es: 'Amor',
    pt: 'Amor',
    fr: 'Amour',
    de: 'Liebe',
    it: 'Amore',
    ru: 'Любовь',
    sv: 'Kärlek',
    nl: 'Liefde',
    zh: '爱',
    hi: 'प्यार',
    bn: 'ভালোবাসা',
    ja: '愛',
    ko: '사랑',
    ar: 'حب',
    sw: 'Upendo',
    ha: 'Soyayya',
    am: 'ፍቅር',
    fil: 'Pag-ibig',
};

const HEART_HOLD_MS = 2600;
const WORD_HOLD_MS = 3000;
const FADE_MS = 400;
const HEART = '♥';

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface LoveTickerProps {
    /** Tamaño de la palabra (px o rem). El corazón escala un poco más. */
    fontSize?: string | number;
}

export default function LoveTicker({ fontSize = '1em' }: LoveTickerProps) {
    const sequence = useMemo(() => {
        const words = supportedLanguages
            .map((l) => LOVE_BY_LANG[l.code])
            .filter(Boolean);
        return [HEART, ...words];
    }, []);

    const [step, setStep] = useState(0);
    const [fading, setFading] = useState(false);
    const [reduced, setReduced] = useState(false);
    const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
    const busyRef = useRef(false);

    useEffect(() => {
        setReduced(prefersReducedMotion());
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = () => setReduced(mq.matches);
        mq.addEventListener?.('change', onChange);
        return () => mq.removeEventListener?.('change', onChange);
    }, []);

    const clearTimers = () => {
        timersRef.current.forEach((id) => clearTimeout(id));
        timersRef.current = [];
    };

    const advance = (fadeMs = FADE_MS) => {
        if (reduced || busyRef.current) return;
        busyRef.current = true;
        clearTimers();
        setFading(true);
        const t = setTimeout(() => {
            setStep((s) => (s + 1) % sequence.length);
            setFading(false);
            busyRef.current = false;
        }, fadeMs);
        timersRef.current.push(t);
    };

    useEffect(() => {
        if (reduced) return;
        clearTimers();
        const isHeart = step === 0;
        const hold = isHeart ? HEART_HOLD_MS : WORD_HOLD_MS;
        const t1 = setTimeout(() => {
            setFading(true);
            const t2 = setTimeout(() => {
                setStep((s) => (s + 1) % sequence.length);
                setFading(false);
            }, FADE_MS);
            timersRef.current.push(t2);
        }, hold);
        timersRef.current.push(t1);
        return clearTimers;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, reduced, sequence.length]);

    // Hover: avanza al siguiente idioma al instante (sin re-entrar si ya está en fade)
    const handleHover = () => {
        if (reduced || busyRef.current) return;
        advance(200);
    };

    const current = sequence[Math.min(step, sequence.length - 1)];
    const isHeart = current === HEART;

    if (reduced) {
        return (
            <Box
                component="span"
                aria-label="Love"
                role="img"
                sx={{
                    display: 'inline-block',
                    color: '#E63946',
                    fontSize,
                    lineHeight: 1,
                    verticalAlign: '-0.08em',
                    mx: 0.15,
                    filter: 'drop-shadow(0 1px 2px rgba(230, 57, 70, 0.4))',
                }}
            >
                {HEART}
            </Box>
        );
    }

    return (
        <Box
            component="span"
            aria-label="Love"
            role="img"
            onMouseEnter={handleHover}
            onFocus={handleHover}
            tabIndex={-1}
            sx={{
                '@keyframes rethLovePulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.2)' },
                    '100%': { transform: 'scale(1)' },
                },
                display: 'inline-block',
                opacity: fading ? 0 : 1,
                transition: `opacity ${FADE_MS}ms ease`,
                color: isHeart ? '#E63946' : '#D32F2F',
                fontWeight: isHeart ? 400 : 700,
                fontSize,
                lineHeight: 1,
                verticalAlign: isHeart ? '-0.08em' : 'baseline',
                mx: 0.15,
                whiteSpace: 'nowrap',
                filter: isHeart ? 'drop-shadow(0 1px 2px rgba(230, 57, 70, 0.4))' : 'none',
                animation: isHeart ? 'rethLovePulse 1.5s ease-in-out infinite' : 'none',
                cursor: 'default',
                userSelect: 'none',
            }}
        >
            {current}
        </Box>
    );
}

const HEART_CHUNK_RE = /([❤♥]\uFE0F?)/;

/**
 * Divide un footerText con ❤️ y sustituye el corazón por LoveTicker.
 * El resto del texto (©, idioma CMS, etc.) se renderiza tal cual.
 */
export function FooterCopyrightText({ text, fontSize }: { text: string; fontSize?: string | number }) {
    if (!HEART_CHUNK_RE.test(text)) {
        return <>{text}</>;
    }
    return (
        <>
            {text.split(HEART_CHUNK_RE).map((chunk, idx) =>
                HEART_CHUNK_RE.test(chunk) ? (
                    <LoveTicker key={idx} fontSize={fontSize} />
                ) : (
                    <span key={idx}>{chunk}</span>
                )
            )}
        </>
    );
}
