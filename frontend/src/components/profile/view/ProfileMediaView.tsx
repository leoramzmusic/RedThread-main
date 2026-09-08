import { Grid } from '@mui/material';
import ProfileGallery from './ProfileGallery';
import ProfileMusic from './ProfileMusic';
import { MediaItem } from '../../../types/media';

interface ProfileMediaViewProps {
    profile: any;
    mediaItems: MediaItem[];
    mainProfilePhoto?: string;
}

export default function ProfileMediaView({ profile, mediaItems, mainProfilePhoto }: ProfileMediaViewProps) {
    return (
        <Grid container spacing={4} sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
            <Grid item xs={12} md={8} lg={6} sx={{ mx: 'auto' }}>
                <ProfileGallery
                    profile={profile}
                    mediaItems={mediaItems}
                    mainProfilePhoto={mainProfilePhoto}
                />
                <ProfileMusic />
            </Grid>
        </Grid>
    );
}
