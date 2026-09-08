import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import Layout from '../../../components/layout/Layout';
import ProfileEdit from '../../../components/profile/ProfileEdit';
import apiClient from '../../../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
import { updateUserAvatar } from '../../../store/slices/authSlice';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function ModifyProfilePage() {
  const router = useRouter();
  const { nickname } = router.query;
  const { t, i18n } = useTranslation('common');
  const { isAuthenticated, user, isInitialized } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [options, setOptions] = useState<any>({});
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    if (!router.isReady) return;

    // Wait for auth initialization to complete
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const initData = async () => {
      try {
        // Fetch options with current language
        const lang = i18n.language || 'es';
        const optionsRes = await apiClient.get(`/options?lang=${lang}`);
        setOptions(optionsRes.data);

        // Fetch profile
        const profileRes = await apiClient.get('/profiles/me');
        setProfile(profileRes.data);

        // Verify ownership (optional but good for UX)
        // If the URL nickname doesn't match current user's nickname, we could redirect
        // But since we fetch /profiles/me, we are editing the logged-in user regardless of URL
        // Ideally we should redirect if URL is wrong to avoid confusion
        const currentNickname = profileRes.data.nickname || profileRes.data.user_id;
        const urlNickname = (nickname as string)?.replace('@', '');

        if (urlNickname && currentNickname !== urlNickname) {
          // Redirect to correct URL
          router.replace(`/profile/@${currentNickname}/modify-profile`);
        }

      } catch (err: any) {
        console.error('Failed to load data', err);
        if (err.response?.status === 404) {
          // Create mode
          setProfile({});
          showNotification(t('profile.create', 'Por favor completa tu perfil'), 'success');
        } else {
          showNotification('Failed to load profile data', 'error');
          setProfile({});
        }
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [isAuthenticated, isInitialized, router.isReady, i18n.language]);

  const handleSave = async (data: any) => {
    try {
      console.log('Saving profile with data:', data);
      const res = await apiClient.put('/profiles/me', data);
      setProfile(res.data);

      // Update avatar in Redux - fetch from media endpoint
      try {
        const mediaResponse = await apiClient.get(`/media/${res.data.user_id}`);
        const photoItems = mediaResponse.data.filter((item: any) => item.type?.toLowerCase() === 'photo');
        if (photoItems.length > 0) {
          dispatch(updateUserAvatar(photoItems[0].url));
        } else if (res.data.photos && res.data.photos.length > 0) {
          // Fallback to photos array if no media items
          dispatch(updateUserAvatar(res.data.photos[0]));
        }
      } catch (mediaError) {
        console.error('Failed to update avatar in Redux:', mediaError);
        // Fallback to photos array
        if (res.data.photos && res.data.photos.length > 0) {
          dispatch(updateUserAvatar(res.data.photos[0]));
        }
      }


      // Show success message
      showNotification(t('profile.saved', 'Perfil actualizado correctamente'), 'success');

    } catch (err: any) {
      console.error('Failed to update profile', err);
      showNotification(t('common.error', 'Error al actualizar perfil'), 'error');
      throw err;
    }
  };

  const handleBack = () => {
    if (profile) {
      const currentNickname = profile.nickname || profile.user_id;
      router.push(`/profile/@${currentNickname}`);
    } else {
      router.back();
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error') => {
    setNotification({ open: true, message, severity });
  };

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="md">
        <ProfileEdit
          profile={profile}
          options={options}
          onSave={handleSave}
          onBack={handleBack}
        />

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          <Alert
            severity={notification.severity}
            onClose={() => setNotification({ ...notification, open: false })}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'es', ['common'])),
    },
  };
}
