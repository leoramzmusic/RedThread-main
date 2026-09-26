import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useState, useEffect } from 'react';
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
  Chat as ChatIcon
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
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

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

  const handleProfileClick = (profile: LikeProfile) => {
    // Only allow interaction for received likes, top picks, and second chance
    if (tabValue === 0 || tabValue === 2 || tabValue === 3) {
      setSelectedProfile(profile);
    }
  };

  const handleCloseProfile = () => {
    setSelectedProfile(null);
  };

  const handleSwipe = async (interaction: 'like' | 'pass' | 'superlike') => {
    if (!selectedProfile) return;

    try {
      const response = await apiClient.post('/discovery/swipe', {
        target_user_id: selectedProfile.user_id,
        interaction
      });

      handleCloseProfile();

      if (response.data.is_match) {
        setMatchDialogOpen(true);
        setSnackbar({
          open: true,
          message: `¡Es un Match con ${selectedProfile.display_name}! 🎉`,
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
        setReceivedLikes(prev => prev.filter(p => p.user_id !== selectedProfile.user_id));
      } else if (tabValue === 2) { // Top picks
        setTopPicks(prev => prev.filter(p => p.user_id !== selectedProfile.user_id));
      } else if (tabValue === 3) { // Second chance
        setSecondChance(prev => prev.filter(p => p.user_id !== selectedProfile.user_id));
      }

    } catch (error) {
      console.error('Error swiping:', error);
      setSnackbar({ open: true, message: 'Error al procesar la acción', severity: 'error' });
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

    return (
      <Grid container spacing={3}>
        {profiles.map((profile) => (
          <Grid item key={profile.user_id} xs={12} sm={6} md={4} lg={3}>
            <Card
              onClick={() => handleProfileClick(profile)}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderRadius: 4,
                overflow: 'hidden',
                transition: 'transform 0.2s',
                cursor: (type === 'received' || type === 'top' || type === 'second') ? 'pointer' : 'default',
                '&:hover': {
                  transform: (type === 'received' || type === 'top' || type === 'second') ? 'translateY(-4px)' : 'none',
                  boxShadow: (type === 'received' || type === 'top' || type === 'second') ? 6 : 1
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
                  <Typography variant="h6" color="white" fontWeight="bold">
                    {profile.display_name}, {profile.age}
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
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
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
              borderRadius: 4,
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
                affinity_score: selectedProfile.affinity_score || 0
              }}
              onLike={() => handleSwipe('like')}
              onPass={() => handleSwipe('pass')}
              onSuperLike={() => handleSwipe('superlike')}
              showActions={true}
            />
          )}
        </Dialog>

        {/* Match Success Dialog */}
        <Dialog
          open={matchDialogOpen}
          onClose={() => setMatchDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 4, textAlign: 'center', p: 2 }
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
