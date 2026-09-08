import {
    Box,
    Paper,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Grid,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface FilterProps {
    filters: any;
    onFilterChange: (newFilters: any) => void;
    onClear: () => void;
}

export default function UserFilters({ filters, onFilterChange, onClear }: FilterProps) {
    const handleChange = (field: string, value: any) => {
        onFilterChange({ ...filters, [field]: value });
    };

    return (
        <Paper sx={{ p: 2, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
                <FilterListIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>Filtros Avanzados</Typography>
            </Box>

            <Grid container spacing={2}>
                {/* Basic Filters */}
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Estado de Cuenta</InputLabel>
                        <Select
                            value={filters.status_filter || ''}
                            label="Estado de Cuenta"
                            onChange={(e) => handleChange('status_filter', e.target.value)}
                        >
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="active">Activo</MenuItem>
                            <MenuItem value="suspended">Suspendido</MenuItem>
                            <MenuItem value="banned">Baneado</MenuItem>
                            <MenuItem value="deleted">Eliminado</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Verificación</InputLabel>
                        <Select
                            value={filters.verified_filter === undefined ? '' : String(filters.verified_filter)}
                            label="Verificación"
                            onChange={(e) => handleChange('verified_filter', e.target.value === '' ? undefined : e.target.value === 'true')}
                        >
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="true">Verificado</MenuItem>
                            <MenuItem value="false">No verificado</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Suscripción</InputLabel>
                        <Select
                            value={filters.tier_filter || ''}
                            label="Suscripción"
                            onChange={(e) => handleChange('tier_filter', e.target.value)}
                        >
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="free">Free</MenuItem>
                            <MenuItem value="premium">Premium</MenuItem>
                            <MenuItem value="vip">VIP</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Inactivo por (días)"
                        type="number"
                        value={filters.last_active_days || ''}
                        onChange={(e) => handleChange('last_active_days', e.target.value)}
                    />
                </Grid>
            </Grid>

            <Accordion sx={{ mt: 2, boxShadow: 'none', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2" color="primary" fontWeight={600}>Filtros de Ubicación y Fecha</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth size="small" label="País"
                                value={filters.country || ''}
                                onChange={(e) => handleChange('country', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth size="small" label="Estado/Región"
                                value={filters.state || ''}
                                onChange={(e) => handleChange('state', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth size="small" label="Ciudad"
                                value={filters.city || ''}
                                onChange={(e) => handleChange('city', e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Desde"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={filters.date_from || ''}
                                onChange={(e) => handleChange('date_from', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Hasta"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={filters.date_to || ''}
                                onChange={(e) => handleChange('date_to', e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            <Divider sx={{ my: 1 }} />

            <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                    startIcon={<RestartAltIcon />}
                    variant="text"
                    onClick={onClear}
                >
                    Limpiar
                </Button>
            </Box>
        </Paper>
    );
}
