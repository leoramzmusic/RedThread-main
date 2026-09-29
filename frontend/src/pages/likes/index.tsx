import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Container,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  Stack,
  Dialog,
  Snackbar,
  Button
} from '@mui/material';
import {
  Favorite as HeartIcon,
  Star as StarIcon,
  Send as SendIcon,
  AccessTime as TimeIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  DeleteOutline as DeleteIcon,
  Visibility as VisibilityIcon,
  Replay as ReplayIcon
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import ParallaxImage from '../../components/motion/ParallaxImage';
import apiClient from '../../services/api';
import ProfileCard, { Profile } from '../../components/profile/ProfileCard';
import { useTranslation } from 'next-i18next';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/router';

interface LikeProfile {
  match_id: string;
  user_id: string;
  display_name: string;
  age: number;
  photos: string[];
  bio?: string;
  interests?: string[];
  affinity_score?: number;
  is_superlike?: boolean;
  liked_at?: string;
  passed_at?: string;
  last_seen?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const ONLINE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

const isOnline = (lastSeen?: string): boolean => {
  if (!lastSeen) return false;
  const seenAt = new Date(lastSeen).getTime();
  if (Number.isNaN(seenAt)) return false;
  return Date.now() - seenAt < ONLINE_WINDOW_MS;
};

type PeriodKey = 'today' | 'week' | 'month';

const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: 'Likes de hoy',
  week: 'Likes de esta semana',
  month: 'Likes de este mes'
};

const getPeriodKey = (dateStr?: string): PeriodKey => {
  if (!dateStr) return 'month';
  const ts = new Date(dateStr).getTime();
  if (Number.isNaN(ts)) return 'month';
  const now = Date.now();
  const startOfToday = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  if (ts >= startOfToday) return 'today';
  if (now - ts < 7 * 24 * 60 * 60 * 1000) return 'week';
  return 'month';
};

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`likes-tabpanel-${index}`}
      aria-labelledby={`likes-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function LikesPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [receivedLikes, setReceivedLikes] = useState<LikeProfile[]>([]);
  const [sentLikes, setSentLikes] = useState<LikeProfile[]>([]);
  const [topPicks, setTopPicks] = useState<LikeProfile[]>([]);
  const [secondChance, setSecondChance] = useState<LikeProfile[]>([]);

  const [selectedProfile, setSelectedProfile] = useState<LikeProfile | null>(null);
  const lastVisitRef = useRef<{ userId: string; at: number } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'info' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('LikesPage: Starting fetch...');

      const [receivedRes, sentRes, topPicksRes, secondChanceRes] = await Promise.all([
        apiClient.get('/discovery/likes-received'),
        apiClient.get('/discovery/likes-sent'),
        apiClient.get('/discovery/top-picks'),
        apiClient.get('/discovery/second-chance')
      ]);

      setReceivedLikes(receivedRes.data || []);
      setSentLikes(sentRes.data || []);
      setTopPicks(topPicksRes.data || []);
      setSecondChance(secondChanceRes.data || []);
    } catch (err: any) {
      console.error('Error fetching likes data:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        config: err.config,
        response: err.response
      });

      if (err.code === 'ERR_NETWORK') {
        setError('Error de conexión con el servidor. Por favor verifica que el backend esté corriendo.');
      } else if (err.response?.status === 404) {
        setError('Los endpoints de likes no están disponibles. Asegúrate de actualizar el backend.');
      } else {
        setError('Error al cargar los likes. Por favor intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const recordVisit = (userId: string) => {
    // Dedup: same profile clicked twice within 60s counts once
    const now = Date.now();
    if (
      lastVisitRef.current &&
      lastVisitRef.current.userId === userId &&
      now - lastVisitRef.current.at < 60_000
    ) {
      return;
    }
    lastVisitRef.current = { userId, at: now };
    apiClient
      .post(`/visits/record?target_user_id=${userId}`)
      .catch((err) => console.warn('Error recording visit:', err));
  };

  const handleProfileClick = (profile: LikeProfile) => {
    // Allow interaction for received likes, sent likes, top picks, and second chance
    if (tabValue === 0 || tabValue === 1 || tabValue === 2 || tabValue === 3) {
      recordVisit(profile.user_id);
      setSelectedProfile(profile);
    }
  };

  const handleCloseProfile = () => {
    setSelectedProfile(null);
  };

  const handleSwipe = async (
    interaction: 'like' | 'pass' | 'superlike',
    profileOverride?: LikeProfile
  ) => {
    const target = profileOverride || selectedProfile;
    if (!target) return;

    try {
      const response = await apiClient.post('/discovery/swipe', {
        target_user_id: target.user_id,
        interaction
      });

      if (!profileOverride) handleCloseProfile();

      if (response.data.is_match) {
        setMatchDialogOpen(true);
        setSnackbar({
          open: true,
          message: `¡Es un Match con ${target.display_name}! 🎉`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: interaction === 'pass' ? 'Perfil descartado' : 'Like enviado',
          severity: 'info'
        });
      }

      // Remove from list
      if (tabValue === 0) { // Received likes
        setReceivedLikes(prev => prev.filter(p => p.user_id !== target.user_id));
      } else if (tabValue === 2) { // Top picks
        setTopPicks(prev => prev.filter(p => p.user_id !== target.user_id));
      } else if (tabValue === 3) { // Second chance
        setSecondChance(prev => prev.filter(p => p.user_id !== target.user_id));
      }

    } catch (error) {
      console.error('Error swiping:', error);
      setSnackbar({ open: true, message: 'Error al procesar la acción', severity: 'error' });
    }
  };

  const handleRemoveLike = async (profile: LikeProfile) => {
    try {
      await apiClient.delete(`/discovery/likes-sent/${profile.match_id}`);
      setSentLikes(prev => prev.filter(p => p.match_id !== profile.match_id));
      if (selectedProfile?.match_id === profile.match_id) handleCloseProfile();
      setSnackbar({ open: true, message: 'Like eliminado', severity: 'info' });
    } catch (error: any) {
      console.error('Error removing like:', error);
      const detail = error?.response?.data?.detail;
      setSnackbar({
        open: true,
        message: detail || 'Error al eliminar el like',
        severity: 'error'
      });
    }
  };

  const handleStartChat = () => {
    router.push('/chat');
  };

  const renderProfileGrid = (profiles: LikeProfile[], type: 'received' | 'sent' | 'top' | 'second') => {
    if (profiles.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 8, opacity: 0.7 }}>
          <HeartIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay perfiles para mostrar en esta sección
          </Typography>
        </Box>
      );
    }

    const dateField = type === 'second' ? 'passed_at' : 'liked_at';
    const buckets: Record<PeriodKey, LikeProfile[]> = { today: [], week: [], month: [] };
    profiles.forEach((p) => buckets[getPeriodKey(p[dateField])].push(p));

    const renderCard = (profile: LikeProfile) => (
          <Grid item key={`${type}-${profile.match_id || profile.user_id}`} xs={12} sm={6} md={4} lg={3}>
            <Card
              onClick={() => handleProfileClick(profile)}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'transform 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <Box sx={{ position: 'relative', pt: '125%' }}>
                <ParallaxImage
                  src={profile.photos[0] || 'https://via.placeholder.com/400'}
                  alt={profile.display_name}
                  intensity={0.08}
                  drift={4}
                  frameSx={{ position: 'absolute', inset: 0 }}
                />
                <Box sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                  p: 2,
                  pt: 6
                }}>
                  <Typography
                    variant="h6"
                    color="white"
                    fontWeight="bold"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    {profile.display_name}, {profile.age}
                    {isOnline(profile.last_seen) && (
                      <Box
                        component="span"
                        role="img"
                        aria-label="En línea ahora"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#4CAF50',
                          boxShadow: '0 0 6px rgba(76, 175, 80, 0.9)',
                          flexShrink: 0
                        }}
                      />
                    )}
                  </Typography>

                  {profile.affinity_score && (
                    <Chip
                      size="small"
                      icon={<HeartIcon style={{ fontSize: 14 }} />}
                      label={`${Math.round(profile.affinity_score)}% Match`}
                      color="secondary"
                      sx={{ mt: 1, height: 24 }}
                    />
                  )}
                </Box>

                {profile.is_superlike && (
                  <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                    <Chip
                      icon={<StarIcon style={{ color: '#fff' }} />}
                      label="Superlike"
                      color="primary"
                      sx={{
                        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                )}
              </Box>

              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                {type === 'top' && profile.bio && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {profile.bio}
                  </Typography>
                )}

                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 'auto' }}>
                  <TimeIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary">
                    {type === 'received' && profile.liked_at && `Te dio like ${formatDistanceToNow(new Date(profile.liked_at), { addSuffix: true, locale: es })}`}
                    {type === 'sent' && profile.liked_at && `Le diste like ${formatDistanceToNow(new Date(profile.liked_at), { addSuffix: true, locale: es })}`}
                    {type === 'top' && 'Recomendado hoy'}
                    {type === 'second' && profile.passed_at && `Lo descartaste ${formatDistanceToNow(new Date(profile.passed_at), { addSuffix: true, locale: es })}`}
                  </Typography>
                </Stack>

                {(type === 'received' || type === 'sent' || type === 'second') && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon fontSize="small" />}
                      onClick={(e) => { e.stopPropagation(); handleProfileClick(profile); }}
                      sx={{ flex: 1 }}
                    >
                      Ver perfil
                    </Button>
                    {type === 'received' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<HeartIcon fontSize="small" />}
                        onClick={(e) => { e.stopPropagation(); handleSwipe('like', profile); }}
                        sx={{ flex: 1 }}
                      >
                        Responder
                      </Button>
                    )}
                    {type === 'sent' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon fontSize="small" />}
                        onClick={(e) => { e.stopPropagation(); handleRemoveLike(profile); }}
                        sx={{ flex: 1 }}
                      >
                        Eliminar like
                      </Button>
                    )}
                    {type === 'second' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<ReplayIcon fontSize="small" />}
                        onClick={(e) => { e.stopPropagation(); handleSwipe('like', profile); }}
                        sx={{ flex: 1 }}
                      >
                        Reconsiderar
                      </Button>
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
    );

    if (type === 'top') {
      return (
        <Grid container spacing={3}>
          {profiles.map((p) => renderCard(p))}
        </Grid>
      );
    }

    return (
      <>
        {(['today', 'week', 'month'] as PeriodKey[])
          .filter((k) => buckets[k].length > 0)
          .map((k) => (
            <Box key={k} sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  {PERIOD_LABELS[k]}
                </Typography>
                <Chip size="small" label={buckets[k].length} />
              </Box>
              <Grid container spacing={3}>
                {buckets[k].map((p) => renderCard(p))}
              </Grid>
            </Box>
          ))}
      </>
    );
  };

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
          Likes
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="likes tabs">
            <Tab
              icon={<HeartIcon />}
              iconPosition="start"
              label="Likes Recibidos"
            />
            <Tab
              icon={<SendIcon />}
              iconPosition="start"
              label="Likes Enviados"
            />
            <Tab
              icon={<StarIcon />}
              iconPosition="start"
              label="Top Picks Diarios"
            />
            <Tab
              icon={<TimeIcon />}
              iconPosition="start"
              label="Segunda Oportunidad"
            />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <CustomTabPanel value={tabValue} index={0}>
              {renderProfileGrid(receivedLikes, 'received')}
            </CustomTabPanel>
            <CustomTabPanel value={tabValue} index={1}>
              {renderProfileGrid(sentLikes, 'sent')}
            </CustomTabPanel>
            <CustomTabPanel value={tabValue} index={2}>
              {renderProfileGrid(topPicks, 'top')}
            </CustomTabPanel>
            <CustomTabPanel value={tabValue} index={3}>
              {renderProfileGrid(secondChance, 'second')}
            </CustomTabPanel>
          </>
        )}

        {/* Profile Detail Dialog */}
        <Dialog
          open={!!selectedProfile}
          onClose={handleCloseProfile}
          scroll="body"
          PaperProps={{
            sx: {
              borderRadius: '12px',
              overflow: 'hidden',
              maxWidth: 400,
              width: '100%',
              m: 2
            }
          }}
        >
          {selectedProfile && (
            <ProfileCard
              profile={{
                ...selectedProfile,
                interests: selectedProfile.interests || [],
                bio: selectedProfile.bio || '',
                affinity_score: selectedProfile.affinity_score || 0,
                online_status: isOnline(selectedProfile.last_seen)
              }}
              onLike={() => handleSwipe('like')}
              onPass={() => handleSwipe('pass')}
              onSuperLike={() => handleSwipe('superlike')}
              showActions={true}
              showSwipeControls={tabValue >= 2}
              showDetailsButton={false}
            />
          )}

          {/* Management actions (Likes recibidos / enviados) - no swipe controls */}
          {selectedProfile && tabValue <= 1 && (
            <Box sx={{ display: 'flex', gap: 1.5, p: 2, pt: 0 }}>
              {tabValue === 0 ? (
                <>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<HeartIcon />}
                    onClick={() => handleSwipe('like')}
                  >
                    Responder
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="inherit"
                    startIcon={<CloseIcon />}
                    onClick={() => handleSwipe('pass')}
                  >
                    Ignorar
                  </Button>
                </>
              ) : (
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleRemoveLike(selectedProfile)}
                >
                  Eliminar like
                </Button>
              )}
            </Box>
          )}
        </Dialog>

        {/* Match Success Dialog */}
        <Dialog
          open={matchDialogOpen}
          onClose={() => setMatchDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: { borderRadius: '12px', textAlign: 'center', p: 2 }
          }}
        >
          <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'secondary.main', mb: 2 }}>
              <HeartIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h4" fontWeight="bold" gutterBottom color="secondary">
              ¡Es un Match!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Tú y esa persona se gustan. ¡Es hora de conversar!
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              startIcon={<ChatIcon />}
              onClick={handleStartChat}
              sx={{ borderRadius: 28, py: 1.5 }}
            >
              Ir al Chat
            </Button>
            <Button
              onClick={() => setMatchDialogOpen(false)}
              sx={{ mt: 2 }}
            >
              Seguir explorando
            </Button>
          </Box>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
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
