import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Button,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    CardActions,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../../../components/layout/AdminLayout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import yukiAdminService, { YukiAsset } from '../../../../services/yukiAdminService';

export default function YukiAssets() {
    const router = useRouter();
    const [assets, setAssets] = useState<YukiAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        yukiAdminService.getAssets().then((a) => { setAssets(a); setLoading(false); });
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError('');
        try {
            const asset = await yukiAdminService.uploadAsset(file);
            setAssets([asset, ...assets]);
            setSuccess(`Asset "${file.name}" subido correctamente`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Error al subir archivo');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        await yukiAdminService.deleteAsset(id);
        setAssets(assets.filter((a) => a.id !== id));
        setDeleteDialog(null);
        setSuccess('Asset eliminado');
        setTimeout(() => setSuccess(''), 2000);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (loading) {
        return (
            <AdminLayout>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress />
                </Box>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                        <Box
                            component="span"
                            onClick={() => router.push('/portal-redthread/experiencia/mascota')}
                            sx={{ cursor: 'pointer', display: 'inline-flex', p: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <ArrowBackIcon />
                        </Box>
                        <Typography variant="h4" fontWeight={700}>
                            Assets de Yuki
                        </Typography>
                    </Box>

                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {/* Upload Zone */}
                    <Paper
                        sx={{
                            p: 4,
                            mb: 3,
                            border: '2px dashed',
                            borderColor: 'primary.main',
                            borderRadius: 2,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".svg,.png,.jpg,.jpeg,.webp,.json"
                            onChange={handleUpload}
                            style={{ display: 'none' }}
                        />
                        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" gutterBottom>
                            {uploading ? 'Subiendo...' : 'Arrastra o haz clic para subir'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Formatos soportados: SVG, PNG, JPG, WebP, Lottie JSON (máx. 10MB)
                        </Typography>
                    </Paper>

                    {/* Assets Grid */}
                    {assets.length === 0 ? (
                        <Alert severity="info">No hay assets subidos aún</Alert>
                    ) : (
                        <Grid container spacing={3}>
                            {assets.map((asset) => (
                                <Grid item xs={12} sm={6} md={4} key={asset.id}>
                                    <Card>
                                        <Box
                                            sx={{
                                                height: 160,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: 'grey.100',
                                            }}
                                        >
                                            {asset.type === 'lottie' ? (
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h3">🎬</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Lottie JSON
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <Box
                                                    component="img"
                                                    src={asset.url}
                                                    alt={asset.filename}
                                                    sx={{ maxHeight: 140, maxWidth: '100%', objectFit: 'contain' }}
                                                />
                                            )}
                                        </Box>
                                        <CardContent sx={{ py: 1 }}>
                                            <Typography variant="body2" fontWeight={600} noWrap>
                                                {asset.filename}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {asset.type.toUpperCase()} · {formatSize(asset.size)}
                                            </Typography>
                                        </CardContent>
                                        <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => setDeleteDialog(asset.id)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {/* Delete Dialog */}
                    <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
                        <DialogTitle>Eliminar asset</DialogTitle>
                        <DialogContent>
                            <Typography>¿Estás seguro de que quieres eliminar este asset? Esta acción no se puede deshacer.</Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDeleteDialog(null)}>Cancelar</Button>
                            <Button
                                color="error"
                                variant="contained"
                                onClick={() => deleteDialog && handleDelete(deleteDialog)}
                            >
                                Eliminar
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            </Container>
        </AdminLayout>
    );
}
