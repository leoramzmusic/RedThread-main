import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import Head from 'next/head';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Container, Box, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import YukiLoader from '../components/common/YukiLoader';
import LandingFooter from '../components/landing/LandingFooter';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatIcon from '@mui/icons-material/Chat';
import RadarIcon from '@mui/icons-material/Radar';
import GroupsIcon from '@mui/icons-material/Groups';
import appearanceService from '../services/appearanceService';
import { AppearanceType } from '../types/appearance';
import { getMediaUrl } from '../utils/media';
import RedThreadLogo from '../components/landing/RedThreadLogo';
import LandingNavbar from '../components/landing/LandingNavbar';
import { landingShadows, landingTypography, getLandingHeroFontSize } from '../theme/liquidGlass';

const getTitleFontFamily = (font?: string) => `${font || landingTypography.heroTitle.family}, Poppins, Inter, sans-serif`;
const getBodyFontFamily = (font?: string) => `${font || landingTypography.heroBody.family}, Inter, sans-serif`;


// Translation content for all languages (fallback)
const translations = {
  es: {
    subtitle: 'Encuentra tus conexiones significativas',
    description: 'Inspirado en la leyenda del hilo rojo, conéctate con personas que comparten tus intereses, pasiones y valores. Ya sea que busques amistad, romance, socios de proyecto o compañeros de juego - tu hilo te espera.',
    ctaPrimary: 'Get Started',
    ctaSecondary: 'Sign In',
    howItWorks: 'Cómo Funciona',
    features: {
      smartMatching: {
        title: 'Emparejamiento Inteligente',
        description: 'Nuestro algoritmo de afinidad impulsado por IA te empareja con personas compatibles basándose en intereses, música, personalidad y más.'
      },
      realTimeChat: {
        title: 'Chat en Tiempo Real',
        description: 'Conéctate instantáneamente con tus coincidencias a través de mensajería en tiempo real, notas de voz y compartir multimedia.'
      },
      proximityRadar: {
        title: 'Radar de Proximidad',
        description: 'Descubre personas cercanas que comparten tus intereses. Perfecto para encontrar amigos y conexiones locales.'
      },
      multipleIntentions: {
        title: 'Múltiples Intenciones',
        description: '¿Buscas amistad, romance, socios de proyecto o compañeros de juego? Encuentra conexiones para cualquier propósito.'
      }
    },
    footer: '© 2026 RETH. Hecho con ❤️ para conexiones significativas.'
  },
  en: {
    subtitle: 'Find your meaningful connections',
    description: 'Inspired by the legend of the red thread, connect with people who share your interests, passions, and values. Whether you\'re looking for friendship, romance, project partners, or gaming buddies - your thread awaits.',
    ctaPrimary: 'Get Started',
    ctaSecondary: 'Sign In',
    howItWorks: 'How It Works',
    features: {
      smartMatching: {
        title: 'Smart Matching',
        description: 'Our AI-powered affinity algorithm matches you with compatible people based on interests, music, personality, and more.'
      },
      realTimeChat: {
        title: 'Real-Time Chat',
        description: 'Connect instantly with your matches through real-time messaging, voice notes, and media sharing.'
      },
      proximityRadar: {
        title: 'Proximity Radar',
        description: 'Discover people nearby who share your interests. Perfect for finding local friends and connections.'
      },
      multipleIntentions: {
        title: 'Multiple Intentions',
        description: 'Looking for friendship, romance, project partners, or gaming buddies? Find connections for any purpose.'
      }
    },
    footer: '© 2026 RETH. Made with ❤️ for meaningful connections.'
  },
  pt: {
    subtitle: 'Encontre suas conexões significativas',
    description: 'Inspirado na lenda do fio vermelho, conecte-se com pessoas que compartilham seus interesses, paixões e valores. Seja procurando amizade, romance, parceiros de projeto ou companheiros de jogo - seu fio aguarda.',
    ctaPrimary: 'Get Started',
    ctaSecondary: 'Entrar',
    howItWorks: 'Como Funciona',
    features: {
      smartMatching: {
        title: 'Correspondência Inteligente',
        description: 'Nosso algoritmo de afinidade alimentado por IA combina você com pessoas compatíveis com base em interesses, música, personalidade e muito mais.'
      },
      realTimeChat: {
        title: 'Chat em Tempo Real',
        description: 'Conecte-se instantaneamente com suas correspondências através de mensagens em tempo real, notas de voz e compartilhamento de mídia.'
      },
      proximityRadar: {
        title: 'Radar de Proximidade',
        description: 'Descubra pessoas próximas que compartilham seus interesses. Perfeito para encontrar amigos e conexões locais.'
      },
      multipleIntentions: {
        title: 'Múltiplas Intenções',
        description: 'Procurando amizade, romance, parceiros de projeto ou companheiros de jogo? Encontre conexões para qualquer propósito.'
      }
    },
    footer: '© 2026 RETH. Feito com ❤️ para conexões significativas.'
  },
  fr: {
    subtitle: 'Trouvez vos connexions significatives',
    description: 'Inspiré par la légende du fil rouge, connectez-vous avec des personnes qui partagent vos intérêts, passions et valeurs. Que vous recherchiez l\'amitié, la romance, des partenaires de projet ou des compagnons de jeu - votre fil vous attend.',
    ctaPrimary: 'Commencer',
    ctaSecondary: 'Se Connecter',
    howItWorks: 'Comment Ça Marche',
    features: {
      smartMatching: {
        title: 'Correspondance Intelligente',
        description: 'Notre algorithme d\'affinité alimenté par l\'IA vous met en relation avec des personnes compatibles en fonction des intérêts, de la musique, de la personnalité et plus encore.'
      },
      realTimeChat: {
        title: 'Chat en Temps Réel',
        description: 'Connectez-vous instantanément avec vos correspondances via la messagerie en temps réel, les notes vocales et le partage de médias.'
      },
      proximityRadar: {
        title: 'Radar de Proximité',
        description: 'Découvrez des personnes à proximité qui partagent vos intérêts. Parfait pour trouver des amis et des connexions locales.'
      },
      multipleIntentions: {
        title: 'Intentions Multiples',
        description: 'Vous cherchez l\'amitié, la romance, des partenaires de projet ou des compagnons de jeu? Trouvez des connexions pour n\'importe quel objectif.'
      }
    },
    footer: '© 2026 RETH. Fait avec ❤️ pour des connexions significatives.'
  }
};

import { supportedLanguages } from '../config/languages';
import apiClient from '../services/api';
import { resolveInitialLang, readStoredLang, persistLangLocal, normalizeLang } from '../utils/landingLanguage';

const languages = supportedLanguages.map((l) => l.code) as unknown as readonly string[];
type Language = (typeof supportedLanguages)[number]['code'];

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Single retime point for the whole landing sequence
const LANDING_TIMING = {
  hero: { charDuration: 0.9, charStagger: 0.04, ease: 'power3.out' },
  heroText: { duration: 0.7, y: 26 },
  features: {
    triggerStart: 'top 12%',
    pin: '+=70%',
    scrub: 1,
    cardStagger: 0.14,
    cardDuration: 0.9,
  },
  parallax: { yStart: -16, yEnd: 12, scrub: 0.6 },
} as const;

function renderChars(text: string): ReactNode {
  const words = text.split(' ').filter((w) => w.length > 0);
  const nodes: ReactNode[] = [];
  words.forEach((word, i) => {
    if (i > 0) nodes.push(' ');
    nodes.push(
      <span key={i} className="rt-landing-word">
        {Array.from(word).map((c, j) => (
          <span key={j} className="rt-landing-char" aria-hidden="true">
            {c}
          </span>
        ))}
      </span>
    );
  });
  return nodes;
}

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);
  const [currentLangIndex, setCurrentLangIndex] = useState(() => {
    if (typeof window !== 'undefined') {
      // Profile is applied after mount (see effect below); local choice wins for anonymous visitors.
      // No browser auto-detection: the global default is English.
      const initial = resolveInitialLang({ storedLang: readStoredLang() });
      return Math.max(0, languages.indexOf(initial));
    }
    return Math.max(0, languages.indexOf('en'));
  });
  const currentLang: Language = languages[currentLangIndex] as Language;
  const t = (translations as Record<string, typeof translations.es>)[currentLang] ?? translations.en;

  // Auto-rotation only makes sense before the user has chosen a language (local or profile)
  const [transitionEnabled, setTransitionEnabled] = useState(
    () => typeof window === 'undefined' || !readStoredLang()
  );

  const handleLangChange = (lang: Language) => {
    const idx = languages.indexOf(lang as string);
    if (idx >= 0) {
      setCurrentLangIndex(idx);
      const persisted = persistLangLocal(lang);
      if (persisted && isAuthenticated) {
        apiClient.patch('/auth/me', { preferred_language: persisted }).catch(() => {});
      }
    }
    setTransitionEnabled(false);
  };

  // Cross-device sync: apply the profile language once the auth session is known
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;
    let cancelled = false;
    apiClient
      .get('/auth/me')
      .then((res) => {
        const lang = normalizeLang(res.data?.preferred_language);
        if (cancelled || !lang) return;
        const idx = languages.indexOf(lang);
        if (idx >= 0) {
          setCurrentLangIndex(idx);
          setTransitionEnabled(false);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isInitialized, isAuthenticated]);

  // CMS State
  const [cmsConfig, setCmsConfig] = useState<any>(null);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [heroBanners, setHeroBanners] = useState<Array<{ url: string; resolution: string }>>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [viewportW, setViewportW] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [heroIcon, setHeroIcon] = useState<string | null>(null);
  const [isLoadingCms, setIsLoadingCms] = useState(true);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/home');
    }
  }, [isAuthenticated, router]);

  // Load CMS Configuration
  useEffect(() => {
    const fetchCmsData = async () => {
      try {
        setIsLoadingCms(true);
        const [themes, banners] = await Promise.all([
          appearanceService.getPublicResources(AppearanceType.LANDING_THEME),
          appearanceService.getPublicResources(AppearanceType.LANDING_BANNER),
        ]);

        const activeTheme = themes.find(r => r.is_active);
        if (activeTheme && activeTheme.metadata) {
          setCmsConfig(activeTheme.metadata);
        }

        const activeBanners = banners.filter(r => r.is_active && !r.metadata?.isHeroIcon);
        if (activeBanners.length > 0) {
          setHeroImages(activeBanners.map(b => getMediaUrl(b.url)));
          setHeroBanners(activeBanners.map(b => ({
            url: getMediaUrl(b.url),
            resolution: (b.metadata?.resolution as string) || (b.metadata?.isMobile ? 'mobile' : 'all'),
          })));
        } else {
          setHeroBanners([]);
        }

        const activeIcon = banners.find(r => r.is_active && r.metadata?.isHeroIcon);
        if (activeIcon) {
          setHeroIcon(getMediaUrl(activeIcon.url));
        } else {
          setHeroIcon('/imagotipo.png');
        }

      } catch (error) {
        console.error("Failed to load CMS data", error);
        setHeroIcon('/imagotipo.png');
      } finally {
        setIsLoadingCms(false);
      }
    };
    fetchCmsData();
  }, []);

  // Viewport listener para fondos por resolución
  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto-rotate language — se pausa tras la primera selección manual (transitionEnabled)
  useEffect(() => {
    if (!transitionEnabled) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const interval = setInterval(() => {
      setCurrentLangIndex((prevIndex) => (prevIndex + 1) % languages.length);
    }, 30000);

    return () => clearInterval(interval);
  }, [transitionEnabled]);

  // Auto-rotate hero images (respeta resolución)
  useEffect(() => {
    const len = Math.max(heroImages.length, heroBanners.length, 1);
    if (len > 1) {
      if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        return;
      }
      const interval = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % len);
      }, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [heroImages, heroBanners]);

  const landingRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const root = landingRef.current;
      if (!root) return;

      const subtitle = root.querySelector<HTMLElement>('.rt-subtitle');
      const description = root.querySelector<HTMLElement>('.rt-description');
      const ctas = root.querySelector<HTMLElement>('.rt-ctas');
      const hero = root.querySelector<HTMLElement>('.rt-hero');
      const heroLogo = root.querySelector<HTMLElement>('.rt-hero-logo');
      const features = root.querySelector<HTMLElement>('.rt-features');
      const featuresTitle = root.querySelector<HTMLElement>('.rt-section-title');
      const cards = gsap.utils.toArray<HTMLElement>('.rt-feature-card', root);

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set([subtitle, description, ctas, heroLogo, ...cards], {
          clearProps: 'transform,opacity,visibility',
        });
      });

      // Hero intro — shared across all (no pin)
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const chars = subtitle ? gsap.utils.toArray<HTMLElement>('.rt-landing-char', subtitle) : [];
        const master = gsap.timeline({ defaults: { ease: LANDING_TIMING.hero.ease } });
        master.addLabel('hero', 0);
        master.fromTo(
          chars,
          { yPercent: 120, autoAlpha: 0, filter: 'blur(8px)' },
          {
            yPercent: 0,
            autoAlpha: 1,
            filter: 'blur(0px)',
            duration: LANDING_TIMING.hero.charDuration,
            stagger: LANDING_TIMING.hero.charStagger,
          },
          'hero'
        );
        master.fromTo(
          [description, ctas],
          { y: LANDING_TIMING.heroText.y, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: LANDING_TIMING.heroText.duration, stagger: 0.12 },
          'hero+=0.3'
        );
        // Parallax solo desktop (evita jank táctil + foldable corto)
        if (heroLogo && hero && window.matchMedia('(min-width: 1024px)').matches) {
          master.fromTo(
            heroLogo,
            { yPercent: LANDING_TIMING.parallax.yStart },
            {
              yPercent: LANDING_TIMING.parallax.yEnd,
              ease: 'none',
              scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: 'bottom top',
                scrub: LANDING_TIMING.parallax.scrub,
              },
            },
            'hero'
          );
        }
        ScrollTrigger.refresh();
      });

      // Features — móvil/tablet/foldable (<1024): fade-up sin pin
      mm.add('(prefers-reduced-motion: no-preference) and (max-width: 1023px)', () => {
        if (!features || cards.length === 0) return;
        const pinTargets = [featuresTitle, ...cards].filter(Boolean) as HTMLElement[];
        gsap.set(pinTargets, { autoAlpha: 0, y: 28 });
        gsap.to(pinTargets, {
          autoAlpha: 1,
          y: 0,
          duration: LANDING_TIMING.features.cardDuration,
          stagger: (i: number) => (i === 0 ? 0.08 : LANDING_TIMING.features.cardStagger),
          ease: 'power2.out',
          scrollTrigger: {
            trigger: features,
            start: 'top 88%',
            end: 'bottom 40%',
            scrub: false,
            once: false,
          },
        });
        ScrollTrigger.refresh();
      });

      // Features — desktop/smart display (≥1024): pin + scrub (P0 desktop, no táctil)
      mm.add('(prefers-reduced-motion: no-preference) and (min-width: 1024px)', () => {
        if (!features || cards.length === 0) return;
        const pinTargets = [featuresTitle, ...cards].filter(Boolean) as HTMLElement[];
        gsap.set(pinTargets, { autoAlpha: 0, y: 70 });
        gsap.to(pinTargets, {
          autoAlpha: 1,
          y: 0,
          duration: LANDING_TIMING.features.cardDuration,
          stagger: (i: number) => (i === 0 ? 0.1 : LANDING_TIMING.features.cardStagger),
          ease: 'power2.out',
          scrollTrigger: {
            trigger: features,
            start: LANDING_TIMING.features.triggerStart,
            end: LANDING_TIMING.features.pin,
            pin: true,
            pinSpacing: true,
            scrub: LANDING_TIMING.features.scrub,
          },
        });
        ScrollTrigger.refresh();
      });

      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener('load', onLoad);

      return () => {
        window.removeEventListener('load', onLoad);
        mm.revert();
      };
    },
    { scope: landingRef }
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => window.cancelAnimationFrame(id);
  }, [heroImages, heroBanners, currentHeroIndex, viewportW]);

  // Dynamic Styles — fondo por resolución (mobile/tablet/desktop/xl/smart) + gradiente fallback
  const getResolutionKey = (w: number): string => {
    if (w <= 767) return 'mobile';
    if (w <= 1023) return 'tablet';
    if (w <= 1439) return 'desktop';
    if (w <= 1919) return 'xl';
    return 'smart';
  };
  const currentHeroImage = (() => {
    if (heroBanners.length > 0) {
      const key = getResolutionKey(viewportW);
      // 1) exact match para la resolución actual
      let pool = heroBanners.filter(b => b.resolution === key);
      // 2) fallback a 'all' (único) o desktop si es smart/xl sin imagen específica
      if (pool.length === 0) pool = heroBanners.filter(b => b.resolution === 'all');
      if (pool.length === 0) pool = heroBanners;
      return pool[currentHeroIndex % pool.length]?.url || null;
    }
    return heroImages.length > 0 ? heroImages[currentHeroIndex % heroImages.length] : null;
  })();

  const backgroundStyle = currentHeroImage
    ? {
      backgroundImage: `linear-gradient(rgba(29, 29, 31, 0.55), rgba(29, 29, 31, 0.68)), url(${currentHeroImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'scroll',
      transform: 'translateZ(0)',
    }
    : {
      backgroundImage: `linear-gradient(135deg, ${cmsConfig?.gradientStart || '#1A1B1E'} 0%, ${cmsConfig?.gradientEnd || '#B71C1C'} 100%)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'scroll',
    };

  // Helper to safely get CMS content with fallbacks
  const getCmsText = (field: string, subField?: string, featureKey?: string) => {
    if (!cmsConfig) return null;

    // 1. Try New Structure (cmsConfig.translations[currentLang])
    const localized = cmsConfig.translations?.[currentLang];
    if (localized) {
      if (featureKey) {
        return localized.features?.[featureKey]?.[subField!] || null;
      }
      return localized[field];
    }

    // 2. Fallback to Old Structure (Flat)
    if (featureKey) {
      return cmsConfig.features?.[featureKey]?.[subField!] || null;
    }
    return cmsConfig[field];
  };

  const displayText = {
    subtitle: getCmsText('subtitle') || t.subtitle,
    description: getCmsText('description') || t.description,
    ctaPrimary: getCmsText('ctaPrimary') || t.ctaPrimary || 'Get Started',
    ctaSecondary: getCmsText('ctaSecondary') || t.ctaSecondary || 'Sign In',
    howItWorks: getCmsText('howItWorksTitle') || t.howItWorks,
    footer: getCmsText('footerText') || t.footer,
    footerTagline: getCmsText('footerTagline') as string | null | undefined ?? null,
    features: {
      smartMatching: {
        title: getCmsText('features', 'title', 'smartMatching') || t.features.smartMatching.title,
        description: getCmsText('features', 'description', 'smartMatching') || t.features.smartMatching.description
      },
      realTimeChat: {
        title: getCmsText('features', 'title', 'realTimeChat') || t.features.realTimeChat.title,
        description: getCmsText('features', 'description', 'realTimeChat') || t.features.realTimeChat.description
      },
      proximityRadar: {
        title: getCmsText('features', 'title', 'proximityRadar') || t.features.proximityRadar.title,
        description: getCmsText('features', 'description', 'proximityRadar') || t.features.proximityRadar.description
      },
      multipleIntentions: {
        title: getCmsText('features', 'title', 'multipleIntentions') || t.features.multipleIntentions.title,
        description: getCmsText('features', 'description', 'multipleIntentions') || t.features.multipleIntentions.description
      }
    }
  };

  // Show loading screen while fetching CMS data
  if (isLoadingCms) {
    return (
      <>
        <Head>
          <title>Red Thread - Meaningful Connections</title>
          <meta name="description" content="Create meaningful connections through friendship, romance, projects, gaming, and conversation" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1A1B1E 0%, #B71C1C 100%)'
          }}
        >
          <YukiLoader message="" size={80} />
        </Box>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Red Thread - Meaningful Connections</title>
        <meta name="description" content="Create meaningful connections through friendship, romance, projects, gaming, and conversation" />
        <link rel="icon" href="/favicon.ico" />
        <style
          dangerouslySetInnerHTML={{
            __html: `@media (prefers-reduced-motion: reduce){.rt-landing,.rt-landing *{transition:none !important;animation:none !important;scroll-behavior:auto !important} .rt-landing .rt-ctas *{transform:none !important}} @media (prefers-reduced-transparency: reduce){.rt-landing .rt-feature-card{backdrop-filter:none !important;-webkit-backdrop-filter:none !important;background:rgba(255,255,255,0.98) !important}} @media (prefers-contrast: more){.rt-landing .rt-feature-card{background:rgba(255,255,255,0.98) !important;border:1.5px solid #1D1D1F !important}}`,
          }}
        />
        <style>{`
          .rt-landing .rt-landing-word { display: inline-block; white-space: nowrap; }
          .rt-landing .rt-landing-char { display: inline-block; will-change: transform; }
          /* Beat globals.css body[data-font-size] span/Typography !important (specificity 0,5,1)
             so CMS subtitleFontSize actually drives the hero title. */
          body[data-font-size] .rt-landing .rt-landing-word.rt-landing-word,
          body[data-font-size] .rt-landing .rt-landing-char.rt-landing-char {
            font-size: inherit !important;
          }
          body[data-font-size] .rt-landing.rt-landing .rt-subtitle.rt-subtitle,
          body[data-font-size] .rt-landing .MuiTypography-root.rt-subtitle.rt-subtitle {
            font-size: clamp(var(--rt-title-clamp-min, 1.5rem), var(--rt-title-clamp-vw, 2.5vw), var(--rt-title-clamp-max, 3rem)) !important;
            overflow-wrap: break-word !important;
          }
          body[data-font-size] .rt-landing .rt-subtitle .rt-landing-word.rt-landing-word,
          body[data-font-size] .rt-landing .rt-subtitle .rt-landing-char.rt-landing-char {
            font-size: inherit !important;
          }
          body[data-font-size] .rt-landing.rt-landing .rt-description.rt-description,
          body[data-font-size] .rt-landing .MuiTypography-root.rt-description.rt-description {
            font-size: ${cmsConfig?.descriptionFontSize || 1.15}rem !important;
          }
          @media (max-width: 899.98px) {
            body[data-font-size] .rt-landing.rt-landing .rt-subtitle.rt-subtitle,
            body[data-font-size] .rt-landing .MuiTypography-root.rt-subtitle.rt-subtitle { font-size: var(--rt-title-size, max(${cmsConfig?.subtitleFontSize || 3.4}rem, 3.1rem)) !important; }
            body[data-font-size] .rt-landing .rt-section-title { font-size: 2.9rem !important; }
            body[data-font-size] .rt-landing .rt-card-title { font-size: 1.6rem !important; }
          }
          @media (min-width: 900px) {
            body[data-font-size] .rt-landing.rt-landing .rt-subtitle.rt-subtitle,
            body[data-font-size] .rt-landing .MuiTypography-root.rt-subtitle.rt-subtitle { font-size: var(--rt-title-size, max(${cmsConfig?.subtitleFontSize || 5}rem, 4.6rem)) !important; }
            body[data-font-size] .rt-landing .rt-section-title { font-size: 4rem !important; }
            body[data-font-size] .rt-landing .rt-card-title { font-size: 1.8rem !important; }
          }
        `}</style>
        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .rt-landing .rt-icon-heart { display: inline-block; animation: rt-rt-heartbeat 1.2s ease-in-out infinite; }
            .rt-landing .rt-icon-chat { display: inline-block; animation: rt-rt-bubble 2.4s ease-in-out infinite; }
            .rt-landing .rt-icon-radar { display: inline-block; animation: rt-rt-radar-pulse 2s ease-in-out infinite; }
            .rt-landing .rt-icon-groups { display: inline-block; animation: rt-rt-sway 3.2s ease-in-out infinite; }
            .rt-landing .rt-icon-heart:hover,
            .rt-landing .rt-icon-chat:hover,
            .rt-landing .rt-icon-radar:hover,
            .rt-landing .rt-icon-groups:hover { animation-play-state: paused; }
          }
          @keyframes rt-rt-heartbeat {
            0%, 100% { transform: scale(1); }
            15% { transform: scale(1.18); }
            30% { transform: scale(0.96); }
            45% { transform: scale(1.12); }
            60% { transform: scale(1); }
          }
          @keyframes rt-rt-bubble {
            0%, 100% { transform: scale(1); }
            30% { transform: scale(1.1); }
            50% { transform: scale(0.96); }
            70% { transform: scale(1.06); }
          }
          @keyframes rt-rt-radar-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.12); }
          }
          @keyframes rt-rt-sway {
            0%, 100% { transform: rotate(-4deg) translateY(0); }
            50% { transform: rotate(4deg) translateY(-3px); }
          }
          .rt-landing .rt-thread-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; filter: drop-shadow(0 0 6px rgba(211,47,47,0.5)); }
          .rt-landing .rt-thread-base { stroke: #D32F2F; stroke-width: 2.5; fill: none; opacity: 0.4; }
          @media (prefers-reduced-motion: no-preference) {
            .rt-landing .rt-thread-flow { stroke: #E53935; stroke-width: 2.5; fill: none; stroke-linecap: round; stroke-dasharray: 10 22; opacity: 0.85; animation: rt-rt-thread-flow 7s linear infinite; }
          }
          @keyframes rt-rt-thread-flow { to { stroke-dashoffset: -640; } }
        `}</style>
      </Head>

      <Box
        ref={landingRef}
        className="rt-landing"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100dvh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          ...backgroundStyle,
          transition: 'background 0.5s ease',
        }}
      >
        <LandingNavbar currentLang={currentLang} onLangChange={handleLangChange} />
        {/* Decorative glow blobs — fluid across 280→2560, muted on foldable cover to avoid overflow */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            top: { xs: -120, sm: -180 },
            right: { xs: -80, sm: -120 },
            width: { xs: 220, sm: 320, md: 520, xl: 640 },
            height: { xs: 220, sm: 320, md: 520, xl: 640 },
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(230,57,70,0.5) 0%, rgba(183,28,28,0) 70%)',
            filter: { xs: 'blur(50px)', md: 'blur(70px)' },
            opacity: { xs: 0.6, md: 1 },
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            bottom: { xs: -100, sm: -160 },
            left: { xs: -80, sm: -140 },
            width: { xs: 220, sm: 300, md: 480, xl: 620 },
            height: { xs: 220, sm: 300, md: 480, xl: 620 },
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,107,0.4) 0%, rgba(255,107,107,0) 70%)',
            filter: { xs: 'blur(60px)', md: 'blur(80px)' },
            opacity: { xs: 0.6, md: 1 },
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        {/* Hero Section — Producto */}
        <Container
          id="producto"
          maxWidth={false}
          sx={{
            maxWidth: { xs: '100%', sm: '540px', md: '768px', lg: '1024px', xl: '1280px' },
            '@media (min-width:1920px)': { maxWidth: '1600px' },
            mx: 'auto',
            px: { xs: 2, sm: 3, lg: 4 },
          }}
        >
          <Box
            className="rt-hero"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pt: { xs: 10, sm: 11, md: 14, lg: 16, xl: 18 },
              pb: { xs: 6, md: 9, lg: 10 },
              textAlign: 'center',
              color: 'white',
              position: 'relative',
              zIndex: 1,
              width: '100%',
              maxWidth: { xs: '100%', sm: '640px', md: '720px', lg: '820px' },
              mx: 'auto',
              transition: transitionEnabled ? 'all 0.3s ease' : 'none',
            }}
          >
            <Box
              className="rt-hero-logo"
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 2,
                minHeight: { xs: 100, sm: 130, lg: 140 },
              }}
            >
              {heroIcon && heroIcon !== '/imagotipo.png' ? (
                <img
                  className="rt-hero-logo"
                  src={heroIcon}
                  alt="Red Thread"
                  style={{ height: 'clamp(88px, 12vw, 160px)', width: 'auto', maxWidth: '100%' }}
                />
              ) : (
                <RedThreadLogo
                  className="rt-hero-logo"
                  variant="mark"
                  aria-label="Red Thread (RETH)"
                  style={{ height: 'clamp(88px, 12vw, 160px)', width: 'auto', maxWidth: '100%' }}
                />
              )}
            </Box>
              <Typography
                component="h1"
                variant="h5"
                className="rt-subtitle"
                ref={titleRef}
                aria-label={displayText.subtitle}
                sx={{
                  fontFamily: getTitleFontFamily(cmsConfig?.titleFont),
                  fontWeight: landingTypography.heroTitle.weight,
                  letterSpacing: landingTypography.heroTitle.tracking,
                  lineHeight: landingTypography.heroTitle.lineHeight,
                  fontOpticalSizing: 'auto',
                  // El texto nunca se corta: ocupa las líneas que necesite; palabras largas sí envuelven
                  fontSize: {
                    xs: landingTypography.heroTitle.size.xs,
                    md: `max(${cmsConfig?.subtitleFontSize || 5}rem, 4.6rem)`,
                  },
                  overflowWrap: 'break-word',
                  textAlign: 'center',
                  mx: 'auto',
                  maxWidth: '100%',
                  textWrap: 'balance',
                  color: cmsConfig?.subtitleColor || 'white',
                  mb: 3,
                  opacity: 0.98,
                  textShadow: landingShadows.text.heroTitle,
                  willChange: 'transform',
                }}
              >
              {renderChars(displayText.subtitle)}
            </Typography>
            <Typography
              variant="body1"
              className="rt-description"
              sx={{
                fontFamily: getBodyFontFamily(cmsConfig?.descriptionFont || cmsConfig?.bodyFont),
                fontWeight: landingTypography.heroBody.weight,
                fontSize: `${cmsConfig?.descriptionFontSize || 1.15}rem`,
                lineHeight: landingTypography.heroBody.lineHeight,
                letterSpacing: landingTypography.heroBody.tracking,
                mb: { xs: 4, md: 5 },
                maxWidth: '720px',
                mx: 'auto',
                textAlign: 'center',
                opacity: 0.95,
                textShadow: landingShadows.text.heroBody,
                overflowWrap: 'anywhere',
                textWrap: 'balance',
              }}
            >
              {displayText.description}
            </Typography>
            <Box className="rt-ctas" sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', width: '100%', mx: 'auto' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/auth/register')}
                sx={{
                  position: 'relative',
                  bgcolor: '#E63946',
                  backdropFilter: 'blur(18px)',
                  WebkitBackdropFilter: 'blur(18px)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: landingShadows.ctaPrimary.rest,
                  overflow: 'hidden',
                  touchAction: 'manipulation', // Apple 10: hit padding + hysteresis
                  transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.2s ease',
                  '&:hover': {
                    bgcolor: '#FF6B6B',
                    transform: 'translateY(-3px)',
                    boxShadow: landingShadows.ctaPrimary.hover,
                  },
                  '&:active': {
                    transform: 'scale(0.97)', // Apple 1: response on pointer-down, 100ms
                    transition: 'transform 100ms ease-out',
                  },
                  flex: { xs: '1 1 140px', sm: '0 0 auto' },
                  minWidth: { xs: 0, sm: 148 },
                  px: { xs: 2.5, sm: 4 },
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                }}
              >
                {displayText.ctaPrimary}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push('/auth/login')}
                sx={{
                  position: 'relative',
                  borderColor: 'rgba(255,255,255,0.6)',
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(18px)',
                  WebkitBackdropFilter: 'blur(18px)',
                  boxShadow: landingShadows.ctaSecondary.rest,
                  touchAction: 'manipulation',
                  transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.2s ease, border-color 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.22)',
                    borderColor: 'rgba(255,255,255,0.95)',
                    transform: 'translateY(-2px)',
                    boxShadow: landingShadows.ctaSecondary.hover,
                  },
                  '&:active': {
                    transform: 'scale(0.97)',
                    transition: 'transform 100ms ease-out',
                  },
                  flex: { xs: '1 1 140px', sm: '0 0 auto' },
                  minWidth: { xs: 0, sm: 148 },
                  px: { xs: 2.5, sm: 4 },
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                }}
              >
                {displayText.ctaSecondary}
              </Button>
            </Box>
          </Box>

          {/* Features Section — Planes / también para anclas */}
          <Box id="planes" className="rt-features" sx={{ py: { xs: 5, sm: 7, md: 10, xl: 12 }, position: 'relative', scrollMarginTop: '88px' }}>
            <svg
              className="rt-thread-svg"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                className="rt-thread-base"
                d="M-40,250 C240,90 420,280 720,170 C1020,60 1230,240 1480,120"
              />
              <path
                className="rt-thread-flow"
                d="M-40,250 C240,90 420,280 720,170 C1020,60 1230,240 1480,120"
              />
            </svg>
            <Typography
              variant="h3"
              className="rt-section-title"
              sx={{
                position: 'relative',
                zIndex: 1,
                fontFamily: getTitleFontFamily(cmsConfig?.titleFont),
                textAlign: 'center',
                color: 'white',
                fontSize: landingTypography.sectionTitle.size,
                letterSpacing: landingTypography.sectionTitle.tracking,
                mb: { xs: 5, md: 7 },
                fontWeight: landingTypography.sectionTitle.weight,
                lineHeight: landingTypography.sectionTitle.lineHeight,
                textShadow: landingShadows.text.sectionTitle,
              }}
            >
              {displayText.howItWorks}
            </Typography>
            <Grid container spacing={{ xs: 2, sm: 3, md: 3, xl: 4 }} sx={{ position: 'relative', zIndex: 1 }}>
              <Grid item xs={12} sm={12} md={6} lg={4} xl={3}>
                <Card
                  className="rt-feature-card"
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    borderRadius: { xs: 3, sm: 4 },
                    bgcolor: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(14px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(14px) saturate(180%)',
                    border: '1px solid rgba(255,255,255,0.7)',
                    borderTop: '1px solid rgba(255,255,255,0.4)',
                    boxShadow: landingShadows.card.rest,
                    willChange: 'transform',
                    transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.03)',
                      boxShadow: landingShadows.card.hover,
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                    <FavoriteIcon className="rt-icon-heart" sx={{ fontSize: { xs: 48, sm: 60 }, color: '#3B82F6', mb: 2 }} />                    <Typography
                      variant="h5"
                      className="rt-card-title"
                      gutterBottom
                      sx={{
                        fontFamily: getTitleFontFamily(cmsConfig?.titleFont),
                        fontWeight: landingTypography.cardTitle.weight,
                        letterSpacing: landingTypography.cardTitle.tracking,
                        lineHeight: landingTypography.cardTitle.lineHeight,
                        fontSize: landingTypography.cardTitle.size,
                        color: landingTypography.cardTitle.color,
                      }}
                    >
                      {displayText.features.smartMatching.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: getBodyFontFamily(cmsConfig?.bodyFont),
                        lineHeight: landingTypography.cardBody.lineHeight,
                        letterSpacing: landingTypography.cardBody.tracking,
                        fontWeight: landingTypography.cardBody.weight,
                        color: landingTypography.cardBody.color,
                      }}
                    >
                      {displayText.features.smartMatching.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={12} md={6} lg={4} xl={3}>
                <Card
                  className="rt-feature-card"
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    borderRadius: { xs: 3, sm: 4 },
                    bgcolor: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(14px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(14px) saturate(180%)',
                    border: '1px solid rgba(255,255,255,0.7)',
                    borderTop: '1px solid rgba(255,255,255,0.4)',
                    boxShadow: landingShadows.card.rest,
                    willChange: 'transform',
                    transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.03)',
                      boxShadow: landingShadows.card.hover,
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                    <ChatIcon className="rt-icon-chat" sx={{ fontSize: { xs: 48, sm: 60 }, color: '#8B5CF6', mb: 2 }} />
                    <Typography
                      variant="h5"
                      className="rt-card-title"
                      gutterBottom
                      sx={{
                        fontFamily: getTitleFontFamily(cmsConfig?.titleFont),
                        fontWeight: landingTypography.cardTitle.weight,
                        letterSpacing: landingTypography.cardTitle.tracking,
                        lineHeight: landingTypography.cardTitle.lineHeight,
                        fontSize: landingTypography.cardTitle.size,
                        color: landingTypography.cardTitle.color,
                      }}
                    >
                      {displayText.features.realTimeChat.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: getBodyFontFamily(cmsConfig?.bodyFont),
                        lineHeight: landingTypography.cardBody.lineHeight,
                        letterSpacing: landingTypography.cardBody.tracking,
                        fontWeight: landingTypography.cardBody.weight,
                        color: landingTypography.cardBody.color,
                      }}
                    >
                      {displayText.features.realTimeChat.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={12} md={6} lg={4} xl={3}>
                <Card
                  className="rt-feature-card"
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    borderRadius: { xs: 3, sm: 4 },
                    bgcolor: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(14px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(14px) saturate(180%)',
                    border: '1px solid rgba(255,255,255,0.7)',
                    borderTop: '1px solid rgba(255,255,255,0.4)',
                    boxShadow: landingShadows.card.rest,
                    willChange: 'transform',
                    transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.03)',
                      boxShadow: landingShadows.card.hover,
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                    <RadarIcon className="rt-icon-radar" sx={{ fontSize: { xs: 48, sm: 60 }, color: '#F59E0B', mb: 2 }} />
                    <Typography
                      variant="h5"
                      className="rt-card-title"
                      gutterBottom
                      sx={{
                        fontFamily: getTitleFontFamily(cmsConfig?.titleFont),
                        fontWeight: landingTypography.cardTitle.weight,
                        letterSpacing: landingTypography.cardTitle.tracking,
                        lineHeight: landingTypography.cardTitle.lineHeight,
                        fontSize: landingTypography.cardTitle.size,
                        color: landingTypography.cardTitle.color,
                      }}
                    >
                      {displayText.features.proximityRadar.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: getBodyFontFamily(cmsConfig?.bodyFont),
                        lineHeight: landingTypography.cardBody.lineHeight,
                        letterSpacing: landingTypography.cardBody.tracking,
                        fontWeight: landingTypography.cardBody.weight,
                        color: landingTypography.cardBody.color,
                      }}
                    >
                      {displayText.features.proximityRadar.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={12} md={6} lg={4} xl={3}>
                <Card
                  className="rt-feature-card"
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    borderRadius: { xs: 3, sm: 4 },
                    bgcolor: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(14px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(14px) saturate(180%)',
                    border: '1px solid rgba(255,255,255,0.7)',
                    borderTop: '1px solid rgba(255,255,255,0.4)',
                    boxShadow: landingShadows.card.rest,
                    willChange: 'transform',
                    transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.03)',
                      boxShadow: landingShadows.card.hover,
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                    <GroupsIcon className="rt-icon-groups" sx={{ fontSize: { xs: 48, sm: 60 }, color: '#E63946', mb: 2 }} />
                    <Typography
                      variant="h5"
                      className="rt-card-title"
                      gutterBottom
                      sx={{
                        fontFamily: getTitleFontFamily(cmsConfig?.titleFont),
                        fontWeight: landingTypography.cardTitle.weight,
                        letterSpacing: landingTypography.cardTitle.tracking,
                        lineHeight: landingTypography.cardTitle.lineHeight,
                        fontSize: landingTypography.cardTitle.size,
                        color: landingTypography.cardTitle.color,
                      }}
                    >
                      {displayText.features.multipleIntentions.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: getBodyFontFamily(cmsConfig?.bodyFont),
                        lineHeight: landingTypography.cardBody.lineHeight,
                        letterSpacing: landingTypography.cardBody.tracking,
                        fontWeight: landingTypography.cardBody.weight,
                        color: landingTypography.cardBody.color,
                      }}
                    >
                      {displayText.features.multipleIntentions.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
          {/* Anclajes adicionales para navbar */}
          <Box id="seguridad" sx={{ scrollMarginTop: '88px', py: 1 }} />
          <Box id="soporte" sx={{ scrollMarginTop: '88px', py: 1 }} />
          <Box id="descarga" sx={{ scrollMarginTop: '88px', py: 1 }} />
        </Container>

        <LandingFooter currentLang={currentLang} footerText={displayText.footer} bodyFont={cmsConfig?.bodyFont} footerTagline={displayText.footerTagline} />
      </Box>
    </>
  );
}
