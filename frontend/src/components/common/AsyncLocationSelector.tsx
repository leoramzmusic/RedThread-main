import { useState, useEffect, useMemo, useRef } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import useDebounce from '../../hooks/useDebounce';
import apiClient from '../../services/api';

interface AsyncLocationSelectorProps {
    label: string;
    placeholder?: string;
    value: string[];
    onChange: (newValue: string[]) => void;
    placeType?: 'country' | 'state' | 'city';
    forceCountry?: string | null;
    maxItems?: number;
}

export default function AsyncLocationSelector({
    label,
    placeholder,
    value,
    onChange,
    placeType = 'city',
    forceCountry,
    maxItems
}: AsyncLocationSelectorProps) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const debouncedInputValue = useDebounce(inputValue, 500);
    const cache = useRef<Map<string, string[]>>(new Map());

    useEffect(() => {
        let active = true;

        if (debouncedInputValue.length < 2) {
            setOptions(value ? [...value] : []);
            return;
        }

        const fetchOptions = async () => {
            // Check cache
            const cacheKey = `${placeType}:${forceCountry || ''}:${debouncedInputValue}`;
            if (cache.current.has(cacheKey)) {
                if (active) {
                    setOptions(cache.current.get(cacheKey) || []);
                }
                return;
            }

            setLoading(true);

            try {
                const query = forceCountry && placeType === 'state'
                    ? `${debouncedInputValue}, ${forceCountry}`
                    : debouncedInputValue;

                const response = await apiClient.get(`/profiles/places/search`, {
                    params: {
                        q: query,
                        place_type: placeType
                    }
                });

                if (active) {
                    let newOptions = response.data;

                    // Filter by country ONLY if forceCountry is specifically provided
                    if (forceCountry && (placeType === 'state' || placeType === 'city')) {
                        newOptions = newOptions.filter((opt: string) =>
                            opt.toLowerCase().includes(forceCountry.toLowerCase())
                        );
                    }

                    // Add "Todos" virtual option if the user is searching for it
                    const searchLower = debouncedInputValue.toLowerCase();
                    const isSearchingAll = ['todos', 'todo', 'all', 'all states', 'todos los estados'].some(k => k.includes(searchLower) || searchLower.includes(k));

                    if (isSearchingAll && (placeType === 'state' || placeType === 'country')) {
                        if (!newOptions.includes('Todos')) {
                            newOptions = ['Todos', ...newOptions];
                        }
                    }

                    setOptions(newOptions);
                    cache.current.set(cacheKey, newOptions);
                }
            } catch (error) {
                console.error("Error fetching location options:", error);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        fetchOptions();

        return () => {
            active = false;
        };
    }, [debouncedInputValue, placeType, JSON.stringify(value)]);

    return (
        <Autocomplete
            multiple
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            isOptionEqualToValue={(option, value) => option === value}
            getOptionLabel={(option) => option}
            options={options}
            loading={loading}
            value={value}
            onChange={(_, newValue) => {
                // If "Todos" is selected, we allow it (it clears others in parent)
                // If it's a normal selection, respect maxItems
                if (maxItems && newValue.length > maxItems && !newValue.includes('Todos')) {
                    return; // Ignore if limit exceeded
                }
                onChange(newValue);
            }}
            onInputChange={(_, newInputValue) => {
                setInputValue(newInputValue);
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    placeholder={placeholder}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
            freeSolo={false}
            filterOptions={(x) => x} // Disable built-in filtering since backend filters
        />
    );
}
