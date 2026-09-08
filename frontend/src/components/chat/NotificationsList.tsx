import React, { useEffect, useState } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Visibility as VisibilityIcon,
  PersonAdd as PersonAddIcon,
  MoreVert as MoreVertIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import apiClient from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
  user: {
    name: string;
    photo: string | null;
  };
}

interface NotificationsListProps {
  onUnreadCountChange?: (count: number) => void;
}

export default function NotificationsList({ onUnreadCountChange }: NotificationsListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/notifications/');
      setNotifications(response.data);
      
      // Calculate unread count
      const unread = response.data.filter((n: Notification) => !n.is_read).length;
      if (onUnreadCountChange) {
        onUnreadCountChange(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    
    try {
      await apiClient.post(`/notifications/${id}/read`);
      
      // Update local state
      const updated = notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      );
      setNotifications(updated);
      
      const unread = updated.filter(n => !n.is_read).length;
      if (onUnreadCountChange) {
        onUnreadCountChange(unread);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <FavoriteIcon fontSize="small" color="error" />;
      case 'view':
        return <VisibilityIcon fontSize="small" color="action" />;
      case 'match':
        return <PersonAddIcon fontSize="small" color="primary" />;
      default:
        return <NotificationsIcon fontSize="small" color="action" />;
    }
  };

  if (notifications.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Typography color="text.secondary">No tienes notificaciones nuevas</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
      {notifications.map((notif) => (
        <ListItem key={notif.id} disablePadding>
          <ListItemButton
            alignItems="flex-start"
            onClick={() => handleMarkAsRead(notif.id, notif.is_read)}
            sx={{
              bgcolor: notif.is_read ? 'transparent' : 'action.hover',
            }}
          >
            <ListItemAvatar>
              <Box position="relative">
                <Avatar src={notif.user.photo || undefined} alt={notif.user.name}>
                  {!notif.user.photo && notif.user.name.charAt(0)}
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    bgcolor: 'background.paper',
                    borderRadius: '50%',
                    p: 0.25,
                    display: 'flex',
                  }}
                >
                  {getIcon(notif.type)}
                </Box>
              </Box>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="subtitle2" component="span" fontWeight={notif.is_read ? 400 : 600}>
                  {notif.user.name}
                </Typography>
              }
              secondary={
                <React.Fragment>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                    sx={{ display: 'inline', mr: 1 }}
                  >
                    {notif.content}
                  </Typography>
                  <Typography component="span" variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                  </Typography>
                </React.Fragment>
              }
            />
            <IconButton size="small" edge="end" onClick={(e) => e.stopPropagation()}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}
