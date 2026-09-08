import { Box, Typography, Paper, useTheme } from '@mui/material';
import { format } from 'date-fns';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckIcon from '@mui/icons-material/Check';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlanAvatar from '../subscription/PlanAvatar';
import IcebreakerMessage from './IcebreakerMessage';
import GameSession from './GameSession';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'voice' | 'icebreaker' | 'game';
  created_at: string;
  is_read: boolean;
  isSending?: boolean; // New prop
  icebreaker_data?: any;
  game_session?: any;
}

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  senderName?: string;
  senderPhoto?: string;
  senderTier?: string;
}

export default function ChatMessage({ message, isOwn, senderName, senderPhoto, senderTier }: ChatMessageProps) {
  const theme = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        mb: 2,
        gap: 1,
      }}
    >
      {!isOwn && (
        <PlanAvatar
          src={senderPhoto}
          alt={senderName}
          tier={senderTier}
          size={32}
          showBadge={false}
        />
      )}

      <Box sx={{ maxWidth: '80%' }}>
        {message.message_type === 'icebreaker' ? (
          <IcebreakerMessage message={message} isOwn={isOwn} user={user} />
        ) : message.message_type === 'game' ? (
          <GameSession message={message} isOwn={isOwn} user={user} />
        ) : (
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              bgcolor: isOwn ? 'primary.main' : (theme.palette.mode === 'dark' ? 'grey.800' : 'white'),
              color: isOwn ? 'primary.contrastText' : 'text.primary',
              borderRadius: 2,
              borderTopLeftRadius: !isOwn ? 0 : 2,
              borderTopRightRadius: isOwn ? 0 : 2,
            }}
          >
            <Typography variant="body1">{message.content}</Typography>
          </Paper>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: isOwn ? 'flex-end' : 'flex-start', gap: 0.5, mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {format(new Date(message.created_at), 'HH:mm')}
          </Typography>
          {isOwn && (
            message.isSending ? (
              <AccessTimeIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            ) : message.is_read ? (
              <VisibilityIcon sx={{ fontSize: 16, color: '#2196F3' }} />
            ) : (
              <CheckIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            )
          )}
        </Box>
      </Box>
    </Box>
  );
}
