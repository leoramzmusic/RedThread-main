import React from 'react';
import { 
  ListItem, 
  ListItemAvatar, 
  Avatar, 
  ListItemText, 
  Typography, 
  Box,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Favorite as LikeIcon,
  Visibility as ViewIcon,
  PersonAdd as MatchIcon,
  EmojiEvents as RewardIcon,
  Info as SystemIcon,
  Chat as MessageIcon,
  Circle as UnreadIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationItemProps {
  notification: any;
  onRead: (id: string) => void;
}

export default function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const theme = useTheme();
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <LikeIcon sx={{ color: '#FF4081', fontSize: 16 }} />;
      case 'view': return <ViewIcon sx={{ color: '#4CAF50', fontSize: 16 }} />;
      case 'match': return <MatchIcon sx={{ color: '#E91E63', fontSize: 16 }} />;
      case 'reward': return <RewardIcon sx={{ color: '#FFD700', fontSize: 16 }} />;
      case 'message': return <MessageIcon sx={{ color: '#2196F3', fontSize: 16 }} />;
      default: return <SystemIcon sx={{ color: '#9E9E9E', fontSize: 16 }} />;
    }
  };

  const getTitle = (type: string, userName: string) => {
    switch (type) {
      case 'like': return `A ${userName} le gustas`;
      case 'view': return `${userName} vio tu perfil`;
      case 'match': return `¡Tienes un nuevo match con ${userName}!`;
      case 'reward': return '¡Ganaste una recompensa!';
      case 'message': return `Mensaje de ${userName}`;
      default: return 'Notificación del sistema';
    }
  };

  return (
    <ListItem 
      alignItems="flex-start"
      sx={{ 
        bgcolor: notification.is_read ? 'transparent' : 'action.hover',
        borderBottom: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        '&:hover': {
          bgcolor: 'action.selected'
        }
      }}
      onClick={() => !notification.is_read && onRead(notification.id)}
    >
      <ListItemAvatar>
        <Box sx={{ position: 'relative' }}>
          <Avatar 
            alt={notification.user?.name} 
            src={notification.user?.photo}
            sx={{ width: 40, height: 40 }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              bgcolor: 'background.paper',
              borderRadius: '50%',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 1
            }}
          >
            {getIcon(notification.type)}
          </Box>
        </Box>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography variant="subtitle2" component="span" fontWeight={notification.is_read ? 400 : 600}>
            {getTitle(notification.type, notification.user?.name || 'Usuario')}
          </Typography>
        }
        secondary={
          <React.Fragment>
            <Typography
              sx={{ display: 'inline' }}
              component="span"
              variant="body2"
              color="text.primary"
            >
              {notification.content}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
            </Typography>
          </React.Fragment>
        }
      />
      {!notification.is_read && (
        <IconButton size="small" edge="end" disabled>
          <UnreadIcon sx={{ fontSize: 10, color: 'primary.main' }} />
        </IconButton>
      )}
    </ListItem>
  );
}
