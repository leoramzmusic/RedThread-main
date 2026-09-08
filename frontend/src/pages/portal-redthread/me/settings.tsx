import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Box,
    Container,
    Paper,
    Typography,
    Button,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Save as SaveIcon,
} from '@mui/icons-material';
import AdminLayout from '../../../components/layout/AdminLayout';
import { useAppTheme } from '../../../context/ThemeContext';
import AppearanceSection from '../../../components/settings/AppearanceSection';

export default function AdminSettingsPage() {
    const router = useRouter();
    const { section } = router.query;
    const activeSection = (section as string) || 'appearance';

    const { mode, setMode, setTheme } = useAppTheme();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);

    // Admin-specific settings (simplified for now)
    const [localSettings, setLocalSettings] = useState({
        theme_mode: mode,
        visual_theme: 'redThread',
        font_size: '14'
    });

    const handleSettingsChange = (field: string, value: any) => {
        setLocalSettings((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSave = async (settingsToSave?: any) => {
        setSaving(true);
        try {
            // Settings are auto-saved via ThemeContext when changed
            // This is just for UI feedback
            setShowSuccessAlert(true);
            setTimeout(() => setShowSuccessAlert(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const getSectionTitle = () => {
        const titles: Record<string, string> = {
            'appearance': 'Apariencia',
            'notifications': 'Notificaciones',
            'security': 'Seguridad',
            'accessibility': 'Accesibilidad',
            'privacy': 'Privacidad',
        };
        return titles[activeSection] || 'Configuración';
    };

    const renderSection = () => {
        if (loading) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            );
        }

        switch (activeSection) {
            case 'appearance':
                return (
                    <AppearanceSection
                        settings={localSettings}
                        onSettingsChange={handleSettingsChange}
                        onSave={handleSave}
                        mode={mode}
                        setMode={setMode as any}
                        setTheme={setTheme as any}
                    />
                );
            default:
                return (
                    <Box textAlign="center" py={8}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Sección en desarrollo
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Esta funcionalidad estará disponible próximamente
                        </Typography>
                    </Box>
                );
        }
    };

    return (
        <AdminLayout>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {showSuccessAlert && (
                    <Alert severity="success" onClose={() => setShowSuccessAlert(false)} sx={{ mb: 3 }}>
                        Configuración guardada correctamente
                    </Alert>
                )}

                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, md: 4 },
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        minHeight: 600,
                    }}
                >
                    {/* Section Title */}
                    <Typography variant="h4" fontWeight={700} gutterBottom mb={3}>
                        {getSectionTitle()}
                    </Typography>

                    {/* Dynamic Section Content */}
                    {renderSection()}

                    {/* Save Button */}
                    {!loading && ['appearance'].includes(activeSection) && (
                        <Box display="flex" justifyContent="flex-end" pt={4} mt={4} borderTop="1px solid" borderColor="divider">
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                size="large"
                            >
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </Box>
                    )}
                </Paper>
            </Container>
        </AdminLayout>
    );
}
