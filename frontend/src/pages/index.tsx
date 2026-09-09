import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import Head from 'next/head';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Container, Box, Typography, Button, Grid, Card, CardContent, CircularProgress } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatIcon from '@mui/icons-material/Chat';
import RadarIcon from '@mui/icons-material/Radar';
import GroupsIcon from '@mui/icons-material/Groups';
import appearanceService from '../services/appearanceService';
import { AppearanceType } from '../types/appearance';
import { getMediaUrl } from '../utils/media';


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

const languages = ['es', 'en', 'pt', 'fr'] as const;
type Language = typeof languages[number];

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
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [currentLangIndex, setCurrentLangIndex] = useState(0);
  const currentLang: Language = languages[currentLangIndex];
  const t = translations[currentLang];

  // CMS State
  const [cmsConfig, setCmsConfig] = useState<any>(null);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isLoadingCms, setIsLoadingCms] = useState(true);
  const [heroIcon, setHeroIcon] = useState<string | null>(null);

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
        // Theme Config
        const themes = await appearanceService.getResources(AppearanceType.LANDING_THEME);
        const activeTheme = themes.find(r => r.is_active);
        if (activeTheme && activeTheme.metadata) {
          setCmsConfig(activeTheme.metadata);
        }

        // Banners (Hero & Icon)
        const banners = await appearanceService.getResources(AppearanceType.LANDING_BANNER);

        // Find Backgrounds
        const activeBanners = banners.filter(r => r.is_active && !r.metadata?.isHeroIcon);
        if (activeBanners.length > 0) {
          setHeroImages(activeBanners.map(b => getMediaUrl(b.url)));
        }

        // Find Icon
        const activeIcon = banners.find(r => r.is_active && r.metadata?.isHeroIcon);
        if (activeIcon) {
          setHeroIcon(getMediaUrl(activeIcon.url));
        } else {
          setHeroIcon('/imagotipo.png'); // Default fallback
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

  // Auto-rotate language (Only if No CMS override for text)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const interval = setInterval(() => {
      setCurrentLangIndex((prevIndex) => (prevIndex + 1) % languages.length);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Auto-rotate hero images
  useEffect(() => {
    if (heroImages.length > 1) {
      if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        return;
      }
      const interval = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
      }, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [heroImages]);

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

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const chars = subtitle
          ? gsap.utils.toArray<HTMLElement>('.rt-landing-char', subtitle)
          : [];

        const master = gsap.timeline({ defaults: { ease: LANDING_TIMING.hero.ease } });

        master.addLabel('hero', 0);
        master.fromTo(
          chars,
          { yPercent: 120, autoAlpha: 0 },
          {
            yPercent: 0,
            autoAlpha: 1,
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

        if (heroLogo && hero) {
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

        if (features && cards.length > 0) {
          const pinTargets = [featuresTitle, ...cards].filter(Boolean) as HTMLElement[];
          gsap.set(pinTargets, { autoAlpha: 0, y: 70 });
          master.to(
            pinTargets,
            {
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
            },
            '<'
          );
        }

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
  }, [heroImages, currentHeroIndex]);

  // Dynamic Styles
  const currentHeroImage = heroImages.length > 0 ? heroImages[currentHeroIndex] : null;

  const backgroundStyle = currentHeroImage
    ? {
      backgroundImage: `linear-gradient(rgba(35, 8, 20, 0.55), rgba(35, 8, 20, 0.68)), url(${currentHeroImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }
    : {
      background: `linear-gradient(135deg, ${cmsConfig?.gradientStart || '#881337'} 0%, ${cmsConfig?.gradientEnd || '#FB7185'} 100%)`
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
            background: 'linear-gradient(135deg, #881337 0%, #FB7185 100%)'
          }}
        >
          <CircularProgress size={60} sx={{ color: 'white' }} />
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;600;700&family=Open+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `@media (prefers-reduced-motion: reduce){.rt-landing,.rt-landing *{transition:none !important;animation:none !important;scroll-behavior:auto !important}}`,
          }}
        />
        <style>{`
          .rt-landing .rt-landing-word { display: inline-block; white-space: nowrap; }
          .rt-landing .rt-landing-char { display: inline-block; will-change: transform; }
          body[data-font-size] .rt-landing .rt-landing-word.rt-landing-word,
          body[data-font-size] .rt-landing .rt-landing-char.rt-landing-char {
            font-size: inherit !important;
          }
          @media (max-width: 899.98px) {
            body[data-font-size] .rt-landing.rt-landing .rt-subtitle { font-size: max(${cmsConfig?.subtitleFontSize || 3.4}rem, 3.1rem) !important; }
            body[data-font-size] .rt-landing .rt-section-title { font-size: 2.9rem !important; }
            body[data-font-size] .rt-landing .rt-card-title { font-size: 1.6rem !important; }
          }
          @media (min-width: 900px) {
            body[data-font-size] .rt-landing.rt-landing .rt-subtitle { font-size: max(${cmsConfig?.subtitleFontSize || 5}rem, 4.6rem) !important; }
            body[data-font-size] .rt-landing .rt-section-title { font-size: 4rem !important; }
            body[data-font-size] .rt-landing .rt-card-title { font-size: 1.8rem !important; }
          }
        `}</style>
      </Head>

      <Box
        ref={landingRef}
        className="rt-landing"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100vh',
          ...backgroundStyle,
          transition: 'background 0.5s ease',
        }}
      >
        {/* Decorative glow blobs */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            top: -180,
            right: -120,
            width: { xs: 320, md: 520 },
            height: { xs: 320, md: 520 },
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251,113,133,0.5) 0%, rgba(213,63,140,0) 70%)',
            filter: 'blur(70px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            bottom: -160,
            left: -140,
            width: { xs: 300, md: 480 },
            height: { xs: 300, md: 480 },
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,177,153,0.4) 0%, rgba(255,177,153,0) 70%)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        {/* Hero Section */}
        <Container maxWidth="lg">
          <Box
            className="rt-hero"
            sx={{
              pt: { xs: 10, md: 14 },
              pb: { xs: 6, md: 9 },
              textAlign: 'center',
              color: 'white',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <img
                className="rt-hero-logo"
                src={heroIcon || "/imagotipo.png"}
                alt="Red Thread"
                style={{
                  height: '120px',
                  width: 'auto',
                  maxWidth: '100%',
                }}
              />
            </Box>
            <Typography
              component="h1"
              variant="h5"
              className="rt-subtitle"
              aria-label={displayText.subtitle}
              sx={{
                fontFamily: 'Dancing Script, Poppins, Inter, cursive',
                fontWeight: 600,
                letterSpacing: '0.02em',
                lineHeight: 1.35,
                fontSize: { xs: 'max(3.4rem, 3.1rem)', md: `max(${cmsConfig?.subtitleFontSize || 5}rem, 4.6rem)` },
                color: cmsConfig?.subtitleColor || 'white',
                mb: 3,
                opacity: 0.98,
                textShadow: '0 2px 6px rgba(0,0,0,0.35)'
              }}
            >
              {renderChars(displayText.subtitle)}
            </Typography>
            <Typography
              variant="body1"
              className="rt-description"
              sx={{
                fontFamily: 'Open Sans, Inter, sans-serif',
                fontWeight: 400,
                fontSize: { xs: '1.05rem', md: '1.15rem' },
                lineHeight: 1.7,
                mb: 5,
                maxWidth: '620px',
                mx: 'auto',
                opacity: 0.95,
                textShadow: '0 1px 3px rgba(0,0,0,0.35)'
              }}
            >
              {displayText.description}
            </Typography>
            <Box className="rt-ctas" sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/auth/register')}
                sx={{
                  bgcolor: 'white',
                  color: cmsConfig?.gradientStart || '#9F1239',
                  '&:hover': {
                    bgcolor: '#FFF1F2',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 14px 32px rgba(136, 19, 55, 0.3)',
                  },
                  px: 4,
                  py: 1.5,
                  boxShadow: '0 8px 22px rgba(88, 8, 34, 0.25)',
                  transition: 'all 0.2s ease',
                }}
              >
                {displayText.ctaPrimary}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push('/auth/login')}
                sx={{
                  borderColor: 'rgba(255,255,255,0.9)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.14)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 26px rgba(0,0,0,0.18)',
                  },
                  px: 4,
                  py: 1.5,
                  transition: 'all 0.2s ease',
                }}
              >
                {displayText.ctaSecondary}
              </Button>
            </Box>
          </Box>

          {/* Features Section */}
          <Box className="rt-features" sx={{ py: { xs: 7, md: 10 } }}>
            <Typography
              variant="h3"
              className="rt-section-title"
              sx={{
                fontFamily: 'Dancing Script, Poppins, Inter, cursive',
                textAlign: 'center',
                color: 'white',
                fontSize: { xs: '2.9rem', md: '4rem' },
                letterSpacing: '0.01em',
                mb: { xs: 5, md: 7 },
                fontWeight: 700,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              {displayText.howItWorks}
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6} lg={3}>
                <Card
                  className="rt-feature-card"
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.86)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: '1px solid rgba(255,255,255,0.7)',
                    boxShadow: '0 18px 40px rgba(88, 8, 34, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 26px 55px rgba(136, 19, 55, 0.24), 0 8px 20px rgba(0, 0, 0, 0.12)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <FavoriteIcon sx={{ fontSize: 60, color: '#E11D48', mb: 2 }} />
                    <Typography
                      variant="h5"
                      className="rt-card-title"
                      gutterBottom
                      sx={{
                        fontFamily: 'Dancing Script, Poppins, Inter, cursive',
                        fontWeight: 600,
                        letterSpacing: '0.01em',
                        lineHeight: 1.3,
                        fontSize: { xs: '1.6rem', md: '1.8rem' },
                        color: '#3B1C2A',
                      }}
                    >
                      {displayText.features.smartMatching.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Open Sans, Inter, sans-serif',
                        lineHeight: 1.7,
                        color: '#6E5560',
                      }}
                    >
                      {displayText.features.smartMatching.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <Card
                  className="rt-feature-card"
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.86)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: '1px solid rgba(255,255,255,0.7)',
                    boxShadow: '0 18px 40px rgba(88, 8, 34, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 26px 55px rgba(136, 19, 55, 0.24), 0 8px 20px rgba(0, 0, 0, 0.12)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <ChatIcon sx={{ fontSize: 60, color: '#EA580C', mb: 2 }} />
                    <Typography
                      variant="h5"
                      className="rt-card-title"
                      gutterBottom
                      sx={{
                        fontFamily: 'Dancing Script, Poppins, Inter, cursive',
                        fontWeight: 600,
                        letterSpacing: '0.01em',
                        lineHeight: 1.3,
                        fontSize: { xs: '1.6rem', md: '1.8rem' },
                        color: '#3B1C2A',
                      }}
                    >
                      {displayText.features.realTimeChat.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Open Sans, Inter, sans-serif',
                        lineHeight: 1.7,
                        color: '#6E5560',
                      }}
                    >
                      {displayText.features.realTimeChat.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <Card
                  className="rt-feature-card"
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.86)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: '1px solid rgba(255,255,255,0.7)',
                    boxShadow: '0 18px 40px rgba(88, 8, 34, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 26px 55px rgba(136, 19, 55, 0.24), 0 8px 20px rgba(0, 0, 0, 0.12)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <RadarIcon sx={{ fontSize: 60, color: '#E11D48', mb: 2 }} />
                    <Typography
                      variant="h5"
                      className="rt-card-title"
                      gutterBottom
                      sx={{
                        fontFamily: 'Dancing Script, Poppins, Inter, cursive',
                        fontWeight: 600,
                        letterSpacing: '0.01em',
                        lineHeight: 1.3,
                        fontSize: { xs: '1.6rem', md: '1.8rem' },
                        color: '#3B1C2A',
                      }}
                    >
                      {displayText.features.proximityRadar.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Open Sans, Inter, sans-serif',
                        lineHeight: 1.7,
                        color: '#6E5560',
                      }}
                    >
                      {displayText.features.proximityRadar.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <Card
                  className="rt-feature-card"
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.86)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: '1px solid rgba(255,255,255,0.7)',
                    boxShadow: '0 18px 40px rgba(88, 8, 34, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 26px 55px rgba(136, 19, 55, 0.24), 0 8px 20px rgba(0, 0, 0, 0.12)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <GroupsIcon sx={{ fontSize: 60, color: '#EA580C', mb: 2 }} />
                    <Typography
                      variant="h5"
                      className="rt-card-title"
                      gutterBottom
                      sx={{
                        fontFamily: 'Dancing Script, Poppins, Inter, cursive',
                        fontWeight: 600,
                        letterSpacing: '0.01em',
                        lineHeight: 1.3,
                        fontSize: { xs: '1.6rem', md: '1.8rem' },
                        color: '#3B1C2A',
                      }}
                    >
                      {displayText.features.multipleIntentions.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Open Sans, Inter, sans-serif',
                        lineHeight: 1.7,
                        color: '#6E5560',
                      }}
                    >
                      {displayText.features.multipleIntentions.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Container>

        {/* Footer */}
        <Box
          sx={{
            py: 5,
            textAlign: 'center',
            color: 'white',
            opacity: 0.85,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontFamily: 'Open Sans, Inter, sans-serif', letterSpacing: '0.04em' }}>
            {displayText.footer}
          </Typography>
        </Box>
      </Box>
    </>
  );
}
