import { Grid } from '@mui/material';
import ProfileGallery from './ProfileGallery';
import ProfileMusic from './ProfileMusic';
import { MediaItem } from '../../../types/media';

interface ProfileMediaViewProps {
    profile: any;
    mediaItems: MediaItem[];
    mainProfilePhoto?: string;
    onPhotoClick?: (mediaId: string) => void;
    smartPhotosEnabled?: boolean;
}

export default function ProfileMediaView({ profile, mediaItems, mainProfilePhoto, onPhotoClick, smartPhotosEnabled }: ProfileMediaViewProps) {
    return (
        <Grid container spacing={4} sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
            <Grid
                sx={{ mx: 'auto' }}
                size={{
                    xs: 12,
                    md: 8,
                    lg: 6
                }}>
                <ProfileGallery
                    profile={profile}
                    mediaItems={mediaItems}
                    mainProfilePhoto={mainProfilePhoto}
                    onPhotoClick={onPhotoClick}
                    smartPhotosEnabled={smartPhotosEnabled}
                />
                <ProfileMusic />
            </Grid>
        </Grid>
    );
}
