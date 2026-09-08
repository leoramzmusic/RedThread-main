import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Zoom,
  IconButton
} from '@mui/material';
import { useTranslation } from 'next-i18next';
import apiClient from '../../services/api';
import { useAppTheme } from '../../context/ThemeContext';
import FavoriteIcon from '@mui/icons-material/Favorite'; // Enamorado
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied'; // Triste
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied'; // Alegre
import PeopleIcon from '@mui/icons-material/People'; // Amistoso
import NightlightRoundIcon from '@mui/icons-material/NightlightRound'; // Reflexivo

const EMOTIONS = [
  {
    id: 'enamorado',
    label: 'Enamorado',
    color: '#FF6B6B',
    icon: <FavoriteIcon fontSize="large" />,
    message: "¡El amor está en el aire! ❤️"
  },
  {
    id: 'alegre',
    label: 'Alegre',
    color: '#FFD700',
    icon: <SentimentVerySatisfiedIcon fontSize="large" />,
    message: "¡Qué buena energía! 🌟"
  },
  {
    id: 'amistoso',
    label: 'Amistoso',
    color: '#32CD32',
    icon: <PeopleIcon fontSize="large" />,
    message: "¡Hoy es día de conectar! 🤝"
  },
  {
    id: 'reflexivo',
    label: 'Reflexivo',
    color: '#2F2F2F',
    icon: <NightlightRoundIcon fontSize="large" />,
    message: "Tiempo para ti. 🌙"
  },
  {
    id: 'triste',
    label: 'Nostálgico',
    color: '#4A90E2',
    icon: <SentimentDissatisfiedIcon fontSize="large" />,
    message: "Está bien no estar bien. 🌧️"
  }
];

export default function EmotionModal() {
  const { t } = useTranslation('common');
  // Map emotions to available visual themes
  const emotionThemeMap: Record<string, string> = {
    'enamorado': 'pink',
    'alegre': 'vip',
    'amistoso': 'green',
    'reflexivo': 'premium',
    'triste': 'blue'
  };

  const { setTheme } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await apiClient.get('/emotions/check');
      if (response.data.needs_update) {
        setOpen(true);
      }
    } catch (error) {
      console.error("Error checking emotion status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (emotionId: string) => {
    try {
      const response = await apiClient.post('/emotions/set', { emotion: emotionId });
      // Map and set the theme
      const mappedTheme = emotionThemeMap[emotionId];
      if (mappedTheme) {
        // Cast string to VisualTheme if strict typing is needed, or ensure map values are correct
        setTheme(mappedTheme as any);
      }
      setOpen(false);
    } catch (error) {
      console.error("Error setting emotion:", error);
    }
  };

  if (loading) return null;

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        style: { borderRadius: 20, padding: 20 }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          ¿Cómo te sientes hoy?
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tu estado de ánimo definirá el color de tu experiencia hoy.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {EMOTIONS.map((emotion) => (
            <Grid item xs={6} sm={4} key={emotion.id}>
              <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 4,
                    transition: 'transform 0.2s',
                    border: `2px solid ${emotion.color}`,
                    '&:hover': {
                      transform: 'scale(1.05)',
                      bgcolor: `${emotion.color}22`
                    }
                  }}
                  onClick={() => handleSelect(emotion.id)}
                >
                  <Box sx={{ color: emotion.color, mb: 1 }}>
                    {emotion.icon}
                  </Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {emotion.label}
                  </Typography>
                </Paper>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
