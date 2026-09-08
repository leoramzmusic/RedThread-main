import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  CircularProgress,
  Alert,
  Button,
  Typography
} from '@mui/material';
import Layout from '../../../components/layout/Layout';
import ProfileView from '../../../components/profile/ProfileView';
import apiClient from '../../../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

export default function ProfilePage() {
  const router = useRouter();
  const { nickname } = router.query;
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation('common');
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!router.isReady || !nickname) return;

    // Extract clean nickname (remove @ if present)
    const cleanNickname = (nickname as string).replace('@', '');
    
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Add cache-busting parameter to prevent showing stale images
        const timestamp = new Date().getTime();
        const res = await apiClient.get(`/users/${cleanNickname}?_t=${timestamp}`);
        
        // Check ownership first
        let ownerStatus = false;
        if (isAuthenticated && user && res.data) {
          // Check both user_id and nickname for ownership
          const matchesUserId = res.data.user_id && res.data.user_id === user.user_id;
          const matchesNickname = res.data.nickname && user.nickname && res.data.nickname === user.nickname;
          const matchesCleanNickname = cleanNickname === user.nickname;
          
          ownerStatus = matchesUserId || matchesNickname || matchesCleanNickname;
          setIsOwner(ownerStatus);
        }
        
        // If owner, fetch full profile data (including private fields)
        if (ownerStatus) {
          try {
            const fullProfileRes = await apiClient.get('/profiles/me');
            setProfile(fullProfileRes.data);
          } catch (e) {
            console.error("Failed to fetch full profile", e);
            // Fallback to public profile data
            setProfile(res.data);
          }
        } else {
          // Not owner, use public profile data
          setProfile(res.data);
        }
      } catch (err: any) {
        console.error('Failed to fetch profile', err);
        setError(err.response?.data?.detail || 'Profile not found');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [router.isReady, nickname, isAuthenticated, user]);

  const handleEditClick = () => {
    const cleanNickname = (nickname as string).replace('@', '');
    router.push(`/profile/@${cleanNickname}/modify-profile`);
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

  if (error) {
    return (
      <Layout>
        <Container maxWidth="md">
          <Box 
            display="flex" 
            flexDirection="column" 
            justifyContent="center" 
            alignItems="center" 
            minHeight="400px"
            gap={2}
          >
            <Typography variant="h5" color="error" gutterBottom>
              User Not Found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              The user {nickname} does not exist or their profile is private.
            </Typography>
            <Button variant="contained" onClick={() => router.push('/discover')}>
              Go to Discover
            </Button>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="md">
        <ProfileView 
          profile={profile} 
          readOnly={!isOwner}
          onEdit={isOwner ? handleEditClick : undefined}
        />
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
