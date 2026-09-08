import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Avatar,
    Button,
    IconButton,
    Chip,
    Stack,
    Tooltip,
    CircularProgress,
    useTheme
} from '@mui/material';
import {
    ChatBubbleOutline as MessageIcon,
    PersonRemove as RemoveIcon,
    Check as AcceptIcon,
    Close as RejectIcon,
    Favorite as HeartIcon,
    DoNotDisturbOn as CancelIcon
} from '@mui/icons-material';
import apiClient from '../../services/api';
import { useRouter } from 'next/router';

// We import the local interface concept or define a compatible one. 
// Since index.tsx has its own interface, we'll try to support it while being robust.
export interface FriendCardProps {
    friend: {
        user_id?: string;
        requester_id?: string;
        relationship_id?: string;
        display_name: string;
        photo: string | null;
        status?: 'active' | 'pending_sent' | 'pending_received';
        affinity_score?: number;
        is_golth?: boolean;
        is_online?: boolean;
        city?: string;
        age?: number;
        [key: string]: any;
    };
    onAction?: () => void;
}

const FriendCard: React.FC<FriendCardProps> = ({ friend, onAction }) => {
    const theme = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Normalize ID
    const targetUserId = friend.user_id || friend.requester_id || friend.target_id;
    const relationshipId = friend.relationship_id;

    // Actions
    const handleAccept = async () => {
        if (!relationshipId) return;
        setLoading(true);
        try {
            await apiClient.post('/friends/respond', {
                relationship_id: relationshipId,
                accept: true
            });
            if (onAction) onAction();
        } catch (error) {
            console.error('Error accepting friend request:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!relationshipId) return;
        setLoading(true);
        try {
            await apiClient.post('/friends/respond', {
                relationship_id: relationshipId,
                accept: false
            });
            if (onAction) onAction();
        } catch (error) {
            console.error('Error rejecting friend request:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async () => {
        if (!relationshipId) return;
        if (!window.confirm('¿Estás seguro de que quieres eliminar este vínculo?')) return;

        setLoading(true);
        try {
            await apiClient.delete(`/friends/${relationshipId}`);
            if (onAction) onAction();
        } catch (error) {
            console.error('Error removing friend:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMessage = () => {
        if (targetUserId) {
            router.push(`/chat?userId=${targetUserId}`);
        }
    };

    // Determine Status Logic (if not explicitly passed, infer from props or context)
    // Note: In index.tsx, distinct lists are used so we might know context, but explicit status is safer.
    const isPending = friend.status === 'pending_received' || (friend.requester_id && !friend.user_id);
    const isActive = friend.status === 'active' || (!isPending && friend.user_id);

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 4,
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4],
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                },
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Background Decoration */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 80,
                    height: 80,
                    background: 'radial-gradient(circle, rgba(255,107,107,0.1) 0%, rgba(0,0,0,0) 70%)',
                    borderRadius: '0 0 0 100%',
                    pointerEvents: 'none'
                }}
            />

            <Stack spacing={2} alignItems="center">
                {/* Avatar Section */}
                <Box position="relative">
                    <Avatar
                        src={friend.photo || undefined}
                        alt={friend.display_name}
                        sx={{
                            width: 80,
                            height: 80,
                            border: '3px solid',
                            borderColor: 'background.paper',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    />
                    {friend.affinity_score !== undefined && (
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: -5,
                                right: -5,
                                bgcolor: 'background.paper',
                                borderRadius: '50%',
                                p: 0.5
                            }}
                        >
                            <CircularProgress
                                variant="determinate"
                                value={friend.affinity_score}
                                size={32}
                                thickness={5}
                                sx={{ color: friend.affinity_score > 80 ? 'success.main' : 'primary.main' }}
                            />
                            <Typography
                                variant="caption"
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    fontSize: '0.6rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                {friend.affinity_score}%
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Info Section */}
                <Box textAlign="center" width="100%">
                    <Typography variant="h6" fontWeight={700} noWrap>
                        {friend.display_name}
                    </Typography>

                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 0.5, mb: 1 }}>
                        {friend.is_golth && (
                            <Chip
                                label="Golth"
                                size="small"
                                color="secondary"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                        )}
                        {friend.age && (
                            <Typography variant="caption" color="text.secondary">
                                {friend.age} años
                            </Typography>
                        )}
                    </Stack>

                    {friend.city && (
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ opacity: 0.8 }}>
                            📍 {friend.city}
                        </Typography>
                    )}
                </Box>

                {/* Actions Section */}
                <Box sx={{ width: '100%', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    {isPending ? (
                        <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Aceptar">
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    onClick={handleAccept}
                                    disabled={loading}
                                    sx={{ minWidth: 0, px: 2, borderRadius: 3 }}
                                >
                                    <AcceptIcon fontSize="small" />
                                </Button>
                            </Tooltip>
                            <Tooltip title="Rechazar">
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={handleReject}
                                    disabled={loading}
                                    sx={{ minWidth: 0, px: 2, borderRadius: 3 }}
                                >
                                    <RejectIcon fontSize="small" />
                                </Button>
                            </Tooltip>
                        </Stack>
                    ) : (
                        <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Enviar mensaje">
                                <IconButton
                                    color="primary"
                                    onClick={handleMessage}
                                    sx={{ bgcolor: 'rgba(78, 205, 196, 0.1)' }}
                                >
                                    <MessageIcon />
                                </IconButton>
                            </Tooltip>
                            {/* 
                            <Tooltip title="Ver perfil">
                                <IconButton color="default">
                                    <ProfileIcon />
                                </IconButton>
                            </Tooltip> 
                            */}
                            <Tooltip title="Eliminar amigo">
                                <IconButton
                                    color="error"
                                    onClick={handleRemove}
                                    sx={{ bgcolor: 'rgba(255, 107, 107, 0.1)' }}
                                >
                                    <RemoveIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    )}
                </Box>
            </Stack>
        </Paper>
    );
};

export default FriendCard;
