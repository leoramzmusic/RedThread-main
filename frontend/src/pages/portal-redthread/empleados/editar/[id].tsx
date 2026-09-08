import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/layout/AdminLayout';
import { Container, Box, Typography, Breadcrumbs, Link, CircularProgress } from '@mui/material';
import EmployeeEditForm from '../../../../components/admin/EmployeeEditForm';
import NextLink from 'next/link';

const EditarEmpleadoPage: React.FC = () => {
    const router = useRouter();
    const { id } = router.query;

    return (
        <AdminLayout>
            <Head>
                <title>Editar Empleado | Admin Portal ReTh</title>
            </Head>

            <Box sx={{ py: 3 }}>
                <Container maxWidth="xl">
                    {/* Breadcrumbs */}
                    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
                        <Link component={NextLink} href="/portal-redthread" underline="hover" color="inherit">
                            Admin
                        </Link>
                        <Link component={NextLink} href="/portal-redthread/empleados/listado" underline="hover" color="inherit">
                            Empleados
                        </Link>
                        <Typography color="text.primary">Editar Empleado</Typography>
                    </Breadcrumbs>

                    <Box mb={4}>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            Perfil de Empleado
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Gestione la información, accesos e historial de auditoría del personal administrativo.
                        </Typography>
                    </Box>

                    {id ? (
                        <EmployeeEditForm employeeId={id as string} />
                    ) : (
                        <Box display="flex" justifyContent="center" py={10}>
                            <CircularProgress />
                        </Box>
                    )}
                </Container>
            </Box>
        </AdminLayout>
    );
};

export default EditarEmpleadoPage;
