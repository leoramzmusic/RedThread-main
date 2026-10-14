import React from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Container, Box, Typography, Breadcrumbs, Link } from '@mui/material';
import EmployeeForm from '../../../components/admin/EmployeeForm';
import NextLink from 'next/link';

const RegistrarEmpleadoPage: React.FC = () => {
    return (
        <AdminLayout>
            <Head>
                <title>Registrar Empleado | Admin Portal ReTh</title>
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
                        <Typography sx={{
                            color: "text.primary"
                        }}>Registrar Nuevo</Typography>
                    </Breadcrumbs>

                    <Box sx={{
                        mb: 4
                    }}>
                        <Typography variant="h4" gutterBottom sx={{
                            fontWeight: "bold"
                        }}>
                            Registrar Nuevo Empleado
                        </Typography>
                        <Typography variant="body1" sx={{
                            color: "text.secondary"
                        }}>
                            Complete el formulario para dar de alta a un nuevo miembro del equipo administrativo.
                        </Typography>
                    </Box>

                    <EmployeeForm />
                </Container>
            </Box>
        </AdminLayout>
    );
};

export default RegistrarEmpleadoPage;
