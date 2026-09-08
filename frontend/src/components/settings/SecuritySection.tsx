import { useState } from 'react';
import apiClient from '@/services/api';
import {
    Box,
    Typography,
    FormControlLabel,
    Switch,
    Stack,
    Divider,
    FormControl,
    FormLabel,
    RadioGroup,
    Radio,
    Paper,
    Chip,
    Button,
    Alert,
    Select,
    MenuItem,
    Checkbox,
    TextField,
    InputAdornment,
    IconButton,
} from '@mui/material';
import {
    Email as EmailIcon,
    Sms as SmsIcon,
    PhoneAndroid as AuthenticatorIcon,
    CheckCircle as CheckCircleIcon,
    PauseCircle as SuspendIcon,
    DeleteForever as DeleteIcon,
    Warning as WarningIcon,
    HeadsetMic as SupportIcon,
    LockReset as PasswordIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Lock as LockIcon,
    Smartphone as SmartphoneIcon,
} from '@mui/icons-material';
import { useTranslation } from 'next-i18next';

interface SecuritySectionProps {
    settings: any;
    onSettingsChange: (field: string, value: any) => void;
    onSuspend: (period: string) => Promise<void>;
    onDelete: (reason: string) => Promise<void>;
    saving: boolean;
}

export default function SecuritySection({
    settings,
    onSettingsChange,
    onSuspend,
    onDelete,
    saving
}: SecuritySectionProps) {
    const { t } = useTranslation('common');
    const twoFactorEnabled = settings?.two_factor_enabled ?? false;
    const twoFactorMethod = settings?.two_factor_method || 'email';

    // State for suspension and deletion
    const [suspensionPeriod, setSuspensionPeriod] = useState('1w');
    const [deleteAccepted, setDeleteAccepted] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [showDeleteForm, setShowDeleteForm] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');

    // State for password change
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordStatus, setPasswordStatus] = useState<{
        type: 'success' | 'error' | null;
        message: string;
    }>({ type: null, message: '' });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // State for password visibility
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordStatus({ type: null, message: '' });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordStatus({
                type: 'error',
                message: t('settings_security_password_error_mismatch')
            });
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordStatus({
                type: 'error',
                message: t('settings_security_password_error_complexity')
            });
            return;
        }

        setIsChangingPassword(true);
        try {
            await apiClient.post('/auth/change-password', {
                new_password: passwordData.newPassword
            });

            setPasswordStatus({
                type: 'success',
                message: t('settings_security_password_success')
            });

            // Clear form
            setPasswordData({
                newPassword: '',
                confirmPassword: ''
            });

            // Optionally close form after delay
            setTimeout(() => setShowPasswordForm(false), 3000);

        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || t('settings_security_password_error_invalid');
            setPasswordStatus({
                type: 'error',
                message: errorMessage
            });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleSuspend = async () => {
        if (window.confirm(t('common.confirm'))) {
            await onSuspend(suspensionPeriod);
        }
    };

    const handleDelete = async () => {
        const finalReason = selectedReason === 'other' ? customReason : selectedReason;
        if (deleteAccepted && window.confirm(t('common.confirmDeleteMessage'))) {
            await onDelete(finalReason);
        }
    };

    const toggleDeleteForm = () => setShowDeleteForm(!showDeleteForm);

    const cardStyle = {
        p: 3,
        borderRadius: 2,
        bgcolor: '#1e1e1e',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        transition: 'all 0.3s ease',
        '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }
    };

    const sectionTitleStyle = {
        fontWeight: 600,
        fontSize: 'clamp(16px, 1.8vw, 20px)',
        color: '#fff'
    };

    const sectionDescStyle = {
        variant: 'caption',
        color: 'text.secondary',
        display: 'block',
        mb: 2
    };

    const primaryButtonStyle = {
        bgcolor: '#e91e63',
        '&:hover': { bgcolor: '#d81b60' },
        borderRadius: '8px',
        textTransform: 'none',
        fontWeight: 'bold',
        px: 3,
        border: 'none',
        color: 'white',
        transition: 'background 0.2s ease',
    };

    const dangerSolidStyle = {
        ...primaryButtonStyle,
        fontWeight: 'bold',
        py: 1.5
    };

    return (
        <Stack spacing={3}>
            {/* 2FA Section */}
            <Paper sx={cardStyle}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <SmartphoneIcon sx={{ color: 'text.secondary' }} />
                        <Box>
                            <Typography sx={sectionTitleStyle}>
                                {t('settings_security_2fa_title')}
                            </Typography>
                            <Typography sx={sectionDescStyle}>
                                {t('settings_security_2fa_desc')}
                            </Typography>
                        </Box>
                    </Box>
                    <Switch
                        checked={twoFactorEnabled}
                        onChange={(e) => onSettingsChange('two_factor_enabled', e.target.checked)}
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#e91e63',
                                '& + .MuiSwitch-track': {
                                    backgroundColor: '#e91e63',
                                },
                            },
                        }}
                    />
                </Box>

                {twoFactorEnabled && (
                    <Box mt={3} pt={3} borderTop="1px solid rgba(255,255,255,0.05)">
                        <FormControl component="fieldset" fullWidth>
                            <FormLabel component="legend" sx={{ mb: 2, color: 'text.secondary', fontSize: '0.85rem' }}>
                                {t('settings_security_2fa_method')}
                            </FormLabel>
                            <RadioGroup
                                value={twoFactorMethod}
                                onChange={(e) => onSettingsChange('two_factor_method', e.target.value)}
                            >
                                <Stack spacing={1}>
                                    {[
                                        { value: 'email', icon: <EmailIcon />, label: t('settings_security_2fa_email'), desc: t('settings_security_2fa_email_desc') },
                                        { value: 'sms', icon: <SmsIcon />, label: t('settings_security_2fa_sms'), desc: t('settings_security_2fa_sms_desc') },
                                        { value: 'authenticator', icon: <AuthenticatorIcon />, label: t('settings_security_2fa_authenticator'), desc: t('settings_security_2fa_authenticator_desc') }
                                    ].map((method) => (
                                        <FormControlLabel
                                            key={method.value}
                                            value={method.value}
                                            control={<Radio sx={{ color: 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: '#e91e63' } }} />}
                                            sx={{
                                                m: 0,
                                                p: 1.5,
                                                borderRadius: '12px',
                                                border: '1px solid transparent',
                                                bgcolor: twoFactorMethod === method.value ? 'rgba(233, 30, 99, 0.05)' : 'transparent',
                                                borderColor: twoFactorMethod === method.value ? 'rgba(233, 30, 99, 0.2)' : 'transparent',
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }
                                            }}
                                            label={
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Box sx={{ color: twoFactorMethod === method.value ? 'text.primary' : 'text.secondary' }}>
                                                        {method.icon}
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {method.label}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {method.desc}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            }
                                        />
                                    ))}
                                </Stack>
                            </RadioGroup>
                        </FormControl>

                        {twoFactorMethod === 'authenticator' && (
                            <Alert
                                severity="info"
                                sx={{
                                    mt: 2,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(233, 30, 99, 0.05)',
                                    color: '#fff',
                                    border: '1px solid rgba(233, 30, 99, 0.1)',
                                    '& .MuiAlert-icon': { color: 'text.secondary' }
                                }}
                            >
                                <Typography variant="caption">
                                    📱 {t('settings_security_2fa_upcoming')}
                                </Typography>
                            </Alert>
                        )}
                    </Box>
                )}
            </Paper>
            <Divider />

            {/* Change Password Section */}
            <Paper sx={cardStyle}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={showPasswordForm ? 2 : 0}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <LockIcon sx={{ color: 'text.secondary' }} />
                        <Box>
                            <Typography sx={sectionTitleStyle}>
                                {t('settings_security_password_title')}
                            </Typography>
                            <Typography sx={sectionDescStyle}>
                                {t('settings_security_password_desc')}
                            </Typography>
                        </Box>
                    </Box>
                    {!showPasswordForm && (
                        <Button
                            variant="outlined"
                            onClick={() => setShowPasswordForm(true)}
                            sx={{ ...primaryButtonStyle, bgcolor: 'transparent', border: '1px solid #e91e63', color: '#e91e63', '&:hover': { bgcolor: 'rgba(233, 30, 99, 0.05)', borderColor: '#e91e63' } }}
                        >
                            {t('settings_security_password_submit')}
                        </Button>
                    )}
                </Box>

                {showPasswordForm && (
                    <Box component="form" onSubmit={handlePasswordChange} mt={3} pt={3} borderTop="1px solid rgba(255,255,255,0.05)">
                        <Stack spacing={2.5}>
                            {passwordStatus.type && (
                                <Alert
                                    severity={passwordStatus.type}
                                    sx={{
                                        borderRadius: 2,
                                        bgcolor: passwordStatus.type === 'success' ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)',
                                        color: '#fff',
                                        border: `1px solid ${passwordStatus.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'}`,
                                        '& .MuiAlert-icon': { color: passwordStatus.type === 'success' ? '#4caf50' : '#f44336' }
                                    }}
                                >
                                    {passwordStatus.message}
                                </Alert>
                            )}

                            <TextField
                                fullWidth
                                label={t('settings_security_password_new')}
                                type={showNewPassword ? 'text' : 'password'}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                                size="small"
                                helperText={t('settings_security_password_error_complexity')}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                edge="end"
                                                size="small"
                                                sx={{ color: 'rgba(255,255,255,0.5)' }}
                                            >
                                                {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.02)' } }}
                            />

                            <TextField
                                fullWidth
                                label={t('settings_security_password_confirm')}
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                required
                                size="small"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                edge="end"
                                                size="small"
                                                sx={{ color: 'rgba(255,255,255,0.5)' }}
                                            >
                                                {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.02)' } }}
                            />

                            <Box display="flex" gap={2} pt={1}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={isChangingPassword}
                                    sx={primaryButtonStyle}
                                >
                                    {isChangingPassword ? t('common.loading') : t('settings_security_password_submit')}
                                </Button>
                                <Button
                                    variant="text"
                                    onClick={() => {
                                        setShowPasswordForm(false);
                                        setPasswordStatus({ type: null, message: '' });
                                    }}
                                    disabled={isChangingPassword}
                                    sx={{ color: 'text.secondary', textTransform: 'none' }}
                                >
                                    {t('common.cancel')}
                                </Button>
                            </Box>
                        </Stack>
                    </Box>
                )}
            </Paper>

            <Divider />

            {/* Account Suspension */}
            <Paper sx={cardStyle}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <SuspendIcon sx={{ color: 'text.secondary' }} />
                        <Box>
                            <Typography sx={sectionTitleStyle}>
                                {t('settings_security_suspend_title')}
                            </Typography>
                            <Typography sx={sectionDescStyle}>
                                {t('settings_security_suspend_desc')}
                            </Typography>
                        </Box>
                    </Box>
                    <Button
                        variant="contained"
                        onClick={handleSuspend}
                        disabled={saving}
                        sx={{ ...primaryButtonStyle, bgcolor: 'rgba(233, 30, 99, 0.1)', color: '#e91e63', '&:hover': { bgcolor: 'rgba(233, 30, 99, 0.2)' } }}
                    >
                        {t('settings_security_suspend_submit')}
                    </Button>
                </Box>

                <Box mt={3} pt={3} borderTop="1px solid rgba(255,255,255,0.05)">
                    <FormControl fullWidth>
                        <FormLabel sx={{ mb: 1, color: 'text.secondary', fontSize: '0.85rem' }}>
                            {t('settings_security_suspend_label')}
                        </FormLabel>
                        <Select
                            value={suspensionPeriod}
                            onChange={(e) => setSuspensionPeriod(e.target.value)}
                            size="small"
                            sx={{
                                maxWidth: 300,
                                bgcolor: 'rgba(255,255,255,0.02)',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }
                            }}
                        >
                            <MenuItem value="1d">{t('settings_security_suspend_1d')}</MenuItem>
                            <MenuItem value="1w">{t('settings_security_suspend_1w')}</MenuItem>
                            <MenuItem value="1m">{t('settings_security_suspend_1m')}</MenuItem>
                            <MenuItem value="forever">{t('settings_security_suspend_forever')}</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            <Divider />

            {/* Account Deletion */}
            <Paper
                sx={{
                    ...cardStyle,
                    border: '1px solid rgba(244, 67, 54, 0.2)',
                    bgcolor: 'rgba(244, 67, 54, 0.05)',
                    '&:hover': {
                        borderColor: 'rgba(244, 67, 54, 0.4)',
                        boxShadow: '0 4px 20px rgba(244, 67, 54, 0.1)'
                    }
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <DeleteIcon sx={{ color: 'text.secondary' }} />
                        <Box>
                            <Typography sx={{ ...sectionTitleStyle, color: 'text.primary' }}>
                                {t('settings_security_delete_title')}
                            </Typography>
                            <Typography sx={sectionDescStyle}>
                                {t('settings_security_delete_desc')}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {!showDeleteForm ? (
                    <Button
                        variant="contained"
                        onClick={toggleDeleteForm}
                        sx={dangerSolidStyle}
                    >
                        {t('settings_security_delete_submit')}
                    </Button>
                ) : (
                    <Box
                        sx={{
                            mt: 2,
                            p: 3,
                            borderRadius: 2,
                            bgcolor: '#2a2a2a',
                            border: '1px solid rgba(255,255,255,0.05)',
                            animation: 'slideDown 0.3s ease'
                        }}
                    >
                        <Stack spacing={2.5}>
                            <Alert
                                severity="warning"
                                sx={{
                                    borderRadius: 2,
                                    bgcolor: 'rgba(244, 67, 54, 0.05)',
                                    color: '#fff',
                                    border: '1px solid rgba(244, 67, 54, 0.1)',
                                    '& .MuiAlert-icon': { color: '#f44336' }
                                }}
                            >
                                <Typography variant="body2">
                                    {t('settings_security_delete_alert_message', '⚠️ Nos duele verte partir. ¿Podemos ayudarte antes de que tomes esta decisión?')}
                                </Typography>
                            </Alert>

                            <Box>
                                <Button
                                    variant="text"
                                    size="small"
                                    startIcon={<SupportIcon />}
                                    sx={{ color: '#3B82F6', textTransform: 'none', fontSize: '0.85rem', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.05)' } }}
                                >
                                    {t('settings_security_delete_talkToUs_button')}
                                </Button>
                            </Box>

                            <FormControl fullWidth>
                                <FormLabel sx={{ mb: 1, color: 'text.secondary', fontSize: '0.85rem' }}>
                                    {t('settings_security_delete_reason_label', '¿Por qué deseas eliminar tu cuenta?')}
                                </FormLabel>
                                <Select
                                    value={selectedReason}
                                    onChange={(e) => setSelectedReason(e.target.value)}
                                    size="small"
                                    displayEmpty
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.02)',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }
                                    }}
                                >
                                    <MenuItem value="" disabled>{t('settings_security_delete_reason_placeholder', 'Selecciona una razón')}</MenuItem>
                                    <MenuItem value="privacy">{t('settings_security_delete_reason_privacy', 'Preocupaciones de privacidad')}</MenuItem>
                                    <MenuItem value="usability">{t('settings_security_delete_reason_usability', 'No entiendo cómo usar la plataforma')}</MenuItem>
                                    <MenuItem value="content">{t('settings_security_delete_reason_content', 'No encuentro contenido relevante')}</MenuItem>
                                    <MenuItem value="other">{t('settings_security_delete_reason_other', 'Otra razón')}</MenuItem>
                                </Select>
                            </FormControl>

                            {selectedReason === 'other' && (
                                <TextField
                                    multiline
                                    rows={3}
                                    placeholder={t('settings_security_delete_reasonPlaceholder')}
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255,255,255,0.02)',
                                            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                                        }
                                    }}
                                />
                            )}

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={deleteAccepted}
                                        onChange={(e) => setDeleteAccepted(e.target.checked)}
                                        sx={{
                                            color: 'rgba(244, 67, 54, 0.3)',
                                            '&.Mui-checked': { color: '#f44336' }
                                        }}
                                    />
                                }
                                label={
                                    <Typography variant="caption" color="text.secondary">
                                        {t('settings_security_delete_checkbox')}
                                    </Typography>
                                }
                            />

                            <Box display="flex" gap={2}>
                                <Button
                                    variant="contained"
                                    onClick={handleDelete}
                                    disabled={!deleteAccepted || !selectedReason || saving}
                                    sx={dangerSolidStyle}
                                >
                                    {t('settings_security_delete_final_submit', 'Sí, estoy completamente seguro')}
                                </Button>
                                <Button
                                    variant="text"
                                    onClick={toggleDeleteForm}
                                    sx={{ color: 'text.secondary', textTransform: 'none' }}
                                >
                                    {t('common.cancel')}
                                </Button>
                            </Box>
                        </Stack>
                    </Box>
                )}
            </Paper>
        </Stack>
    );
}
