import React, { useState, useEffect } from 'react';
import {
    TextField,
    Box,
    Typography,
    CircularProgress,
    Chip,
    InputAdornment
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import useDebounce from '@/hooks/useDebounce';
import apiClient from '@/services/api';

interface UsernameEditorProps {
    currentUsername: string;
    onUsernameChange: (username: string) => void;
}

export const UsernameEditor: React.FC<UsernameEditorProps> = ({
    currentUsername,
    onUsernameChange,
}) => {
    const { t } = useTranslation('common');
    const [username, setUsername] = useState(currentUsername);
    const [checking, setChecking] = useState(false);
    const [available, setAvailable] = useState<boolean | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const debouncedUsername = useDebounce(username, 500);

    useEffect(() => {
        const checkUsername = async () => {
            if (debouncedUsername === currentUsername) {
                setAvailable(true);
                setSuggestions([]);
                return;
            }

            if (debouncedUsername.length < 3) {
                setAvailable(null);
                setSuggestions([]);
                return;
            }

            setChecking(true);
            try {
                const response = await apiClient.get(`/auth/check-username?username=${debouncedUsername}`);
                setAvailable(response.data.available);
                setSuggestions(response.data.suggestions || []);

                if (response.data.available) {
                    onUsernameChange(debouncedUsername);
                }
            } catch (err) {
                console.error('Error checking username:', err);
                setAvailable(null);
            } finally {
                setChecking(false);
            }
        };

        checkUsername();
    }, [debouncedUsername, currentUsername, onUsernameChange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Unicode support: letters, numbers, underscores, dots
        if (value && !/^[\w\u0080-\uFFFF._]*$/.test(value)) return;
        if (value.length > 30) return;
        setUsername(value);
    };

    return (
        <Box sx={{ mb: 3 }}>
            <TextField
                fullWidth
                label={t('profile.username')}
                value={username}
                onChange={handleChange}
                InputProps={{
                    sx: { borderRadius: 2 },
                    endAdornment: (
                        <InputAdornment position="end">
                            {checking ? (
                                <CircularProgress size={20} />
                            ) : available === true ? (
                                <CheckCircle color="success" />
                            ) : available === false ? (
                                <Cancel color="error" />
                            ) : null}
                        </InputAdornment>
                    ),
                }}
                helperText={
                    available === false
                        ? t('auth.usernameTaken')
                        : available === true && username !== currentUsername
                            ? t('auth.usernameAvailable')
                            : t('profile.usernameHelp')
                }
                error={available === false}
            />

            {/* Suggestions */}
            {available === false && suggestions.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {t('auth.usernameSuggestions')}:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {suggestions.map((suggestion) => (
                            <Chip
                                key={suggestion}
                                label={suggestion}
                                size="small"
                                onClick={() => setUsername(suggestion)}
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'primary.light',
                                    }
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
};
