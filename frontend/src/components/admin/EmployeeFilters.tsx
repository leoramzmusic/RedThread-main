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
    Divider,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface FilterProps {
    filters: any;
    roles: any[];
    departments: any[];
    onFilterChange: (newFilters: any) => void;
    onClear: () => void;
}

export default function EmployeeFilters({ filters, roles, departments, onFilterChange, onClear }: FilterProps) {
    const handleChange = (field: string, value: any) => {
        onFilterChange({ ...filters, [field]: value });
    };

    return (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" mb={2}>
                <FilterListIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                <Typography variant="body1" fontWeight={600}>Filtros de Búsqueda</Typography>
            </Box>

            <Grid container spacing={2}>
                {/* Role Filter */}
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Rol en Sistema</InputLabel>
                        <Select
                            value={filters.role || ''}
                            label="Rol en Sistema"
                            onChange={(e) => handleChange('role', e.target.value)}
                        >
                            <MenuItem value="">Todos los Roles</MenuItem>
                            {roles.map(r => (
                                <MenuItem key={r.slug || r.id} value={r.slug || r.id}>{r.name || r.nombre}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Area Filter */}
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Departamento</InputLabel>
                        <Select
                            value={filters.department_id || ''}
                            label="Departamento"
                            onChange={(e) => handleChange('department_id', e.target.value)}
                        >
                            <MenuItem value="">Todos los Deptos.</MenuItem>
                            {departments.map(d => (
                                <MenuItem key={d._id || d.id} value={d._id || d.id}>{d.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Status Filter */}
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Estado</InputLabel>
                        <Select
                            value={filters.status || ''}
                            label="Estado"
                            onChange={(e) => handleChange('status', e.target.value)}
                        >
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="active">Activo</MenuItem>
                            <MenuItem value="inactive">Inactivo</MenuItem>
                            <MenuItem value="suspended">Suspendido</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {/* Country Filter */}
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Ubicación (País)"
                        value={filters.country || ''}
                        onChange={(e) => handleChange('country', e.target.value)}
                    />
                </Grid>
            </Grid>

            <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                    startIcon={<RestartAltIcon />}
                    variant="text"
                    size="small"
                    onClick={onClear}
                    sx={{ textTransform: 'none' }}
                >
                    Reiniciar filtros
                </Button>
            </Box>
        </Paper>
    );
}
