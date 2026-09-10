import { useState, useRef, useEffect } from 'react';
import { Grid, Paper, Typography, Box, Button, Stack, FormControl, Select, MenuItem, TextField, CircularProgress, InputLabel, Avatar, IconButton, Card, CardMedia, CardContent, Accordion, AccordionSummary, AccordionDetails, Alert } from '@mui/material';
import { MusicNote, OpenInNew, CheckCircle, LinkOff, Add, Delete, PlayArrow, Pause, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Controller, useWatch } from 'react-hook-form';
import { useAppTheme } from '../../../../context/ThemeContext';
import { BaseSectionProps } from '../types';
import SpotifySearchModal from '../SpotifySearchModal'; // Adjust path if needed
import { SpotifyTrack, SpotifyArtist } from '../../../../services/spotifyService'; // Adjust path
import MusicGenreSelector from '../../MusicGenreSelector';
import apiClient from '../../../../services/api';

// Service configuration (unchanged)
const SERVICES: Record<string, { label: string; color: string; textColor: string; gradient: string; icon: string; url: string }> = {
    spotify: {
        label: 'Spotify',
        color: '#1DB954',
        textColor: '#FFFFFF',
        gradient: 'linear-gradient(90deg, #1DB954, #1ED760)',
        icon: '🎵',
        url: 'https://spotify.com'
    },
    applemusic: {
        label: 'Apple Music',
        color: '#FA233B',
        textColor: '#FFFFFF',
        gradient: 'linear-gradient(90deg, #FA233B, #FF4F70)',
        icon: '🍎',
        url: 'https://music.apple.com'
    },
    amazonmusic: {
        label: 'Amazon Music',
        color: '#9146FF',
        textColor: '#FFFFFF',
        gradient: 'linear-gradient(90deg, #9146FF, #B983FF)',
        icon: '🛒',
        url: 'https://music.amazon.com'
    },
    deezer: {
        label: 'Deezer',
        color: '#000000',
        textColor: '#FFFFFF',
        gradient: 'linear-gradient(90deg, #000000, #444444)',
        icon: '🎼',
        url: 'https://deezer.com'
    },
    youtubemusic: {
        label: 'YouTube Music',
        color: '#FF0000',
        textColor: '#FFFFFF',
        gradient: 'linear-gradient(90deg, #FF0000, #FF4F4F)',
        icon: '▶️',
        url: 'https://music.youtube.com'
    },
    soundcloud: {
        label: 'SoundCloud',
        color: '#FF5500',
        textColor: '#FFFFFF',
        gradient: 'linear-gradient(90deg, #FF5500, #FF884D)',
        icon: '☁️',
        url: 'https://soundcloud.com'
    },
    tidal: {
        label: 'Tidal',
        color: '#000000',
        textColor: '#FFFFFF',
        gradient: 'linear-gradient(90deg, #000000, #333333)',
        icon: '🌊',
        url: 'https://tidal.com'
    },
    audius: {
        label: 'Audius',
        color: '#8C30F5',
        textColor: '#FFFFFF',
        gradient: 'linear-gradient(90deg, #8C30F5, #B266FF)',
        icon: '🎧',
        url: 'https://audius.co'
    }
};

export default function MusicSection({ control, watch, setValue }: BaseSectionProps) {
    // robustly watch the entire mi_himno object
    const miHimno = useWatch({
        control,
        name: 'mi_himno',
        defaultValue: {}
    });

    const selectedService = miHimno?.service || '';
    const isConnected = !!miHimno?.connected;
    const favoriteArtists = Array.isArray(miHimno?.favorite_artists) ? miHimno.favorite_artists : [];
    const featuredSongs = Array.isArray(miHimno?.featured_songs) ? miHimno.featured_songs : [];

    const [isConnecting, setIsConnecting] = useState(false);
    const [freeSpotifyAccount, setFreeSpotifyAccount] = useState(false);

    // Search Modal State
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchType, setSearchType] = useState<'track' | 'artist'>('track');
    const containerRef = useRef<HTMLDivElement>(null);
    const { mode } = useAppTheme();

    // Handle OAuth Callback
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('spotify_connected') === 'true') {
            setValue('mi_himno.connected', 'spotify');
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [setValue]);

    // Check if user already has Spotify connected on mount
    useEffect(() => {
        async function checkSpotifyConnection() {
            try {
                const response = await apiClient.get('/api/auth/spotify/token');
                if (response.data.authenticated && response.data.token) {
                    // User has Spotify token, mark as connected
                    if (!miHimno?.connected) {
                        setValue('mi_himno.connected', 'spotify');
                    }
                    setFreeSpotifyAccount(response.data.product === 'free');
                } else {
                    // Token is invalid or expired
                    // If we thought we were connected, we should disconnect (visually) 
                    // to disable editing, but KEEP data (read-only mode).
                    if (miHimno?.connected === 'spotify') {
                        setValue('mi_himno.connected', null);
                    }
                    setFreeSpotifyAccount(false);
                }
            } catch (error) {
                console.error('Error checking Spotify connection:', error);
            }
        }
        checkSpotifyConnection();
    }, [miHimno?.connected, setValue]);

    const currentServiceData = SERVICES[selectedService] || null;
    const bannerGradient = currentServiceData?.gradient || 'action.hover';

    const handleConnect = async () => {
        if (isConnected) {
            // Disconnect logic (Backend + Frontend)
            try {
                await apiClient.delete('/api/auth/spotify/disconnect');
                setValue('mi_himno.connected', null);
                setValue('mi_himno.service', null);
                setValue('mi_himno.favorite_artists', []);
                setValue('mi_himno.featured_songs', []);
            } catch (error) {
                console.error('Error disconnecting:', error);
            }
            return;
        }

        // Auto-set Spotify as the service (since it's the only one available)
        setValue('mi_himno.service', 'spotify');

        // Fetch Spotify Auth URL from backend (authenticated)
        setIsConnecting(true);
        try {
            const response = await apiClient.post('/api/auth/spotify/auth-url', {
                redirect_to: window.location.pathname // Send current URL to return here after OAuth
            });
            if (response.data.url) {
                window.location.href = response.data.url;
            } else {
                console.error('No auth URL received');
                setIsConnecting(false);
            }
        } catch (error) {
            console.error('Error getting auth URL:', error);
            setIsConnecting(false);
        }
    };

    // Helper to safely get list data (handles backward compatibility with strings)
    const getList = (val: any): any[] => Array.isArray(val) ? val : [];

    // --- Artist Handlers ---
    // --- Artist Handlers ---
    const handleAddArtist = (artist: SpotifyArtist) => {
        const current = favoriteArtists;

        // Enforce max 16 artists limit
        if (current.length >= 16) return;

        // Avoid duplicates by ID
        if (current.some((a: any) => a.id === artist.id)) return;

        // Store complete artist object with all data needed for display
        const artistData = {
            id: artist.id,
            name: artist.name,
            image: artist.images?.[0]?.url || null,
            spotify_url: artist.external_urls?.spotify
        };

        setValue('mi_himno.favorite_artists', [...current, artistData]);
    };

    // --- Song Handlers ---
    const handleAddSong = (track: SpotifyTrack) => {
        // console.log('🎵 handleAddSong - Track recibido completo:', track);
        // console.log('🎵 Preview URL:', track.preview_url);

        const current = getList(watch('mi_himno.featured_songs'));
        if (current.length >= 5) return;

        // Avoid duplicates
        if (current.some((t: any) => t.id === track.id)) return;

        // Store complete track object with all data needed for display and preview
        const trackData = {
            id: track.id,
            name: track.name,
            artist: track.artists?.[0]?.name || 'Unknown',
            image: track.album?.images?.[0]?.url || null,
            preview_url: track.preview_url,
            spotify_url: track.external_urls?.spotify
        };

        // console.log('💾 Track data guardado:', trackData);
        setValue('mi_himno.featured_songs', [...current, trackData]);
    };

    const handleRemoveItem = (field: string, index: number) => {
        const current = getList(watch(field));
        const newItems = [...current];
        newItems.splice(index, 1);
        setValue(field, newItems);
    };

    // --- Rendering Helpers ---
    // Since we only store IDs, we need to fetch data to display ?? 
    // Or we rely on the component fetching it?
    // The user's example component fetches data: `getSpotifyTrackPreview(songId)`.
    // So YES, we store IDs, and the component fetches.
    // I need a sub-component to render the ID as a visual card.

    return (
        <Grid item xs={12}>
            <SpotifySearchModal
                open={searchOpen}
                onClose={() => setSearchOpen(false)}
                type={searchType}
                anchorEl={containerRef.current}
                onSelect={(item) => {
                    if (searchType === 'track') handleAddSong(item as SpotifyTrack);
                    else handleAddArtist(item as SpotifyArtist);
                }}
            />

            <Accordion
                defaultExpanded
                ref={containerRef}
                sx={{
                    position: 'relative',
                    border: (theme) => '1px solid ' + theme.palette.divider,
                    boxShadow: 1,
                    backgroundImage: 'none',
                    borderRadius: '12px !important',
                    '&:before': { display: 'none' }
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ px: 3, py: 1 }}
                >
                    <Box display="flex" alignItems="center" gap={1}>
                        <MusicNote color="action" />
                        <Typography variant="h6">Mi Himno</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                    {/* Banner (same as before) */}
                    <Box sx={{
                        background: currentServiceData?.gradient || undefined,
                        bgcolor: currentServiceData?.gradient ? undefined : 'action.selected',
                        color: currentServiceData ? 'white' : 'text.primary',
                        p: 3,
                        borderRadius: 3,
                        mb: 3,
                        boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
                        border: currentServiceData ? 'none' : '1px solid',
                        borderColor: 'divider'
                    }}>
                        <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                            {isConnected ? (
                                <>Has conectado <strong>Spotify</strong>. Tu mundo musical está listo para mostrarse en tu perfil.</>
                            ) : (
                                <>Conecta con <strong>Spotify</strong> para mostrar tu mundo musical.</>
                            )}
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {/* Service Selector (Simplified for brevity, assuming only Spotify for this demo) */}
                        <Grid item xs={12}>
                            {isConnected && freeSpotifyAccount && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    Estás usando la cuenta gratuita de Spotify. Algunas funciones (como reproducir canciones) pueden estar limitadas, pero esto no afecta tu experiencia dentro de RETH.
                                </Alert>
                            )}
                            {!isConnected && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Al conectar tu cuenta de Spotify, algunas funciones (reproducir canciones, crear listas) dependerán de tu suscripción. Esto no afecta tu experiencia dentro de RETH.
                                </Alert>
                            )}
                            <Button
                                variant="contained"
                                fullWidth
                                // Removed disabled prop to allow disconnection
                                onClick={handleConnect}
                                startIcon={<span style={{ fontSize: '1.2rem' }}>🎵</span>}
                                sx={{
                                    bgcolor: isConnected ? '#d32f2f' : '#1DB954', // Red for disconnect, Green for connect
                                    '&:hover': { bgcolor: isConnected ? '#b71c1c' : '#1ed760' },
                                    color: '#fff'
                                }}
                            >
                                {isConnected ? 'Desconectar Spotify' : 'Conectar Spotify'}
                            </Button>
                        </Grid>

                        {/* Music Genres Section */}
                        <Grid item xs={12}>
                            <Accordion
                                defaultExpanded={false}
                                sx={{
                                    bgcolor: 'transparent',
                                    backgroundImage: 'none',
                                    boxShadow: 'none',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    borderRadius: '12px !important',
                                    '&:before': { display: 'none' }
                                }}
                            >
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                                            Géneros Musicales
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            ({(watch('music_genres') || []).length}/25)
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ p: 2, pt: 0 }}>
                                    <MusicGenreSelector
                                        selectedGenres={watch('music_genres') || []}
                                        onGenresChange={(genres) => setValue('music_genres', genres)}
                                        editable={true}
                                        showTitle={false}
                                    />
                                </AccordionDetails>
                            </Accordion>
                        </Grid>

                        {(isConnected || getList(watch('mi_himno.favorite_artists')).length > 0 || featuredSongs.length > 0) && (
                            <>
                                {freeSpotifyAccount && (
                                    <Grid item xs={12}>
                                        <Alert severity="info" sx={{ mb: 1, py: 0, '& .MuiAlert-message': { fontSize: '0.85rem' } }}>
                                            Las funciones de "Añadir" están bloqueadas por tu cuenta gratuita de Spotify. Esto depende de tu suscripción a Spotify, no de RETH.
                                        </Alert>
                                    </Grid>
                                )}
                                {/* Favorite Artists */}
                                <Grid item xs={12}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Typography variant="h6">
                                            Artistas Favoritos ({getList(watch('mi_himno.favorite_artists')).length}/16)
                                        </Typography>
                                        {getList(watch('mi_himno.favorite_artists')).length < 16 && (
                                            <Button
                                                startIcon={<Add />}
                                                size="small"
                                                onClick={() => { setSearchType('artist'); setSearchOpen(true); }}
                                                disabled={freeSpotifyAccount}
                                                sx={{ color: 'text.primary' }}
                                            >
                                                Añadir
                                            </Button>
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                        <Controller
                                            name="mi_himno.favorite_artists"
                                            control={control}
                                            defaultValue={[]}
                                            render={({ field }) => {
                                                const artists = getList(field.value);
                                                return (
                                                    <>
                                                        {artists.map((artist: any, index: number) => (
                                                            <Box
                                                                key={artist.id || index}
                                                                sx={{
                                                                    width: { xs: '25%', sm: '16.66%', md: '12.5%' }, // 4, 6, 8 items per row responsive
                                                                    display: 'flex',
                                                                    justifyContent: 'center'
                                                                }}
                                                            >
                                                                <VisualArtistCard
                                                                    artist={artist}
                                                                    readOnly={false}
                                                                    onDelete={() => handleRemoveItem('mi_himno.favorite_artists', index)}
                                                                />
                                                            </Box>
                                                        ))}
                                                        {artists.length === 0 && (
                                                            <Typography color="gray" sx={{ pl: 2, fontStyle: 'italic', width: '100%' }}>No hay artistas seleccionados</Typography>
                                                        )}
                                                    </>
                                                );
                                            }}
                                        />
                                    </Box>
                                </Grid>

                                {/* Featured Songs */}
                                <Grid item xs={12}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} mt={2}>
                                        <Typography variant="h6">
                                            Canciones Destacadas ({featuredSongs.length}/5)
                                        </Typography>
                                        {
                                            <Button
                                                startIcon={<Add />}
                                                size="small"
                                                onClick={() => { setSearchType('track'); setSearchOpen(true); }}
                                                disabled={freeSpotifyAccount || featuredSongs.length >= 5}
                                                sx={{ color: 'text.primary' }}
                                            >
                                                Añadir
                                            </Button>
                                        }
                                    </Box>
                                    <Stack spacing={2}>
                                        <Controller
                                            name="mi_himno.featured_songs"
                                            control={control}
                                            defaultValue={[]}
                                            render={({ field }) => {
                                                const tracks = getList(field.value);
                                                //console.log('🎧 Tracks en render:', tracks);
                                                return (
                                                    <>
                                                        {tracks.map((track: any, index: number) => {
                                                            console.log(`🎵 Track ${index}:`, track);
                                                            return (
                                                                <VisualSongCard
                                                                    key={track.id || index}
                                                                    track={track}
                                                                    playing={false}
                                                                    readOnly={false}
                                                                    mode={mode}
                                                                    onPlay={() => { }}
                                                                    onDelete={() => handleRemoveItem('mi_himno.featured_songs', index)}
                                                                />
                                                            );
                                                        })}
                                                        {tracks.length === 0 && (
                                                            <Typography color="gray" sx={{ fontStyle: 'italic' }}>No hay canciones seleccionadas</Typography>
                                                        )}
                                                    </>
                                                );
                                            }}
                                        />
                                    </Stack>
                                </Grid>
                            </>
                        )}
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </Grid >
    );
}

// --- Sub-components (integrated for simplicity, normally separate) ---

// Visual Artist Card
function VisualArtistCard({ artist, onDelete, readOnly }: { artist: any, onDelete: () => void, readOnly?: boolean }) {
    return (
        <Box position="relative" sx={{ textAlign: 'center', width: 80 }}>
            <Avatar
                src={artist.image}
                sx={{ width: 80, height: 80, mb: 1, border: '2px solid', borderColor: 'divider' }}
            >
                <MusicNote />
            </Avatar>
            {!readOnly && (
                <IconButton
                    size="small"
                    onClick={onDelete}
                    sx={{ position: 'absolute', top: -5, right: -5, bgcolor: 'rgba(0,0,0,0.7)', '&:hover': { bgcolor: 'red' } }}
                >
                    <Delete fontSize="small" sx={{ color: 'white', fontSize: 16 }} />
                </IconButton>
            )}
        </Box>
    );
}

// Visual SongCard with Spotify Embedded Player
function VisualSongCard({ track, playing, onPlay, onDelete, readOnly, mode }: { track: any, playing: boolean, onPlay: () => void, onDelete: () => void, readOnly?: boolean, mode?: string }) {
    // Extract Spotify track ID from URL or use direct ID
    const getSpotifyTrackId = (track: any): string | null => {
        // Validation regex for Spotify ID (base62, typically 22 chars)
        const isValidId = (id: string) => /^[a-zA-Z0-9]{22}$/.test(id);

        if (track.id && isValidId(track.id)) return track.id;

        if (track.spotify_url) {
            const match = track.spotify_url.match(/track\/([a-zA-Z0-9]+)/);
            if (match && isValidId(match[1])) return match[1];
        }

        // Fallback: If ID exists but validation fails, return it anyway if it looks reasonable (not a URL)
        // This handles cases where ID format might vary slightly or be mocked "1" (for dev)
        if (track.id && !track.id.includes('http') && track.id.length < 50) return track.id;

        return null;
    };

    const trackId = getSpotifyTrackId(track);
    // Logic: If trackId looks like a real Spotify ID (approx 22 chars), use iframe.
    // Otherwise (or if mocked "1"), fallback to custom card.
    const useIframe = trackId && trackId.length > 5;
    const spotifyTheme = mode === 'dark' ? '0' : '1';

    return (
        <Card sx={{
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            borderRadius: 2,
            overflow: 'hidden',
            border: 1,
            borderColor: 'divider',
            transition: 'background-color 0.3s ease'
        }}>
            {/* Spotify Embedded Player */}
            {useIframe ? (
                <Box sx={{ p: 2, pb: 0 }}>
                    <iframe
                        key={`${trackId}-${mode}`}
                        style={{ borderRadius: '12px' }}
                        src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=${spotifyTheme}`}
                        width="100%"
                        height="152"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                    />
                </Box>
            ) : (
                // Fallback Layout for Invalid/Mock IDs
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        src={track.image}
                        variant="rounded"
                        sx={{ width: 60, height: 60 }}
                    >
                        <MusicNote />
                    </Avatar>
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                        <Typography variant="subtitle1" noWrap sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                            {track.name || 'Canción desconocida'}
                        </Typography>
                        <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                            {track.artist || 'Artista desconocido'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#ff6b6b', fontSize: '0.7rem', display: 'block', mt: 0.5 }}>
                            Vista previa no disponible
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Delete Button */}
            {!readOnly && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, pt: 1 }}>
                    <Button
                        onClick={onDelete}
                        size="small"
                        startIcon={<Delete />}
                        sx={{
                            color: '#ff4444',
                            textTransform: 'none',
                            fontSize: '0.875rem',
                            '&:hover': {
                                bgcolor: 'rgba(255,68,68,0.1)',
                                color: '#ff6666'
                            }
                        }}
                    >
                        Eliminar
                    </Button>
                </Box>
            )}
        </Card>
    );
}
