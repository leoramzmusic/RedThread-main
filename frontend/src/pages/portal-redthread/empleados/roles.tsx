import React from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Container, Box, Typography, Breadcrumbs, Link } from '@mui/material';
import RoleList from '../../../components/admin/RoleList';
import NextLink from 'next/link';

const RolesPage: React.FC = () => {
    return (
        <AdminLayout>
            <Head>
                <title>Roles y Permisos | Admin Portal ReTh</title>
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
                        <Typography color="text.primary">Roles y Permisos</Typography>
                    </Breadcrumbs>

                    <Box mb={4}>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            Seguridad y Roles
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Defina la estructura de seguridad y los niveles de acceso para el personal administrativo.
                        </Typography>
                    </Box>

                    <RoleList />
                </Container>
            </Box>
        </AdminLayout>
    );
};

export default RolesPage;
