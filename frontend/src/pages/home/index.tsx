import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
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
import { TransitionProps } from '@mui/material/transitions';
import {
  Favorite as FavoriteIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  ThumbUp as ThumbUpIcon,
  Casino as CasinoIcon,
  Explore as ExploreIcon,
  Chat as ChatIcon,
  ArrowForward as ArrowForwardIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import apiClient from '../../services/api';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation, Trans } from 'next-i18next';

interface DashboardStats {
  matches_count: number;
  unread_messages: number;
  profile_completion: number;
  likes_count: number;
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

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { user } = useSelector((state: RootState) => state.auth);

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

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box display="flex" alignItems="center" gap={2} mb={4} flexWrap="wrap">
          <Typography variant="h4" fontWeight={700}>
            {t('dashboard.title')}
          </Typography>
          {user?.subscription_tier && user.subscription_tier !== 'free' && (
            <Chip
              label={user.subscription_tier.toUpperCase()}
              size="small"
              sx={{
                background: getTierColor(user.subscription_tier),
                color: user.subscription_tier === 'vip' ? 'black' : 'black',
                fontWeight: 'bold',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}
            />
          )}
        </Box>

        {/* CARE Introduction Widget */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            pb: { xs: 8, md: 3 },
            mb: 4,
            background: 'linear-gradient(135deg, #2A0E61 0%, #7B1FA2 100%)', // Cosmic Purple
            borderRadius: 3,
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative Circle */}
          <Box sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            zIndex: 0
          }} />

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, position: 'relative', zIndex: 1 }}>
            <Box sx={{
              p: 1.5,
              bgcolor: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AutoAwesomeIcon sx={{ fontSize: 32, color: '#E1BEE7' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: '#E1BEE7' }}>
                {t('dashboard.careGreeting')}
              </Typography>
              <Typography variant="body1" sx={{ maxWidth: { xs: '100%', md: 'calc(100% - 120px)' }, lineHeight: 1.6, opacity: 0.95, pr: { xs: 0, md: 4 } }}>
                <Trans i18nKey="dashboard.careIntro" />
              </Typography>
            </Box>
          </Box>

          {/* Saber más - fijo en esquina inferior derecha */}
          <Button
            onClick={handleCareOpen}
            disabled={careDisabled}
            sx={{
              position: 'absolute',
              bottom: 14,
              right: 20,
              zIndex: 2,
              color: '#fff',
              bgcolor: 'rgba(255,255,255,0.08)',
              borderRadius: 2,
              px: 1.5,
              py: 0.75,
              minWidth: 0,
              textTransform: 'none',
              fontWeight: 700,
              gap: 0.5,
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
              '&.Mui-disabled': { opacity: 0.5 },
              '@keyframes careArrow': {
                '0%, 100%': { transform: 'translateX(0)' },
                '50%': { transform: 'translateX(5px)' },
              },
              '@media (prefers-reduced-motion: reduce)': {
                '& .care-arrow': { animation: 'none' },
              },
            }}
          >
            {t('dashboard.careKnowMore')}
            <ArrowForwardIcon
              className="care-arrow"
              sx={{ fontSize: 18, animation: 'careArrow 1.2s ease-in-out infinite' }}
            />
          </Button>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h2" fontWeight={700} color="white">
                      {stats?.matches_count || 0}
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ opacity: 0.9, fontWeight: 500, fontSize: '1.125rem' }}>
                      {t('dashboard.statMatches')}
                    </Typography>
                  </Box>
                  <FavoriteIcon sx={{ fontSize: 48, color: 'white', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4ECDC4 0%, #7FD9D1 100%)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h2" fontWeight={700} color="white">
                      {stats?.unread_messages || 0}
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ opacity: 0.9, fontWeight: 500, fontSize: '1.125rem' }}>
                      {t('dashboard.statMessages')}
                    </Typography>
                  </Box>
                  <MessageIcon sx={{ fontSize: 48, color: 'white', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #9B59B6 0%, #B47FD1 100%)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h2" fontWeight={700} color="white">
                      {stats?.profile_completion || 0}%
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ opacity: 0.9, fontWeight: 500, fontSize: '1.125rem' }}>
                      {t('dashboard.statProfile')}
                    </Typography>
                  </Box>
                  <PersonIcon sx={{ fontSize: 48, color: 'white', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #3498DB 0%, #5DADE2 100%)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h2" fontWeight={700} color="white">
                      {stats?.likes_count || 0}
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ opacity: 0.9, fontWeight: 500, fontSize: '1.125rem' }}>
                      {t('dashboard.statLikes')}
                    </Typography>
                  </Box>
                  <ThumbUpIcon sx={{ fontSize: 48, color: 'white', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #FF6B6B 0%, #E64A4A 100%)' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h5" fontWeight={700} color="white" mb={1}>
                {t('dashboard.quickReady')}
              </Typography>
              <Typography variant="body1" color="white" sx={{ opacity: 0.9 }}>
                {t('dashboard.quickReadyDesc')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CasinoIcon />}
                  onClick={() => router.push('/roulette')}
                  sx={{
                    bgcolor: 'white',
                    color: '#FF6B6B',
                    '&:hover': { bgcolor: '#f5f5f5' },
                    fontWeight: 600,
                    width: { xs: '100%', sm: 'auto' },
                    flex: { xs: '1 1 100%', sm: '0 1 auto' },
                  }}
                >
                  {t('dashboard.quickRoulette')}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<ExploreIcon />}
                  onClick={() => router.push('/discover')}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                    width: { xs: '100%', sm: 'auto' },
                    flex: { xs: '1 1 100%', sm: '0 1 auto' },
                  }}
                >
                  {t('dashboard.quickDiscover')}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<ChatIcon />}
                  onClick={() => router.push('/chat')}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                    width: { xs: '100%', sm: 'auto' },
                    flex: { xs: '1 1 100%', sm: '0 1 auto' },
                  }}
                >
                  {t('dashboard.quickChat')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* Recent Matches */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  {t('dashboard.recentMatches')}
                </Typography>
                <IconButton size="small" onClick={() => router.push('/discover')}>
                  <ArrowForwardIcon />
                </IconButton>
              </Box>
              {recentMatches.length > 0 ? (
                <Box display="flex" flexDirection="column" gap={2}>
                  {recentMatches.map((match) => (
                    <Box
                      key={match.match_id}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
                      onClick={() => router.push(`/chat?user=${match.user_id}`)}
                    >
                      <Avatar
                        src={match.photo || undefined}
                        sx={{ width: 56, height: 56 }}
                      >
                        {match.display_name[0]}
                      </Avatar>
                      <Box flex={1} minWidth={0}>
                        <Typography variant="body1" fontWeight={600}>
                          {match.display_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(match.matched_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.noRecentMatches')}
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Recent Conversations */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  {t('dashboard.conversations')}
                </Typography>
                <IconButton size="small" onClick={() => router.push('/chat')}>
                  <ArrowForwardIcon />
                </IconButton>
              </Box>
              {recentConversations.length > 0 ? (
                <Box display="flex" flexDirection="column" gap={2}>
                  {recentConversations.map((conv) => (
                    <Box
                      key={conv.user_id}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
                      onClick={() => router.push(`/chat?user=${conv.user_id}`)}
                    >
                      <Avatar
                        src={conv.photo || undefined}
                        sx={{ width: 56, height: 56 }}
                      >
                        {conv.display_name[0]}
                      </Avatar>
                      <Box flex={1} minWidth={0}>
                        <Typography variant="body1" fontWeight={600}>
                          {conv.display_name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontWeight: conv.unread ? 600 : 400,
                            color: conv.unread ? 'primary.main' : 'text.secondary',
                          }}
                        >
                          {conv.last_message}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.noConversations')}
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Suggestions */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                {t('dashboard.suggestions')}
              </Typography>
              <Grid container spacing={2}>
                {suggestions.map((suggestion) => (
                  <Grid item xs={12} sm={6} md={4} lg={2.4} key={suggestion.user_id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-4px)' },
                      }}
                      onClick={() => router.push(`/discover`)}
                    >
                      <Box
                        sx={{
                          height: 200,
                          background: suggestion.photo
                            ? `url(${suggestion.photo})`
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative',
                        }}
                      >
                        <Chip
                          label={t('dashboard.matchAffinity', { affinity: suggestion.affinity })}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(255,255,255,0.9)',
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                      <CardContent>
                        <Typography variant="body1" fontWeight={600}>
                          {suggestion.display_name}, {suggestion.age}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {suggestion.bio || t('dashboard.noBio')}
                        </Typography>
                        <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                          {suggestion.interests.map((interest, idx) => (
                            <Chip key={idx} label={interest} size="small" />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              {suggestions.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.noSuggestions')}
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* CARE Algorithm Modal */}
      <Dialog
        open={careOpen}
        onClose={handleCareClose}
        TransitionComponent={CareTransition}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('dashboard.modalTitle')}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" paragraph>
            <Trans i18nKey="dashboard.modalIntro" />
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            <Box component="li">
              <Typography variant="body1">
                <strong>{t('dashboard.modalContextLabel')}:</strong> {t('dashboard.modalContext')}
              </Typography>
            </Box>
            <Box component="li">
              <Typography variant="body1">
                <strong>{t('dashboard.modalAttributesLabel')}:</strong> {t('dashboard.modalAttributes')}
              </Typography>
            </Box>
            <Box component="li">
              <Typography variant="body1">
                <strong>{t('dashboard.modalRelevanceLabel')}:</strong> {t('dashboard.modalRelevance')}
              </Typography>
            </Box>
            <Box component="li">
              <Typography variant="body1">
                <strong>{t('dashboard.modalEngagementLabel')}:</strong> {t('dashboard.modalEngagement')}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {t('dashboard.modalClosing')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCareClose} color="primary">
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
