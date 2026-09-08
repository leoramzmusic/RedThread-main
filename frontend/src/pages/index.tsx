import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import Head from 'next/head';
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
    footer: '© 2025 Red Thread. Hecho con ❤️ para conexiones significativas.'
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
    footer: '© 2025 Red Thread. Made with ❤️ for meaningful connections.'
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
    footer: '© 2025 Red Thread. Feito com ❤️ para conexões significativas.'
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
    footer: '© 2025 Red Thread. Fait avec ❤️ pour des connexions significatives.'
  }
};

const languages = ['es', 'en', 'pt', 'fr'] as const;
type Language = typeof languages[number];

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
    const interval = setInterval(() => {
      setCurrentLangIndex((prevIndex) => (prevIndex + 1) % languages.length);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Auto-rotate hero images
  useEffect(() => {
    if (heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
      }, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [heroImages]);

  // Dynamic Styles
  const currentHeroImage = heroImages.length > 0 ? heroImages[currentHeroIndex] : null;

  const backgroundStyle = currentHeroImage
    ? {
      backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${currentHeroImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }
    : {
      background: `linear-gradient(135deg, ${cmsConfig?.gradientStart || '#FF6B6B'} 0%, ${cmsConfig?.gradientEnd || '#4ECDC4'} 100%)`
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
            background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)'
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
      </Head>

      <Box
        sx={{
          minHeight: '100vh',
          ...backgroundStyle,
          transition: 'background 0.5s ease',
        }}
      >
        {/* Hero Section */}
        <Container maxWidth="lg">
          <Box
            sx={{
              pt: 8,
              pb: 6,
              textAlign: 'center',
              color: 'white',
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
              variant="h5"
              sx={{
                fontSize: { xs: '1.2rem', md: `${cmsConfig?.subtitleFontSize || 1.5}rem` },
                color: cmsConfig?.subtitleColor || 'white',
                mb: 4,
                opacity: 0.95,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              {displayText.subtitle}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.1rem',
                mb: 4,
                maxWidth: '600px',
                mx: 'auto',
                opacity: 0.9,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              {displayText.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/auth/register')}
                sx={{
                  bgcolor: 'white',
                  color: cmsConfig?.gradientStart || '#FF6B6B',
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                  },
                  px: 4,
                  py: 1.5,
                }}
              >
                {displayText.ctaPrimary}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push('/auth/login')}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                  px: 4,
                  py: 1.5,
                }}
              >
                {displayText.ctaSecondary}
              </Button>
            </Box>
          </Box>

          {/* Features Section */}
          <Box sx={{ py: 8 }}>
            <Typography
              variant="h3"
              sx={{
                textAlign: 'center',
                color: 'white',
                mb: 6,
                fontWeight: 600,
              }}
            >
              {displayText.howItWorks}
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6} lg={3}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <FavoriteIcon sx={{ fontSize: 60, color: '#FF6B6B', mb: 2 }} />
                    <Typography variant="h5" gutterBottom fontWeight={600}>
                      {displayText.features.smartMatching.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {displayText.features.smartMatching.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <ChatIcon sx={{ fontSize: 60, color: '#4ECDC4', mb: 2 }} />
                    <Typography variant="h5" gutterBottom fontWeight={600}>
                      {displayText.features.realTimeChat.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {displayText.features.realTimeChat.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <RadarIcon sx={{ fontSize: 60, color: '#FF6B6B', mb: 2 }} />
                    <Typography variant="h5" gutterBottom fontWeight={600}>
                      {displayText.features.proximityRadar.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {displayText.features.proximityRadar.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <GroupsIcon sx={{ fontSize: 60, color: '#4ECDC4', mb: 2 }} />
                    <Typography variant="h5" gutterBottom fontWeight={600}>
                      {displayText.features.multipleIntentions.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
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
            py: 4,
            textAlign: 'center',
            color: 'white',
            opacity: 0.8,
          }}
        >
          <Typography variant="body2">
            {displayText.footer}
          </Typography>
        </Box>
      </Box>
    </>
  );
}
