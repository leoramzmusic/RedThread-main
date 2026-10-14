import React from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Container, Box, Typography, Breadcrumbs, Link } from '@mui/material';
import DepartmentList from '../../../components/admin/DepartmentList';
import NextLink from 'next/link';

const DepartamentosPage: React.FC = () => {
    return (
        <AdminLayout>
            <Head>
                <title>Departamentos | Admin Portal ReTh</title>
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
                        }}>Departamentos</Typography>
                    </Breadcrumbs>

                    <Box sx={{
                        mb: 4
                    }}>
                        <Typography variant="h4" gutterBottom sx={{
                            fontWeight: "bold"
                        }}>
                            Estructura Organizacional
                        </Typography>
                        <Typography variant="body1" sx={{
                            color: "text.secondary"
                        }}>
                            Gestione las áreas, departamentos y responsables de la organización.
                        </Typography>
                    </Box>

                    <DepartmentList />
                </Container>
            </Box>
        </AdminLayout>
    );
};

export default DepartamentosPage;
