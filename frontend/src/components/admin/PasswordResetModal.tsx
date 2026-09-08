import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    InputAdornment,
    IconButton,
    Chip,
    Stack,
    Divider,
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Lock as LockIcon,
    LockReset as LockResetIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    VpnKey as KeyIcon,
    Undo as UndoIcon,
} from '@mui/icons-material';

interface PasswordResetModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (password: string) => Promise<void>;
    submitting: boolean;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
    open,
    onClose,
    onConfirm,
    submitting,
}) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const rules = [
        { label: '8-15 caracteres', test: (p: string) => p.length >= 8 && p.length <= 15 },
        { label: 'Minúscula', test: (p: string) => /[a-z]/.test(p) },
        { label: 'Mayúscula', test: (p: string) => /[A-Z]/.test(p) },
        { label: 'Número', test: (p: string) => /\d/.test(p) },
        { label: 'Especial (.#$\\)', test: (p: string) => /[.#$\\]/.test(p) },
        { label: 'Coinciden', test: (p: string) => p === confirmPassword && p !== '' && confirmPassword !== '' },
    ];

    const isValid = rules.every(rule => rule.test(password));

    useEffect(() => {
        if (!open) {
            setPassword('');
            setConfirmPassword('');
            setShowPassword(false);
            setShowConfirm(false);
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) {
            await onConfirm(password);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={submitting ? undefined : onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    p: 2,
                    bgcolor: 'background.paper',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.05)'
                }
            }}
        >
            <Box textAlign="center" mb={2} mt={1}>
                <Box
                    sx={{
                        display: 'inline-flex',
                        p: 1.5,
                        bgcolor: 'grey.100',
                        color: 'grey.700',
                        borderRadius: '50%',
                        mb: 2
                    }}
                >
                    <LockResetIcon fontSize="large" />
                </Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Restablecer Contraseña
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Ingresa una nueva contraseña segura para el empleado.
                </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ px: 2, py: 1 }}>
                    <Stack spacing={3}>
                        <TextField
                            fullWidth
                            label="Nueva contraseña"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <KeyIcon color="action" fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Confirmar contraseña"
                            type={showConfirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="action" fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small">
                                            {showConfirm ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box>
                            <Box display="flex" flexWrap="wrap" gap={1} justifyContent="center">
                                {rules.map((rule, index) => {
                                    const met = rule.test(password);
                                    return (
                                        <Chip
                                            key={index}
                                            label={rule.label}
                                            size="small"
                                            icon={met ? <CheckCircleIcon /> : undefined}
                                            color={met ? 'success' : 'default'}
                                            variant={met ? 'filled' : 'outlined'}
                                            sx={{
                                                fontSize: '0.75rem',
                                                height: 24,
                                                opacity: met ? 1 : 0.7,
                                                transition: 'all 0.2s',
                                                fontWeight: met ? 'bold' : 'normal',
                                                borderColor: met ? 'transparent' : 'rgba(0,0,0,0.12)'
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        </Box>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ flexDirection: 'column', gap: 1.5, px: 3, pb: 3, pt: 2 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={!isValid || submitting}
                        startIcon={<LockIcon />}
                        sx={{
                            borderRadius: 50,
                            py: 1.2,
                            textTransform: 'none',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                        }}
                    >
                        Guardar Contraseña
                    </Button>
                    <Button
                        onClick={onClose}
                        disabled={submitting}
                        color="inherit"
                        startIcon={<UndoIcon />}
                        sx={{
                            textTransform: 'none',
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'transparent', color: 'text.primary' }
                        }}
                    >
                        Cancelar operación
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default PasswordResetModal;
