import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import apiClient from '../../services/api';
import { MediaItem } from '../../types/media';

// Sub-components
import ProfileHeader from './view/ProfileHeader';
import ProfileTabs from './view/ProfileTabs';
import ProfileMainView from './view/ProfileMainView';
import ProfileMediaView from './view/ProfileMediaView';
import ProfileIdentityView from './view/ProfileIdentityView';
import ProfileRewardsView from './view/ProfileRewardsView';

interface ProfileViewProps {
  profile: any;
  onEdit?: () => void;
  onProfileUpdate?: () => void;
  readOnly?: boolean;
}

export default function ProfileView({ profile, onEdit, onProfileUpdate, readOnly = false }: ProfileViewProps) {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  // Tab handling
  const [activeTab, setActiveTab] = useState('profile');

  // Sync tab with URL query param
  useEffect(() => {
    if (router.query.tab) {
      setActiveTab(router.query.tab as string);
    }
  }, [router.query.tab]);

  const handleTabChange = (newValue: string) => {
    setActiveTab(newValue);

    // Update URL shallowly
    const query = { ...router.query, tab: newValue };
    router.replace({
      pathname: router.pathname,
      query: query
    }, undefined, { shallow: true });
  };

  useEffect(() => {
    const fetchMedia = async () => {
      if (profile?.user_id) {
        try {
          const response = await apiClient.get(`/media/${profile.user_id}`);
          setMediaItems(response.data);
        } catch (error) {
          console.error('Error fetching media:', error);
        }
      }
    };
    fetchMedia();
  }, [profile?.user_id]);

  const getImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`;
  };

  // Get main profile photo logic
  const isOwnProfile = user?.user_id === profile.user_id;
  let mainProfilePhoto: string | undefined;

  if (isOwnProfile && user?.avatar) {
    mainProfilePhoto = user.avatar;
  } else if (mediaItems.length > 0) {
    const firstPhoto = mediaItems.find(item => item.type?.toLowerCase() === 'photo');
    mainProfilePhoto = firstPhoto?.url;
  } else if (profile.photos && profile.photos.length > 0) {
    mainProfilePhoto = getImageUrl(profile.photos[0]);
  }

  if (mainProfilePhoto && !isOwnProfile) {
    const separator = mainProfilePhoto.includes('?') ? '&' : '?';
    mainProfilePhoto = `${mainProfilePhoto}${separator}_t=${Date.now()}`;
  }

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 1, md: 2 } }}>
      <ProfileHeader
        profile={profile}
        mainProfilePhoto={mainProfilePhoto}
        onEdit={onEdit}
        readOnly={readOnly}
      />

      <ProfileTabs activeTab={activeTab} onChange={handleTabChange} />

      <Box sx={{ minHeight: '50vh', bgcolor: 'background.default' }}>
        {activeTab === 'profile' && <ProfileMainView profile={profile} />}

        {activeTab === 'media' && (
          <ProfileMediaView
            profile={profile}
            mediaItems={mediaItems}
            mainProfilePhoto={mainProfilePhoto}
          />
        )}

        {activeTab === 'identity' && <ProfileIdentityView profile={profile} />}

        {activeTab === 'rewards' && <ProfileRewardsView profile={profile} />}
      </Box>
    </Box>
  );
}
