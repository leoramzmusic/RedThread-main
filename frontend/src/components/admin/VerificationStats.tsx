import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import adminApiClient from '../../services/adminApi';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Button } from '@mui/material';

interface VerificationStats {
  total_verified: number;
  total_rejected: number;
  total_pending: number;
  approval_rate: number;
  top_rejection_reasons: { reason: string; count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function VerificationStatsDashboard() {
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminApiClient.get('/portal-redthread/verificaciones/stats/general');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Auto-reload every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
    return <Typography color="error">Error cargando estadísticas</Typography>;
  }

  // Data for Pie Chart (Overall Distribution)
  const pieData = [
    { name: 'Aprobados', value: stats.total_verified, color: '#4caf50' },
    { name: 'Rechazados', value: stats.total_rejected, color: '#f44336' },
    { name: 'Pendientes', value: stats.total_pending, color: '#ff9800' },
  ].filter(d => d.value > 0);

  const handleDownload = async () => {
    try {
      const response = await adminApiClient.get('/portal-redthread/verificaciones/export/csv', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'verification_stats.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Dashboard de Verificación
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<FileDownloadIcon />}
          onClick={handleDownload}
        >
          Exportar CSV
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" variant="subtitle2">
                    Total Aprobados
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {stats.total_verified}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffebee' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" variant="subtitle2">
                    Total Rechazados
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="error.main">
                    {stats.total_rejected}
                  </Typography>
                </Box>
                <CancelIcon sx={{ fontSize: 40, color: 'error.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
             <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" variant="subtitle2">
                    Pendientes
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {stats.total_pending}
                  </Typography>
                </Box>
                <PendingIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
           <Card>
            <CardContent>
               <Box>
                  <Typography color="text.secondary" variant="subtitle2">
                    Tasa de Aprobación
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {stats.approval_rate}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    de solicitudes procesadas
                  </Typography>
                </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Rejection Reasons Bar Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Top Motivos de Rechazo
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {stats.top_rejection_reasons.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={stats.top_rejection_reasons}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="reason" type="category" width={150} tick={{fontSize: 12}} />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#ef5350" name="Cantidad" radius={[0, 4, 4, 0]} />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                    <Typography color="text.secondary">No hay datos de rechazos suficientes</Typography>
                </Box>
            )}
          </Paper>
        </Grid>

        {/* Overall Distribution Pie Chart */}
        <Grid item xs={12} md={4}>
           <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Distribución Total
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
