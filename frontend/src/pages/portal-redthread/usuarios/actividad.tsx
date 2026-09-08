import {
  Box,
  Container,
  Typography,
  Paper,
} from '@mui/material';
import AdminLayout from '../../../components/layout/AdminLayout';
import HistoryIcon from '@mui/icons-material/History';

export default function ActivityHistoryPage() {
  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box display="flex" alignItems="center" mb={4}>
            <HistoryIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4" fontWeight={700}>
              Historial de Actividad
            </Typography>
          </Box>

          <Paper sx={{ p: 3 }}>
            <Typography variant="body1" color="text.secondary">
              Historial de actividad (Implementación pendiente)
            </Typography>
          </Paper>
        </Box>
      </Container>
    </AdminLayout>
  );
}
