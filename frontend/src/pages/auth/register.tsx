import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Box, Tabs, Tab } from '@mui/material';
import AuthLayout from '../../components/auth/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';
import RegisterForm from '../../components/auth/RegisterForm';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

export default function RegisterPage() {
    const router = useRouter();
    // Inicia en tab 1 (Registro) ya que esta es la ruta /auth/register
    const [tabIndex, setTabIndex] = useState<number>(1);
    const { t } = useTranslation('common');
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/discover');
        }
    }, [isAuthenticated, router]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
        // Navegar entre Login (/auth) y Register (/auth/register) sin recargar
        if (newValue === 0) {
            router.push('/auth');
        }
        // Si newValue === 1 ya estamos en /auth/register, no hace falta navegar
    };

    return (
        <>
            <Head>
                <title>{t('auth.join')} - Red Thread</title>
                <meta name="description" content={t('auth.registerSubtitle')} />
            </Head>
            <AuthLayout
                title={tabIndex === 0 ? t('auth.welcome') : t('auth.join')}
                subtitle={tabIndex === 0 ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
            >
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs
                        value={tabIndex}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        textColor="primary"
                        indicatorColor="primary"
                    >
                        <Tab value={0} label={t('auth.loginTab')} sx={{ fontWeight: 600, textTransform: 'none', fontSize: '1rem' }} />
                        <Tab value={1} label={t('auth.registerTab')} sx={{ fontWeight: 600, textTransform: 'none', fontSize: '1rem' }} />
                    </Tabs>
                </Box>

                {tabIndex === 0 && <LoginForm />}
                {tabIndex === 1 && <RegisterForm />}
            </AuthLayout>
        </>
    );
}

export async function getServerSideProps({ locale }: { locale: string }) {
    return {
        props: {
            ...(await serverSideTranslations(locale || 'es', ['common'])),
        },
    };
}
