import {
    Box,
    Container,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    Chip,
    Fab,
    TextField,
    InputAdornment,
} from '@mui/material';
import AdminLayout from '../../../components/layout/AdminLayout';
import SupportIcon from '@mui/icons-material/Support';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

export default function IcebreakerManagerPage() {
    const icebreakers = [
        { text: '¿Cuál es la canción que no puedes dejar de escuchar hoy?', tone: 'Cercano', context: 'Primera interacción' },
        { text: 'Si pudieras viajar a cualquier lugar en este momento, ¿dónde irías?', tone: 'Creativo', context: 'Match reciente' },
        { text: '¿Qué es lo más valiente que has hecho por amor?', tone: 'Profundo', context: 'Silencio prolongado' },
        { text: 'Dime un dato curioso que casi nadie sepa sobre ti.', tone: 'Divertido', context: 'Cualquiera' },
    ];

    return (
        <AdminLayout>
            <Container maxWidth="xl">
                <Box sx={{ py: 4 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                        <Box display="flex" alignItems="center">
                            <SupportIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                            <Typography variant="h4" fontWeight={700}>
                                Icebreaker Manager
                            </Typography>
                        </Box>
                        <TextField
                            size="small"
                            placeholder="Buscar frase..."
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    <List>
                        {icebreakers.map((ib, index) => (
                            <ListItem key={index} component={Paper} sx={{ mb: 2, p: 2, display: 'flex', justifyContent: 'space-between' }}>
                                <ListItemText
                                    primary={ib.text}
                                    secondary={`Contexto: ${ib.context}`}
                                />
                                <Chip label={ib.tone} variant="outlined" color="primary" />
                            </ListItem>
                        ))}
                    </List>

                    <Fab color="primary" aria-label="add" sx={{ position: 'fixed', bottom: 32, right: 32 }}>
                        <AddIcon />
                    </Fab>
                </Box>
            </Container>
        </AdminLayout>
    );
}
