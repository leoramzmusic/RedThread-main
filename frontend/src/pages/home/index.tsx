import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  alpha,
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';
import {
  Favorite as FavoriteIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Casino as CasinoIcon,
  Explore as ExploreIcon,
  Chat as ChatIcon,
  ArrowForward as ArrowForwardIcon,
  ChevronRight as ChevronRightIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import apiClient from '../../services/api';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation, Trans } from 'next-i18next';
import {
  RED,
  RED_SMALL,
  BLUE,
  GRAPHITE,
  ICE_BLUE,
  glassSurface,
  glassHover,
  orbisLayer,
  glassHeading,
  textPrimary,
  textSecondary,
  hairline,
  pillPrimary,
  pillGlass,
  avatarRing,
  heartReactionHost,
  sectionDivider,
} from '../../styles/glass';

interface DashboardStats {
  matches_count: number;
  unread_messages: number;
  profile_completion: number;
  profile_visits: number;
}

interface RecentMatch {
  match_id: string;
  user_id: string;
  display_name: string;
  photo: string | null;
  matched_at: string;
}

interface RecentConversation {
  user_id: string;
  display_name: string;
  photo: string | null;
  last_message: string;
  last_message_at: string;
  unread: boolean;
}

interface Suggestion {
  user_id: string;
  display_name: string;
  age: number;
  bio: string | null;
  photo: string | null;
  interests: string[];
  affinity: number;
}

import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

function useCountTo(target: number, duration = 1100, delay = 0): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      if (start === null) start = now;
      const progress = Math.min(1, Math.max(0, (now - start - delay) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);
  return value;
}

function AnimatedPercent({ target }: { target: number }) {
  const value = useCountTo(target, 1100, 150);
  return <>{value}%</>;
}

/**
 * Formato abreviado para contadores (Matches, Mensajes, Visitas):
 * 0–999 → completo; 1.000+ → "k"; 1M+ → "M".
 */
function formatStatValue(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1_000) return `${Math.floor(num / 1_000)}k`;
  return `${num}`;
}

/** Color dinámico del contador de Perfil según el progreso. */
function profileColor(percent: number): string {
  if (percent >= 90) return '#4CAF50';
  if (percent >= 60) return '#FFC107';
  return '#F44336';
}

interface StatNumberProps {
  value: string | number;
  isDark: boolean;
  className?: string;
}

/**
 * Contador de tarjeta de stats.
 * - Perfil (%): color dinámico por progreso, transición de color 0.4s y pulso verde al 100%.
 * - Numéricos: formato abreviado (k/M).
 * Se re-monta por valor (key) para re-disparar el fade + slide up al cambiar.
 */
function StatNumber({ value, isDark, className }: StatNumberProps) {
  const isPercent = typeof value === 'string' && value.includes('%');
  const percent = isPercent ? parseInt(value, 10) || 0 : NaN;
  const color = isPercent ? profileColor(percent) : textPrimary(isDark);
  return (
    <Box
      key={String(value)}
      className={className}
      sx={{
        animation: 'rtSlideUpFade 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <Typography
        variant="h2"
        fontWeight={700}
        sx={{
          color,
          transition: 'color 0.4s ease, transform 0.3s ease',
          fontFamily: "'Poppins', Inter, system-ui, sans-serif",
          letterSpacing: '-0.02em',
          animation: isPercent && percent >= 100 ? 'rtPulse 0.6s ease 3' : undefined,
        }}
      >
        {isPercent ? <AnimatedPercent target={percent} /> : formatStatValue(Number(value))}
      </Typography>
    </Box>
  );
}

interface RippleActionButtonProps {
  label: string;
  accent: string;
  icon: React.ReactNode;
  isDark: boolean;
  style?: 'primary' | 'glass';
  onClick: () => void;
}

function RippleActionButton({
  label,
  accent,
  icon,
  isDark,
  onClick,
  style = 'glass',
}: RippleActionButtonProps) {
  const pillSx = style === 'primary' ? pillPrimary() : pillGlass(isDark);
  return (
    <Button
      onClick={onClick}
      sx={{
        ...pillSx,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Poppins', Inter, system-ui, sans-serif",
        fontWeight: 700,
        fontSize: '1rem',
        py: 1.25,
        cursor: 'pointer',
        minHeight: 52,
        width: { xs: '100%', sm: 'auto' },
        flex: { xs: '1 1 100%', sm: '0 1 auto' },
        '& .rt-blob': {
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 34,
          height: 34,
          borderRadius: '50%',
          backgroundColor: accent,
          pointerEvents: 'none',
          opacity: 0,
          transition: 'transform 0.6s ease, opacity 0.6s ease',
        },
        '& .rt-blob-0': { transform: 'translate(-3.3em, -4em)' },
        '& .rt-blob-1': { transform: 'translate(-6em, 1.3em)' },
        '& .rt-blob-2': { transform: 'translate(-0.2em, 1.8em)' },
        '& .rt-blob-3': { transform: 'translate(3.5em, 1.4em)' },
        '& .rt-blob-4': { transform: 'translate(3.5em, -3.8em)' },
        '& .rt-label': {
          position: 'relative',
          zIndex: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          whiteSpace: 'nowrap',
        },
        '& .rt-label svg': { fontSize: 22, color: 'inherit' },
        '&:hover .rt-blob': {
          transform: 'translate(-50%, -50%) scale(6)',
          opacity: 1,
          transition: 'transform 2.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease',
        },
        '@media (prefers-reduced-motion: reduce)': {
          '&:hover .rt-blob': {
            transform: 'translate(-50%, -50%) scale(2)',
            opacity: 1,
            transition: 'none',
          },
          '& .rt-blob': { transition: 'none' },
        },
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Box key={i} component="span" className={`rt-blob rt-blob-${i}`} />
      ))}
      <Box component="span" className="rt-label">
        {icon}
        {label}
      </Box>
    </Button>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primary = theme.palette.primary.main;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [careOpen, setCareOpen] = useState(false);
  const [careDisabled, setCareDisabled] = useState(false);

  const handleCareOpen = () => {
    if (!careDisabled) setCareOpen(true);
  };

  const handleCareClose = () => {
    setCareOpen(false);
    setCareDisabled(true);
  };

  const CareTransition = React.forwardRef(function CareTransition(
    props: TransitionProps & { children: React.ReactElement },
    ref: React.Ref<unknown>
  ) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes, suggestionsRes] = await Promise.all([
        apiClient.get('/home/stats'),
        apiClient.get('/home/recent-activity'),
        apiClient.get('/home/suggestions'),
      ]);

      setStats(statsRes.data);
      setRecentMatches(activityRes.data.recent_matches);
      setRecentConversations(activityRes.data.recent_conversations);
      setSuggestions(suggestionsRes.data);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);

      // If profile not found (404), redirect to profile creation
      if (error.response?.status === 404) {
        router.push('/profile');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to get badge color
  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'vip': return 'linear-gradient(45deg, #FFD700, #FFA500)';
      case 'premium': return 'linear-gradient(45deg, #C0C0C0, #E0E0E0)';
      default: return undefined; // Default gray/primary
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  const statAccents = [
    { icon: <FavoriteIcon sx={{ fontSize: 48 }} />, color: RED },
    { icon: <MessageIcon sx={{ fontSize: 48 }} />, color: BLUE },
    { icon: <PersonIcon sx={{ fontSize: 48 }} />, color: isDark ? '#AEB6C4' : GRAPHITE },
    { icon: <VisibilityIcon sx={{ fontSize: 48 }} />, color: ICE_BLUE },
  ];

  const statBodies = [
    { value: stats?.matches_count || 0, label: t('dashboard.statMatches'), nav: () => router.push('/matches') },
    { value: stats?.unread_messages || 0, label: t('dashboard.statMessages'), nav: () => router.push('/chat') },
    { value: `${stats?.profile_completion || 0}%`, label: t('dashboard.statProfile'), nav: () => router.push(`/profile/@${user?.nickname || user?.user_id}/modify-profile`) },
    { value: stats?.profile_visits || 0, label: t('dashboard.statVisits'), nav: () => router.push('/visits') },
  ];

  const statDelays = ['0s', '0.08s', '0.16s', '0.24s'];

  // Tarjetas con actividad pendiente: solo Matches, Mensajes y Visitas
  const statPending = [
    (stats?.matches_count || 0) > 0,
    (stats?.unread_messages || 0) > 0,
    false,
    (stats?.profile_visits || 0) > 0,
  ];

  const glassRow = {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    cursor: 'pointer',
    borderRadius: 3,
    px: 1.25,
    py: 1,
    borderBottom: '1px solid',
    borderColor: hairline(isDark),
    transition: 'background-color 0.25s ease',
    '&:last-of-type': { borderBottom: 'none' },
    '&:hover': {
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.45)',
    },
  };

  return (
    <Layout>
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        {/* Orbís de luz ambiental — el vidrio los refracta */}
        <Box sx={orbisLayer(isDark)} />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, pt: { xs: 2, md: 3 }, pb: 6 }}>
          {/* Header */}
          <Box display="flex" alignItems="center" gap={2} mb={4} flexWrap="wrap">
            <Typography
              variant="h4"
              component="h1"
              sx={{ ...glassHeading, color: textPrimary(isDark), fontSize: { xs: '1.75rem', md: '2.25rem' } }}
            >
              {t('dashboard.title')}
            </Typography>
            {user?.subscription_tier && user.subscription_tier !== 'free' && (
              <Chip
                label={user.subscription_tier.toUpperCase()}
                size="small"
                sx={{
                  background: getTierColor(user.subscription_tier),
                  color: user.subscription_tier === 'vip' ? 'black' : GRAPHITE,
                  fontWeight: 'bold',
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                  boxShadow: isDark
                    ? '0 4px 12px rgba(0,0,0,0.4)'
                    : '0 2px 8px rgba(26,27,30,0.08)',
                }}
              />
            )}
          </Box>

          {/* CARE Intro Widget */}
          <Paper
            elevation={0}
            sx={{
              ...glassSurface(isDark, { blur: 32, radius: 28, level: 'high', sheen: 'auto' }),
              p: 3,
              pb: { xs: 8, md: 3 },
              mb: 4,
              position: 'relative',
              overflow: 'hidden',
              animation: 'rtFadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
            }}
          >
            {/* Halo emocional: rojo destino + azul */}
            <Box sx={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: isDark
                ? 'radial-gradient(circle, rgba(230,57,70,0.25) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(230,57,70,0.18) 0%, transparent 70%)',
              zIndex: 0,
            }} />
            <Box sx={{
              position: 'absolute',
              bottom: -60,
              left: -30,
              width: 260,
              height: 260,
              borderRadius: '50%',
              background: isDark
                ? 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
              zIndex: 0,
            }} />

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, position: 'relative', zIndex: 1 }}>
              <Box sx={{
                p: 1.5,
                bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)',
                borderRadius: '50%',
                WebkitBackdropFilter: 'blur(12px)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'rtBreathe 2.6s ease-in-out infinite',
              }}>
                <AutoAwesomeIcon
                  className="care-spark"
                  sx={{
                    fontSize: 32,
                    color: RED,
                    transition: 'transform 0.3s ease, color 0.3s ease',
                    '&:hover': { transform: 'scale(1.25) rotate(8deg)', color: isDark ? '#ff6b76' : RED_SMALL },
                  }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ ...glassHeading, color: textPrimary(isDark), fontSize: '1.125rem' }}
                >
                  {t('dashboard.careGreeting')}
                </Typography>
                <Typography variant="body1" sx={{ maxWidth: { xs: '100%', md: 'calc(100% - 200px)' }, lineHeight: 1.55, fontSize: { xs: '0.95rem', md: '1rem' }, color: textSecondary(isDark), pr: { xs: 0, md: 4 } }}>
                  <Trans i18nKey="dashboard.careIntro" />
                </Typography>
              </Box>
            </Box>

            {/* Saber más - fijo en esquina inferior derecha (estilo learn-more) */}
            <Button
              onClick={handleCareOpen}
              disabled={careDisabled}
              sx={{
                position: 'absolute',
                bottom: 14,
                right: 20,
                zIndex: 2,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                width: '11rem',
                height: 44,
                minWidth: 0,
                padding: 0,
                overflow: 'hidden',
                borderRadius: 999,
                verticalAlign: 'middle',
                textTransform: 'none',
                cursor: 'pointer',
                background: 'transparent',
                '& .rt-learn-circle': {
                  transition: 'all 0.45s cubic-bezier(0.65, 0, 0.076, 1)',
                  position: 'relative',
                  display: 'block',
                  flexShrink: 0,
                  marginLeft: '0.75rem',
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: 'rgba(40,41,54,0.82)',
                  WebkitBackdropFilter: 'blur(14px) saturate(150%)',
                  backdropFilter: 'blur(14px) saturate(150%)',
                  border: '1px solid',
                  borderColor: isDark ? alpha(primary, 0.55) : alpha(primary, 0.6),
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 0 12px ${alpha(primary, 0.5)}, 0 8px 20px rgba(0,0,0,0.25)`,
                  zIndex: 1,
                  '&:hover': {
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px ${alpha(primary, 0.65)}, 0 0 22px ${alpha(primary, 0.75)}, 0 10px 24px rgba(0,0,0,0.28)`,
                  },
                },
                '& .rt-learn-chevron': {
                  position: 'absolute',
                  left: '23px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 22,
                  color: '#fff',
                  zIndex: 3,
                  transition: 'all 0.45s cubic-bezier(0.65, 0, 0.076, 1)',
                },
                '& .rt-learn-arrow-morph': {
                  position: 'absolute',
                  left: '23px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 20,
                  color: '#fff',
                  opacity: 0,
                  zIndex: 3,
                  transition: 'all 0.45s cubic-bezier(0.65, 0, 0.076, 1)',
                },
                '& .rt-learn-text': {
                  transition: 'all 0.45s cubic-bezier(0.65, 0, 0.076, 1)',
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  paddingLeft: '4rem',
                  paddingRight: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  whiteSpace: 'nowrap',
                  color: textPrimary(isDark),
                  zIndex: 2,
                },
                '&:hover .rt-learn-circle': { width: 'calc(100% - 0.75rem)' },
                '&:hover .rt-learn-chevron': { opacity: 0 },
                '&:hover .rt-learn-arrow-morph': { opacity: 1 },
                '&:hover .rt-learn-text': { color: '#fff' },
                '&.Mui-disabled': { opacity: 0.5, cursor: 'default' },
                '@media (prefers-reduced-motion: reduce)': {
                  '& .rt-learn-circle, & .rt-learn-chevron, & .rt-learn-arrow-morph, & .rt-learn-text': { transition: 'none' },
                  '&:hover .rt-learn-chevron': { opacity: 1, transform: 'translateY(-50%)' },
                  '&:hover .rt-learn-arrow-morph': { opacity: 0, transform: 'translateY(-50%)' },
                },
              }}
            >
              <Box component="span" className="rt-learn-circle" />
              <ChevronRightIcon className="rt-learn-chevron" />
              <ArrowForwardIcon className="rt-learn-arrow-morph" />
              <Box component="span" className="rt-learn-text">
                {t('dashboard.careKnowMore')}
              </Box>
            </Button>
          </Paper>

          <Box component="hr" sx={sectionDivider(isDark)} />

          {/* Stats Cards */}
          <Grid container spacing={3} mb={4}>
            {statBodies.map((stat, idx) => (
              <Grid item xs={12} sm={6} md={3} key={stat.label}>
                <Card
                  role="button"
                  tabIndex={0}
                  onClick={stat.nav}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stat.nav(); } }}
                  sx={{
                    ...glassSurface(isDark),
                    ...glassHover(),
                    animation: statPending[idx]
                      ? 'rtFadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both, rtGlowPulse 2.6s ease-in-out infinite'
                      : 'rtFadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
                    animationDelay: statPending[idx] ? `${statDelays[idx]}, 0.7s` : statDelays[idx],
                    cursor: 'pointer',
                    zIndex: 1,
                    color: statPending[idx] ? statAccents[idx].color : undefined,
                    ...(statPending[idx] && {
                      '&:hover .stat-number': { transform: 'scale(1.08)' },
                      '&:hover .stat-icon': { animation: 'rtIconBounce 0.45s ease' },
                    }),
                  }}
                >
                  {statPending[idx] && (
                    <Box
                      component="span"
                      aria-label="Actividad pendiente"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        zIndex: 2,
                        bgcolor: statAccents[idx].color,
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(255,255,255,0.55)' : '#fff',
                        boxShadow: `0 0 10px ${statAccents[idx].color}`,
                        animation: 'rtBadgePulse 1.8s ease-in-out infinite',
                      }}
                    />
                  )}
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
<StatNumber value={stat.value} isDark={isDark} className="stat-number" />
                        <Typography variant="body1" sx={{ color: textSecondary(isDark), fontWeight: 500, fontSize: '1.0625rem', mt: 0.5 }}>
                          {stat.label}
                        </Typography>
                      </Box>
                      <Box sx={{ animation: 'rtHeartbeat 2.6s ease-in-out infinite', display: 'flex' }}>
                          <Box
                            component="span"
                            className="stat-icon"
                            sx={
                              idx === 0
                                ? {
                                    ...heartReactionHost(isDark),
                                    display: 'flex',
                                    color: statAccents[idx].color,
                                    opacity: 0.85,
                                    filter: isDark ? 'drop-shadow(0 0 12px rgba(230,57,70,0.25))' : 'none',
                                  }
                                : {
                                    display: 'flex',
                                    color: statAccents[idx].color,
                                    opacity: 0.85,
                                    transition: 'transform 0.3s ease, opacity 0.3s ease, filter 0.3s ease',
                                    filter: isDark ? `drop-shadow(0 0 12px ${statAccents[idx].color}40)` : 'none',
                                    '&:hover': {
                                      transform: 'scale(1.14)',
                                      filter: `drop-shadow(0 4px 14px ${statAccents[idx].color}99)`,
                                    },
                                  }
                            }
                          >
                            {statAccents[idx].icon}
                          </Box>
                        </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box component="hr" sx={sectionDivider(isDark)} />

          {/* Quick Actions */}
          <Paper
            elevation={0}
            sx={{
              ...glassSurface(isDark, { level: 'high', sheen: 'auto' }),
              p: 3,
              mb: 4,
              animation: 'rtFadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
              animationDelay: '0.32s',
              zIndex: 1,
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h5" mb={1} sx={{ ...glassHeading, color: textPrimary(isDark), fontSize: '1.375rem' }}>
                  {t('dashboard.quickReady')}
                </Typography>
                <Typography variant="body1" sx={{ color: textSecondary(isDark) }}>
                  {t('dashboard.quickReadyDesc')}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" gap={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap">
                  <RippleActionButton
                    label={t('dashboard.quickRoulette')}
                    icon={<CasinoIcon sx={{ color: 'inherit' }} />}
                    accent={RED}
                    onClick={() => router.push('/roulette')}
                    isDark={isDark}
                  />
                  <RippleActionButton
                    label={t('dashboard.quickDiscover')}
                    icon={<ExploreIcon sx={{ color: 'inherit' }} />}
                    accent={BLUE}
                    onClick={() => router.push('/discover')}
                    isDark={isDark}
                  />
                  <RippleActionButton
                    label={t('dashboard.quickChat')}
                    icon={<ChatIcon sx={{ color: 'inherit' }} />}
                    accent={ICE_BLUE}
                    onClick={() => router.push('/chat')}
                    isDark={isDark}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Box component="hr" sx={sectionDivider(isDark)} />

          <Grid container spacing={3}>
            {/* Recent Matches */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  ...glassSurface(isDark, { sheen: 'auto' }),
                  ...glassHover(),
                  p: 3,
                  zIndex: 1,
                  animation: 'rtFadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
                  animationDelay: '0.4s',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ ...glassHeading, color: textPrimary(isDark), fontSize: '1.125rem' }}>
                    {t('dashboard.recentMatches')}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => router.push('/discover')}
                    sx={{ color: textSecondary(isDark), transition: 'transform 0.3s ease, color 0.3s ease', '&:hover': { transform: 'translateX(3px) scale(1.1)', color: BLUE } }}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                </Box>
                {recentMatches.length > 0 ? (
                  <Box display="flex" flexDirection="column">
                    {recentMatches.map((match) => (
                      <Box
                        key={match.match_id}
                        sx={glassRow}
                        onClick={() => router.push(`/chat?user=${match.user_id}`)}
                      >
                        <Avatar src={match.photo || undefined} sx={{ width: 56, height: 56, ...avatarRing(isDark) }}>
                          {match.display_name[0]}
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                          <Typography variant="body1" fontWeight={600} sx={{ color: textPrimary(isDark) }}>
                            {match.display_name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: textSecondary(isDark) }}>
                            {new Date(match.matched_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: textSecondary(isDark) }}>
                    {t('dashboard.noRecentMatches')}
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Recent Conversations */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  ...glassSurface(isDark, { sheen: 'auto' }),
                  ...glassHover(),
                  p: 3,
                  zIndex: 1,
                  animation: 'rtFadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
                  animationDelay: '0.48s',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ ...glassHeading, color: textPrimary(isDark), fontSize: '1.125rem' }}>
                    {t('dashboard.conversations')}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => router.push('/chat')}
                    sx={{ color: textSecondary(isDark), transition: 'transform 0.3s ease, color 0.3s ease', '&:hover': { transform: 'translateX(3px) scale(1.1)', color: BLUE } }}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                </Box>
                {recentConversations.length > 0 ? (
                  <Box display="flex" flexDirection="column">
                    {recentConversations.map((conv) => (
                      <Box
                        key={conv.user_id}
                        sx={glassRow}
                        onClick={() => router.push(`/chat?user=${conv.user_id}`)}
                      >
                        <Avatar src={conv.photo || undefined} sx={{ width: 56, height: 56, ...avatarRing(isDark) }}>
                          {conv.display_name[0]}
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                          <Typography variant="body1" fontWeight={600} sx={{ color: textPrimary(isDark) }}>
                            {conv.display_name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: conv.unread ? 600 : 400,
                              color: conv.unread ? BLUE : textSecondary(isDark),
                            }}
                          >
                            {conv.last_message}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: textSecondary(isDark) }}>
                    {t('dashboard.noConversations')}
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Suggestions */}
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  ...glassSurface(isDark, { sheen: 'auto' }),
                  ...glassHover(),
                  p: 3,
                  zIndex: 1,
                  animation: 'rtFadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
                  animationDelay: '0.56s',
                }}
              >
                <Typography variant="h6" mb={2} sx={{ ...glassHeading, color: textPrimary(isDark), fontSize: '1.125rem' }}>
                  {t('dashboard.suggestions')}
                </Typography>
                <Grid container spacing={2}>
                  {suggestions.map((suggestion) => (
                    <Grid item xs={12} sm={6} md={4} lg={2.4} key={suggestion.user_id}>
                      <Card
                        sx={{
                          ...glassSurface(isDark, { blur: 16, radius: 20, level: 'low' }),
                          cursor: 'pointer',
                          zIndex: 1,
                        }}
                        onClick={() => router.push(`/discover`)}
                      >
                        <Box
                          sx={{
                            height: 200,
                            m: 1.25,
                            mb: 0,
                            borderRadius: 24,
                            overflow: 'hidden',
                            background: suggestion.photo
                              ? `url(${suggestion.photo})`
                              : 'linear-gradient(135deg, #BFDBFE 0%, #E0E7FF 100%)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative',
                            border: '1px solid',
                            borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.6)',
                          }}
                        >
                          <Chip
                            label={t('dashboard.matchAffinity', { affinity: suggestion.affinity })}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              bgcolor: isDark ? 'rgba(26,27,30,0.72)' : 'rgba(255,255,255,0.85)',
                              WebkitBackdropFilter: 'blur(10px)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid',
                              borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)',
                              color: RED,
                              fontWeight: 700,
                            }}
                          />
                        </Box>
                        <CardContent>
                          <Typography variant="body1" fontWeight={600} sx={{ color: textPrimary(isDark) }}>
                            {suggestion.display_name}, {suggestion.age}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: textSecondary(isDark),
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {suggestion.bio || t('dashboard.noBio')}
                          </Typography>
                          <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                            {suggestion.interests.map((interest, idx) => (
                              <Chip
                                key={idx}
                                label={interest}
                                size="small"
                                sx={{
                                  bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)',
                                  border: '1px solid',
                                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.55)',
                                  color: textSecondary(isDark),
                                  fontWeight: 500,
                                }}
                              />
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                {suggestions.length === 0 && (
                  <Typography variant="body2" sx={{ color: textSecondary(isDark) }}>
                    {t('dashboard.noSuggestions')}
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CARE Algorithm Modal */}
      <Dialog
        open={careOpen}
        onClose={handleCareClose}
        TransitionComponent={CareTransition}
        maxWidth="sm"
        fullWidth
        BackdropProps={{
          sx: {
            bgcolor: isDark ? 'rgba(10,11,13,0.55)' : 'rgba(26,27,30,0.35)',
            WebkitBackdropFilter: 'blur(8px)',
            backdropFilter: 'blur(8px)',
          },
        }}
        PaperProps={{
          sx: glassSurface(isDark, { blur: 32, level: 'high', elevated: true }),
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: textPrimary(isDark), fontFamily: "'Poppins', Inter, system-ui, sans-serif" }}>
          {t('dashboard.modalTitle')}
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: hairline(isDark), color: textSecondary(isDark) }}>
          <Typography variant="body1" paragraph>
            <Trans i18nKey="dashboard.modalIntro" />
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            <Box component="li">
              <Typography variant="body1" sx={{ color: textSecondary(isDark) }}>
                <strong style={{ color: textPrimary(isDark) }}>{t('dashboard.modalContextLabel')}:</strong> {t('dashboard.modalContext')}
              </Typography>
            </Box>
            <Box component="li">
              <Typography variant="body1" sx={{ color: textSecondary(isDark) }}>
                <strong style={{ color: textPrimary(isDark) }}>{t('dashboard.modalAttributesLabel')}:</strong> {t('dashboard.modalAttributes')}
              </Typography>
            </Box>
            <Box component="li">
              <Typography variant="body1" sx={{ color: textSecondary(isDark) }}>
                <strong style={{ color: textPrimary(isDark) }}>{t('dashboard.modalRelevanceLabel')}:</strong> {t('dashboard.modalRelevance')}
              </Typography>
            </Box>
            <Box component="li">
              <Typography variant="body1" sx={{ color: textSecondary(isDark) }}>
                <strong style={{ color: textPrimary(isDark) }}>{t('dashboard.modalEngagementLabel')}:</strong> {t('dashboard.modalEngagement')}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body1" sx={{ mt: 2, color: textSecondary(isDark) }}>
            {t('dashboard.modalClosing')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCareClose} sx={pillGlass(isDark, true)}>
            {t('dashboard.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}