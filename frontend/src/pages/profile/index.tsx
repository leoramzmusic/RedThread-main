import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, CircularProgress } from '@mui/material';
import Layout from '../../components/layout/Layout';
import apiClient from '../../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

export default function ProfileRedirect() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const fetchAndRedirect = async () => {
      try {
        // Fetch fresh profile data to get current nickname
        const res = await apiClient.get('/profiles/me');
        const nickname = res.data.nickname || res.data.user_id;
        router.replace(`/profile/@${nickname}`);
      } catch (err) {
        console.error('Failed to fetch profile for redirect', err);
        router.push('/auth/login');
      }
    };

    fetchAndRedirect();
  }, [isAuthenticated, router]);

  return (
    <Layout>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    </Layout>
  );
}


export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
