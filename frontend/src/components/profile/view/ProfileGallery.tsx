import { Paper, Typography, Avatar, Box } from '@mui/material';
import { MediaItem, MediaType } from '../../../types/media';

interface ProfileGalleryProps {
    profile: any;
    mediaItems: MediaItem[];
    mainProfilePhoto?: string;
}

export default function ProfileGallery({ profile, mediaItems, mainProfilePhoto }: ProfileGalleryProps) {
    const getImageUrl = (url?: string) => {
        if (!url) return undefined;
        if (url.startsWith('http')) return url;
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`;
    };

    const displayItems = mediaItems.length > 0
        ? mediaItems.filter(item => item.url !== mainProfilePhoto).slice(0, 9)
        : profile.photos?.filter((photo: string) => getImageUrl(photo) !== mainProfilePhoto)?.slice(0, 9) || [];

    return (
        <Paper
            className="profile-section"
            sx={{
                bgcolor: 'transparent',
                p: 2
            }}
            elevation={0}
        >
            <Typography variant="h6" gutterBottom fontWeight={700} mb={2}>
                Galería
            </Typography>

            {/* Grid Layout for Media Tab */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: 2,
                    mt: 2
                }}
            >
                {displayItems.length > 0 ? (
                    mediaItems.length > 0 ? (
                        mediaItems.map((item: MediaItem) => (
                            <Box
                                key={item._id}
                                sx={{
                                    aspectRatio: '1',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: 2
                                }}
                            >
                                {item.type === MediaType.PHOTO ? (
                                    <Avatar
                                        src={item.url}
                                        variant="rounded"
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            cursor: 'pointer',
                                            transition: 'transform 0.3s ease',
                                            '&:hover': {
                                                transform: 'scale(1.05)',
                                            }
                                        }}
                                    />
                                ) : (
                                    <Box sx={{
                                        width: '100%',
                                        height: '100%',
                                        bgcolor: 'black',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}>
                                        <Typography color="white">Video</Typography>
                                    </Box>
                                )}
                            </Box>
                        ))
                    ) : (
                        displayItems.map((photo: string, index: number) => (
                            <Box
                                key={index}
                                sx={{
                                    aspectRatio: '1',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: 2
                                }}
                            >
                                <Avatar
                                    src={getImageUrl(photo)}
                                    variant="rounded"
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        cursor: 'pointer',
                                        transition: 'transform 0.3s ease',
                                        '&:hover': {
                                            transform: 'scale(1.05)',
                                        }
                                    }}
                                />
                            </Box>
                        ))
                    )
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 4 }}>
                        No hay fotos disponibles
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}
