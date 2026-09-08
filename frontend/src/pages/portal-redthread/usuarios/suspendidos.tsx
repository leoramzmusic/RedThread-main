import {
  Box,
  Container,
  Typography,
  Paper,
} from '@mui/material';
import AdminLayout from '../../../components/layout/AdminLayout';
import BlockIcon from '@mui/icons-material/Block';

export default function SuspendedUsersPage() {
  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box display="flex" alignItems="center" mb={4}>
            <BlockIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4" fontWeight={700}>
              Usuarios Suspendidos
            </Typography>
          </Box>

          <Paper sx={{ p: 3 }}>
            <Typography variant="body1" color="text.secondary">
              Usuarios suspendidos (Implementación pendiente)
            </Typography>
          </Paper>
        </Box>
      </Container>
    </AdminLayout>
  );
}
