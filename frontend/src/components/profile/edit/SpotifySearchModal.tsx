import { useState, useEffect } from 'react';
import {
    Popover, DialogTitle, DialogContent, DialogActions,
    Button, TextField, List, ListItem, ListItemAvatar,
    ListItemText, Avatar, IconButton, Typography, Box,
    CircularProgress, InputAdornment
} from '@mui/material';
import { Search, Add, MusicNote, Person } from '@mui/icons-material';
import { spotifyService, SpotifyTrack, SpotifyArtist } from '../../../services/spotifyService';
import { useDebounce } from 'use-debounce';

interface SpotifySearchModalProps {
    open: boolean;
    onClose: () => void;
    type: 'track' | 'artist';
    onSelect: (item: SpotifyTrack | SpotifyArtist) => void;
    anchorEl: HTMLElement | null;
}

export default function SpotifySearchModal({ open, onClose, type, onSelect, anchorEl }: SpotifySearchModalProps) {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 500);
    const [results, setResults] = useState<(SpotifyTrack | SpotifyArtist)[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (debouncedQuery.length < 2) {
            setResults([]);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            console.log('SpotifySearchModal: fetching results for query:', debouncedQuery, 'type:', type);
            try {
                if (type === 'track') {
                    const tracks = await spotifyService.searchTracks(debouncedQuery);
                    console.log('SpotifySearchModal: received tracks:', tracks);
                    setResults(tracks);
                } else {
                    const artists = await spotifyService.searchArtists(debouncedQuery);
                    console.log('SpotifySearchModal: received artists:', artists);
                    setResults(artists);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery, type]);

    const handleClose = () => {
        setQuery('');
        setResults([]);
        onClose();
    };

    // Calculate width to match anchor if possible, or default
    const width = anchorEl ? anchorEl.clientWidth : 500;

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
            PaperProps={{
                sx: {
                    width: width,
                    maxHeight: 600,
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column'
                }
            }}
        >
            <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box display="flex" alignItems="center" gap={1}>
                    {type === 'track' ? <MusicNote color="primary" /> : <Person color="primary" />}
                    <Typography variant="h6">
                        {type === 'track' ? 'Buscar Canción' : 'Buscar Artista'}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ mt: 2, flex: 1, overflowY: 'auto' }}>
                <TextField
                    autoFocus
                    fullWidth
                    placeholder={type === 'track' ? "Escribe el nombre de la canción..." : "Escribe el nombre del artista..."}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: '#666' }} />
                            </InputAdornment>
                        ),
                        sx: {
                            bgcolor: 'action.hover',
                            color: 'text.primary',
                            borderRadius: 2,
                            '& fieldset': { borderColor: 'divider' }
                        }
                    }}
                />

                <Box mt={2}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={4}>
                            <CircularProgress color="primary" />
                        </Box>
                    ) : (
                        <List>
                            {results.map((item) => {
                                const isTrack = type === 'track';
                                const image = isTrack
                                    ? (item as SpotifyTrack).album.images[0]?.url
                                    : (item as SpotifyArtist).images[0]?.url;
                                const primaryText = item.name;
                                const secondaryText = isTrack
                                    ? (item as SpotifyTrack).artists.map(a => a.name).join(', ')
                                    : (item as SpotifyArtist).genres.slice(0, 2).join(', ');

                                return (
                                    <ListItem
                                        key={item.id}
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                onClick={() => {
                                                    onSelect(item);
                                                    handleClose();
                                                }}
                                                sx={{ color: 'primary.main' }}
                                            >
                                                <Add />
                                            </IconButton>
                                        }
                                        sx={{
                                            borderRadius: 2,
                                            '&:hover': { bgcolor: 'action.hover' },
                                            mb: 1
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar
                                                src={image}
                                                variant={type === 'track' ? "rounded" : "circular"}
                                                sx={{ width: 50, height: 50 }}
                                            >
                                                {type === 'track' ? <MusicNote /> : <Person />}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Typography color="text.primary" fontWeight="bold">{primaryText}</Typography>}
                                            secondary={<Typography color="text.secondary" variant="body2">{secondaryText}</Typography>}
                                        />
                                    </ListItem>
                                );
                            })}
                            {!loading && query.length >= 2 && results.length === 0 && (
                                <Typography color="text.secondary" align="center" mt={4}>
                                    No se encontraron resultados
                                </Typography>
                            )}
                        </List>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
                <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>
                    Cancelar
                </Button>
            </DialogActions>
        </Popover>
    );
}
