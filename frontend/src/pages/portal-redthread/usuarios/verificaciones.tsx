import { useState, SyntheticEvent, ReactNode } from 'react';
import {
  Box,
  Container,
  Typography,
  Tab,
  Tabs,
  Paper,
} from '@mui/material';
import AdminLayout from '../../../components/layout/AdminLayout';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import HistoryIcon from '@mui/icons-material/History';
import BarChartIcon from '@mui/icons-material/BarChart';
import VerificationRequestsTable from '../../../components/admin/VerificationRequestsTable';
import VerificationHistoryTable from '../../../components/admin/VerificationHistoryTable';
import VerificationStatsDashboard from '../../../components/admin/VerificationStats';

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function VerificationRequestsPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box display="flex" alignItems="center" mb={4}>
            <VerifiedUserIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4" fontWeight={700}>
              Gestión de Verificaciones
            </Typography>
          </Box>

          <Paper sx={{ width: '100%', mb: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="verification tabs">
                <Tab label="Solicitudes Pendientes" icon={<VerifiedUserIcon />} iconPosition="start" />
                <Tab label="Historial Aprobados" icon={<HistoryIcon />} iconPosition="start" />
                <Tab label="Estadísticas" icon={<BarChartIcon />} iconPosition="start" />
              </Tabs>
            </Box>
            <CustomTabPanel value={tabValue} index={0}>
              <VerificationRequestsTable />
            </CustomTabPanel>
            <CustomTabPanel value={tabValue} index={1}>
              <VerificationHistoryTable />
            </CustomTabPanel>
            <CustomTabPanel value={tabValue} index={2}>
              <VerificationStatsDashboard />
            </CustomTabPanel>
          </Paper>
        </Box>
      </Container>
    </AdminLayout>
  );
}
