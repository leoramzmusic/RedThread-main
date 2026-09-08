import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Avatar,
  Slider,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Layout from '../../components/layout/Layout';
import apiClient from '../../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface NearbyUser {
  user_id: string;
  display_name: string;
  age: number;
  photo: string;
  distance_km: number;
  interests: string[];
}

export default function Radar() {
  const router = useRouter();
  const { t } = useTranslation('radar');
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [range, setRange] = useState<number>(5); // km

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    // Check if location is already enabled in profile (mock check)
    if (localStorage.getItem('location_enabled') === 'true') {
      setLocationEnabled(true);
      fetchNearbyUsers();
    }
  }, [isAuthenticated, router]);

  const enableLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await apiClient.post('/profiles/location', {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setLocationEnabled(true);
            localStorage.setItem('location_enabled', 'true');
            fetchNearbyUsers();
          } catch (err) {
            console.error('Failed to update location', err);
          }
        },
        (error) => {
          console.error('Error getting location', error);
          alert(t('errors.location'));
        }
      );
    } else {
      alert(t('errors.geolocation'));
    }
  };

  const fetchNearbyUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/radar/nearby?radius=${range}`);
      setNearbyUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch nearby users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (event: Event, newValue: number | number[]) => {
    setRange(newValue as number);
  };

  const handleRangeCommit = () => {
    if (locationEnabled) {
      fetchNearbyUsers();
    }
  };

  return (
    <Layout>
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {t('title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('subtitle')}
            </Typography>
          </Box>

          {!locationEnabled ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
              <LocationOnIcon sx={{ fontSize: 80, color: '#FF6B6B', mb: 2 }} />
              <Typography variant="h5" gutterBottom fontWeight={600}>
                {t('enableLocation.title')}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 400, mx: 'auto', mb: 4 }}>
                {t('enableLocation.description')}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={enableLocation}
                sx={{ borderRadius: 8, px: 4 }}
              >
                {t('enableLocation.button')}
              </Button>
            </Paper>
          ) : (
            <>
              <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Typography gutterBottom>{t('searchRadius')}: {range} km</Typography>
                    <Slider
                      value={range}
                      onChange={handleRangeChange}
                      onChangeCommitted={handleRangeCommit}
                      min={1}
                      max={user?.subscription_tier === 'premium' ? 50 : 5}
                      valueLabelDisplay="auto"
                      disabled={loading}
                    />
                    {user?.subscription_tier !== 'premium' && (
                      <Typography variant="caption" color="text.secondary">
                        {t('upgradeMessage')}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
                    <FormControlLabel
                      control={<Switch checked={locationEnabled} onChange={() => setLocationEnabled(false)} />}
                      label={t('locationSharing')}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : nearbyUsers.length > 0 ? (
                <Grid container spacing={3}>
                  {nearbyUsers.map((u) => (
                    <Grid item xs={12} sm={6} md={4} key={u.user_id}>
                      <Paper
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': { transform: 'translateY(-4px)' },
                        }}
                        onClick={() => router.push(`/profile/${u.user_id}`)}
                      >
                        <Avatar
                          src={u.photo}
                          sx={{ width: 80, height: 80, mb: 2 }}
                        />
                        <Typography variant="h6" fontWeight={600}>
                          {u.display_name}, {u.age}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, color: 'text.secondary' }}>
                          <LocationOnIcon fontSize="small" />
                          <Typography variant="body2">
                            {u.distance_km < 1 ? '< 1' : Math.round(u.distance_km)} {t('distance.away')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                          {u.interests.slice(0, 3).map((interest) => (
                            <Typography
                              key={interest}
                              variant="caption"
                              sx={{
                                bgcolor: '#f0f0f0',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                              }}
                            >
                              {interest}
                            </Typography>
                          ))}
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary">
                    {t('noUsers')}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </Container>
    </Layout>
  );
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'radar'])),
    },
  };
}
