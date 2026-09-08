import React, { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    Switch,
    FormControlLabel,
    Grid,
    Paper,
    CircularProgress,
    Fade,
    useTheme,
    IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';

interface IconUploadDialogProps {
    open: boolean;
    onClose: () => void;
    onUpload: (file: File, resolution: string, description: string, date?: string) => Promise<void>;
    platform: string;
}

export default function IconUploadDialog({ open, onClose, onUpload, platform }: IconUploadDialogProps) {
    const theme = useTheme();
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [resolution, setResolution] = useState<string>('');
    const [description, setDescription] = useState('');
    const [scheduleEnabled, setScheduleEnabled] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state when opening
    useEffect(() => {
        if (open) {
            setFile(null);
            setPreviewUrl(null);
            setResolution('');
            setDescription('');
            setScheduleEnabled(false);
            setScheduleDate('');
            setUploading(false);
        }
    }, [open]);

    // Clean up object URL
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleFileSelect = (selectedFile: File) => {
        if (!selectedFile) return;

        // Create preview and get dimensions
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);
        setFile(selectedFile);

        const img = new Image();
        img.onload = () => {
            setResolution(`${img.width}x${img.height}`);
        };
        img.src = objectUrl;
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleUploadClick = async () => {
        if (!file || !resolution) return;
        setUploading(true);
        try {
            await onUpload(file, resolution, description, scheduleEnabled ? scheduleDate : undefined);
            onClose();
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
        }
    };

    const minDate = new Date().toISOString().slice(0, 16);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    backgroundImage: 'none'
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.divider}`,
                pb: 2
            }}>
                <Typography variant="h6" fontWeight="bold">
                    Subir Nuevo Icono ({platform})
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4 }}>
                <Grid container spacing={4}>
                    {/* Left Column: Drag & Drop Area */}
                    <Grid item xs={12} md={5}>
                        <Paper
                            variant="outlined"
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={onDrop}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                                height: 320,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderStyle: 'dashed',
                                borderWidth: 2,
                                borderColor: isDragging ? 'primary.main' : 'divider',
                                bgcolor: isDragging ? 'action.hover' : 'background.default',
                                borderRadius: 4,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover'
                                }
                            }}
                        >
                            <input
                                type="file"
                                hidden
                                ref={fileInputRef}
                                accept=".ico,.png,.jpg,.svg"
                                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                            />

                            {previewUrl ? (
                                <Box sx={{ position: 'relative', width: '100%', height: '100%', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    <Box sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        p: 1,
                                        textAlign: 'center',
                                        bgcolor: 'rgba(0,0,0,0.6)',
                                        color: 'white',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        <Typography variant="caption" fontWeight="bold">Click para cambiar</Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <>
                                    <CloudUploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="body1" fontWeight={600} color="text.primary">
                                        Arrastra tu archivo aquí
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        o haz click para seleccionar
                                    </Typography>
                                </>
                            )}
                        </Paper>

                        {/* Resolution Badge */}
                        <Fade in={!!resolution}>
                            <Paper sx={{ mt: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'action.selected' }}>
                                <ImageSearchIcon color="action" />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">Resolución Detectada</Typography>
                                    <Typography variant="body2" fontWeight="bold">{resolution}</Typography>
                                </Box>
                            </Paper>
                        </Fade>
                    </Grid>

                    {/* Right Column: Form Data */}
                    <Grid item xs={12} md={7}>
                        <Box display="flex" flexDirection="column" gap={3}>

                            {/* Narrative Field */}
                            <Box>
                                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                                    Narrativa Emocional & Descripción
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="Ej: Este ícono representa el inicio de primavera en RETH, donde florecen nuevas conexiones."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    helperText="Una breve historia ayuda a contextualizar el cambio para el equipo."
                                />
                            </Box>

                            {/* Scheduling Section */}
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={scheduleEnabled ? 2 : 0}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <CalendarMonthIcon color={scheduleEnabled ? "primary" : "disabled"} />
                                        <Box>
                                            <Typography variant="body1" fontWeight={600}>Programar Activación</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {scheduleEnabled ? "El ícono se activará automáticamente" : "¿Deseas activar esto en el futuro?"}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Switch
                                        checked={scheduleEnabled}
                                        onChange={(e) => setScheduleEnabled(e.target.checked)}
                                    />
                                </Box>

                                <Fade in={scheduleEnabled} unmountOnExit>
                                    <Box>
                                        <TextField
                                            type="datetime-local"
                                            fullWidth
                                            value={scheduleDate}
                                            onChange={(e) => setScheduleDate(e.target.value)}
                                            inputProps={{ min: minDate }}
                                            InputLabelProps={{ shrink: true }}
                                            label="Fecha y Hora de Activación"
                                        />
                                        <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                                            🗓️ Este ícono se activará el {scheduleDate ? new Date(scheduleDate).toLocaleDateString() : '...'} a las {scheduleDate ? new Date(scheduleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}.
                                        </Typography>
                                    </Box>
                                </Fade>
                            </Paper>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button onClick={onClose} size="large" color="inherit" sx={{ borderRadius: 2 }}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleUploadClick}
                    disabled={!file || !resolution || (scheduleEnabled && !scheduleDate) || uploading}
                    sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1,
                        background: scheduleEnabled
                            ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                            : 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                        boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
                    }}
                >
                    {uploading ? <CircularProgress size={24} color="inherit" /> : (scheduleEnabled ? "Programar Subida" : "Subir Ahora")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
