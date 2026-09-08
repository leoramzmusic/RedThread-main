import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Button,
    Paper,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AdminLayout from '../../../components/layout/AdminLayout';
import appearanceService from '../../../services/appearanceService';
import { AppearanceResource, AppearanceType, Platform } from '../../../types/appearance';

export default function TemasPage() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [themeId, setThemeId] = useState<string | null>(null);

    // Theme State
    const [primaryColor, setPrimaryColor] = useState('#FF4D4F');
    const [secondaryColor, setSecondaryColor] = useState('#4ECDC4');
    const [fontFamily, setFontFamily] = useState('Roboto');
    const [borderRadius, setBorderRadius] = useState('8px');

    useEffect(() => {
        fetchTheme();
    }, []);

    const fetchTheme = async () => {
        setLoading(true);
        try {
            const data = await appearanceService.getResources(AppearanceType.THEME);
            const activeTheme = data.find((r: AppearanceResource) => r.is_active);
            if (activeTheme && activeTheme.metadata) {
                setThemeId(activeTheme._id || null);
                setPrimaryColor(activeTheme.metadata.primaryColor || '#FF4D4F');
                setSecondaryColor(activeTheme.metadata.secondaryColor || '#4ECDC4');
                setFontFamily(activeTheme.metadata.fontFamily || 'Roboto');
                setBorderRadius(activeTheme.metadata.borderRadius || '8px');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const metadata = { primaryColor, secondaryColor, fontFamily, borderRadius };

            if (themeId) {
                // Update existing
                // Note: Update not fully implemented in service helper for generic update but logic is in backend
                // We'll just create a new one for now or assume update.
                // Let's rely on createResource's auto-deactivate logic for simplicity, creating a NEW revision of theme.
                await appearanceService.createResource({
                    type: AppearanceType.THEME,
                    platform: Platform.ALL,
                    url: 'theme_config', // Dummy URL
                    metadata: metadata,
                    is_active: true
                });
            } else {
                await appearanceService.createResource({
                    type: AppearanceType.THEME,
                    platform: Platform.ALL,
                    url: 'theme_config',
                    metadata: metadata,
                    is_active: true
                });
            }
            alert('Tema guardado correctamente');
            fetchTheme();
        } catch (error) {
            console.error(error);
            alert('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout>
            <Container maxWidth="md">
                <Box sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h4" fontWeight={700}>Configuración de Tema</Typography>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </Box>

                    {loading ? <CircularProgress /> : (
                        <Paper sx={{ p: 4 }}>
                            <Typography variant="h6" gutterBottom>Paleta de Colores</Typography>
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Color Primario"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        InputProps={{
                                            endAdornment: <Box sx={{ width: 24, height: 24, bgcolor: primaryColor, border: '1px solid #ddd', borderRadius: 1 }} />
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Color Secundario"
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
                                        InputProps={{
                                            endAdornment: <Box sx={{ width: 24, height: 24, bgcolor: secondaryColor, border: '1px solid #ddd', borderRadius: 1 }} />
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 4 }} />

                            <Typography variant="h6" gutterBottom>Tipografía y Estilos</Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Fuente Principal</InputLabel>
                                        <Select
                                            value={fontFamily}
                                            label="Fuente Principal"
                                            onChange={(e) => setFontFamily(e.target.value)}
                                        >
                                            <MenuItem value="Roboto">Roboto</MenuItem>
                                            <MenuItem value="Inter">Inter</MenuItem>
                                            <MenuItem value="Open Sans">Open Sans</MenuItem>
                                            <MenuItem value="Lato">Lato</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Bordes (Border Radius)</InputLabel>
                                        <Select
                                            value={borderRadius}
                                            label="Bordes (Border Radius)"
                                            onChange={(e) => setBorderRadius(e.target.value)}
                                        >
                                            <MenuItem value="0px">Cuadrado (0px)</MenuItem>
                                            <MenuItem value="4px">Sutil (4px)</MenuItem>
                                            <MenuItem value="8px">Estándar (8px)</MenuItem>
                                            <MenuItem value="16px">Redondeado (16px)</MenuItem>
                                            <MenuItem value="24px">Muy Redondeado (24px)</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 4, p: 3, bgcolor: '#f5f5f5', borderRadius: borderRadius }}>
                                <Typography variant="subtitle1" sx={{ fontFamily }} gutterBottom>Vista Previa</Typography>
                                <Button variant="contained" sx={{ bgcolor: primaryColor, fontFamily, borderRadius, mr: 2 }}>Botón Primario</Button>
                                <Button variant="outlined" sx={{ color: secondaryColor, borderColor: secondaryColor, fontFamily, borderRadius }}>Botón Secundario</Button>
                            </Box>

                        </Paper>
                    )}
                </Box>
            </Container>
        </AdminLayout>
    );
}
