import { Box, Tooltip, Typography } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export type ConnectionStatus = 'online' | 'active_recent' | 'away' | 'idle' | 'offline';

interface StatusMeta {
  color: string;
  label: string;
}

const getStatusMeta = (status: ConnectionStatus): StatusMeta => {
  switch (status) {
    case 'online':
      return { color: '#4CAF50', label: 'En línea' };
    case 'active_recent':
      return { color: '#4CAF50', label: 'Activo recientemente' };
    case 'away':
      return { color: '#FFC107', label: 'Ausente' };
    case 'idle':
      return { color: '#FFC107', label: 'Inactivo' };
    default:
      return { color: '#9E9E9E', label: 'Desconectado' };
  }
};

const VALID_STATUSES: ConnectionStatus[] = [
  'online',
  'active_recent',
  'away',
  'idle',
  'offline',
];

/**
 * Backend datetimes are naive UTC ("2026-09-28T19:25:24.656000", no Z).
 * Append Z so browsers don't parse them as local time.
 */
export const parseServerDate = (value?: string): number | null => {
  if (!value) return null;
  const iso = /Z$|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`;
  const ts = new Date(iso).getTime();
  return Number.isNaN(ts) ? null : ts;
};

/** Client fallback mirroring backend thresholds when connection_status is absent. */
export const computeConnectionStatus = (lastSeen?: string): ConnectionStatus => {
  const ts = parseServerDate(lastSeen);
  if (ts === null) return 'offline';
  const minutes = (Date.now() - ts) / 60000;
  if (minutes < 1) return 'online';
  if (minutes < 5) return 'active_recent';
  if (minutes < 15) return 'away';
  if (minutes < 30) return 'idle';
  return 'offline';
};

interface PresenceIndicatorProps {
  status?: ConnectionStatus | string;
  lastSeen?: string;
  size?: number;
  /** Show "En línea" / "Activo hace X" text next to the dot */
  showText?: boolean;
  /** Override tooltip text */
  tooltipTitle?: string;
  /** CSS color for the showText label (defaults to white for dark backgrounds) */
  textColor?: string;
}

export default function PresenceIndicator({
  status,
  lastSeen,
  size = 8,
  showText = false,
  tooltipTitle,
  textColor = 'rgba(255,255,255,0.9)',
}: PresenceIndicatorProps) {
  const resolved: ConnectionStatus =
    status && VALID_STATUSES.includes(status as ConnectionStatus)
      ? (status as ConnectionStatus)
      : computeConnectionStatus(lastSeen);
  const meta = getStatusMeta(resolved);
  const ts = parseServerDate(lastSeen);
  const timeText =
    ts !== null ? formatDistanceToNow(new Date(ts), { addSuffix: true, locale: es }) : null;

  const text = resolved === 'online' ? meta.label : timeText ? `Activo ${timeText}` : meta.label;
  const tooltip =
    tooltipTitle ??
    (resolved === 'online' || !timeText ? meta.label : `${meta.label} · ${timeText}`);

  return (
    <Tooltip title={tooltip}>
      <Box
        component="span"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}
      >
        <Box
          component="span"
          role="img"
          aria-label={tooltip}
          sx={{
            width: size,
            height: size,
            borderRadius: '50%',
            bgcolor: meta.color,
            boxShadow:
              resolved !== 'offline' ? `0 0 ${Math.max(size, 6)}px ${meta.color}cc` : 'none',
            border: size >= 10 ? '2px solid rgba(255,255,255,0.9)' : 'none',
            flexShrink: 0,
          }}
        />
        {showText && (
          <Typography
            variant="caption"
            sx={{ color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {text}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}
