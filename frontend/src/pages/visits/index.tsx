import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Avatar,
  Button,
  FormControlLabel,
  Switch,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import Layout from '../../components/layout/Layout';
import apiClient from '../../services/api';
import { useRouter } from 'next/router';

interface VisitItem {
  viewer_id: string;
  display_name: string;
  nickname: string | null;
  photo: string | null;
  visited_at: string | null;
}

interface VisitsResponse {
  visits: VisitItem[];
  stats: {
    today: number;
    week: number;
    month: number;
    total: number;
    daily: { date: string; count: number }[];
  };
  hide_visit_activity: boolean;
}

export default function VisitsPage() {
  const router = useRouter();
  const [data, setData] = useState<VisitsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const fetchVisits = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/visits');
      setData(res.data);
    } catch (err: any) {
      console.error('Error fetching visits:', err);
      setError('No se pudieron cargar tus visitas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const handlePrivacyChange = async (hidden: boolean) => {
    setSavingPrivacy(true);
    try {
      await apiClient.put('/settings/me', { hide_visit_activity: hidden });
      setData((prev) => (prev ? { ...prev, hide_visit_activity: hidden } : prev));
    } catch (err) {
      console.error('Error updating privacy setting:', err);
    } finally {
      setSavingPrivacy(false);
    }
  };

  const formatVisited = (iso: string | null) => {
    if (!iso) return 'Fecha desconocida';
    const date = new Date(iso);
    return `${formatDistanceToNow(date, { addSuffix: true, locale: es })} · ${format(date, 'd MMM, HH:mm', { locale: es })}`;
  };

  const stats = data?.stats;

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          Tus visitas recientes
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, opacity: 0.8 }}>
          Descubre quién ha visitado tu perfil y cuándo.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stats */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #3498DB 0%, #5DADE2 100%)', color: '#fff' }}>
              <Typography variant="h3" fontWeight={800}>{stats?.today ?? '—'}</Typography>
              <Typography sx={{ opacity: 0.9, fontWeight: 500 }}>Hoy</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #2E86C1 0%, #5499C7 100%)', color: '#fff' }}>
              <Typography variant="h3" fontWeight={800}>{stats?.week ?? '—'}</Typography>
              <Typography sx={{ opacity: 0.9, fontWeight: 500 }}>Esta semana</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #2471A3 0%, #5DADE2 100%)', color: '#fff' }}>
              <Typography variant="h3" fontWeight={800}>{stats?.month ?? '—'}</Typography>
              <Typography sx={{ opacity: 0.9, fontWeight: 500 }}>Este mes</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #1A5276 0%, #3498DB 100%)', color: '#fff' }}>
              <Typography variant="h3" fontWeight={800}>{stats?.total ?? '—'}</Typography>
              <Typography sx={{ opacity: 0.9, fontWeight: 500 }}>Total</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Chart */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Visitas por día (últimos 14 días)
          </Typography>
          <Box sx={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={stats?.daily ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => format(new Date(v), 'd/M')}
                  tick={{ fontSize: 11 }}
                  interval={1}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(label: any) => format(new Date(String(label)), 'dd/MM/yyyy')}
                  formatter={(value) => [`${value} visitas`, 'Visitas']}
                />
                <Bar dataKey="count" fill="#3498DB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Privacy */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Privacidad de visitas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480 }}>
                Al activar esta opción, no aparecerás en la lista de visitas de otros perfiles.
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={!!data?.hide_visit_activity}
                  onChange={(e) => handlePrivacyChange(e.target.checked)}
                  disabled={savingPrivacy}
                  color="primary"
                />
              }
              label={data?.hide_visit_activity ? 'Modo incógnito activo' : 'Ocultar mi actividad en las visitas'}
            />
          </Box>
        </Paper>

        {/* Visitors list */}
        <Paper sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight={700}>
              Visitantes
            </Typography>
            {!loading && data && (
              <Chip size="small" label={`${data.visits.length} recientes`} variant="outlined" />
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : !data || data.visits.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, opacity: 0.7 }}>
              <VisibilityIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Aún no tienes visitas.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cuando alguien vea tu perfil, aparecerá aquí.
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {data.visits.map((v, idx) => (
                <Box key={v.viewer_id}>
                  {idx > 0 && <Divider component="li" />}
                  <ListItem
                    alignItems="center"
                    disableGutters
                    secondaryAction={
                      <Box display="flex" gap={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PersonIcon />}
                          disabled={!v.nickname}
                          onClick={() => v.nickname && router.push(`/profile/@${v.nickname}`)}
                        >
                          Ver perfil
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<ChatIcon />}
                          onClick={() => router.push('/chat')}
                        >
                          Mensaje
                        </Button>
                      </Box>
                    }
                    sx={{ py: 2 }}
                  >
                    <ListItemAvatar>
                      <Avatar src={v.photo || undefined} sx={{ width: 48, height: 48 }}>
                        {v.display_name?.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography fontWeight={600}>{v.display_name}</Typography>
                          {v.nickname && (
                            <Typography variant="caption" color="text.secondary">
                              @{v.nickname}
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {formatVisited(v.visited_at)}
                        </Typography>
                      }
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </Paper>
      </Container>
    </Layout>
  );
}