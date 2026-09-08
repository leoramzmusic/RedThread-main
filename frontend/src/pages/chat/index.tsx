import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Paper,
  Divider,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  AlertColor,
  Chip,
  Stack,
  useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReportIcon from '@mui/icons-material/Report';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import MicIcon from '@mui/icons-material/Mic';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PeopleIcon from '@mui/icons-material/People';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import Layout from '../../components/layout/Layout';
import ChatMessage, { Message } from '../../components/chat/ChatMessage';
import NotificationsList from '../../components/chat/NotificationsList';
import apiClient from '../../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { formatDistanceToNow, differenceInMinutes, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslation } from 'next-i18next';
import PlanAvatar from '../../components/subscription/PlanAvatar';
import IcebreakerButton from '../../components/chat/IcebreakerButton';

interface Conversation {
  match_id: string;
  other_user_id: string;
  display_name: string;
  photo: string;
  last_message?: Message;
  unread_count: number;
  is_online: boolean;
  last_active?: string;
  show_online_status?: boolean;
  status: 'matched' | 'blocked' | 'unmatched';
  blocked_by?: string;
  // New Fields
  type: 'match' | 'friend' | 'partner';
  emotional_status?: string; // e.g., "passionate", "flirty", "friendly"
  theme_color?: string;
  subscription_tier?: string;
}

export default function Chat() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();

  const getOnlineStatusText = (conv: Conversation) => {
    if (conv.show_online_status === false) return '';
    if (conv.is_online) return t('chat.online', 'En línea');

    if (!conv.last_active) return t('chat.offline', 'Desconectado');

    const lastActive = new Date(conv.last_active);
    const now = new Date();
    const diffMins = differenceInMinutes(now, lastActive);
    const diffDays = differenceInDays(now, lastActive);

    if (diffMins < 1) return t('chat.online', 'En línea');
    if (diffDays >= 7) return t('chat.offline', 'Desconectado');

    return `${t('chat.last_seen', 'Última vez')} ${formatDistanceToNow(lastActive, { addSuffix: true, locale: es })}`;
  };

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0); // 0: Messages, 1: Notifications
  const [messageFilter, setMessageFilter] = useState<'match' | 'friend'>('match'); // Sub-tab for messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogTitle, setConfirmDialogTitle] = useState('');
  const [confirmDialogMessage, setConfirmDialogMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => Promise<void> | void>(() => { });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('success');

  const showSnackbar = (message: string, severity: AlertColor = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleReportOpen = () => {
    setAnchorEl(null);
    setReportDialogOpen(true);
  };

  const handleReportSubmit = async () => {
    if (!activeConversation || !reportReason) return;
    try {
      await apiClient.post('/moderation/report', {
        reported_user_id: activeConversation.other_user_id,
        reason: reportReason,
        description: reportDescription
      });
      showSnackbar(t('common.report_success', 'Reporte enviado correctamente.'));
      setReportDialogOpen(false);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      console.error("Error reporting user:", error);
      showSnackbar(t('common.error', 'Ocurrió un error.'), 'error');
    }
  };

  const handleConfirmAction = async () => {
    await confirmAction();
    setConfirmDialogOpen(false);
  };

  const handleBlock = () => {
    setAnchorEl(null);
    if (activeConversation) {
      setConfirmDialogTitle(t('common.block_user', 'Bloquear Usuario'));
      setConfirmDialogMessage(t('common.block_confirm', "¿Estás seguro de que quieres bloquear a este usuario? No podrás ver su perfil ni recibir mensajes."));
      setConfirmAction(() => async () => {
        try {
          await apiClient.post('/moderation/block', {
            blocked_user_id: activeConversation.other_user_id
          });
          showSnackbar(t('common.block_success', "Usuario bloqueado."));
          fetchConversations();
        } catch (error) {
          console.error("Error blocking user:", error);
          showSnackbar(t('common.error', 'Ocurrió un error.'), 'error');
        }
      });
      setConfirmDialogOpen(true);
    }
  };

  const handleUnblock = async () => {
    setAnchorEl(null);
    if (activeConversation) {
      try {
        await apiClient.post('/moderation/unblock', {
          blocked_user_id: activeConversation.other_user_id
        });
        showSnackbar(t('common.unblock_success', "Usuario desbloqueado."));
        fetchConversations();
      } catch (error) {
        console.error("Error unblocking user:", error);
        showSnackbar(t('common.error', 'Ocurrió un error.'), 'error');
      }
    }
  };

  const handleClearChat = () => {
    setAnchorEl(null);
    if (activeConversation) {
      setConfirmDialogTitle(t('chat.clear_chat', 'Vaciar Chat'));
      setConfirmDialogMessage(t('chat.clear_confirm', "¿Vaciar chat? Esto solo borrará tu copia de los mensajes."));
      setConfirmAction(() => async () => {
        try {
          await apiClient.post(`/chat/clear/${activeConversation.match_id}`);
          setMessages([]);
        } catch (error) {
          console.error("Error clearing chat:", error);
        }
      });
      setConfirmDialogOpen(true);
    }
  };

  const handleExportChat = () => {
    if (!messages.length) return;

    const content = messages.map(m =>
      `[${new Date(m.created_at).toLocaleString()}] ${m.sender_id === user?.user_id ? 'You' : activeConversation?.display_name}: ${m.content}`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${activeConversation?.display_name}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setAnchorEl(null);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const response = await apiClient.get('/chat/conversations');
      setConversations(response.data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  const fetchSuggestions = async (targetUserId: string) => {
    try {
      const response = await apiClient.get(`/chat/suggestions?target_user_id=${targetUserId}`);
      setSuggestions(response.data);
    } catch (err) {
      console.error('Failed to load suggestions', err);
      setSuggestions([]);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.user_id) {
      if (!isAuthenticated) router.push('/auth/login');
      return;
    }

    // Initialize WebSocket
    const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('http', 'ws') + `/chat/ws/${user.user_id}`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log('Connected to chat server');
    };

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.action === 'new_message') {
        if (data.message.match_id === activeMatchId) {
          setMessages((prev) => [...prev, data.message]);
          scrollToBottom();
        } else {
          fetchConversations();
        }
      } else if (data.action === 'message_sent') {
        setMessages(prev => prev.map(m =>
          m.id === data.temp_id ? { ...m, id: data.message_id, isSending: false } : m
        ));
      } else if (data.action === 'message_read') {
        setMessages(prev => prev.map(m =>
          m.id === data.message_id ? { ...m, is_read: true } : m
        ));
        // Decrement unread count if applicable
        setConversations(prev => prev.map(c => {
          if (c.match_id === activeMatchId) {
            return { ...c, unread_count: Math.max(0, c.unread_count - 1) };
          }
          return c;
        }));
      }
    };

    newSocket.onclose = () => {
      console.log('Disconnected from chat server');
    };

    setSocket(newSocket);
    fetchConversations();

    return () => {
      newSocket.close();
    };
  }, [isAuthenticated, user?.user_id, activeMatchId]);

  useEffect(() => {
    if (activeMatchId) {
      fetchMessages(activeMatchId);
      const conv = conversations.find(c => c.match_id === activeMatchId);
      if (conv) {
        fetchSuggestions(conv.other_user_id);
      }
    }
  }, [activeMatchId]);

  const fetchMessages = async (matchId: string) => {
    try {
      const response = await apiClient.get(`/chat/messages/${matchId}`);
      setMessages(response.data.reverse()); // API returns newest first
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, content?: string) => {
    if (e) e.preventDefault();
    const msgContent = content || newMessage;

    if (!msgContent.trim() || !activeMatchId || !socket) return;

    const tempId = Date.now().toString();

    const messageData = {
      action: 'send_message',
      match_id: activeMatchId,
      content: msgContent,
      message_type: 'text',
      temp_id: tempId
    };

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(messageData));
    } else {
      console.error('WebSocket not connected');
      // Fallback to REST?
    }

    // Optimistic update
    const tempMsg: Message = {
      id: tempId,
      sender_id: user?.user_id || '',
      content: msgContent,
      message_type: 'text',
      created_at: new Date().toISOString(),
      is_read: false,
      isSending: true
    };

    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage('');
    setShowEmojiPicker(false);
    scrollToBottom();
  };

  const onEmojiSelect = (emoji: any) => {
    setNewMessage(prev => prev + emoji.native);
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingInterval.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
    }
    setIsRecording(false);
    // Here we would handle the actual audio file if backend supported it
    // For now, just a UI feedback
    showSnackbar(t('chat.voice_message_sent', 'Nota de voz enviada (Simulación)'));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeConversation = conversations.find(c => c.match_id === activeMatchId);

  // Filter conversations based on selected sub-tab
  const filteredConversations = conversations.filter(c => {
    if (messageFilter === 'match') return c.type === 'match' || !c.type; // Default to match for legacy
    if (messageFilter === 'friend') return c.type === 'friend' || c.type === 'partner';
    return true;
  });

  // Dynamic Theme Color
  const activeThemeColor = activeConversation?.theme_color || theme.palette.primary.main;

  return (
    <Layout>
      <Grid container spacing={2} sx={{ height: 'calc(100vh - 100px)' }}>
        {/* Conversation List */}
        <Grid item xs={12} md={4} sx={{ height: '100%' }}>
          <Paper sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 4 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                variant="fullWidth"
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab label={
                  <Badge
                    badgeContent={conversations.reduce((sum, c) => sum + c.unread_count, 0)}
                    color="error"
                  >
                    {t('chat.messages', 'Mensajes')}
                  </Badge>
                } />
                <Tab label={
                  <Badge badgeContent={unreadNotifications} color="error">
                    {t('chat.notifications', 'Notificaciones')}
                  </Badge>
                } />
              </Tabs>
            </Box>

            {activeTab === 0 ? (
              <>
                {/* Sub-tabs for Matches vs Friends */}
                <Box sx={{ px: 2, py: 1, display: 'flex', gap: 1 }}>
                  <Chip
                    icon={<FavoriteIcon />}
                    label="Matches 💘"
                    onClick={() => setMessageFilter('match')}
                    color={messageFilter === 'match' ? 'primary' : 'default'}
                    variant={messageFilter === 'match' ? 'filled' : 'outlined'}
                    sx={{ flex: 1 }}
                  />
                  <Chip
                    icon={<PeopleIcon />}
                    label="Amigos 👥"
                    onClick={() => setMessageFilter('friend')}
                    color={messageFilter === 'friend' ? 'secondary' : 'default'}
                    variant={messageFilter === 'friend' ? 'filled' : 'outlined'}
                    sx={{ flex: 1 }}
                  />
                </Box>
                <Divider />

                <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
                  {filteredConversations.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                      <Typography variant="body2">
                        {messageFilter === 'match'
                          ? "No tienes matches aún. ¡Ve a Discover!"
                          : "No tienes amigos conectados aún."}
                      </Typography>
                    </Box>
                  )}
                  {filteredConversations.map((conv) => (
                    <ListItem key={conv.match_id} disablePadding>
                      <ListItemButton
                        selected={activeMatchId === conv.match_id}
                        onClick={() => setActiveMatchId(conv.match_id)}
                        sx={{
                          bgcolor: conv.status === 'blocked' ? 'action.disabledBackground' : undefined,
                          opacity: conv.status === 'blocked' ? 0.7 : 1,
                          borderLeft: activeMatchId === conv.match_id ? `4px solid ${conv.theme_color || theme.palette.primary.main}` : 'none'
                        }}
                      >
                        <ListItemAvatar>
                          <Box position="relative" display="inline-block">
                            <PlanAvatar
                              tier={conv.subscription_tier}
                              size={40}
                              showBadge={false}
                              src={conv.photo}
                              alt={conv.display_name}
                            >
                              <Badge
                                color="success"
                                variant="dot"
                                invisible={!conv.is_online && (!conv.last_active || differenceInMinutes(new Date(), new Date(conv.last_active)) >= 1)}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                              >
                                {/* Badge needs a child, but PlanAvatar already renders the avatar. 
                                      We might need to wrap PlanAvatar with Badge or vice versa. 
                                      PlanAvatar has showBadge prop for tier badge, but here we want online status badge.
                                      Let's wrap PlanAvatar with the online Badge. */}
                              </Badge>
                            </PlanAvatar>
                          </Box>
                        </ListItemAvatar>
                        <ListItemText
                          primary={conv.display_name}
                          secondary={
                            <Box component="span" sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" component="span" noWrap color="text.primary" fontWeight={conv.unread_count > 0 ? 700 : 400}>
                                {conv.last_message?.content || t('chat.start_chatting', 'Comienza a chatear...')}
                              </Typography>
                              <Typography variant="caption" component="span" color="text.secondary">
                                {getOnlineStatusText(conv)}
                              </Typography>
                            </Box>
                          }
                        />
                        {conv.unread_count > 0 && (
                          <Badge badgeContent={conv.unread_count} color="primary" />
                        )}
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </>
            ) : (
              <NotificationsList onUnreadCountChange={setUnreadNotifications} />
            )}
          </Paper>
        </Grid>

        {/* Chat Window */}
        <Grid item xs={12} md={8} sx={{ height: '100%', display: { xs: activeMatchId ? 'block' : 'none', md: 'block' } }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 4 }}>
            {activeMatchId ? (
              <>
                {/* Header */}
                <Box sx={{
                  p: 2,
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  justifyContent: 'space-between',
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  bgcolor: activeThemeColor, // Dynamic Header Color
                  color: '#fff'
                }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <PlanAvatar
                      tier={activeConversation?.subscription_tier}
                      size={40}
                      showBadge={true}
                      src={activeConversation?.photo}
                    />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700} color="inherit">
                        {activeConversation?.display_name}
                      </Typography>
                      <Typography variant="caption" color="inherit" sx={{ opacity: 0.8 }}>
                        {activeConversation && getOnlineStatusText(activeConversation)}
                        {activeConversation?.emotional_status && ` • ${activeConversation.emotional_status}`}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: 'inherit' }}>
                      <MoreVertIcon />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={() => setAnchorEl(null)}
                    >
                      <MenuItem onClick={handleReportOpen}>
                        <ListItemIcon><ReportIcon fontSize="small" color="warning" /></ListItemIcon>
                        <ListItemText>{t('common.report', 'Reportar')}</ListItemText>
                      </MenuItem>

                      {activeConversation?.status === 'blocked' && activeConversation.blocked_by === user?.user_id ? (
                        <MenuItem onClick={handleUnblock}>
                          <ListItemIcon><LockOpenIcon fontSize="small" color="primary" /></ListItemIcon>
                          <ListItemText>{t('common.unblock', 'Desbloquear')}</ListItemText>
                        </MenuItem>
                      ) : (
                        <MenuItem onClick={handleBlock}>
                          <ListItemIcon><BlockIcon fontSize="small" color="error" /></ListItemIcon>
                          <ListItemText>{t('common.block', 'Bloquear')}</ListItemText>
                        </MenuItem>
                      )}

                      <MenuItem onClick={handleClearChat}>
                        <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>{t('chat.clear_chat', 'Vaciar Chat')}</ListItemText>
                      </MenuItem>

                      <MenuItem onClick={handleExportChat}>
                        <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>{t('chat.export_chat', 'Exportar Chat')}</ListItemText>
                      </MenuItem>
                    </Menu>
                  </Box>
                </Box>

                {/* Messages */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: 'background.default' }}>
                  {messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      isOwn={msg.sender_id === user?.user_id}
                      senderName={activeConversation?.display_name}
                      senderPhoto={activeConversation?.photo}
                      senderTier={activeConversation?.subscription_tier}
                    // Pass theme color to message bubbles if supported
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Smart Suggestions */}
                {suggestions.length > 0 && (
                  <Box sx={{ px: 2, py: 1, display: 'flex', gap: 1, overflowX: 'auto' }}>
                    {suggestions.map((suggestion, index) => (
                      <Chip
                        key={index}
                        label={suggestion}
                        onClick={() => handleSendMessage(undefined, suggestion)}
                        clickable
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                )}

                {/* Input */}
                {activeConversation?.status === 'blocked' ? (
                  <Box sx={{ p: 2, borderTop: '1px solid #eee', textAlign: 'center', bgcolor: 'action.disabledBackground', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                    <Typography color="text.secondary">
                      {activeConversation.blocked_by === user?.user_id
                        ? t('chat.you_blocked', 'Has bloqueado a este usuario.')
                        : t('chat.user_blocked', 'Este usuario no está disponible.')}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ p: 2, borderTop: '1px solid #eee', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, position: 'relative' }}>
                    {showEmojiPicker && (
                      <Box sx={{ position: 'absolute', bottom: '80px', left: '20px', zIndex: 10 }}>
                        <Picker
                          data={data}
                          onEmojiSelect={onEmojiSelect}
                          theme={theme.palette.mode}
                          locale="es"
                        />
                      </Box>
                    )}

                    <Box component="form" onSubmit={(e) => handleSendMessage(e)} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <IcebreakerButton
                        matchId={activeConversation!.match_id}
                        otherUserId={activeConversation!.other_user_id}
                        onSend={(text) => handleSendMessage(undefined, text)}
                        color={activeThemeColor}
                      />
                      <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                        <EmojiEmotionsIcon color="action" />
                      </IconButton>

                      <TextField
                        fullWidth
                        placeholder={isRecording ? t('chat.recording', 'Grabando... 00:{{seconds}}', { seconds: recordingTime.toString().padStart(2, '0') }) : t('chat.message_placeholder', 'Mensaje')}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        size="small"
                        autoComplete="off"
                        disabled={isRecording}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: isRecording ? 'error.light' : 'background.paper',
                            color: isRecording ? 'error.contrastText' : 'text.primary',
                            '&.Mui-focused fieldset': {
                              borderColor: activeThemeColor // Dynamic Focus Color
                            }
                          }
                        }}
                      />

                      {newMessage.trim() ? (
                        <IconButton type="submit" sx={{ color: activeThemeColor }}>
                          <SendIcon />
                        </IconButton>
                      ) : (
                        <IconButton
                          color={isRecording ? "error" : "primary"}
                          onMouseDown={startRecording}
                          onMouseUp={stopRecording}
                          onMouseLeave={stopRecording}
                          onTouchStart={startRecording}
                          onTouchEnd={stopRecording}
                          sx={{ color: isRecording ? 'error.main' : activeThemeColor }}
                        >
                          <MicIcon />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography color="text.secondary">{t('chat.select_conversation', 'Selecciona una conversación para comenzar')}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)}>
        <DialogTitle>{t('common.report_user', 'Reportar Usuario')}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>{t('common.reason', 'Razón')}</InputLabel>
            <Select
              value={reportReason}
              label={t('common.reason', 'Razón')}
              onChange={(e) => setReportReason(e.target.value)}
            >
              <MenuItem value="harassment">{t('report.harassment', 'Acoso')}</MenuItem>
              <MenuItem value="fraud">{t('report.fraud', 'Fraude')}</MenuItem>
              <MenuItem value="inappropriate_content">{t('report.inappropriate', 'Contenido Inapropiado')}</MenuItem>
              <MenuItem value="other">{t('report.other', 'Otro')}</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={4}
            margin="dense"
            label={t('common.description', 'Descripción (opcional)')}
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>{t('common.cancel', 'Cancelar')}</Button>
          <Button onClick={handleReportSubmit} variant="contained" color="primary">
            {t('common.submit', 'Enviar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>{confirmDialogTitle}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>{t('common.cancel', 'Cancelar')}</Button>
          <Button onClick={handleConfirmAction} variant="contained" color="primary" autoFocus>
            {t('common.confirm', 'Confirmar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
