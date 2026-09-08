import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  autocompleteClasses,
  Autocomplete,
  TextField,
  Paper,
  Alert,
  CircularProgress,
  Avatar,
  debounce
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  PersonAdd as PersonAddIcon,
  LinkOff as LinkOffIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import apiClient from '../../services/api';

interface PartnerManagerProps {
  profile: any;
  onUpdate: () => void;
}

export default function PartnerManager({ profile, onUpdate }: PartnerManagerProps) {
  const [openSearch, setOpenSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Search state
  const [searchOptions, setSearchOptions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  // Debounced search
  const fetchUsers = useMemo(
    () =>
      debounce(async (query: string, callback: (results: any[]) => void) => {
        if (query.length < 2) {
          callback([]);
          return;
        }
        try {
          const response = await apiClient.get('/users/search', { params: { q: query } });
          callback(response.data);
        } catch (error) {
          console.error('Error searching users:', error);
          callback([]);
        }
      }, 400),
    []
  );

  useEffect(() => {
    let active = true;

    if (searchQuery === '') {
      setSearchOptions([]);
      return undefined;
    }

    setSearching(true);
    fetchUsers(searchQuery, (results) => {
      if (active) {
        setSearchOptions(results);
        setSearching(false);
      }
    });

    return () => {
      active = false;
    };
  }, [searchQuery, fetchUsers]);

  const handleSendRequest = async () => {
    if (!selectedUser) return;
    setLoading(true);
    setMessage(null);
    try {
      // Sending user_id instead of email. Requires backend change!
      await apiClient.post('/partners/request', { target_user_id: selectedUser.id });
      setMessage({ text: 'Solicitud enviada correctamente', type: 'success' });
      setTimeout(() => {
        setOpenSearch(false);
        setSelectedUser(null);
        setSearchQuery('');
        setMessage(null);
        onUpdate();
      }, 1500);
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.detail || 'Error al enviar solicitud',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      await apiClient.post('/partners/accept');
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    try {
      await apiClient.post('/partners/reject');
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('¿Estás seguro de que quieres desvincularte de tu pareja?')) return;
    try {
      await apiClient.delete('/partners/unlink');
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelRequest = async () => {
    if (!confirm('¿Estás seguro de que quieres cancelar la solicitud enviada?')) return;
    try {
      await apiClient.post('/partners/cancel');
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Linked State
  if (profile.partner_id) {
    return (
      <Paper elevation={0} sx={{
        p: 2.5,
        mt: 2,
        background: 'linear-gradient(135deg, #FFD700 0%, #FDB931 100%)',
        color: '#424242',
        borderRadius: 3,
        boxShadow: '0 4px 15px rgba(253, 185, 49, 0.3)'
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.3)', borderRadius: '50%' }}>
              <LinkOffIcon sx={{ color: '#424242' }} /> {/* Using LinkIcon conceptually, but keeping the requested flow */}
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', opacity: 0.8 }}>
                Vínculo Confirmado
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {profile.partner_name || 'Tu pareja'}
              </Typography>
            </Box>
          </Box>
          <Button
            size="small"
            onClick={handleUnlink}
            sx={{
              color: '#424242',
              borderColor: 'rgba(0,0,0,0.2)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.05)', borderColor: 'rgba(0,0,0,0.3)' }
            }}
            variant="outlined"
          >
            Desvincular
          </Button>
        </Box>
      </Paper>
    );
  }

  // 2. Pending Request Received
  if (profile.partner_request_uid) {
    return (
      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper', mt: 2, border: '1px solid #ff9800' }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Solicitud de pareja pendiente
        </Typography>
        <Typography variant="body2" paragraph>
          Alguien quiere vincular su perfil contigo.
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<CheckIcon />}
            onClick={handleAccept}
          >
            Aceptar
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<CloseIcon />}
            onClick={handleReject}
          >
            Rechazar
          </Button>
        </Box>
      </Paper>
    );
  }

  // 3. Pending Request Sent (NEW)
  if (profile.sent_partner_request_to_uid) {
    return (
      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', mt: 2, border: '1px dashed', borderColor: 'grey.400', borderRadius: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ position: 'relative', display: 'flex' }}>
              <CircularProgress size={24} sx={{ color: 'text.secondary' }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                Solicitud enviada
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Esperando confirmación...
              </Typography>
            </Box>
          </Box>
          <Button
            variant="text"
            color="inherit"
            size="small"
            onClick={handleCancelRequest}
            sx={{ color: 'text.secondary' }}
          >
            Cancelar
          </Button>
        </Box>
      </Paper>
    );
  }

  // 4. Default State (Single) & Absolute Modal
  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<PersonAddIcon />}
        onClick={() => setOpenSearch(!openSearch)}
        fullWidth
        disabled={openSearch}
        sx={{ height: '56px' }}
      >
        Vincular Pareja
      </Button>

      {openSearch && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            p: 3,
            borderRadius: 2
          }}
        >
          <Typography variant="h6" gutterBottom>Vincular Pareja</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Busca a tu pareja por nombre de usuario o nombre visible.
          </Typography>

          <TextField
            fullWidth
            label="Buscar usuario"
            placeholder="Escribe el nombre o usuario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              endAdornment: (
                <>
                  {searching ? <CircularProgress color="inherit" size={20} /> : <SearchIcon color="action" />}
                </>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* Results List */}
          {searchOptions.length > 0 && (
            <Box sx={{
              maxHeight: 200,
              overflowY: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mb: 2
            }}>
              {searchOptions.map((user) => (
                <Box
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    setSearchQuery(`${user.display_name} (@${user.nickname})`); // Optional: Show selected in input or just keep visual selection
                    setSearchOptions([]); // Hide list after selection
                  }}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    bgcolor: selectedUser?.id === user.id ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 32, height: 32 }}>{user.display_name.charAt(0).toUpperCase()}</Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{user.display_name}</Typography>
                      <Typography variant="caption" color="text.secondary">@{user.nickname}</Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Explicit No Results Message (only if searched and no results) */}
          {searchQuery.length > 2 && !searching && searchOptions.length === 0 && !selectedUser && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic', textAlign: 'center' }}>
              No se encontraron usuarios.
            </Typography>
          )}

          {/* Selected User Indicator (if list is hidden but user is selected) */}
          {selectedUser && searchOptions.length === 0 && (
            <Alert severity="success" sx={{ mb: 2 }} icon={<CheckIcon fontSize="inherit" />}>
              Seleccionado: <strong>{selectedUser.display_name}</strong> (@{selectedUser.nickname})
            </Alert>
          )}

          {message && (
            <Alert severity={message.type} sx={{ mb: 2 }}>
              {message.text}
            </Alert>
          )}

          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button onClick={() => setOpenSearch(false)}>Cancelar</Button>
            <Button
              onClick={handleSendRequest}
              variant="contained"
              disabled={loading || !selectedUser}
            >
              {loading ? <CircularProgress size={24} /> : 'Enviar'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
