import { Paper, Box, Typography, Button } from '@mui/material';
import { MusicNote as MusicIcon } from '@mui/icons-material';

export default function ProfileMusic() {
    return (
        <Paper
            className="profile-section"
            sx={{
                bgcolor: 'transparent',
                overflow: 'hidden',
                position: 'relative'
            }}
            elevation={0}
        >
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Box
                    p={1.5}
                    bgcolor="#1DB954"
                    borderRadius="50%"
                    color="white"
                    display="flex"
                    sx={{
                        boxShadow: '0 4px 12px rgba(29, 185, 84, 0.3)'
                    }}
                >
                    <MusicIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                    <Typography variant="h6" fontWeight={700} mb={0.5}>
                        Mi Himno
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Comparte tu música favorita
                    </Typography>
                </Box>
            </Box>

            <Button
                variant="contained"
                fullWidth
                startIcon={<MusicIcon sx={{ fontSize: 20 }} />}
                sx={{
                    justifyContent: 'flex-start',
                    py: 2,
                    px: 2.5,
                    background: 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(29, 185, 84, 0.25)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #1ed760 0%, #1fdf64 100%)',
                        boxShadow: '0 6px 16px rgba(29, 185, 84, 0.35)',
                        transform: 'translateY(-2px)'
                    },
                    textTransform: 'none',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    fontWeight: 600
                }}
            >
                <Box textAlign="left">
                    <Typography variant="body1" fontWeight={700}>
                        Conectar con Spotify
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Muestra tu personalidad musical
                    </Typography>
                </Box>
            </Button>
        </Paper>
    );
}
