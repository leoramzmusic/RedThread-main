import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    Paper,
    Alert,
    CircularProgress,
    Avatar,
    Tabs,
    Tab,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider
} from '@mui/material';
import {
    Search as SearchIcon,
    PersonAdd as PersonAddIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    Group as GroupIcon,
    Timer as TimerIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import apiClient from '../../services/api';

export default function FriendManager() {
    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Data State
    const [friends, setFriends] = useState<any[]>([]);
    const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
    const [sentRequests, setSentRequests] = useState<any[]>([]);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    // Fetch Data
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [friendsRes, receivedRes, sentRes] = await Promise.all([
                apiClient.get('/friends/list'),
                apiClient.get('/friends/requests/pending'),
                apiClient.get('/friends/requests/sent')
            ]);
            setFriends(friendsRes.data);
            setReceivedRequests(receivedRes.data);
            setSentRequests(sentRes.data);
        } catch (error) {
            console.error('Error loading friends data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Search Logic
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const response = await apiClient.get('/users/search', { params: { q: searchQuery } });
                setSearchResults(response.data);
            } catch (error) {
                console.error(error);
            } finally {
                setSearching(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Actions
    const handleSendRequest = async (targetUserId: string) => {
        try {
            await apiClient.post('/friends/request', { target_user_id: targetUserId });
            setMessage({ text: 'Solicitud de amistad enviada', type: 'success' });
            setSearchQuery('');
            setSearchResults([]);
            loadData();
            setTabIndex(2); // Switch to Sent Requests tab
        } catch (err: any) {
            setMessage({ text: err.response?.data?.detail || 'Error', type: 'error' });
        }
    };

    const handleAcceptRequest = async (relationshipId: string) => {
        try {
            await apiClient.post('/friends/respond', { relationship_id: relationshipId, accept: true });
            loadData();
        } catch (err) { console.error(err); }
    };

    const handleRejectRequest = async (relationshipId: string) => {
        try {
            await apiClient.post('/friends/respond', { relationship_id: relationshipId, accept: false });
            loadData();
        } catch (err) { console.error(err); }
    };

    const handleCancelRequest = async (relationshipId: string) => {
        if (!confirm('¿Cancelar solicitud?')) return;
        try {
            await apiClient.delete(`/friends/${relationshipId}`);
            loadData();
        } catch (err) { console.error(err); }
    };

    const handleRemoveFriend = async (relationshipId: string) => {
        if (!confirm('¿Eliminar de tus amigos?')) return;
        try {
            await apiClient.delete(`/friends/${relationshipId}`);
            loadData();
        } catch (err) { console.error(err); }
    };

    // Render Helpers
    const renderEmptyState = (msg: string) => (
        <Box textAlign="center" py={4} color="text.secondary">
            <Typography variant="body1">{msg}</Typography>
        </Box>
    );

    return (
        <Paper variant="outlined" sx={{ p: 0, bgcolor: 'background.paper', overflow: 'hidden', borderRadius: 2 }}>
            {/* Header Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
                <Tabs
                    value={tabIndex}
                    onChange={(_, v) => setTabIndex(v)}
                    variant="fullWidth"
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab icon={<GroupIcon />} iconPosition="start" label={`Amigos (${friends.length})`} />
                    <Tab icon={<PersonAddIcon />} iconPosition="start" label="Buscar" />
                    <Tab
                        icon={<TimerIcon />}
                        iconPosition="start"
                        label={
                            <Box display="flex" alignItems="center" gap={1}>
                                Solicitudes
                                {(receivedRequests.length > 0) && (
                                    <Chip label={receivedRequests.length} color="error" size="small" sx={{ height: 20, minWidth: 20 }} />
                                )}
                            </Box>
                        }
                    />
                </Tabs>
            </Box>

            {/* Feedback Message */}
            {message && (
                <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ m: 2 }}>
                    {message.text}
                </Alert>
            )}

            {/* Tab 0: My Friends */}
            <Box role="tabpanel" hidden={tabIndex !== 0}>
                {tabIndex === 0 && (
                    <Box>
                        {friends.length === 0 ? renderEmptyState("Aún no tienes amigos agregados.") : (
                            <List>
                                {friends.map((friend) => (
                                    <ListItem key={friend.relationship_id} divider>
                                        <ListItemAvatar>
                                            <Avatar src={friend.photo} alt={friend.display_name}>
                                                {friend.display_name?.charAt(0)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={friend.display_name}
                                            secondary={friend.city || "Sin ubicación"}
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton edge="end" color="error" onClick={() => handleRemoveFriend(friend.relationship_id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                )}
            </Box>

            {/* Tab 1: Search */}
            <Box role="tabpanel" hidden={tabIndex !== 1} sx={{ p: 2 }}>
                {tabIndex === 1 && (
                    <Box>
                        <TextField
                            fullWidth
                            placeholder="Buscar por nombre o usuario..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                                endAdornment: searching && <CircularProgress size={20} />
                            }}
                            sx={{ mb: 2 }}
                        />

                        {searchResults.length > 0 ? (
                            <List sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                {searchResults.map((user) => {
                                    // Check if already friend or request pending
                                    const isFriend = friends.some(f => f.user_id === user.id);
                                    const isPendingSent = sentRequests.some(r => r.target_id === user.id);
                                    const isPendingReceived = receivedRequests.some(r => r.requester_id === user.id);

                                    let action = null;
                                    if (isFriend) {
                                        action = <Chip label="Amigo" color="success" size="small" icon={<CheckIcon />} />;
                                    } else if (isPendingSent) {
                                        action = <Chip label="Enviada" color="primary" variant="outlined" size="small" icon={<TimerIcon />} />;
                                    } else if (isPendingReceived) {
                                        action = <Chip label="Pendiente" color="warning" size="small" />;
                                    } else {
                                        action = (
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<PersonAddIcon />}
                                                onClick={() => handleSendRequest(user.id)}
                                            >
                                                Agregar
                                            </Button>
                                        );
                                    }

                                    return (
                                        <ListItem key={user.id} divider>
                                            <ListItemAvatar>
                                                <Avatar>{user.display_name?.charAt(0)}</Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={user.display_name}
                                                secondary={`@${user.nickname}`}
                                            />
                                            <ListItemSecondaryAction>
                                                {action}
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        ) : (
                            searchQuery.length > 2 && !searching && renderEmptyState("No se encontraron usuarios")
                        )}
                    </Box>
                )}
            </Box>

            {/* Tab 2: Requests */}
            <Box role="tabpanel" hidden={tabIndex !== 2}>
                {tabIndex === 2 && (
                    <Box>
                        <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                            <Typography variant="subtitle2" fontWeight="bold">Solicitudes Recibidas ({receivedRequests.length})</Typography>
                        </Box>
                        <Divider />
                        {receivedRequests.length === 0 ? (
                            <Box p={2} textAlign="center"><Typography variant="body2" color="text.secondary">No tienes solicitudes pendientes.</Typography></Box>
                        ) : (
                            <List>
                                {receivedRequests.map((req) => (
                                    <ListItem key={req.relationship_id} divider>
                                        <ListItemAvatar>
                                            <Avatar src={req.requester_photo}>{req.requester_name?.charAt(0)}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={req.requester_name}
                                            secondary="Quiere ser tu amigo"
                                        />
                                        <ListItemSecondaryAction sx={{ display: 'flex', gap: 1 }}>
                                            <IconButton size="small" color="primary" onClick={() => handleAcceptRequest(req.relationship_id)}>
                                                <CheckIcon />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleRejectRequest(req.relationship_id)}>
                                                <CloseIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        )}

                        <Box sx={{ p: 2, bgcolor: 'action.hover', borderTop: 1, borderColor: 'divider' }}>
                            <Typography variant="subtitle2" fontWeight="bold">Solicitudes Enviadas ({sentRequests.length})</Typography>
                        </Box>
                        <Divider />
                        {sentRequests.length === 0 ? (
                            <Box p={2} textAlign="center"><Typography variant="body2" color="text.secondary">No has enviado solicitudes.</Typography></Box>
                        ) : (
                            <List>
                                {sentRequests.map((req) => (
                                    <ListItem key={req.relationship_id} divider>
                                        <ListItemAvatar>
                                            <Avatar src={req.target_photo}>{req.target_name?.charAt(0)}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={req.target_name}
                                            secondary="Esperando respuesta..."
                                        />
                                        <ListItemSecondaryAction>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="inherit"
                                                onClick={() => handleCancelRequest(req.relationship_id)}
                                            >
                                                Cancelar
                                            </Button>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                )}
            </Box>
        </Paper>
    );
}
