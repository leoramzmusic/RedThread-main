import { useState, useEffect } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import AuthLayout from '../../components/auth/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';
import RegisterForm from '../../components/auth/RegisterForm';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

export default function AuthPage() {
    const router = useRouter();
    const [tabIndex, setTabIndex] = useState(0);
    const { t } = useTranslation('common');
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/discover');
        }
    }, [isAuthenticated, router]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
        if (newValue === 1) {
            router.push('/auth/register');
        }
    };

    return (
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
                    <Tab label={t('auth.loginTab')} sx={{ fontWeight: 600, textTransform: 'none', fontSize: '1rem' }} />
                    <Tab label={t('auth.registerTab')} sx={{ fontWeight: 600, textTransform: 'none', fontSize: '1rem' }} />
                </Tabs>
            </Box>

            {tabIndex === 0 && <LoginForm />}
            {tabIndex === 1 && <RegisterForm />}
        </AuthLayout>
    );
}

export async function getServerSideProps({ locale }: { locale: string }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common'])),
        },
    };
}
