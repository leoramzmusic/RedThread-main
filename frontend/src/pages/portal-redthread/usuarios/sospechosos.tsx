import {
  Box,
  Container,
  Typography,
  Paper,
} from '@mui/material';
import AdminLayout from '../../../components/layout/AdminLayout';
import WarningIcon from '@mui/icons-material/Warning';

export default function FlaggedProfilesPage() {
  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 4
            }}>
            <WarningIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4" sx={{
              fontWeight: 700
            }}>
              Perfiles Sospechosos
            </Typography>
          </Box>

          <Paper sx={{ p: 3 }}>
            <Typography variant="body1" sx={{
              color: "text.secondary"
            }}>
              Perfiles sospechosos (Implementación pendiente)
            </Typography>
          </Paper>
        </Box>
      </Container>
    </AdminLayout>
  );
}
