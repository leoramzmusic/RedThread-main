import { useEffect, useState } from 'react';
import { Box, Tabs, Tab, Slide, keyframes } from '@mui/material';
import AuthLayout from '../../components/auth/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';
import RegisterForm from '../../components/auth/RegisterForm';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useSnackbar } from 'notistack';

const indicatorDraw = keyframes`
  0% { transform: scaleX(0); opacity: 0.7; }
  100% { transform: scaleX(1); opacity: 1; }
`;

export default function AuthPage() {
    const router = useRouter();
    const { t } = useTranslation('common');
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    const tabIndex = router.query.tab === 'register' ? 1 : 0;

    const [authSuccess, setAuthSuccess] = useState(false);
    const [slideDir, setSlideDir] = useState<'left' | 'right' | 'up' | 'down'>('up');
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        if (router.query.expired === '1') {
            enqueueSnackbar(t('errors.sessionExpired', 'Tu sesión expiró, tejiendo tu hilo de nuevo'), { variant: 'warning' });
            router.replace('/auth', undefined, { shallow: true });
        }
    }, [router.query.expired, enqueueSnackbar, router, t]);

    useEffect(() => {
        if (isAuthenticated && !authSuccess) {
            router.replace('/discover');
        }
    }, [isAuthenticated, authSuccess, router]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        if (newValue === 1 && tabIndex === 0) {
            setSlideDir('left');
        } else if (newValue === 0 && tabIndex === 1) {
            setSlideDir('right');
        }
        router.replace(
            { pathname: '/auth', query: newValue === 1 ? { tab: 'register' } : {} },
            undefined,
            { shallow: true }
        );
    };

    const handleAuthSuccess = () => setAuthSuccess(true);

    return (
        <AuthLayout
            title={tabIndex === 0 ? t('auth.welcome') : t('auth.join')}
            subtitle={tabIndex === 0 ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
            authSuccess={authSuccess}
        >
            <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.2)', mb: 3 }}>
                <Tabs
                    key={`rt-tabs-${tabIndex}`}
                    value={tabIndex}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{
                        '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'none', fontSize: '1rem' },
                        '& .Mui-selected': { color: '#FFFFFF' },
                        '& .MuiTabs-indicator': {
                            height: 3,
                            borderRadius: 3,
                            transformOrigin: 'left center',
                            background: 'linear-gradient(90deg, #D32F2F 0%, #FB7185 100%)',
                            boxShadow: '0 0 12px rgba(211, 47, 47, 0.7), 0 2px 4px rgba(211, 47, 47, 0.35)',
                            '@media (prefers-reduced-motion: no-preference)': {
                                animation: `${indicatorDraw} 0.35s ease`,
                            },
                        },
                    }}
                >
                    <Tab label={t('auth.loginTab')} />
                    <Tab label={t('auth.registerTab')} />
                </Tabs>
            </Box>

            <Box sx={{ minHeight: tabIndex === 0 ? 420 : 480 }}>
                {tabIndex === 0 && (
                    <Slide in direction={slideDir} timeout={450} mountOnEnter unmountOnExit>
                        <Box>
                            <LoginForm onSuccess={handleAuthSuccess} />
                        </Box>
                    </Slide>
                )}
                {tabIndex === 1 && (
                    <Slide in direction={slideDir} timeout={450} mountOnEnter unmountOnExit>
                        <Box>
                            <RegisterForm onSuccess={handleAuthSuccess} />
                        </Box>
                    </Slide>
                )}
            </Box>
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
