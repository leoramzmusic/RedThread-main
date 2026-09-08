import Head from 'next/head';
import { Box, Typography, Button, Breadcrumbs, Link as MuiLink, Container } from '@mui/material';
import Link from 'next/link';
import AdminLayout from '../../../components/layout/AdminLayout';
import EmployeeList from '../../../components/admin/EmployeeList';
import AddIcon from '@mui/icons-material/Add';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export default function EmployeeListadoPage() {
    return (
        <AdminLayout>
            <Container maxWidth="xl">
                <Box sx={{ py: { xs: 2, md: 4 } }}>
                    <Head>
                        <title>Gestión de Empleados | ReTh Admin</title>
                    </Head>

                    {/* Header / Breadcrumbs */}
                    <Box mb={4}>
                        <Breadcrumbs
                            separator={<NavigateNextIcon fontSize="small" />}
                            sx={{ mb: 1, '& .MuiBreadcrumbs-li': { color: 'text.secondary', fontSize: '0.875rem' } }}
                        >
                            <Link href="/portal-redthread/dashboard" passHref legacyBehavior>
                                <MuiLink underline="hover" color="inherit">Dashboard</MuiLink>
                            </Link>
                            <Typography color="text.primary" variant="body2" fontWeight={500}>Empleados</Typography>
                        </Breadcrumbs>

                        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                            <Box>
                                <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
                                    Gestión de <Box component="span" sx={{ color: 'primary.main' }}>Empleados</Box>
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Administra el personal, roles y accesos del portal administrativo.
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    px: 3,
                                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                                }}
                            >
                                Nuevo Empleado
                            </Button>
                        </Box>
                    </Box>

                    {/* Main Content */}
                    <EmployeeList />
                </Box>
            </Container>
        </AdminLayout>
    );
}
