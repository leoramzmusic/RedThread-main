import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, CircularProgress, Container, Typography, Tooltip } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../../components/layout/Layout';
import ProfileCard from '../../components/profile/ProfileCard';
import apiClient from '../../services/api';

export default function ProfilePreview() {
    const router = useRouter();
    const { t } = useTranslation('common');
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await apiClient.get('/profiles/me');
                const profileData = res.data;
                // Add defaults for ProfileCard if missing
                if (!profileData.affinity_score) profileData.affinity_score = 0;
                setProfile(profileData);
            } catch (err) {
                console.error(err);
                // Handle error
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <Layout>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress />
                </Box>
            </Layout>
        );
    }

    if (!profile) {
        return (
            <Layout>
                <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="h6">{t('errors.loadFailed')}</Typography>
                </Container>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Top Bar with Back Button */}
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    bgcolor: 'background.default',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    py: 2,
                    px: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center' // Center title
                }}
            >
                {/* Discrete Close Button */}
                <Box sx={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)' }}>
                    <Tooltip title={t('actions.back_to_edit', 'Volver a edición')}>
                        <Button
                            startIcon={<ArrowBack sx={{ fontSize: 20 }} />}
                            onClick={() => router.back()}
                            sx={{
                                color: 'text.secondary',
                                textTransform: 'none',
                                fontWeight: 400,
                                fontSize: '0.875rem',
                                '&:hover': {
                                    color: 'text.primary',
                                    bgcolor: 'action.hover'
                                }
                            }}
                        >
                            {t('actions.close_preview', 'Cerrar vista previa')}
                        </Button>
                    </Tooltip>
                </Box>

                {/* Emotional Narrative Title */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                        variant="h5"
                        component="h1"
                        sx={{
                            background: 'linear-gradient(45deg, #FF6B6B, #F06292)',
                            backgroundClip: 'text',
                            textFillColor: 'transparent',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 800,
                            letterSpacing: '-0.5px'
                        }}
                    >
                        Lo que otros ven cuando te descubren
                    </Typography>
                    <Typography variant="h5">🌟</Typography>
                </Box>
            </Box>

            <Container maxWidth="sm" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                {/* Render ProfileCard in read-only mode (no actions) */}
                <ProfileCard
                    profile={profile}
                    showActions={false}
                    isOwnProfile={true}
                />
            </Container>
        </Layout>
    );
}

export async function getServerSideProps({ locale }: { locale: string }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'profile'])),
        },
    };
}
