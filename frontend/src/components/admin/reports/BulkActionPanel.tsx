import React, { useState } from 'react';
import {
    Paper,
    Typography,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Stack,
    Divider,
    Alert,
    Grid,
} from '@mui/material';
import {
    Gavel as GavelIcon,
    CheckCircle as ResolveIcon,
    Delete as DismissIcon,
    Person as AssignIcon,
} from '@mui/icons-material';

interface BulkActionPanelProps {
    selectedCount: number;
    onApply: (action: string, notes: string, moderatorId?: string) => void;
    loading?: boolean;
}

const BulkActionPanel: React.FC<BulkActionPanelProps> = ({ selectedCount, onApply, loading }) => {
    const [action, setAction] = useState('resolve');
    const [notes, setNotes] = useState('');
    const [moderatorId, setModeratorId] = useState('');

    const handleApply = () => {
        onApply(action, notes, action === 'assign' ? moderatorId : undefined);
    };

    return (
        <Paper sx={{ p: 3, mb: 4, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <GavelIcon color="primary" /> Acciones por Lote
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Se han seleccionado <b>{selectedCount}</b> denuncias. Elige una acción para aplicarla a todas.
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={3} alignItems="flex-end">
                <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Acción</InputLabel>
                        <Select
                            value={action}
                            label="Acción"
                            onChange={(e) => setAction(e.target.value)}
                        >
                            <MenuItem value="resolve">Resolver (Procedentes)</MenuItem>
                            <MenuItem value="dismiss">Desestimar todas</MenuItem>
                            <MenuItem value="assign">Asignar a Moderador</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {action === 'assign' && (
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            size="small"
                            label="ID de Moderador"
                            value={moderatorId}
                            onChange={(e) => setModeratorId(e.target.value)}
                        />
                    </Grid>
                )}

                <Grid item xs={12} md={action === 'assign' ? 3 : 6}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Notas de resolución masiva"
                        placeholder="Ej: Spam detectado por filtro automático"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <Button
                        fullWidth
                        variant="contained"
                        disabled={selectedCount === 0 || loading}
                        onClick={handleApply}
                        startIcon={<GavelIcon />}
                    >
                        Aplicar a {selectedCount} items
                    </Button>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default BulkActionPanel;


