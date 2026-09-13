import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  AvatarGroup,
  Tab,
  Tabs,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  Event as EventIcon,
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  VideoCameraFront as VideoIcon,
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import ParallaxImage from '../../components/motion/ParallaxImage';
import apiClient from '../../services/api';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

interface Event {
  id: string;
  title: string;
  description: string;
  theme: string;
  date: string;
  duration_minutes: number;
  image_url: string | null;
  participants: string[];
  max_participants: number;
  room_url: string | null;
}

const THEMES = ['Todos', 'Cine', 'Música', 'Gaming', 'Tecnología', 'Arte', 'Idiomas'];

export default function Events() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [openCreate, setOpenCreate] = useState(false);
  
  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    theme: 'Gaming',
    date: '',
    time: '',
    duration_minutes: 60,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await apiClient.get('/events/');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (eventId: string) => {
    try {
      await apiClient.post(`/events/${eventId}/join`);
      fetchEvents(); // Refresh list
    } catch (error) {
      console.error('Error joining event:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const eventDate = new Date(`${newEvent.date}T${newEvent.time}`);
      
      await apiClient.post('/events/', {
        ...newEvent,
        date: eventDate.toISOString(),
        image_url: `https://source.unsplash.com/random/800x600/?${newEvent.theme.toLowerCase()}`,
      });
      
      setOpenCreate(false);
      fetchEvents();
      // Reset form
      setNewEvent({
        title: '',
        description: '',
        theme: 'Gaming',
        date: '',
        time: '',
        duration_minutes: 60,
      });
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const filteredEvents = selectedTheme === 0 
    ? events 
    : events.filter(e => e.theme === THEMES[selectedTheme]);

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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Eventos Virtuales
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Únete a salas temáticas y conoce gente con tus mismos intereses
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreate(true)}
            sx={{ bgcolor: '#FF6B6B', '&:hover': { bgcolor: '#E64A4A' } }}
          >
            Crear Evento
          </Button>
        </Box>

        <Tabs
          value={selectedTheme}
          onChange={(_, val) => setSelectedTheme(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
        >
          {THEMES.map((theme, idx) => (
            <Tab key={idx} label={theme} />
          ))}
        </Tabs>

        <Grid container spacing={3}>
          {filteredEvents.map((event) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={event.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <ParallaxImage
                  src={event.image_url || `https://source.unsplash.com/random/800x600/?${event.theme.toLowerCase()}`}
                  alt={event.title}
                  intensity={0.1}
                  drift={4}
                  frameSx={{ height: 140 }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Chip label={event.theme} size="small" color="primary" variant="outlined" />
                    <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                      <PersonIcon fontSize="small" />
                      <Typography variant="caption">
                        {event.participants.length}/{event.max_participants}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {event.title}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" gap={1} mb={1} color="text.secondary">
                    <CalendarIcon fontSize="small" />
                    <Typography variant="body2">
                      {new Date(event.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1} mb={2} color="text.secondary">
                    <TimeIcon fontSize="small" />
                    <Typography variant="body2">
                      {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({event.duration_minutes} min)
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {event.description}
                  </Typography>

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<VideoIcon />}
                    onClick={() => handleJoin(event.id)}
                    disabled={event.participants.length >= event.max_participants}
                  >
                    Unirse
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredEvents.length === 0 && (
          <Box textAlign="center" py={8}>
            <EventIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No hay eventos programados en esta categoría
            </Typography>
          </Box>
        )}

        {/* Create Event Dialog */}
        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Crear Nuevo Evento</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <TextField
                label="Título"
                fullWidth
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
              <TextField
                label="Descripción"
                fullWidth
                multiline
                rows={3}
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
              <TextField
                select
                label="Tema"
                fullWidth
                value={newEvent.theme}
                onChange={(e) => setNewEvent({ ...newEvent, theme: e.target.value })}
              >
                {THEMES.slice(1).map((theme) => (
                  <MenuItem key={theme} value={theme}>
                    {theme}
                  </MenuItem>
                ))}
              </TextField>
              <Box display="flex" gap={2}>
                <TextField
                  type="date"
                  label="Fecha"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
                <TextField
                  type="time"
                  label="Hora"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancelar</Button>
            <Button 
              variant="contained" 
              onClick={handleCreate}
              disabled={!newEvent.title || !newEvent.date || !newEvent.time}
            >
              Crear
            </Button>
          </DialogActions>
        </Dialog>
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
