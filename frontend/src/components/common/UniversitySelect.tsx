import React, { useState, useEffect, useMemo } from 'react';
import { Autocomplete, TextField, CircularProgress, debounce } from '@mui/material';
import apiClient from '../../services/api';

interface UniversitySelectProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    error?: boolean;
    helperText?: string;
}

export default function UniversitySelect({
    value,
    onChange,
    label = "Centro de estudios",
    error,
    helperText
}: UniversitySelectProps) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');

    // Sync local input value if external value changes (e.g. from parent reset)
    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    const fetchUniversities = useMemo(
        () =>
            debounce(async (input: string, callback: (results: string[]) => void) => {
                if (input.length < 3) {
                    callback([]);
                    return;
                }

                try {
                    // Use backend proxy to avoid Mixed Content / CORS issues
                    const response = await apiClient.get(`/profiles/universities/search?name=${encodeURIComponent(input)}`);
                    const data = response.data;
                    const names = data.map((u: any) => u.name);
                    // Filter duplicates
                    callback([...new Set(names)] as string[]);
                } catch (error) {
                    console.error('Error fetching universities:', error);
                    callback([]);
                }
            }, 400),
        []
    );

    useEffect(() => {
        let active = true;

        if (inputValue === '') {
            setOptions([]);
            return undefined;
        }

        setLoading(true);

        fetchUniversities(inputValue, (results) => {
            if (active) {
                setOptions(results);
                setLoading(false);
            }
        });

        return () => {
            active = false;
        };
    }, [inputValue, fetchUniversities]);

    return (
        <Autocomplete
            freeSolo
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            isOptionEqualToValue={(option, value) => option === value}
            getOptionLabel={(option) => option}
            options={options}
            loading={loading}
            value={value}
            inputValue={inputValue}
            onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
                // If the user types manually, passing that up immediately allows "manual entry"
                // onChange(newInputValue); 
                // However, standard Autocomplete behavior usually waits for selection or blur for strict forms, 
                // but for freeSolo sync on type is often desired or handled via onChange of the combo.
                // Let's rely on the onChange prop of Autocomplete for selection, and basic typing updates parent too if desired.
                // Actually, for freeSolo, onChange is called when an option is picked or enter pressed.
                // But we also want to update parent when typing custom text.
                if (event && event.type === 'change') {
                    onChange(newInputValue);
                }
            }}
            onChange={(event, newValue) => {
                // newValue can be null or string
                onChange(newValue || '');
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    fullWidth
                    error={error}
                    helperText={helperText || "Escribe para buscar o ingresar manualmente"}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <React.Fragment>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </React.Fragment>
                        ),
                    }}
                />
            )}
        />
    );
}
