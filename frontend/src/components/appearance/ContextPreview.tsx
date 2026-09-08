import { Box, Paper, Typography } from '@mui/material';
import { getMediaUrl } from '../../utils/media';

interface ContextPreviewProps {
    iconUrl?: string;
    platform: 'web' | 'android' | 'ios';
}

export default function ContextPreview({ iconUrl, platform }: ContextPreviewProps) {
    if (!iconUrl) return null;

    const fullUrl = getMediaUrl(iconUrl);

    return (
        <Box sx={{
            mb: 3,
            p: 2,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f0f2f5',
            borderRadius: 2,
            border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
        }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Previsualización ({platform})</Typography>

            {platform === 'web' && (
                <Paper sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    maxWidth: 400,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? '#333' : '#fff' // Darker browser bar in dark mode
                }}>
                    <Box sx={{ width: 16, height: 16, mr: 1, display: 'flex', alignItems: 'center' }}>
                        <img src={fullUrl} style={{ width: '100%', height: '100%' }} alt="favicon" />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>RedThread Portal</Typography>
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, bgcolor: 'action.disabled', borderRadius: '50%' }} />
                    </Box>
                </Paper>
            )}

            {platform === 'android' && (
                <Box sx={{ width: 100, textAlign: 'center' }}>
                    <Box sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '12%', // Android adaptive icon shape
                        overflow: 'hidden',
                        mx: 'auto',
                        bgcolor: '#fff', // App icons usually on white or specific bg
                        boxShadow: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <img src={fullUrl} style={{ width: 44, height: 44, objectFit: 'contain' }} alt="app icon" />
                    </Box>
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>RedThread</Typography>
                </Box>
            )}

            {platform === 'ios' && (
                <Box sx={{ width: 100, textAlign: 'center' }}>
                    <Box sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '22%', // iOS app icon superellipse-ish
                        overflow: 'hidden',
                        mx: 'auto',
                        bgcolor: '#000',
                        boxShadow: 1
                    }}>
                        <img src={fullUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="app icon" />
                    </Box>
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>RedThread</Typography>
                </Box>
            )}
        </Box>
    );
}
