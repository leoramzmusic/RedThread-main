import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Button,
    Tabs,
    Tab,
    Card,
    CardContent,
    IconButton,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AdminLayout from '../../../components/layout/AdminLayout';
import appearanceService from '../../../services/appearanceService';
import { AppearanceResource, AppearanceType, Platform } from '../../../types/appearance';
import { getMediaUrl } from '../../../utils/media';
import { BRAND_LOGO_KIT, DEFAULT_LOGO_BY_VARIANT, BrandLogoVariant } from '../../../config/brandAssets';

export default function LogosPage() {
    const [tabIndex, setTabIndex] = useState(0); // 0: Principal, 1: Dark Mode, 2: Mobile
    const [resources, setResources] = useState<AppearanceResource[]>([]);
    const [loading, setLoading] = useState(false);
    const [openUpload, setOpenUpload] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const data = await appearanceService.getResources(AppearanceType.LOGO);
            setResources(data);
        } catch (error) {
            console.error("Error fetching logos:", error);
        } finally {
            setLoading(false);
        }
    };

    const getVariantFromTab = (tab: number): BrandLogoVariant => {
        if (tab === 1) return 'dark';
        if (tab === 2) return 'mobile';
        return 'main';
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        try {
            const url = await appearanceService.uploadFile(selectedFile, AppearanceType.LOGO);
            await appearanceService.createResource({
                type: AppearanceType.LOGO,
                platform: Platform.ALL, // Logos are usually cross-platform or handled via CSS media queries
                url: url,
                metadata: { variant: getVariantFromTab(tabIndex) },
                is_active: true
            });
            setOpenUpload(false);
            setSelectedFile(null);
            fetchResources();
        } catch (error) {
            console.error(error);
            alert("Error uploading logo");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar logo?')) {
            await appearanceService.deleteResource(id);
            fetchResources();
        }
    };

    const filteredResources = resources.filter(r => r.metadata?.variant === getVariantFromTab(tabIndex));

    return (
        <AdminLayout>
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" fontWeight={700}>Logos</Typography>
                        <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={() => setOpenUpload(true)}>
                            Subir Logo
                        </Button>
                    </Box>

                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                        Kit de marca
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Archivos del kit en img/assets, listos para Principal, Dark Mode y Mobile.
                    </Typography>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {BRAND_LOGO_KIT.map((asset) => (
                            <Grid item xs={12} sm={6} md={4} key={asset.id}>
                                <Card sx={{ bgcolor: asset.variant === 'dark' ? '#1A1B1E' : '#fff' }}>
                                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', height: 200, alignItems: 'center' }}>
                                        <img src={asset.src} alt={asset.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    </Box>
                                    <CardContent>
                                        <Typography variant="subtitle2">{asset.title}</Typography>
                                        <Typography variant="caption" color={asset.variant === 'dark' ? 'grey.400' : 'text.secondary'} display="block">
                                            {asset.description}
                                        </Typography>
                                        <Typography variant="caption" color="primary.main">
                                            {asset.variant === 'main' ? 'Principal' : asset.variant === 'dark' ? 'Dark Mode' : 'Mobile'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    <Paper sx={{ width: '100%', mb: 2 }}>
                        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} centered>
                            <Tab label="Principal (Light)" />
                            <Tab label="Dark Mode" />
                            <Tab label="Mobile (Compact)" />
                        </Tabs>
                    </Paper>

                    {loading ? <CircularProgress /> : (
                        <Grid container spacing={3}>
                            {filteredResources.length === 0 && (
                                <Grid item xs={12} sm={6} md={4}>
                                    <Card sx={{ bgcolor: tabIndex === 1 ? '#1A1B1E' : '#fff' }}>
                                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', height: 200, alignItems: 'center' }}>
                                            <img
                                                src={DEFAULT_LOGO_BY_VARIANT[getVariantFromTab(tabIndex)]}
                                                alt="Logo por defecto"
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                            />
                                        </Box>
                                        <CardContent>
                                            <Typography variant="caption" color={tabIndex === 1 ? 'grey.400' : 'text.secondary'}>
                                                Por defecto (kit de marca)
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}
                            {filteredResources.map((r) => (
                                <Grid item xs={12} sm={6} md={4} key={r._id}>
                                    <Card sx={{ bgcolor: tabIndex === 1 ? '#333' : '#fff' }}>
                                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', height: 200, alignItems: 'center' }}>
                                            <img src={getMediaUrl(r.url)} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                                        </Box>
                                        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="caption" color={tabIndex === 1 ? 'grey.400' : 'text.secondary'}>
                                                {r.is_active ? "Activo" : "Inactivo"}
                                            </Typography>
                                            <IconButton size="small" color="error" onClick={() => r._id && handleDelete(r._id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    <Dialog open={openUpload} onClose={() => setOpenUpload(false)}>
                        <DialogTitle>Subir Logo ({getVariantFromTab(tabIndex)})</DialogTitle>
                        <DialogContent>
                            <Box sx={{ mt: 2 }}>
                                <Button variant="outlined" component="label">
                                    Seleccionar Archivo
                                    <input type="file" hidden accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                                </Button>
                                {selectedFile && <Typography sx={{ mt: 1 }}>{selectedFile.name}</Typography>}
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpenUpload(false)}>Cancelar</Button>
                            <Button onClick={handleUpload} variant="contained" disabled={!selectedFile || uploading}>
                                {uploading ? <CircularProgress size={20} /> : 'Subir'}
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            </Container>
        </AdminLayout>
    );
}
