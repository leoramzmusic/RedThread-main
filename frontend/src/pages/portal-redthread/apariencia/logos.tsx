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
    CardMedia,
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

    const getVariantFromTab = (tab: number) => {
        if (tab === 0) return 'main';
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

                    <Paper sx={{ width: '100%', mb: 2 }}>
                        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} centered>
                            <Tab label="Principal (Light)" />
                            <Tab label="Dark Mode" />
                            <Tab label="Mobile (Compact)" />
                        </Tabs>
                    </Paper>

                    {loading ? <CircularProgress /> : (
                        <Grid container spacing={3}>
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
                            {filteredResources.length === 0 && <Typography sx={{ p: 4, width: '100%', textAlign: 'center' }}>No hay logos.</Typography>}
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
