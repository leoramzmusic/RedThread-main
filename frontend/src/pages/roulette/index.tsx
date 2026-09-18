import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Button,
  Avatar,
  Paper,
  CircularProgress,
  IconButton,
  TextField,
  Chip,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Casino as CasinoIcon,
  Send as SendIcon,
  SkipNext as SkipNextIcon,
  Stop as StopIcon,
  Timer as TimerIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import apiClient from '../../services/api';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

interface MatchUser {
  match_id: string;
  user_id: string;
  display_name: string;
  photo: string | null;
  age: number;
  bio: string | null;
  interests: string[];
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

export default function Roulette() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [status, setStatus] = useState<'idle' | 'searching' | 'matched'>('idle');
  const [match, setMatch] = useState<MatchUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Preferences
  const [language, setLanguage] = useState('');
  const [topic, setTopic] = useState('');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'matched' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Time's up
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleStart = async () => {
    setStatus('searching');
    try {
      // Simulate searching delay for effect
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = await apiClient.post('/roulette/start', {
        language: language || undefined,
        topic: topic || undefined
      });
      setMatch(response.data);
      setStatus('matched');
      setTimeLeft(300);
      setMessages([]); // Clear messages for new match
    } catch (error) {
      console.error('Error starting roulette:', error);
      setStatus('idle');
      // Show error notification
    }
  };

  const handleNext = async () => {
    setStatus('searching');
    setMatch(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const response = await apiClient.post('/roulette/next', {
        language: language || undefined,
        topic: topic || undefined
      });
      setMatch(response.data);
      setStatus('matched');
      setTimeLeft(300);
      setMessages([]);
    } catch (error) {
      console.error('Error finding next match:', error);
      setStatus('idle');
    }
  };

  const handleStop = async () => {
    try {
      await apiClient.post('/roulette/end');
      setStatus('idle');
      setMatch(null);
    } catch (error) {
      console.error('Error ending roulette:', error);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !match) return;

    // Optimistic update
    const tempMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender_id: 'me', // Placeholder, will be replaced by real ID from auth context or backend response
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');

    try {
      // In a real app, we would send to backend
      // await apiClient.post(`/chat/${match.match_id}/send`, { content: newMessage });
      
      // For now, simulate a reply after a delay
      setTimeout(() => {
        const reply: Message = {
          id: (Date.now() + 1).toString(),
          content: "¡Hola! ¿Qué tal? (Respuesta automática de prueba)",
          sender_id: match.user_id,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, reply]);
      }, 2000);
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ height: 'calc(100vh - 100px)' }}>
        {status === 'idle' && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
            gap={4}
          >
            <Box
              sx={{
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(255, 107, 107, 0.3)',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.05)' },
                  '100%': { transform: 'scale(1)' },
                },
              }}
            >
              <CasinoIcon sx={{ fontSize: 100, color: 'white' }} />
            </Box>
            <Typography variant="h3" fontWeight={700} textAlign="center">
              Ruleta de Conversación
            </Typography>
            <Typography variant="h6" color="text.secondary" textAlign="center" maxWidth={600}>
              Conecta aleatoriamente con personas que comparten tus intereses.
              Tienes 5 minutos para romper el hielo.
            </Typography>

            {/* Preferences */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%', maxWidth: 600 }}>
              <FormControl fullWidth>
                <InputLabel>Idioma</InputLabel>
                <Select
                  value={language}
                  label="Idioma"
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <MenuItem value="">Cualquiera</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="en">Inglés</MenuItem>
                  <MenuItem value="fr">Francés</MenuItem>
                  <MenuItem value="pt">Portugués</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Tema (Opcional)"
                placeholder="Ej. Cine, Música"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </Stack>

            <Button
              variant="contained"
              size="large"
              onClick={handleStart}
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                borderRadius: 50,
                background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E8E 90%)',
                boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
              }}
            >
              CONECTAR AHORA
            </Button>
          </Box>
        )}

        {status === 'searching' && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
            gap={4}
          >
            <CircularProgress size={80} thickness={4} sx={{ color: '#FF6B6B' }} />
            <Typography variant="h4" fontWeight={600} color="text.secondary">
              Buscando a alguien especial...
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Analizando intereses y compatibilidad
            </Typography>
          </Box>
        )}

        {status === 'matched' && match && (
          <Box display="flex" height="100%" gap={3} sx={{ flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Profile Card */}
            <Paper
              sx={{
                width: { xs: '100%', md: 350 },
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                borderRadius: 4,
              }}
            >
              <Avatar
                src={match.photo || undefined}
                sx={{ width: 120, height: 120, border: '4px solid #FF6B6B' }}
              >
                {match.display_name[0]}
              </Avatar>
              <Typography variant="h5" fontWeight={700}>
                {match.display_name}, {match.age}
              </Typography>
              <Typography variant="body2" textAlign="center" color="text.secondary">
                {match.bio || 'Sin biografía'}
              </Typography>
              
              <Box display="flex" flexWrap="wrap" gap={1} justifyContent="center">
                {match.interests.map((interest, idx) => (
                  <Chip key={idx} label={interest} size="small" variant="outlined" />
                ))}
              </Box>

              <Box flex={1} />

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: '#F6F7F9',
                  color: '#E63946',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  mb: 2,
                }}
              >
                <TimerIcon />
                <Typography fontWeight={600}>{formatTime(timeLeft)}</Typography>
              </Box>

              <Stack direction="row" spacing={2} width="100%">
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={handleStop}
                  fullWidth
                >
                  Salir
                </Button>
                <Button
                  variant="contained"
                  endIcon={<SkipNextIcon />}
                  onClick={handleNext}
                  fullWidth
                  sx={{ bgcolor: '#FF6B6B', '&:hover': { bgcolor: '#E64A4A' } }}
                >
                  Siguiente
                </Button>
              </Stack>
            </Paper>

            {/* Chat Area */}
            <Paper
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              {/* Messages */}
              <Box
                sx={{
                  flex: 1,
                  p: 3,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  bgcolor: '#F8F9FA',
                }}
              >
                {messages.length === 0 && (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                    sx={{ opacity: 0.5 }}
                  >
                    <ChatIcon sx={{ fontSize: 60, mb: 2 }} />
                    <Typography>¡Di hola! Rompe el hielo.</Typography>
                  </Box>
                )}
                {messages.map((msg) => (
                  <Box
                    key={msg.id}
                    sx={{
                      alignSelf: msg.sender_id === 'me' ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                    }}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: msg.sender_id === 'me' ? '#FF6B6B' : 'white',
                        color: msg.sender_id === 'me' ? 'white' : 'text.primary',
                        borderRadius: 3,
                        borderTopRightRadius: msg.sender_id === 'me' ? 0 : 12,
                        borderTopLeftRadius: msg.sender_id === 'me' ? 12 : 0,
                      }}
                    >
                      <Typography variant="body1">{msg.content}</Typography>
                    </Paper>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: 'block', textAlign: msg.sender_id === 'me' ? 'right' : 'left' }}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>

              {/* Input */}
              <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                  p: 2,
                  bgcolor: 'white',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  gap: 2,
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Escribe un mensaje..."
                  variant="outlined"
                  size="small"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 20,
                    },
                  }}
                />
                <IconButton
                  type="submit"
                  disabled={!newMessage.trim()}
                  sx={{
                    bgcolor: '#FF6B6B',
                    color: 'white',
                    '&:hover': { bgcolor: '#E64A4A' },
                    '&.Mui-disabled': { bgcolor: '#FFCDCD' },
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Paper>
          </Box>
        )}
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
