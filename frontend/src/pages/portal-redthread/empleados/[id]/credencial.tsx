import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Box, Container, Typography, Paper, CircularProgress, Button, Breadcrumbs, Link } from '@mui/material';
import Head from 'next/head';
import NextLink from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import CredentialCard from '@/components/admin/CredentialCard';
import CredentialBack from '@/components/admin/CredentialBack';
import adminApiClient from '@/services/adminApi';

export default function CredencialEmpleadoPage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    adminApiClient.get(`/portal-redthread/empleados/${id}`).then((res) => setEmployee(res.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AdminLayout><Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box></AdminLayout>;
  if (!employee) return <AdminLayout><Container><Typography>Empleado no encontrado</Typography></Container></AdminLayout>;

  const serial = `SN-${employee.employee_id}-${String(employee.first_name).slice(0, 2).toUpperCase()}${String(employee.last_name).slice(0, 2).toUpperCase()}`;
  const issueDate = new Date(employee.created_at || Date.now()).toLocaleDateString('en-GB');
  const expiryDate = new Date(new Date(employee.created_at || Date.now()).setFullYear(new Date(employee.created_at || Date.now()).getFullYear() + 5)).toLocaleDateString('en-GB');

  return (
    <AdminLayout>
      <Head><title>Credencial {employee.display_name || employee.first_name} | ReTh Admin</title></Head>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link component={NextLink} href="/portal-redthread/empleados/listado" underline="hover" color="inherit">Empleados</Link>
          <Typography color="text.primary">Credencial</Typography>
        </Breadcrumbs>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Credencial — {employee.first_name} {employee.last_name}</Typography>
            <Typography variant="body2" color="text.secondary">{employee.employee_id} • {employee.email}</Typography>
          </Box>
          <Button variant="contained" onClick={() => window.print()} sx={{ borderRadius: 2, bgcolor: '#E63946', '&:hover': { bgcolor: '#B71C1C' } }}>Imprimir / Descargar PDF</Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', bgcolor: '#f5f5f5', p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">FRENTE</Typography>
            <CredentialCard
              photoUrl={employee.avatar}
              firstName={employee.first_name}
              lastName={employee.last_name}
              departmentName={employee.department_id}
              roleName={employee.roles?.[0]}
              employeeCode={employee.employee_id}
              email={employee.email}
              phone={employee.phone}
              birthDate={employee.birth_date}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">REVERSO</Typography>
            <CredentialBack employeeCode={employee.employee_id} email={employee.email} issueDate={issueDate} expiryDate={expiryDate} serial={serial} />
          </Box>
        </Box>

        <Paper sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
          <Typography variant="caption" color="text.secondary">Ruta: <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>/portal-redthread/empleados/{id}/credencial</Box> — Accesible desde Listado → Ver credencial o directo por ID.</Typography>
        </Paper>
      </Container>
    </AdminLayout>
  );
}
