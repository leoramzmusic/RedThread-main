import { Grid, Stack, Box } from '@mui/material';
import { useSelector } from 'react-redux';
import BasicIdentitySection from './blocks/BasicIdentitySection';
import PersonalContextSection from './blocks/PersonalContextSection';
import EmotionalExpressionSection from './blocks/EmotionalExpressionSection';
import SensitiveLayersSection from './blocks/SensitiveLayersSection';
import RelationshipSection from './blocks/RelationshipSection';
import { RootState } from '../../../store/store';

interface ProfileMainViewProps {
    profile: any;
    onEdit?: () => void;
    isPublicView?: boolean;
}

export default function ProfileMainView({ profile, onEdit, isPublicView = false }: ProfileMainViewProps) {
    const { user } = useSelector((state: RootState) => state.auth);
    // If it's public view (preview), we treat it as NOT own profile to test visibility
    const isOwnProfile = !isPublicView && (user?.user_id === profile.user_id);

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Grid container spacing={3}>
                {/* Left Column: Identity & Context */}
                <Grid item xs={12} md={6}>
                    <Stack spacing={3}>
                        <BasicIdentitySection profile={profile} onEdit={onEdit} />
                        <PersonalContextSection profile={profile} onEdit={onEdit} />
                        <SensitiveLayersSection
                            profile={profile}
                            isOwnProfile={isOwnProfile}
                            onEdit={onEdit}
                        />
                    </Stack>
                </Grid>

                {/* Right Column: Emotional & Relationship */}
                <Grid item xs={12} md={6}>
                    <Stack spacing={3}>
                        <EmotionalExpressionSection profile={profile} onEdit={onEdit} />
                        <RelationshipSection profile={profile} onEdit={onEdit} />
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}
