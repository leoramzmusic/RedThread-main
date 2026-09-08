import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Grid,
    Divider,
    Chip,
    Avatar,
    Stack,
    TextField,
    CircularProgress,
    Alert,
    Paper,
} from '@mui/material';
import {
    Report as ReportIcon,
    Visibility as ViewIcon,
    CheckCircle as ResolveIcon,
    Cancel as DismissIcon,
    Gavel as GavelIcon,
} from '@mui/icons-material';

interface ReportDetailDialogProps {
    open: boolean;
    reportId: string | null;
    onClose: () => void;
    onActionTaken: () => void;
}

const ReportDetailDialog: React.FC<ReportDetailDialogProps> = ({ open, reportId, onClose, onActionTaken }) => {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any>(null);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // TODO: Fetch detailed report data when reportId changes and dialog is open

    const handleUpdateStatus = async (status: string) => {
        setSubmitting(true);
        // TODO: API call to update status
        setTimeout(() => {
            setSubmitting(false);
            onActionTaken();
        }, 1000);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <ReportIcon color="error" />
                    Detalle de Denuncia
                    {reportId && <Typography variant="caption" sx={{ ml: 'auto' }}>ID: {reportId}</Typography>}
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
                ) : (
                    <Grid container spacing={3}>
                        {/* Users Info */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom color="text.secondary">Denunciado</Typography>
                            <Box display="flex" alignItems="center" gap={2} p={2} sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
                                <Avatar sx={{ width: 56, height: 56 }}>U</Avatar>
                                <Box>
                                    <Typography variant="h6">Nombre Usuario</Typography>
                                    <Typography variant="caption" color="text.secondary">ID: user_id_123</Typography>
                                </Box>
                                <Button size="small" variant="outlined" sx={{ ml: 'auto' }}>Ver Perfil</Button>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom color="text.secondary">Denunciante</Typography>
                            <Box display="flex" alignItems="center" gap={2} p={2} sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
                                <Avatar sx={{ width: 56, height: 56 }}>D</Avatar>
                                <Box>
                                    <Typography variant="h6">Nombre Denunciante</Typography>
                                    <Typography variant="caption" color="text.secondary">ID: reporter_id_456</Typography>
                                </Box>
                                <Button size="small" variant="outlined" sx={{ ml: 'auto' }}>Ver Perfil</Button>
                            </Box>
                        </Grid>

                        {/* Report Content */}
                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                            <Stack spacing={2} sx={{ mt: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>Categoría y Motivo</Typography>
                                    <Box display="flex" gap={1} mb={1}>
                                        <Chip label="CHAT" color="primary" size="small" />
                                        <Chip label="acosu" variant="outlined" size="small" />
                                    </Box>
                                    <Typography variant="body1" fontWeight={500}>"Acoso y lenguaje ofensivo constante"</Typography>
                                </Box>

                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>Descripción adicional</Typography>
                                    <Paper sx={{ p: 2, bgcolor: 'action.hover', border: '1px dashed', borderColor: 'divider' }}>
                                        <Typography variant="body2">
                                            El usuario me ha estado enviando mensajes inapropiados a pesar de que le pedí que parara.
                                            Dice que conoce mi ubicación real y que vendrá a buscarme.
                                        </Typography>
                                    </Paper>
                                </Box>

                                {/* Evidence Section - TODO */}
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>Evidencia (Fragmento de Chat)</Typography>
                                    <Paper sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? '#000' : '#f5f5f5', maxHeight: 200, overflow: 'auto' }}>
                                        <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
                                            [2023-12-24 10:05] Usuario: Hola, ¿por qué no contestas?
                                            [2023-12-24 10:06] Usuario: No me ignores.
                                            [2023-12-24 10:10] Usuario: Te encontré en Instagram también.
                                            [2023-12-24 10:11] Usuario: Vive en calle falsa 123, ¿verdad?
                                        </Typography>
                                    </Paper>
                                </Box>
                            </Stack>
                        </Grid>

                        {/* Moderation Actions */}
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                                <GavelIcon /> Acciones de Moderación
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Notas de resolución"
                                placeholder="Explica la acción tomada..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                sx={{ mb: 2, mt: 1 }}
                            />
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} disabled={submitting}>Cerrar</Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => handleUpdateStatus('dismissed')}
                    disabled={submitting || loading}
                    startIcon={<DismissIcon />}
                >
                    Desestimar
                </Button>
                <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleUpdateStatus('resolved')}
                    disabled={submitting || loading}
                    startIcon={<ResolveIcon />}
                >
                    Resolver (Procedente)
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReportDetailDialog;
