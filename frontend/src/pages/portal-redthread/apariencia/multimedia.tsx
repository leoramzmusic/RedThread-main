import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Button,
    Card,
    CardContent,
    IconButton,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AdminLayout from '../../../components/layout/AdminLayout';
import appearanceService from '../../../services/appearanceService';
import { AppearanceResource, AppearanceType, Platform } from '../../../types/appearance';
import { getMediaUrl } from '../../../utils/media';
import ParallaxImage from '../../../components/motion/ParallaxImage';

export default function MultimediaPage() {
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
            const data = await appearanceService.getResources(AppearanceType.MULTIMEDIA);
            setResources(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        try {
            const url = await appearanceService.uploadFile(selectedFile, AppearanceType.MULTIMEDIA);
            await appearanceService.createResource({
                type: AppearanceType.MULTIMEDIA,
                platform: Platform.ALL,
                url: url,
                is_active: true
            });
            setOpenUpload(false);
            setSelectedFile(null);
            fetchResources();
        } catch (error) {
            console.error(error);
            alert("Error upload");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar recurso?')) {
            await appearanceService.deleteResource(id);
            fetchResources();
        }
    };

    return (
        <AdminLayout>
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" fontWeight={700}>Multimedia</Typography>
                        <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={() => setOpenUpload(true)}>
                            Subir Recurso
                        </Button>
                    </Box>

                    {loading ? <CircularProgress /> : (
                        <Grid container spacing={2}>
                            {resources.map((r) => (
                                <Grid item xs={6} md={3} key={r._id}>
                                    <Card>
                                        {/* Simple distinction for demo, ideally check mime type in metadata */}
                                        {r.url.endsWith('.mp4') ? (
                                            <video src={getMediaUrl(r.url)} style={{ width: '100%', height: 150, objectFit: 'cover' }} controls />
                                        ) : (
                                            <ParallaxImage src={getMediaUrl(r.url)} alt="media" intensity={0.08} drift={3} frameSx={{ height: 150 }} />
                                        )}
                                        <CardContent sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                                            <IconButton size="small" color="error" onClick={() => r._id && handleDelete(r._id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                            {resources.length === 0 && <Typography sx={{ p: 4, width: '100%', textAlign: 'center' }}>Galería vacía.</Typography>}
                        </Grid>
                    )}

                    <Dialog open={openUpload} onClose={() => setOpenUpload(false)}>
                        <DialogTitle>Subir Multimedia</DialogTitle>
                        <DialogContent>
                            <Box sx={{ mt: 2 }}>
                                <Button variant="outlined" component="label">
                                    Seleccionar Archivo
                                    <input type="file" hidden accept="image/*,video/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
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
