import React, { useState } from 'react';
import {
    Paper,
    Typography,
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Grid,
    Switch,
    FormControlLabel,
    Divider,
    Slider,
} from '@mui/material';
import { Add as AddIcon, Save as SaveIcon } from '@mui/icons-material';

interface ModerationRuleFormProps {
    onSubmit: (rule: any) => void;
    loading?: boolean;
}

const ModerationRuleForm: React.FC<ModerationRuleFormProps> = ({ onSubmit, loading }) => {
    const [name, setName] = useState('');
    const [triggerType, setTriggerType] = useState('count_threshold');
    const [threshold, setThreshold] = useState(5);
    const [action, setAction] = useState('notify');
    const [category, setCategory] = useState('all');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            trigger_type: triggerType,
            threshold,
            action,
            category_filter: category === 'all' ? null : category,
            is_active: true
        });
        // Reset form
        setName('');
    };

    return (
        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>Nueva Regla de Automatización</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Define disparadores para acciones automáticas basadas en el comportamiento de los usuarios.
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Nombre de la regla"
                        placeholder="Ej: Auto-suspender por múltiples denuncias de acoso"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                        <InputLabel>Disparador</InputLabel>
                        <Select value={triggerType} label="Disparador" onChange={(e) => setTriggerType(e.target.value)}>
                            <MenuItem value="count_threshold">Umbral de Denuncias</MenuItem>
                            <MenuItem value="category">Por Categoría</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                        <InputLabel>Categoría (Opcional)</InputLabel>
                        <Select value={category} label="Categoría (Opcional)" onChange={(e) => setCategory(e.target.value)}>
                            <MenuItem value="all">Todas</MenuItem>
                            <MenuItem value="chat">Chat</MenuItem>
                            <MenuItem value="profile">Perfil</MenuItem>
                            <MenuItem value="discover">Discover</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Typography gutterBottom variant="subtitle2">Umbral: {threshold} denuncias</Typography>
                    <Slider
                        value={threshold}
                        min={1}
                        max={50}
                        step={1}
                        onChange={(_, v) => setThreshold(v as number)}
                        valueLabelDisplay="auto"
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                        <InputLabel>Acción Automática</InputLabel>
                        <Select value={action} label="Acción Automática" onChange={(e) => setAction(e.target.value)}>
                            <MenuItem value="notify">Notificar a Moderadores</MenuItem>
                            <MenuItem value="hide">Ocultar Perfil</MenuItem>
                            <MenuItem value="suspend">Suspender Cuenta</MenuItem>
                            <MenuItem value="block">Banear Permanentemente</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        startIcon={<AddIcon />}
                        disabled={!name || loading}
                        sx={{ height: 56 }}
                    >
                        Crear Regla
                    </Button>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default ModerationRuleForm;
