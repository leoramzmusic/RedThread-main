import {
  Box,
  Container,
  Typography,
} from '@mui/material';
import AdminLayout from '../../../components/layout/AdminLayout';
import PeopleIcon from '@mui/icons-material/People';
import UserStatsDashboard from '../../../components/admin/UserStatsDashboard';
import UsersList from '../../../components/admin/UsersList';

export default function UsersListPage() {
  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box display="flex" alignItems="center" mb={4}>
            <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4" fontWeight={700}>
              Gestión de Usuarios
            </Typography>
          </Box>

          {/* Estadísticas Superiores */}
          <UserStatsDashboard />

          {/* Listado de Usuarios con Filtros */}
          <UsersList />
        </Box>
      </Container>
    </AdminLayout>
  );
}
