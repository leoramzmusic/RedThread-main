import { Paper, Typography, Avatar, Box, Chip } from '@mui/material';
import { MediaItem, MediaType } from '../../../types/media';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface ProfileGalleryProps {
    profile: any;
    mediaItems: MediaItem[];
    mainProfilePhoto?: string;
    onPhotoClick?: (mediaId: string) => void;
    smartPhotosEnabled?: boolean;
}

export default function ProfileGallery({ profile, mediaItems, mainProfilePhoto, onPhotoClick, smartPhotosEnabled }: ProfileGalleryProps) {
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
                        mediaItems.map((item: MediaItem, index: number) => (
                            <Box
                                key={item._id}
                                data-media-id={item._id}
                                onClick={() => onPhotoClick?.(item._id)}
                                sx={{
                                    aspectRatio: '1',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: 2,
                                    cursor: 'pointer'
                                }}
                            >
                                {item.type === MediaType.PHOTO ? (
                                    <Avatar
                                        src={item.url}
                                        variant="rounded"
                                        sx={{
                                            width: '100%',
                                            height: '100%',
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
                                    }}>
                                        <Typography color="white">Video</Typography>
                                    </Box>
                                )}

                                {/* Smart Photos Badge on first photo */}
                                {smartPhotosEnabled && index === 0 && (
                                    <Chip
                                        icon={<AutoAwesomeIcon sx={{ fontSize: 10 }} />}
                                        label="Smart"
                                        size="small"
                                        color="warning"
                                        variant="filled"
                                        sx={{
                                            position: 'absolute',
                                            top: 4,
                                            left: 4,
                                            height: 20,
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            '& .MuiChip-icon': { color: 'white', mr: 0.5 },
                                        }}
                                    />
                                )}
                            </Box>
                        ))
                    ) : (
                        displayItems.map((photo: string, index: number) => (
                            <Box
                                key={index}
                                data-media-id={`photo-${index}`}
                                onClick={() => onPhotoClick?.(`photo-${index}`)}
                                sx={{
                                    aspectRatio: '1',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: 2,
                                    cursor: 'pointer'
                                }}
                            >
                                <Avatar
                                    src={getImageUrl(photo)}
                                    variant="rounded"
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        transition: 'transform 0.3s ease',
                                        '&:hover': {
                                            transform: 'scale(1.05)',
                                        }
                                    }}
                                />

                                {/* Smart Photos Badge on first photo */}
                                {smartPhotosEnabled && index === 0 && (
                                    <Chip
                                        icon={<AutoAwesomeIcon sx={{ fontSize: 10 }} />}
                                        label="Smart"
                                        size="small"
                                        color="warning"
                                        variant="filled"
                                        sx={{
                                            position: 'absolute',
                                            top: 4,
                                            left: 4,
                                            height: 20,
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            '& .MuiChip-icon': { color: 'white', mr: 0.5 },
                                        }}
                                    />
                                )}
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
