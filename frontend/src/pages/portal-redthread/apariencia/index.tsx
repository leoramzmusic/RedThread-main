import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
} from '@mui/material';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import PaletteIcon from '@mui/icons-material/Palette';
import ImageIcon from '@mui/icons-material/Image';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import MenuIcon from '@mui/icons-material/Menu';

export default function AppearanceDashboard() {
    const router = useRouter();

    const modules = [
        {
            title: 'Favicon & Iconos',
            description: 'Gestionar iconos para Web, Android e iOS',
            icon: <ImageIcon sx={{ fontSize: 60, color: '#FF6B6B' }} />,
            path: '/portal-redthread/apariencia/iconos',
            color: '#FF6B6B'
        },
        {
            title: 'Logos',
            description: 'Logo principal y variantes (dark mode, mobile)',
            icon: <ImageIcon sx={{ fontSize: 60, color: '#4ECDC4' }} />,
            path: '/portal-redthread/apariencia/logos',
            color: '#4ECDC4'
        },
        {
            title: 'Banners',
            description: 'Portada del portal y banners de campaña',
            icon: <ViewCarouselIcon sx={{ fontSize: 60, color: '#34495E' }} />,
            path: '/portal-redthread/apariencia/landingpage',
            color: '#34495E'
        },
        {
            title: 'Multimedia',
            description: 'Galería de imágenes y videos',
            icon: <VideoLibraryIcon sx={{ fontSize: 60, color: '#9B59B6' }} />,
            path: '/portal-redthread/apariencia/multimedia',
            color: '#9B59B6'
        },
        {
            title: 'Navbar y Footer',
            description: 'Secciones del navbar, orden, visibilidad, traducciones y contenido del footer',
            icon: <MenuIcon sx={{ fontSize: 60, color: '#E63946' }} />,
            path: '/portal-redthread/apariencia/landingPageNavbarAndFooter',
            color: '#E63946'
        },
        {
            title: 'Temas',
            description: 'Paleta de colores y tipografía',
            icon: <ColorLensIcon sx={{ fontSize: 60, color: '#F1C40F' }} />,
            path: '/portal-redthread/apariencia/temas',
            color: '#F1C40F'
        }
    ];

    return (
        <AdminLayout>
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}>
                    {/* Header */}
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <PaletteIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h3" fontWeight={700} gutterBottom>
                            Apariencia
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            Gestión de recursos visuales y temas
                        </Typography>
                    </Box>

                    {/* Modules Grid */}
                    <Grid container spacing={4}>
                        {modules.map((module) => (
                            <Grid item xs={12} md={4} key={module.title}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'all 0.3s',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: 6,
                                        },
                                    }}
                                    onClick={() => router.push(module.path)}
                                >
                                    <CardContent
                                        sx={{
                                            flexGrow: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            p: 4,
                                        }}
                                    >
                                        {module.icon}
                                        <Typography variant="h5" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
                                            {module.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {module.description}
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            sx={{
                                                mt: 3,
                                                bgcolor: module.color,
                                                '&:hover': {
                                                    bgcolor: module.color,
                                                    opacity: 0.9,
                                                },
                                            }}
                                        >
                                            Gestionar
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Container>
        </AdminLayout>
    );
}
