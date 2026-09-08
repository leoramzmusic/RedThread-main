import { useState, useEffect, useRef } from 'react';
import { TextField, Autocomplete, CircularProgress, InputAdornment } from '@mui/material';
import { Search } from '@mui/icons-material';
import { useDebounce } from 'use-debounce';

interface MusicEntity {
    id: string;
    name: string;
    image?: string;
    artist?: string; // For tracks
    owner?: string; // For playlists
}

interface MusicSearchInputProps {
    placeholder: string;
    apiEndpoint: string;
    onSelect: (item: MusicEntity | string) => void;
    initialValue?: string; // or MusicEntity
}

export default function MusicSearchInput({ placeholder, apiEndpoint, onSelect, initialValue }: MusicSearchInputProps) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<MusicEntity[]>([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState(initialValue || '');
    const [debouncedValue] = useDebounce(inputValue, 500);

    useEffect(() => {
        let active = true;

        if (debouncedValue === '') {
            setOptions(inputValue ? [] : []);
            return undefined;
        }

        if (debouncedValue.length < 2) return;

        setLoading(true);

        // MOCK API IMPLEMENTATION (Since backend endpoints don't exist yet)
        // In a real scenario, this would be: fetch(`${apiEndpoint}${debouncedValue}`)
        const mockSearch = async () => {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));

            if (!active) return;

            let mockResults: MusicEntity[] = [];

            if (apiEndpoint.includes('artist')) {
                mockResults = [
                    { id: '1', name: debouncedValue, image: '' },
                    { id: '2', name: `${debouncedValue} Band`, image: '' },
                    { id: '3', name: `The ${debouncedValue}s`, image: '' },
                ];
            } else if (apiEndpoint.includes('playlist')) {
                mockResults = [
                    { id: '1', name: `${debouncedValue} Mix`, owner: 'Spotify', image: '' },
                    { id: '2', name: `${debouncedValue} Essentials`, owner: 'Curators', image: '' },
                ];
            } else if (apiEndpoint.includes('track')) {
                mockResults = [
                    { id: '1', name: debouncedValue, artist: 'Unknown Artist', image: '' },
                    { id: '2', name: `${debouncedValue} Remix`, artist: 'DJ Cool', image: '' },
                ];
            }

            setOptions(mockResults);
            setLoading(false);
        };

        mockSearch();

        return () => {
            active = false;
        };
    }, [debouncedValue, apiEndpoint, inputValue]);

    return (
        <Autocomplete
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            isOptionEqualToValue={(option, value) => option.name === value.name}
            getOptionLabel={(option) => option.name}
            options={options}
            loading={loading}
            onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
            }}
            onChange={(event, newValue) => {
                if (newValue) {
                    onSelect(newValue);
                }
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    placeholder={placeholder}
                    fullWidth
                    InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: '#666' }} />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                        sx: {
                            bgcolor: '#1e1e1e',
                            color: '#fff',
                            borderRadius: 2,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#666' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
                            '& input': { color: '#fff' }
                        }
                    }}
                />
            )}
            renderOption={(props, option) => (
                <li {...props} style={{ backgroundColor: '#1e1e1e', color: '#fff' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 'bold' }}>{option.name}</span>
                        {option.artist && <span style={{ fontSize: '0.8em', color: '#aaa' }}>{option.artist}</span>}
                        {option.owner && <span style={{ fontSize: '0.8em', color: '#aaa' }}>By {option.owner}</span>}
                    </div>
                </li>
            )}
            PaperComponent={({ children }) => (
                <div style={{ backgroundColor: '#1e1e1e', borderRadius: '0 0 8px 8px', border: '1px solid #444' }}>
                    {children}
                </div>
            )}
        />
    );
}
